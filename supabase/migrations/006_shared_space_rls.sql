-- Enable RLS and define robust collaborative permissions for shared couple space tables
-- diary_entries, photo_albums, and photos tables

-- 1. diary_entries policies
alter table if exists public.diary_entries enable row level security;

drop policy if exists diary_entries_couple_members on public.diary_entries;
drop policy if exists diary_entries_select_own_or_couple on public.diary_entries;
drop policy if exists diary_entries_insert_own on public.diary_entries;
drop policy if exists diary_entries_update_own on public.diary_entries;
drop policy if exists diary_entries_delete_own on public.diary_entries;

create policy diary_entries_couple_members
on public.diary_entries for all to authenticated
using (public.is_couple_member(couple_id))
with check (public.is_couple_member(couple_id));


-- 2. photo_albums policies
alter table if exists public.photo_albums enable row level security;

drop policy if exists photo_albums_couple_members on public.photo_albums;
drop policy if exists photo_albums_select_own_or_couple on public.photo_albums;
drop policy if exists photo_albums_insert_own on public.photo_albums;
drop policy if exists photo_albums_update_own on public.photo_albums;
drop policy if exists photo_albums_delete_own on public.photo_albums;

create policy photo_albums_couple_members
on public.photo_albums for all to authenticated
using (public.is_couple_member(couple_id))
with check (public.is_couple_member(couple_id));


-- 3. photos policies
alter table if exists public.photos enable row level security;

drop policy if exists photos_couple_members on public.photos;
drop policy if exists photos_select_own_or_couple on public.photos;
drop policy if exists photos_insert_own on public.photos;
drop policy if exists photos_update_own on public.photos;
drop policy if exists photos_delete_own on public.photos;

create policy photos_couple_members
on public.photos for all to authenticated
using (public.is_couple_member(couple_id))
with check (public.is_couple_member(couple_id));
