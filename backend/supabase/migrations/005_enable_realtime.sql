-- Enable realtime replication for all shared couple tables
-- This ensures that PostgreSQL broadcasts INSERT/UPDATE/DELETE events to the client browser via WebSockets

begin;
  alter publication supabase_realtime add table public.mood_logs;
  alter publication supabase_realtime add table public.love_notes;
  alter publication supabase_realtime add table public.diary_entries;
  alter publication supabase_realtime add table public.photo_albums;
  alter publication supabase_realtime add table public.photos;
  alter publication supabase_realtime add table public.bucket_list;
commit;
