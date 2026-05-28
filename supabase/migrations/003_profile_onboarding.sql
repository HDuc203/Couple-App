alter table public.profiles
  add column if not exists full_name text,
  add column if not exists nickname text,
  add column if not exists phone text,
  add column if not exists onboarding_completed boolean not null default false;

update public.profiles
set onboarding_completed = true
where onboarding_completed = false
  and nullif(trim(coalesce(full_name, '')), '') is not null
  and nullif(trim(coalesce(display_name, '')), '') is not null
  and birthday is not null
  and nullif(trim(coalesce(gender, '')), '') is not null;
