-- ============================================================
-- Migration: 011_add_delete_policy_to_notifications
-- Mục đích: Cho phép người dùng xóa thông báo của chính mình
-- ============================================================

DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;

CREATE POLICY "Users can delete their own notifications"
ON public.notifications FOR DELETE
USING (auth.uid() = user_id);
