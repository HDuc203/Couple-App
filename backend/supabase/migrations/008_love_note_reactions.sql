-- Migration 008: love_note_reactions
-- Thêm bảng reaction nhẹ nhàng cho từng love note
-- Mỗi user chỉ có 1 reaction trên 1 note (upsert)

create table if not exists public.love_note_reactions (
  id            uuid primary key default gen_random_uuid(),
  love_note_id  uuid not null references public.love_notes(id) on delete cascade,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  reaction_type text not null check (reaction_type in ('heart', 'hug_back', 'touched', 'gentle')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint love_note_reactions_unique unique (love_note_id, user_id)
);

-- Index for fast lookups by love_note_id
create index if not exists love_note_reactions_note_idx on public.love_note_reactions (love_note_id);
create index if not exists love_note_reactions_user_idx on public.love_note_reactions (user_id);

-- RLS: couple members only
alter table public.love_note_reactions enable row level security;

drop policy if exists love_note_reactions_couple_members on public.love_note_reactions;

create policy love_note_reactions_couple_members
  on public.love_note_reactions
  for all
  to authenticated
  using (
    exists (
      select 1 from public.love_notes ln
      join public.couple_members cm on cm.couple_id = ln.couple_id
      where ln.id = love_note_reactions.love_note_id
        and cm.user_id = auth.uid()
    )
  )
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.love_notes ln
      join public.couple_members cm on cm.couple_id = ln.couple_id
      where ln.id = love_note_reactions.love_note_id
        and cm.user_id = auth.uid()
    )
  );

-- Enable realtime
alter publication supabase_realtime add table public.love_note_reactions;
