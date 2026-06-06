create extension if not exists "pgcrypto";

alter table public.profiles enable row level security;
alter table public.couples enable row level security;
alter table public.couple_members enable row level security;

create or replace function public.is_couple_member(couple_id_input uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.couple_members cm
    where cm.couple_id = couple_id_input
      and cm.user_id = auth.uid()
  );
$$;

grant execute on function public.is_couple_member(uuid) to authenticated;

drop policy if exists profiles_select_self on public.profiles;
drop policy if exists profiles_insert_self on public.profiles;
drop policy if exists profiles_update_self on public.profiles;
drop policy if exists profiles_delete_self on public.profiles;

create policy profiles_select_self
on public.profiles
for select
to authenticated
using (id = auth.uid());

create policy profiles_insert_self
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

create policy profiles_update_self
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists couples_select_member_or_owner on public.couples;
drop policy if exists couples_insert_owner on public.couples;
drop policy if exists couples_update_member_or_owner on public.couples;
drop policy if exists couples_delete_owner on public.couples;

create policy couples_select_member_or_owner
on public.couples
for select
to authenticated
using (
  owner_id = auth.uid()
  or public.is_couple_member(id)
);

create policy couples_insert_owner
on public.couples
for insert
to authenticated
with check (owner_id = auth.uid());

create policy couples_update_member_or_owner
on public.couples
for update
to authenticated
using (
  owner_id = auth.uid()
  or public.is_couple_member(id)
)
with check (
  owner_id = auth.uid()
  or public.is_couple_member(id)
);

create policy couples_delete_owner
on public.couples
for delete
to authenticated
using (owner_id = auth.uid());

drop policy if exists couple_members_select_member_rows on public.couple_members;
drop policy if exists couple_members_insert_owner_self on public.couple_members;
drop policy if exists couple_members_delete_self on public.couple_members;

create policy couple_members_select_member_rows
on public.couple_members
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_couple_member(couple_id)
);

create policy couple_members_insert_owner_self
on public.couple_members
for insert
to authenticated
with check (
  user_id = auth.uid()
  and role = 'owner'
  and exists (
    select 1
    from public.couples c
    where c.id = couple_id
      and c.owner_id = auth.uid()
  )
);

create policy couple_members_delete_self
on public.couple_members
for delete
to authenticated
using (user_id = auth.uid());

drop function if exists public.join_couple_by_invite_code(text);

create or replace function public.join_couple_by_invite_code(invite_code_input text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_couple_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Bạn cần đăng nhập để kết nối couple';
  end if;

  select c.id
  into target_couple_id
  from public.couples c
  where c.invite_code = upper(trim(invite_code_input))
  limit 1;

  if target_couple_id is null then
    raise exception 'Mã mời không hợp lệ';
  end if;

  insert into public.couple_members (couple_id, user_id, role)
  values (target_couple_id, auth.uid(), 'member')
  on conflict (couple_id, user_id) do nothing;

  return target_couple_id;
end;
$$;

grant execute on function public.join_couple_by_invite_code(text) to authenticated;

alter table if exists public.mood_logs enable row level security;
drop policy if exists mood_logs_select_own_or_couple on public.mood_logs;
drop policy if exists mood_logs_insert_own on public.mood_logs;
drop policy if exists mood_logs_update_own on public.mood_logs;
create policy mood_logs_select_own_or_couple
on public.mood_logs for select to authenticated
using (user_id = auth.uid() or public.is_couple_member(couple_id));
create policy mood_logs_insert_own
on public.mood_logs for insert to authenticated
with check (user_id = auth.uid() and (couple_id is null or public.is_couple_member(couple_id)));
create policy mood_logs_update_own
on public.mood_logs for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

alter table if exists public.love_notes enable row level security;
drop policy if exists love_notes_couple_members on public.love_notes;
create policy love_notes_couple_members
on public.love_notes for all to authenticated
using (public.is_couple_member(couple_id))
with check (public.is_couple_member(couple_id));

alter table if exists public.bucket_list enable row level security;
drop policy if exists bucket_list_couple_members on public.bucket_list;
create policy bucket_list_couple_members
on public.bucket_list for all to authenticated
using (public.is_couple_member(couple_id))
with check (public.is_couple_member(couple_id));
