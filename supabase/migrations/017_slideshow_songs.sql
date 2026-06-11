-- Create slideshow_songs table
create table if not exists public.slideshow_songs (
  id uuid default gen_random_uuid() primary key,
  couple_id uuid references public.couples(id) on delete cascade,
  title text not null,
  url text not null,
  created_at timestamptz default now() not null,
  created_by uuid references public.profiles(id) on delete set null
);

-- Enable RLS
alter table public.slideshow_songs enable row level security;

-- Drop existing policies if any
drop policy if exists "Allow read for members of the couple" on public.slideshow_songs;
drop policy if exists "Allow insert for members of the couple" on public.slideshow_songs;
drop policy if exists "Allow delete for members of the couple" on public.slideshow_songs;

-- Policies
create policy "Allow read for members of the couple"
  on public.slideshow_songs for select
  using (
    exists (
      select 1 from public.couple_members
      where couple_members.couple_id = slideshow_songs.couple_id
      and couple_members.user_id = auth.uid()
    )
  );

create policy "Allow insert for members of the couple"
  on public.slideshow_songs for insert
  with check (
    exists (
      select 1 from public.couple_members
      where couple_members.couple_id = slideshow_songs.couple_id
      and couple_members.user_id = auth.uid()
    )
  );

create policy "Allow delete for members of the couple"
  on public.slideshow_songs for delete
  using (
    exists (
      select 1 from public.couple_members
      where couple_members.couple_id = slideshow_songs.couple_id
      and couple_members.user_id = auth.uid()
    )
  );

-- Add active song columns to couples table for shared realtime sync
alter table public.couples add column if not exists active_song_url text;
alter table public.couples add column if not exists active_song_title text;
