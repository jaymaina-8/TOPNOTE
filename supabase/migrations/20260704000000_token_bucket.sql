-- Alter rate_limits table to support token bucket parameters
alter table public.rate_limits add column if not exists tokens double precision;
alter table public.rate_limits add column if not exists last_refilled_at timestamptz;

-- Set default values for any existing records
update public.rate_limits
set tokens = count::double precision,
    last_refilled_at = coalesce(reset_at - interval '1 minute', now())
where tokens is null;

-- Atomic database function for rate limiting using Token Bucket algorithm
create or replace function public.check_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
returns table (
  allowed boolean,
  remaining integer,
  retry_after integer
)
language plpgsql
security definer
as $$
declare
  v_tokens double precision;
  v_last_refilled timestamptz;
  v_now timestamptz := now();
  v_elapsed double precision;
  v_refill_rate double precision;
  v_new_tokens double precision;
  v_allowed boolean := false;
  v_retry_after integer := 0;
begin
  -- Select existing rate limit state
  select tokens, last_refilled_at into v_tokens, v_last_refilled
  from public.rate_limits
  where key = p_key;

  v_refill_rate := p_limit::double precision / p_window_seconds::double precision;

  if not found then
    -- Brand new key, initialize bucket
    v_new_tokens := p_limit::double precision - 1.0;
    v_last_refilled := v_now;
    v_allowed := true;

    insert into public.rate_limits (key, tokens, last_refilled_at, count, reset_at)
    values (
      p_key, 
      v_new_tokens, 
      v_last_refilled, 
      1, 
      v_now + (p_window_seconds || ' seconds')::interval
    )
    on conflict (key) do update
    set tokens = v_new_tokens,
        last_refilled_at = v_last_refilled,
        count = 1,
        reset_at = v_now + (p_window_seconds || ' seconds')::interval;

    return query select true, floor(v_new_tokens)::integer, 0;
  else
    -- Calculate elapsed time and replenish tokens
    v_elapsed := greatest(0.0, extract(epoch from (v_now - v_last_refilled)));
    v_new_tokens := least(p_limit::double precision, v_tokens + (v_elapsed * v_refill_rate));

    -- Check if we can consume a token
    if v_new_tokens >= 1.0 then
      v_new_tokens := v_new_tokens - 1.0;
      v_allowed := true;
    end if;

    -- Update rate limit state in DB
    update public.rate_limits
    set tokens = v_new_tokens,
        last_refilled_at = v_now,
        count = ceil(p_limit::double precision - v_new_tokens)::integer,
        reset_at = v_now + ((ceil((p_limit::double precision - v_new_tokens) / v_refill_rate)) || ' seconds')::interval
    where key = p_key;

    if not v_allowed then
      v_retry_after := ceil((1.0 - v_new_tokens) / v_refill_rate)::integer;
    end if;

    return query select v_allowed, floor(v_new_tokens)::integer, v_retry_after;
  end if;
end;
$$;
