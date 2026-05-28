drop policy if exists profiles_select_couple_members on public.profiles;

create policy profiles_select_couple_members
on public.profiles
for select
to authenticated
using (
  exists (
    select 1
    from public.couple_members viewer_member
    join public.couple_members target_member
      on target_member.couple_id = viewer_member.couple_id
    where viewer_member.user_id = auth.uid()
      and target_member.user_id = profiles.id
  )
);
