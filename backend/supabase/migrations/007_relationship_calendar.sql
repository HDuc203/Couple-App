-- Create tables for the Relationship Calendar, Period Tracking, and Relationship Timeline

-- 1. Create special_dates table
create table if not exists public.special_dates (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid references public.couples(id) on delete cascade,
  title text not null,
  type text not null, -- 'birthday', 'anniversary', 'milestone', 'date', 'kiss', 'custom'
  date date not null,
  description text,
  repeat_yearly boolean not null default true,
  created_by uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Create period_tracking table
create table if not exists public.period_tracking (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade unique,
  last_period_date date not null,
  cycle_length integer not null default 28,
  period_length integer not null default 5,
  notifications_enabled boolean not null default true,
  share_with_partner boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Create relationship_timeline table
create table if not exists public.relationship_timeline (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid references public.couples(id) on delete cascade,
  event_type text not null, -- 'mood', 'memory', 'anniversary', 'journal', 'album', 'bucket'
  reference_id uuid, -- Reference ID pointing to diary_entries, photos, or bucket_list
  title text not null,
  description text,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.special_dates enable row level security;
alter table public.period_tracking enable row level security;
alter table public.relationship_timeline enable row level security;

-- Drop existing policies if any
drop policy if exists special_dates_couple_members on public.special_dates;
drop policy if exists period_tracking_all on public.period_tracking;
drop policy if exists relationship_timeline_couple_members on public.relationship_timeline;

-- Create Policies
create policy special_dates_couple_members
on public.special_dates for all to authenticated
using (public.is_couple_member(couple_id))
with check (public.is_couple_member(couple_id));

create policy period_tracking_all
on public.period_tracking for all to authenticated
using (
  user_id = auth.uid() 
  or exists (
    select 1 
    from public.couple_members m1
    join public.couple_members m2 on m2.couple_id = m1.couple_id
    where m1.user_id = auth.uid() 
      and m2.user_id = period_tracking.user_id 
      and period_tracking.share_with_partner = true
  )
)
with check (user_id = auth.uid());


create policy relationship_timeline_couple_members
on public.relationship_timeline for all to authenticated
using (public.is_couple_member(couple_id))
with check (public.is_couple_member(couple_id));

-- Add tables to realtime publication (Chống lỗi nếu đã add)
begin;
  alter publication supabase_realtime drop table if exists public.special_dates, public.period_tracking, public.relationship_timeline;
  alter publication supabase_realtime add table public.special_dates, public.period_tracking, public.relationship_timeline;
commit;
