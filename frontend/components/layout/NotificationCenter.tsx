"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Bell, X, Calendar, Cake, Droplet, Heart, Sparkles,
  MessageSquare, HeartHandshake, Image as ImageIcon, Check, Trash2, EyeOff
} from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/types/database";
import type { Profile } from "@/lib/profile";

type NotificationCenterProps = { profile: Profile };

// ─── Smart Reminder type ─────────────────────────────────────────────────────
type SmartReminder = {
  reminderKey: string;   // unique key để dismiss, vd: "anniversary_abc123"
  type: "mood" | "birthday" | "period" | "anniversary" | "milestone" | "bucket_list";
  title: string;
  content: string;
  icon: React.ElementType;
  gradient: string;
  iconColor: string;
  daysLeft: number;      // 0 = hôm nay, >0 = còn X ngày
};

// ─── Reminder generation rules ───────────────────────────────────────────────
const ANNIVERSARY_WINDOWS = [7, 6, 5, 4, 3, 2, 1, 0];
const BIRTHDAY_WINDOWS    = [7, 6, 5, 4, 3, 2, 1, 0];
const PERIOD_WINDOWS      = [7, 6, 5, 4, 3, 2, 1, 0]; // 0 = đang trong kỳ

// Helper: số ngày giữa today và targetDate (>0 = tương lai, 0 = hôm nay, <0 = đã qua)
function diffDays(today: Date, target: Date): number {
  const t = new Date(target);
  t.setHours(0, 0, 0, 0);
  return Math.round((t.getTime() - today.getTime()) / 86400000);
}

// Helper: ngày kết thúc hôm nay (23:59:59.999)
function endOfToday(): Date {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

// ─── Main Component ──────────────────────────────────────────────────────────
export function NotificationCenter({ profile }: NotificationCenterProps) {
  const [isOpen, setIsOpen]         = useState(false);
  const [activeTab, setActiveTab]   = useState<"reminders" | "activities">("reminders");
  const [notifications, setNotifications] = useState<Tables<"notifications">[]>([]);
  const [reminders, setReminders]   = useState<SmartReminder[]>([]);
  const [dismissedKeys, setDismissedKeys] = useState<Set<string>>(new Set());
  const [unreadCount, setUnreadCount]     = useState(0);
  const [showToast, setShowToast]         = useState(false);
  const [latestToast, setLatestToast]     = useState<Tables<"notifications"> | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  // ─── 1. KHỞI TẠO: purge cũ + fetch activities + fetch dismissed ─────────
  useEffect(() => {
    const init = async () => {
      // Xóa toàn bộ reminder rows cũ trong DB (chỉ chạy 1 lần)
      // Cú pháp PostgREST đúng: không có ngoặc kép bên trong
      await supabase
        .from("notifications")
        .delete()
        .eq("user_id", profile.id)
        .in("type", ["birthday", "period", "anniversary"]);

      // Fetch dismissed keys còn hiệu lực
      await fetchDismissed();

      // Fetch activity notifications thật
      await fetchNotifications();
    };
    init();
  }, [profile.id]);

  // ─── 2. REALTIME: chỉ listen INSERT của activity notifications ───────────
  useEffect(() => {
    const channel = supabase
      .channel(`notif_realtime:${profile.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${profile.id}` },
        (payload) => {
          const n = payload.new as Tables<"notifications">;
          if (["birthday", "period", "anniversary"].includes(n.type)) return;
          setNotifications((prev) => [n, ...prev]);
          setUnreadCount((c) => c + 1);
          setLatestToast(n);
          setShowToast(true);
          setTimeout(() => setShowToast(false), 4500);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile.id]);

  // ─── 2.5. CONNECTION REALTIME SYNC ──────────────────────────────────────────
  useEffect(() => {
    let activeChannel: any = null;
    let isMounted = true;

    const setupSubscription = async () => {
      const { data: memberData } = await supabase
        .from("couple_members")
        .select("couple_id")
        .eq("user_id", profile.id)
        .maybeSingle();

      if (!isMounted) return;

      const coupleId = memberData?.couple_id;
      if (coupleId) {
        activeChannel = supabase
          .channel(`couple_members_sync:${profile.id}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "couple_members",
            },
            () => {
              router.refresh();
            }
          )
          .subscribe();
      } else {
        activeChannel = supabase
          .channel(`user_members_sync:${profile.id}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "couple_members",
            },
            () => {
              router.refresh();
            }
          )
          .subscribe();
      }
    };

    setupSubscription();

    return () => {
      isMounted = false;
      if (activeChannel) {
        supabase.removeChannel(activeChannel);
      }
    };
  }, [profile.id, supabase, router]);

  // ─── 3. GENERATE REMINDERS: chạy lần đầu + mỗi 30 phút ─────────────────
  useEffect(() => {
    generateSmartReminders();
    const interval = setInterval(generateSmartReminders, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [profile.id, dismissedKeys]);

  // ─── Fetch dismissed_reminders còn hiệu lực ─────────────────────────────
  const fetchDismissed = async () => {
    const { data } = await supabase
      .from("dismissed_reminders")
      .select("reminder_key")
      .eq("user_id", profile.id)
      .gt("dismissed_until", new Date().toISOString());

    if (data) {
      setDismissedKeys(new Set(data.map((r) => r.reminder_key)));
    }
  };

  // ─── Fetch activity notifications từ DB ────────────────────────────────────────────
  const fetchNotifications = async () => {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", profile.id)
      // Loại bỏ reminder types (không phải activity thật)
      // Cú pháp PostgREST đúng: không có ngoặc kép bên trong
      .not("type", "in", "(birthday,period,anniversary)")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.is_read).length);
    }
  };

  // ─── CORE: Generate Smart Reminders ─────────────────────────────────────
  const generateSmartReminders = useCallback(async () => {
    const calculated: SmartReminder[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      // Lấy couple info
      const { data: memberData } = await supabase
        .from("couple_members").select("couple_id").eq("user_id", profile.id).maybeSingle();
      if (!memberData?.couple_id) return;
      const coupleId = memberData.couple_id as string;

      // Lấy partner
      const { data: partnerMembers } = await supabase
        .from("couple_members").select("user_id").eq("couple_id", coupleId).neq("user_id", profile.id);
      const partnerId = partnerMembers?.[0]?.user_id;
      let partnerProfile: Profile | null = null;
      if (partnerId) {
        const { data } = await supabase.from("profiles").select("*").eq("id", partnerId).maybeSingle();
        partnerProfile = data;
      }

      // Lấy couple data
      const { data: coupleData } = await supabase
        .from("couples").select("love_start_date").eq("id", coupleId).maybeSingle();

      // Lấy special dates của cặp đôi
      const { data: specDates } = await supabase
        .from("special_dates").select("*").eq("couple_id", coupleId);

      // ── A. ANNIVERSARY & SPECIAL DATES ────────────────────────────────
      if (specDates) {
        for (const d of specDates) {
          const key = `anniversary_${d.id}`;
          if (dismissedKeys.has(key)) continue;

          const base = new Date(d.date);
          let target = new Date(base);

          if (d.repeat_yearly) {
            target = new Date(today.getFullYear(), base.getMonth(), base.getDate());
            if (target < today) target.setFullYear(today.getFullYear() + 1);
          }

          const days = diffDays(today, target);
          if (!ANNIVERSARY_WINDOWS.includes(days) || days < 0) continue;

          const typeLabel = d.type === "birthday" ? "Sinh nhật" : "Kỷ niệm";
          calculated.push({
            reminderKey: key,
            type: "anniversary",
            title: days === 0
              ? `🎉 Hôm nay là ${typeLabel.toLowerCase()} "${d.title}"!`
              : `${typeLabel} "${d.title}" ${days === 1 ? "ngày mai" : `còn ${days} ngày`} 📅`,
            content: days === 0
              ? `Hôm nay chính là ngày kỷ niệm đặc biệt: "${d.title}". Chúc hai bạn tràn ngập tiếng cười! 🎉`
              : `Còn ${days} ngày nữa là ${typeLabel.toLowerCase()} "${d.title}" (${target.toLocaleDateString("vi-VN")}). Đừng quên chuẩn bị nhé! 💕`,
            icon: Calendar,
            gradient: "from-amber-100 to-orange-100 dark:from-amber-950/20 dark:to-orange-950/20",
            iconColor: "text-amber-600",
            daysLeft: days,
          });
        }
      }

      // ── B. MILESTONES (ngày yêu nhau) ─────────────────────────────────
      if (coupleData?.love_start_date) {
        const start = new Date(coupleData.love_start_date);
        const currentDays = Math.floor((Date.now() - start.getTime()) / 86400000) + 1;
        const milestones = [100, 200, 300, 365, 500, 1000, 1500, 2000, 3000];

        for (const mile of milestones) {
          const diff = mile - currentDays;
          if (!ANNIVERSARY_WINDOWS.includes(diff) || diff < 0) continue;

          const key = `milestone_${mile}`;
          if (dismissedKeys.has(key)) continue;

          calculated.push({
            reminderKey: key,
            type: "milestone",
            title: diff === 0
              ? `💞 Hôm nay hai bạn tròn ${mile} ngày bên nhau!`
              : `Sắp tròn ${mile} ngày yêu nhau ${diff === 1 ? "(ngày mai!)" : `(còn ${diff} ngày)`} 💞`,
            content: diff === 0
              ? `Chúc mừng! Hôm nay chính là ngày hai bạn tròn ${mile} ngày đồng hành. Hãy làm điều gì đó thật đặc biệt! 🥂`
              : `Còn ${diff} ngày nữa là cột mốc ${mile} ngày yêu nhau. Cùng tạo một bất ngờ nhỏ nhé! ✨`,
            icon: Heart,
            gradient: "from-pink-100 via-rose-100 to-purple-100 dark:from-pink-950/20 dark:to-purple-950/20",
            iconColor: "text-pink-600 animate-bounce",
            daysLeft: diff,
          });
        }
      }

      // ── C. BIRTHDAY ─────────────────────────────────────────────────────
      // Sinh nhật đối phương
      if (partnerProfile?.birthday) {
        const key = `birthday_partner_${partnerId}`;
        if (!dismissedKeys.has(key)) {
          const [, bM, bD] = partnerProfile.birthday.split("-").map(Number);
          const target = new Date(today.getFullYear(), bM - 1, bD);
          if (target < today) target.setFullYear(today.getFullYear() + 1);
          const days = diffDays(today, target);

          if (BIRTHDAY_WINDOWS.includes(days) && days >= 0) {
            calculated.push({
              reminderKey: key,
              type: "birthday",
              title: days === 0
                ? `🎂 Hôm nay là sinh nhật ${partnerProfile.display_name}!`
                : `Sinh nhật ${partnerProfile.display_name} ${days === 1 ? "ngày mai" : `còn ${days} ngày`} 🎂`,
              content: days === 0
                ? `Hôm nay chính là sinh nhật của ${partnerProfile.display_name}! Hãy gửi ngàn lời chúc ngọt ngào nhất nhé! 🎉`
                : `Còn ${days} ngày nữa là sinh nhật của ${partnerProfile.display_name} (${bD}/${bM}). Cùng lên kế hoạch thổi nến nhé! 💕`,
              icon: Cake,
              gradient: "from-pink-100 to-rose-100 dark:from-pink-950/20 dark:to-rose-950/20",
              iconColor: "text-rose-500",
              daysLeft: days,
            });
          }
        }
      }

      // Sinh nhật bản thân
      if (profile.birthday) {
        const key = `birthday_self`;
        if (!dismissedKeys.has(key)) {
          const [, bM, bD] = profile.birthday.split("-").map(Number);
          const target = new Date(today.getFullYear(), bM - 1, bD);
          if (target < today) target.setFullYear(today.getFullYear() + 1);
          const days = diffDays(today, target);

          if (BIRTHDAY_WINDOWS.includes(days) && days >= 0) {
            calculated.push({
              reminderKey: key,
              type: "birthday",
              title: days === 0
                ? `🎂 Hôm nay là sinh nhật của bạn!`
                : `Sinh nhật của bạn ${days === 1 ? "ngày mai rồi" : `còn ${days} ngày`} 🎉`,
              content: days === 0
                ? `Chúc mừng sinh nhật! Hôm nay là ngày của bạn — hãy để người ấy chiều chuộng bạn nhé! 💖`
                : `Còn ${days} ngày nữa là sinh nhật của bạn (${bD}/${bM}). Chuẩn bị nhận quà thôi! ✨`,
              icon: Cake,
              gradient: "from-yellow-100 to-amber-100 dark:from-yellow-950/20 dark:to-amber-950/20",
              iconColor: "text-amber-500",
              daysLeft: days,
            });
          }
        }
      }

      // ── D. PERIOD TRACKING ──────────────────────────────────────────────
      const buildPeriodReminder = (
        trackingData: Tables<"period_tracking">,
        key: string,
        isPartner: boolean,
        name: string
      ) => {
        if (dismissedKeys.has(key)) return;

        const [lpY, lpM, lpD] = trackingData.last_period_date.split("-").map(Number);
        const lastDate = new Date(lpY, lpM - 1, lpD);
        const cycle = trackingData.cycle_length || 28;
        const len   = trackingData.period_length  || 5;

        // Tính nextStart
        let nextStart = new Date(lastDate);
        while (nextStart <= today) {
          nextStart = new Date(nextStart.getTime() + cycle * 86400000);
        }

        // Kiểm tra đang trong kỳ
        let isActive = false;
        for (let i = 0; i < 3; i++) {
          const pStart = new Date(lastDate.getTime() + i * cycle * 86400000);
          const pEnd   = new Date(pStart.getTime() + len * 86400000);
          if (today >= pStart && today < pEnd) { isActive = true; break; }
        }

        const days = isActive ? 0 : diffDays(today, nextStart);

        if (isActive) {
          calculated.push({
            reminderKey: key,
            type: "period",
            title: isPartner ? `🌸 ${name} đang trong chu kỳ` : `🌸 Bạn đang trong chu kỳ`,
            content: isPartner
              ? `${name} đang trong những ngày chu kỳ nhạy cảm. Hãy pha một ly trà gừng ấm và quan tâm nhiều hơn nhé! 🍵`
              : `Hãy chăm sóc bản thân thật tốt, uống nhiều nước ấm và nghỉ ngơi đầy đủ nhé! 🍵`,
            icon: Droplet,
            gradient: "from-rose-50 to-pink-100 dark:from-rose-950/10 dark:to-pink-950/15",
            iconColor: "text-red-500 animate-pulse",
            daysLeft: 0,
          });
        } else if (PERIOD_WINDOWS.includes(days) && days > 0) {
          calculated.push({
            reminderKey: key,
            type: "period",
            title: isPartner
              ? `🌸 Chu kỳ của ${name} ${days === 1 ? "ngày mai" : `còn ${days} ngày`}`
              : `🌸 Chu kỳ của bạn ${days === 1 ? "ngày mai" : `còn ${days} ngày`}`,
            content: isPartner
              ? `Dự báo còn ${days} ngày nữa ${name} sẽ bắt đầu chu kỳ. Hãy sẵn sàng quan tâm và chiều chuộng nhé! 🫂`
              : `Dự báo còn ${days} ngày nữa là đến chu kỳ mới. Hãy giữ gìn sức khỏe nhé! 🍵`,
            icon: Droplet,
            gradient: "from-red-50 to-amber-50 dark:from-red-950/10 dark:to-amber-950/10",
            iconColor: "text-red-400",
            daysLeft: days,
          });
        }
      };

      // Period của partner
      const isPartnerPeriodEnabled = partnerProfile?.gender === "female" || partnerProfile?.period_tracking_enabled === true;
      if (partnerId && isPartnerPeriodEnabled) {
        const { data: pPeriod } = await supabase
          .from("period_tracking").select("*").eq("user_id", partnerId).maybeSingle();
        if (pPeriod?.share_with_partner) {
          buildPeriodReminder(pPeriod, "period_partner", true, partnerProfile?.display_name || "Người ấy");
        }
      }

      // Period của bản thân
      const isOwnPeriodEnabled = profile.gender === "female" || profile.period_tracking_enabled === true;
      if (isOwnPeriodEnabled) {
        const { data: ownPeriod } = await supabase
          .from("period_tracking").select("*").eq("user_id", profile.id).maybeSingle();
        if (ownPeriod) {
          buildPeriodReminder(ownPeriod, "period_self", false, profile.display_name);
        }
      }

      // ── E. PARTNER MOOD (trong 24h) ─────────────────────────────────────
      if (partnerId) {
        const key = `mood_partner`;
        if (!dismissedKeys.has(key)) {
          const { data: mood } = await supabase
            .from("mood_logs").select("*").eq("user_id", partnerId)
            .order("created_at", { ascending: false }).limit(1).maybeSingle();

          if (mood?.created_at) {
            const hours = (Date.now() - new Date(mood.created_at).getTime()) / 3600000;
            if (hours < 24) {
              calculated.push({
                reminderKey: key,
                type: "mood",
                title: `${partnerProfile?.display_name || "Người ấy"} vừa cập nhật tâm trạng`,
                content: `Tâm trạng: "${mood.mood}"${mood.note ? ` - "${mood.note}"` : ""}. Hãy gửi lời nhắn yêu thương nhé! ❤️`,
                icon: HeartHandshake,
                gradient: "from-purple-100 to-indigo-100 dark:from-purple-950/20 dark:to-indigo-950/20",
                iconColor: "text-purple-600",
                daysLeft: 0,
              });
            }
          }
        }
      }

      // ── F. BUCKET LIST (gợi ý ngẫu nhiên) ─────────────────────────────
      const bucketKey = `bucket_suggestion`;
      if (!dismissedKeys.has(bucketKey)) {
        const { data: buckets } = await supabase
          .from("bucket_list").select("*").eq("couple_id", coupleId).eq("is_completed", false);

        if (buckets && buckets.length > 0) {
          const item = buckets[Math.floor(Math.random() * buckets.length)];
          calculated.push({
            reminderKey: bucketKey,
            type: "bucket_list",
            title: "Cùng nhau thực hiện ước mơ ✨",
            content: `Thử thách: "${item.title}" đang chờ hai bạn. Lên lịch hẹn hò tuần này nhé! 🚀`,
            icon: Sparkles,
            gradient: "from-teal-100 to-emerald-100 dark:from-teal-950/20 dark:to-emerald-950/20",
            iconColor: "text-teal-600",
            daysLeft: -1,
          });
        }
      }

    } catch (err) {
      console.error("Lỗi generate smart reminders:", err);
    }

    // Sắp xếp: sắp xảy ra trước (daysLeft nhỏ hơn lên trên)
    calculated.sort((a, b) => {
      if (a.daysLeft < 0) return 1;
      if (b.daysLeft < 0) return -1;
      return a.daysLeft - b.daysLeft;
    });

    setReminders(calculated);
  }, [profile.id, dismissedKeys]);

  // ─── DISMISS: ẩn reminder cho hôm nay ──────────────────────────────────
  const dismissReminder = async (key: string) => {
    const until = endOfToday().toISOString();

    await supabase.from("dismissed_reminders").upsert(
      { user_id: profile.id, reminder_key: key, dismissed_until: until },
      { onConflict: "user_id,reminder_key" }
    );

    setDismissedKeys((prev) => new Set([...prev, key]));
    setReminders((prev) => prev.filter((r) => r.reminderKey !== key));
  };

  // ─── ACTIVITY NOTIFICATION ACTIONS ──────────────────────────────────────
  const markAllAsRead = async () => {
    const ids = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (!ids.length) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    await supabase.from("notifications").update({ is_read: true }).in("id", ids);
  };

  const deleteNotification = async (id: string) => {
    // Optimistic: xóa UI ngay
    const snapshot = notifications;
    const updated = notifications.filter((n) => n.id !== id);
    setNotifications(updated);
    setUnreadCount(updated.filter((n) => !n.is_read).length);

    // Xóa DB thật
    const { error } = await supabase.from("notifications").delete().eq("id", id);
    if (error) {
      // Rollback nếu thất bại
      setNotifications(snapshot);
      setUnreadCount(snapshot.filter((n) => !n.is_read).length);
      console.error("Lỗi xóa thông báo:", error.message);
    }
  };

  const clickNotification = async (notif: Tables<"notifications">) => {
    if (!notif.is_read) {
      setNotifications((prev) => prev.map((n) => n.id === notif.id ? { ...n, is_read: true } : n));
      setUnreadCount((c) => Math.max(0, c - 1));
      await supabase.from("notifications").update({ is_read: true }).eq("id", notif.id);
    }
    if (notif.link) { setIsOpen(false); window.location.href = notif.link; }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case "love_note":  return MessageSquare;
      case "reaction":   return Heart;
      case "album":      return ImageIcon;
      case "bucket_list":return Sparkles;
      default:           return Bell;
    }
  };

  const getNotifColor = (type: string) => {
    switch (type) {
      case "love_note":  return "text-blue-500 bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300";
      case "reaction":   return "text-pink-500 bg-pink-100 dark:bg-pink-950/40 dark:text-pink-300";
      case "album":      return "text-emerald-500 bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300";
      case "bucket_list":return "text-purple-500 bg-purple-100 dark:bg-purple-950/40 dark:text-purple-300";
      default:           return "text-amber-500 bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300";
    }
  };

  const visibleReminders = reminders.filter((r) => r.type !== "bucket_list" || r.reminderKey !== "bucket_suggestion" || reminders.length === 0);
  const badgeCount = unreadCount + visibleReminders.length;

  return (
    <>
      {/* NÚT CHUÔNG */}
      <button
        onClick={() => { setIsOpen(true); generateSmartReminders(); }}
        className="fixed top-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-card)]/80 backdrop-blur-md shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 group cursor-pointer"
        title="Trung tâm thông báo"
      >
        <Bell className="h-5 w-5 text-[var(--color-primary)] transition-transform duration-300 group-hover:rotate-12" />
        {badgeCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[0.65rem] font-black text-white shadow-md animate-[pulse_2s_infinite]">
            {badgeCount}
          </span>
        )}
      </button>

      {/* REALTIME TOAST */}
      {showToast && latestToast && (
        <div
          onClick={() => clickNotification(latestToast)}
          className="fixed bottom-20 right-5 z-50 flex max-w-sm items-center gap-4 rounded-3xl border border-[var(--color-border)] bg-[var(--color-card)]/90 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.15)] backdrop-blur-lg animate-in slide-in-from-bottom-5 duration-300 cursor-pointer hover:-translate-y-1"
        >
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${getNotifColor(latestToast.type)}`}>
            {(() => { const I = getNotifIcon(latestToast.type); return <I className="h-5 w-5" />; })()}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-black text-[var(--color-text)] truncate">{latestToast.title}</h4>
            <p className="mt-0.5 text-xs text-[var(--color-muted)] font-medium leading-relaxed line-clamp-2">{latestToast.content}</p>
          </div>
          <button onClick={(e) => { e.stopPropagation(); setShowToast(false); }} className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-[var(--color-soft)] text-[var(--color-faint)]">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* SLIDE-OVER DRAWER */}
      <div className={`fixed inset-0 z-50 overflow-hidden transition-all duration-500 ${isOpen ? "visible pointer-events-auto" : "invisible pointer-events-none"}`}>
        {/* Backdrop */}
        <div className={`absolute inset-0 bg-black/10 backdrop-blur-sm transition-opacity duration-500 ${isOpen ? "opacity-100" : "opacity-0"}`} onClick={() => setIsOpen(false)} />

        <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
          <div className={`w-screen max-w-md transform transition-transform duration-500 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
            <div className="flex h-full flex-col border-l border-[var(--color-border)] bg-[var(--color-card)]/95 backdrop-blur-xl shadow-2xl">

              {/* Header */}
              <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-5">
                <div className="flex items-center gap-2.5">
                  <Bell className="h-5 w-5 text-[var(--color-primary)] animate-pulse" />
                  <h2 className="text-lg font-black text-[var(--color-text)] tracking-tight">Hộp thư Đôi lứa</h2>
                </div>
                <button onClick={() => setIsOpen(false)} className="rounded-full p-2 text-[var(--color-faint)] hover:bg-[var(--color-soft)] hover:text-[var(--color-primary)] transition">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="grid grid-cols-2 border-b border-[var(--color-border)] bg-[var(--color-soft)]/50 p-1.5 m-4 rounded-2xl">
                <button
                  onClick={() => setActiveTab("reminders")}
                  className={`rounded-xl py-2.5 text-xs font-black transition-all ${activeTab === "reminders" ? "bg-[var(--color-card)] text-[var(--color-primary)] shadow-sm" : "text-[var(--color-muted)] hover:text-[var(--color-text)]"}`}
                >
                  Gợi ý yêu thương ({reminders.length})
                </button>
                <button
                  onClick={() => setActiveTab("activities")}
                  className={`rounded-xl py-2.5 text-xs font-black transition-all ${activeTab === "activities" ? "bg-[var(--color-card)] text-[var(--color-primary)] shadow-sm" : "text-[var(--color-muted)] hover:text-[var(--color-text)]"}`}
                >
                  Hoạt động ({unreadCount > 0 ? unreadCount : notifications.length})
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-6 pb-6">

                {/* ── TAB 1: SMART REMINDERS ── */}
                {activeTab === "reminders" && (
                  <div className="space-y-4">
                    {/* Hint */}
                    <p className="text-[10px] text-[var(--color-faint)] font-medium text-center">
                      Tự động cập nhật theo ngày · Bỏ qua hôm nay sẽ tái hiện ngày mai
                    </p>

                    {visibleReminders.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 text-center text-[var(--color-muted)]">
                        <Heart className="h-10 w-10 text-[var(--color-primary-soft)] animate-pulse mb-3" />
                        <p className="text-xs font-bold">Không gian bình yên ✨</p>
                        <p className="mt-1 text-[10px] max-w-[200px]">Không có sự kiện nào trong 7 ngày tới. Tận hưởng khoảnh khắc bên nhau nhé!</p>
                      </div>
                    ) : (
                      visibleReminders.map((r) => {
                        const IconComp = r.icon;
                        return (
                          <div
                            key={r.reminderKey}
                            className={`group relative overflow-hidden rounded-[1.75rem] border border-[var(--color-border)] bg-gradient-to-br ${r.gradient} p-5 shadow-[0_8px_30px_rgba(0,0,0,0.02)] transition-all hover:shadow-[0_12px_40px_rgba(136,65,95,0.06)] hover:-translate-y-0.5`}
                          >
                            {/* daysLeft badge */}
                            {r.daysLeft >= 0 && (
                              <span className={`absolute top-3 right-3 rounded-full px-2 py-0.5 text-[9px] font-black ${r.daysLeft === 0 ? "bg-red-500 text-white animate-pulse" : "bg-[var(--color-card)] text-[var(--color-primary)]"}`}>
                                {r.daysLeft === 0 ? "HÔM NAY" : `${r.daysLeft} ngày`}
                              </span>
                            )}

                            <div className="flex items-start gap-4 pr-8">
                              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-card)] shadow-sm ${r.iconColor}`}>
                                <IconComp className="h-5 w-5" />
                              </div>
                              <div className="space-y-1 flex-1">
                                <h4 className="text-sm font-black text-[var(--color-text)] tracking-tight leading-snug">{r.title}</h4>
                                <p className="text-xs font-medium text-[var(--color-muted)] leading-relaxed">{r.content}</p>
                              </div>
                            </div>

                            {/* Dismiss button */}
                            <button
                              onClick={() => dismissReminder(r.reminderKey)}
                              className="mt-3 flex items-center gap-1.5 text-[10px] font-bold text-[var(--color-faint)] hover:text-[var(--color-muted)] transition opacity-0 group-hover:opacity-100"
                              title="Bỏ qua hôm nay – sẽ hiện lại ngày mai"
                            >
                              <EyeOff className="h-3 w-3" />
                              Bỏ qua hôm nay
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* ── TAB 2: ACTIVITY NOTIFICATIONS ── */}
                {activeTab === "activities" && (
                  <div className="space-y-4">
                    {notifications.length > 0 && (
                      <div className="flex justify-end">
                        <button onClick={markAllAsRead} className="flex items-center gap-1.5 text-[10px] font-black text-[var(--color-primary)] hover:underline cursor-pointer">
                          <Check className="h-3.5 w-3.5" /> Đánh dấu đã đọc tất cả
                        </button>
                      </div>
                    )}

                    {notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 text-center text-[var(--color-muted)] animate-in fade-in duration-300">
                        <MessageSquare className="h-10 w-10 text-[var(--color-primary-soft)] mb-3" />
                        <p className="text-xs font-bold">Trống trải quá...</p>
                        <p className="mt-1 text-[10px] max-w-[200px]">Chưa có hoạt động hay lời nhắn nào từ người ấy.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {notifications.map((notif) => {
                          const IconComp = getNotifIcon(notif.type);
                          return (
                            <div
                              key={notif.id}
                              onClick={() => clickNotification(notif)}
                              className={`group relative overflow-hidden rounded-[1.75rem] border border-[var(--color-border)] p-4 shadow-sm transition-all hover:bg-[var(--color-soft)] cursor-pointer ${notif.is_read ? "bg-[var(--color-card)]/50" : "bg-[var(--color-primary-soft)]/20 border-[var(--color-primary)]/35"}`}
                            >
                              <div className="flex items-start gap-3.5">
                                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${getNotifColor(notif.type)}`}>
                                  <IconComp className="h-4 w-4" />
                                </div>
                                <div className="min-w-0 flex-1 space-y-0.5">
                                  <div className="flex items-center justify-between gap-1">
                                    <h4 className="text-xs font-black text-[var(--color-text)] truncate">{notif.title}</h4>
                                    <span className="text-[9px] font-medium text-[var(--color-faint)] whitespace-nowrap">
                                      {notif.created_at ? new Date(notif.created_at).toLocaleDateString("vi-VN", { month: "numeric", day: "numeric" }) : ""}
                                    </span>
                                  </div>
                                  <p className="text-[11px] font-medium text-[var(--color-muted)] leading-normal line-clamp-2">{notif.content}</p>
                                </div>
                                <button
                                  onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }}
                                  className="opacity-0 group-hover:opacity-100 flex h-7 w-7 items-center justify-center rounded-full hover:bg-red-50 hover:text-red-500 text-[var(--color-faint)] transition cursor-pointer"
                                  title="Xóa thông báo"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                              {!notif.is_read && (
                                <span className="absolute top-4 right-4 flex h-2 w-2 rounded-full bg-red-500" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
