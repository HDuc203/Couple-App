-- Migration 013: Add mood_logs delete policy
-- Allow users to delete their own mood logs

begin;
  drop policy if exists mood_logs_delete_own on public.mood_logs;
  create policy mood_logs_delete_own
  on public.mood_logs for delete to authenticated
  using (user_id = auth.uid());
commit;
