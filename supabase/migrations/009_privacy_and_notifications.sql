-- 1. Thêm cột is_private vào diary_entries
ALTER TABLE public.diary_entries ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;

-- 2. Thêm cột is_hidden vào love_notes
ALTER TABLE public.love_notes ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false;

-- 3. Tạo bảng notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- Người nhận thông báo
    sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Tác nhân gây ra thông báo
    type VARCHAR(50) NOT NULL, -- 'love_note', 'reaction', 'album', 'bucket_list', 'mood', etc.
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    link TEXT, -- Đường dẫn chuyển hướng khi click
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Kích hoạt RLS cho bảng notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Cấp quyền bảo mật cho notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" 
ON public.notifications FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" 
ON public.notifications FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert notifications for couple members" ON public.notifications;
CREATE POLICY "Users can insert notifications for couple members" 
ON public.notifications FOR INSERT 
WITH CHECK (public.is_couple_member(couple_id));

-- 4. Nâng cấp RLS cho diary_entries để hỗ trợ chế độ riêng tư (is_private)
DROP POLICY IF EXISTS diary_entries_couple_members ON public.diary_entries;
DROP POLICY IF EXISTS "diary_entries_select" ON public.diary_entries;
DROP POLICY IF EXISTS "diary_entries_insert" ON public.diary_entries;
DROP POLICY IF EXISTS "diary_entries_update" ON public.diary_entries;
DROP POLICY IF EXISTS "diary_entries_delete" ON public.diary_entries;

CREATE POLICY "diary_entries_select"
ON public.diary_entries FOR SELECT TO authenticated
USING (
    author_id = auth.uid() 
    OR (public.is_couple_member(couple_id) AND (is_private = false OR is_private IS NULL))
);

CREATE POLICY "diary_entries_insert"
ON public.diary_entries FOR INSERT TO authenticated
WITH CHECK (
    author_id = auth.uid() 
    AND public.is_couple_member(couple_id)
);

CREATE POLICY "diary_entries_update"
ON public.diary_entries FOR UPDATE TO authenticated
USING (author_id = auth.uid())
WITH CHECK (author_id = auth.uid());

CREATE POLICY "diary_entries_delete"
ON public.diary_entries FOR DELETE TO authenticated
USING (author_id = auth.uid());

-- 5. Kích hoạt realtime cho bảng notifications (Chống lỗi nếu đã add)
alter publication supabase_realtime drop table if exists public.notifications;
alter publication supabase_realtime add table public.notifications;
