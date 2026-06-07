-- Migration: Create delete_user_account security definer function
create or replace function public.delete_user_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  user_couple_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Bạn cần đăng nhập để thực hiện tác vụ này.';
  end if;

  -- 1. Retrieve the couple ID of the user if it exists
  select couple_id into user_couple_id 
  from public.couple_members 
  where user_id = auth.uid() 
  limit 1;

  -- 2. Purge couple-related data if they were in a couple
  if user_couple_id is not null then
    delete from public.bucket_list where couple_id = user_couple_id;
    delete from public.special_dates where couple_id = user_couple_id;
    delete from public.photo_albums where couple_id = user_couple_id;
    delete from public.couple_members where couple_id = user_couple_id;
    delete from public.couples where id = user_couple_id;
  end if;

  -- 3. Purge individual user data
  delete from public.couple_members where user_id = auth.uid();
  delete from public.period_tracking where user_id = auth.uid();
  delete from public.partner_notes where user_id = auth.uid();
  delete from public.mood_logs where user_id = auth.uid();
  delete from public.love_note_reactions where user_id = auth.uid();
  delete from public.love_notes where sender_id = auth.uid();
  delete from public.diary_entries where author_id = auth.uid();
  delete from public.dismissed_reminders where user_id = auth.uid();
  delete from public.notifications where user_id = auth.uid();
  delete from public.profiles where id = auth.uid();

  -- 4. Delete user account from authentication table
  delete from auth.users where id = auth.uid();
end;
$$;
