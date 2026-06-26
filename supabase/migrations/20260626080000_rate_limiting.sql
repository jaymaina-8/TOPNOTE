-- Rate limiting and security monitoring schema additions.
-- Safe to re-run (idempotent).

-- 1. Table for rate limiting tracking (fallback when Redis/Upstash is unconfigured)
create table if not exists public.rate_limits (
  key text primary key,
  count integer not null default 0,
  reset_at timestamptz not null
);

-- Enable RLS on rate_limits
alter table public.rate_limits enable row level security;

-- No public policies means only service_role (which bypasses RLS) can access rate_limits.

-- 2. Table for persistent security alerts and events
create table if not exists public.security_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null, -- 'rate_limit_blocked' | 'duplicate_order' | 'suspicious_activity' | 'validation_failed'
  ip text not null,
  path text,
  details jsonb,
  created_at timestamptz not null default now()
);

-- Enable RLS on security_events
alter table public.security_events enable row level security;

-- Only service role can write/read security_events

-- Create indexes for performance
create index if not exists idx_rate_limits_reset_at on public.rate_limits (reset_at);
create index if not exists idx_security_events_type_ip on public.security_events (event_type, ip);
create index if not exists idx_security_events_created_at on public.security_events (created_at desc);

-- 3. Atomic database function for rate limiting
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
  v_count integer;
  v_reset_at timestamptz;
  v_now timestamptz := now();
begin
  -- Select existing limit
  select count, reset_at into v_count, v_reset_at
  from public.rate_limits
  where key = p_key;

  if not found or v_now >= v_reset_at then
    -- Reset window
    v_reset_at := v_now + (p_window_seconds || ' seconds')::interval;
    v_count := 1;

    insert into public.rate_limits (key, count, reset_at)
    values (p_key, v_count, v_reset_at)
    on conflict (key) do update
    set count = v_count, reset_at = v_reset_at;

    return query select true, p_limit - v_count, 0;
  elsif v_count < p_limit then
    -- Increment
    v_count := v_count + 1;
    update public.rate_limits
    set count = v_count
    where key = p_key;

    return query select true, p_limit - v_count, 0;
  else
    -- Blocked
    return query select false, 0, extract(epoch from (v_reset_at - v_now))::integer;
  end if;
end;
$$;
