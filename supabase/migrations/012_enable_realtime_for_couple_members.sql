-- Enable realtime for couple_members table
-- This allows both users to listen for INSERT/UPDATE/DELETE changes on memberships

begin;
  alter publication supabase_realtime add table public.couple_members;
commit;
