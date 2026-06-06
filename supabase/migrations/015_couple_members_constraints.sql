-- Migration: Enforce one couple per user constraint and update join_couple_by_invite_code function

-- Clean up any duplicates in couple_members first
DELETE FROM public.couple_members a USING public.couple_members b
WHERE a.id < b.id AND a.user_id = b.user_id;

-- Add UNIQUE constraint on user_id in couple_members
ALTER TABLE public.couple_members
  DROP CONSTRAINT IF EXISTS couple_members_user_id_key;

ALTER TABLE public.couple_members
  ADD CONSTRAINT couple_members_user_id_key UNIQUE (user_id);

-- Update join_couple_by_invite_code function
create or replace function public.join_couple_by_invite_code(invite_code_input text)
returns uuid  
language plpgsql
security definer
set search_path = public
as $$
declare
  target_couple_id uuid;
  code_normalized text;
begin
  if auth.uid() is null then
    raise exception 'Bạn cần đăng nhập để kết nối couple';
  end if;

  code_normalized := upper(trim(invite_code_input));

  -- 1. Check if trying to use own invite code
  if exists (
    select 1 
    from public.couples c
    where c.invite_code = code_normalized
      and c.owner_id = auth.uid()
  ) then
    raise exception 'Không thể sử dụng mã mời của chính mình';
  end if;

  -- 2. Check if user is already in any couple
  if exists (
    select 1
    from public.couple_members
    where user_id = auth.uid()
  ) then
    raise exception 'Bạn đã tham gia một cặp đôi khác rồi';
  end if;

  select c.id
  into target_couple_id
  from public.couples c
  where c.invite_code = code_normalized
  limit 1;

  if target_couple_id is null then
    raise exception 'Mã mời không hợp lệ';
  end if;

  -- 3. Check if target couple already has 2 or more members
  if (
    select count(*)
    from public.couple_members
    where couple_id = target_couple_id
  ) >= 2 then
    raise exception 'Cặp đôi này đã đủ thành viên';
  end if;

  insert into public.couple_members (couple_id, user_id, role)
  values (target_couple_id, auth.uid(), 'member')
  on conflict (couple_id, user_id) do nothing;

  return target_couple_id;
end;
$$;
