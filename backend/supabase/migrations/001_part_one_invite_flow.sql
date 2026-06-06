create extension if not exists pgcrypto;

create table if not exists public.couples (
  id uuid primary key default gen_random_uuid(),
  invite_code text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text not null,
  couple_id uuid references public.couples(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists profiles_couple_id_idx
on public.profiles(couple_id);

alter table public.couples enable row level security;
alter table public.profiles enable row level security;

drop policy if exists profiles_select_self on public.profiles;
create policy profiles_select_self
on public.profiles for select to authenticated
using (id = auth.uid());

drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self
on public.profiles for insert to authenticated
with check (id = auth.uid());

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self
on public.profiles for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists couples_insert_authenticated on public.couples;
create policy couples_insert_authenticated
on public.couples for insert to authenticated
with check (auth.uid() is not null);

drop policy if exists couples_select_own_profile_couple on public.couples;
create policy couples_select_own_profile_couple
on public.couples for select to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.couple_id = couples.id
  )
);
