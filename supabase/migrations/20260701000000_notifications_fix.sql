-- Fix notifications triggers and RLS policies

-- 1. Update the trigger function to automatically manage read_at timestamp
create or replace function public.set_notifications_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    if new.is_read = true and (old.is_read = false or old.is_read is null) then
        new.read_at = now();
    elsif new.is_read = false then
        new.read_at = null;
    end if;
    return new;
end;
$$;

-- 2. Drop existing policy if it exists and add authenticated delete policy
drop policy if exists notifications_delete_authenticated on public.notifications;

create policy notifications_delete_authenticated
on public.notifications
for delete
to authenticated
using (true);
