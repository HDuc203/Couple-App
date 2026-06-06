-- =====================================================
-- Migration: Create partner_notes table
-- "Sổ tay người ấy" — Couple notebook feature
-- =====================================================

CREATE TABLE IF NOT EXISTS public.partner_notes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id   UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  created_by  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category    TEXT NOT NULL CHECK (category IN (
    'like', 'dislike', 'food', 'gift', 'habit', 'remember', 'note'
  )),
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- ── Indexes ──
CREATE INDEX IF NOT EXISTS idx_partner_notes_couple_id ON public.partner_notes(couple_id);
CREATE INDEX IF NOT EXISTS idx_partner_notes_created_by ON public.partner_notes(created_by);
CREATE INDEX IF NOT EXISTS idx_partner_notes_couple_category ON public.partner_notes(couple_id, category);

-- ── Row Level Security ──
ALTER TABLE public.partner_notes ENABLE ROW LEVEL SECURITY;

-- Couple members can read all notes in their couple
CREATE POLICY "couple members can select partner_notes"
  ON public.partner_notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.couple_members cm
      WHERE cm.couple_id = partner_notes.couple_id
        AND cm.user_id = auth.uid()
    )
  );

-- Couple members can insert notes for their couple
CREATE POLICY "couple members can insert partner_notes"
  ON public.partner_notes FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM public.couple_members cm
      WHERE cm.couple_id = partner_notes.couple_id
        AND cm.user_id = auth.uid()
    )
  );

-- Only author can update their own notes
CREATE POLICY "author can update partner_notes"
  ON public.partner_notes FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Only author can delete their own notes
CREATE POLICY "author can delete partner_notes"
  ON public.partner_notes FOR DELETE
  USING (auth.uid() = created_by);

-- ── Auto-update updated_at trigger ──
CREATE OR REPLACE FUNCTION public.update_partner_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_partner_notes_updated_at
  BEFORE UPDATE ON public.partner_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_partner_notes_updated_at();

-- ── Enable Realtime ──
-- NOTE: Run this separately if supabase_realtime publication already exists:
ALTER PUBLICATION supabase_realtime ADD TABLE public.partner_notes;
