-- ============================================================
-- TopNote Notification System
-- Production Migration
-- ============================================================

-- Enable UUID generation if not already enabled
create extension if not exists pgcrypto;

-- ============================================================
-- Notification Type Enum
-- ============================================================

do $$
begin
    if not exists (
        select 1
        from pg_type
        where typname = 'notification_type'
    ) then
        create type notification_type as enum (
            'exam_order',
            'inquiry',
            'payment',
            'testimonial',
            'product',
            'system'
        );
    end if;
end $$;

-- ============================================================
-- Notifications Table
-- ============================================================

create table if not exists public.notifications (

    id uuid primary key default gen_random_uuid(),

    title text not null,

    message text not null,

    type notification_type not null,

    reference_type text,

    reference_id uuid,

    metadata jsonb not null default '{}'::jsonb,

    is_read boolean not null default false,

    read_at timestamptz,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now()

);

-- ============================================================
-- Indexes
-- ============================================================

create index if not exists idx_notifications_created_at
on public.notifications(created_at desc);

create index if not exists idx_notifications_type
on public.notifications(type);

create index if not exists idx_notifications_is_read
on public.notifications(is_read);

create index if not exists idx_notifications_reference
on public.notifications(reference_type, reference_id);

-- ============================================================
-- updated_at Trigger
-- ============================================================

create or replace function public.set_notifications_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists notifications_updated_at
on public.notifications;

create trigger notifications_updated_at
before update
on public.notifications
for each row
execute function public.set_notifications_updated_at();

-- ============================================================
-- Enable RLS
-- ============================================================

alter table public.notifications
enable row level security;

-- ============================================================
-- PUBLIC
-- No public access
-- ============================================================

-- Nothing intentionally granted.

-- ============================================================
-- AUTHENTICATED ADMINS
-- ============================================================

-- These policies assume dashboard access is handled
-- by your server using the Service Role.
--
-- Authenticated users can only read notifications.
-- Inserts are performed server-side.

drop policy if exists notifications_select_authenticated
on public.notifications;

create policy notifications_select_authenticated
on public.notifications
for select
to authenticated
using (true);

drop policy if exists notifications_update_authenticated
on public.notifications;

create policy notifications_update_authenticated
on public.notifications
for update
to authenticated
using (true)
with check (true);

-- No DELETE policy.

-- ============================================================
-- Realtime
-- ============================================================

alter publication supabase_realtime
add table public.notifications;

-- ============================================================
-- Helper Function
-- ============================================================

create or replace function public.create_notification(

    p_title text,

    p_message text,

    p_type notification_type,

    p_reference_type text default null,

    p_reference_id uuid default null,

    p_metadata jsonb default '{}'::jsonb

)

returns uuid

language plpgsql

security definer

as $$

declare

    new_id uuid;

begin

    insert into public.notifications(

        title,

        message,

        type,

        reference_type,

        reference_id,

        metadata

    )

    values(

        p_title,

        p_message,

        p_type,

        p_reference_type,

        p_reference_id,

        p_metadata

    )

    returning id

    into new_id;

    return new_id;

end;

$$;

grant execute on function public.create_notification
to authenticated;

-- ============================================================
-- Example
-- ============================================================

-- select public.create_notification(
--     'New Exam Order',
--     'ABC Primary School submitted an order.',
--     'exam_order',
--     'exam_order',
--     'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
--     jsonb_build_object(
--         'orderNumber','TN-EX-2026-0001',
--         'school','ABC Primary School',
--         'amount',18500,
--         'students',420,
--         'session','END TERM 2026'
--     )
-- );

-- ============================================================
-- Comments
-- ============================================================

comment on table public.notifications is
'Stores dashboard notifications for realtime updates.';

comment on column public.notifications.metadata is
'Flexible JSON payload for event-specific information.';

comment on column public.notifications.reference_id is
'Primary key of the related entity (exam order, inquiry, etc.).';

comment on column public.notifications.reference_type is
'Table/entity associated with the notification.';