-- ============================================================
-- Migration: 010_dismissed_reminders
-- Mục đích: Lưu trạng thái "ẩn tạm thời hôm nay" cho reminder
-- Reminder vẫn tự tái xuất hiện ngày mai (smart recurring)
-- ============================================================

CREATE TABLE IF NOT EXISTS dismissed_reminders (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Key định danh loại reminder, ví dụ:
  --   "anniversary_<special_date_id>"
  --   "milestone_365"
  --   "birthday_partner_<partner_id>"
  --   "birthday_self"
  --   "period_partner"
  --   "period_self"
  reminder_key    TEXT        NOT NULL,
  -- Thời điểm dismiss hết hiệu lực (cuối ngày hôm nay 23:59:59)
  dismissed_until TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),

  -- Mỗi user chỉ có 1 dismiss record cho mỗi reminder_key
  -- (UPSERT khi bấm dismiss lại)
  CONSTRAINT dismissed_reminders_user_key UNIQUE (user_id, reminder_key)
);

-- Index để query nhanh
CREATE INDEX IF NOT EXISTS idx_dismissed_reminders_user_until
  ON dismissed_reminders (user_id, dismissed_until);

-- Bật Row Level Security
ALTER TABLE dismissed_reminders ENABLE ROW LEVEL SECURITY;

-- Policy: user chỉ thao tác được với record của chính mình
CREATE POLICY "Users manage own dismissed reminders"
  ON dismissed_reminders
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Dọn dẹp tự động: xóa các record đã hết hạn (cron nếu có pg_cron,
-- hoặc sẽ được xử lý phía client khi fetch)
-- (Tùy chọn, có thể bỏ qua nếu không cài pg_cron)
-- SELECT cron.schedule('cleanup-dismissed', '0 4 * * *',
--   'DELETE FROM dismissed_reminders WHERE dismissed_until < NOW()');
