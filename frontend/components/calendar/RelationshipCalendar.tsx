"use client";

import { useState, useEffect, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  Cake,
  Heart,
  Droplet,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Clock,
  Lock,
  Unlock,
  AlertCircle,
  Loader2,
  X,
  BookOpen,
  Images,
  Send,
  Eye,
  EyeOff,
  Bell
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/types/database";
import type { Profile } from "@/lib/profile";
import type { PartnerProfile } from "@/lib/couple";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { CustomSelect } from "@/components/ui/CustomSelect";

type RelationshipCalendarProps = {
  profile: Profile;
  currentCouple: any;
  partnerProfile: PartnerProfile | null;
  initialSpecialDates: Tables<"special_dates">[];
  initialPeriodLogs: Tables<"period_tracking">[];
  initialTimelineItems: Tables<"relationship_timeline">[];
  initialBucketItems: Tables<"bucket_list">[];
  initialJournalEntries: Tables<"diary_entries">[];
  initialPhotos: Tables<"photos">[];
  queryError?: string;
};

type SpecialDateType = "birthday" | "anniversary" | "milestone" | "date" | "kiss" | "custom";

type ParsedDescription = {
  text: string;
  category: string;
  moodTag: "Planned" | "Someday";
};

function parseDreamDescription(rawDesc: string | null): ParsedDescription {
  if (!rawDesc) return { text: "", category: "Ước mơ", moodTag: "Someday" };
  const clean = rawDesc.trim();
  if (clean.startsWith("{") && clean.endsWith("}")) {
    try {
      const parsed = JSON.parse(clean);
      return {
        text: parsed.text || "",
        category: parsed.category || "Ước mơ",
        moodTag: parsed.moodTag || "Someday",
      };
    } catch (e) {
      // Fallback
    }
  }
  return {
    text: rawDesc,
    category: "Ước mơ",
    moodTag: "Someday",
  };
}

const DATE_TYPES: Record<SpecialDateType, { label: string; emoji: string; color: string }> = {
  anniversary: { label: "Kỷ niệm yêu", emoji: "❤️", color: "bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-950/40 dark:text-pink-300" },
  birthday: { label: "Sinh nhật", emoji: "🎂", color: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300" },
  milestone: { label: "Cột mốc lớn", emoji: "💍", color: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300" },
  date: { label: "Hẹn hò đầu", emoji: "🌌", color: "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300" },
  kiss: { label: "Nụ hôn đầu", emoji: "🥰", color: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300" },
  custom: { label: "Khác", emoji: "✨", color: "bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300" }
};


export function RelationshipCalendar({
  profile,
  currentCouple,
  partnerProfile,
  initialSpecialDates,
  initialPeriodLogs,
  initialTimelineItems,
  initialBucketItems,
  initialJournalEntries,
  initialPhotos,
  queryError,
}: RelationshipCalendarProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const supabase = useMemo(() => createClient(), []);

  const coupleId = currentCouple?.couple?.id ?? null;
  const partnerName = partnerProfile?.display_name ?? "Người ấy";

  // State Management
  const [specialDates, setSpecialDates] = useState<Tables<"special_dates">[]>(initialSpecialDates);
  const [periodLogs, setPeriodLogs] = useState<Tables<"period_tracking">[]>(initialPeriodLogs);
  const [timelineItems, setTimelineItems] = useState<Tables<"relationship_timeline">[]>(initialTimelineItems);

  // Month navigation states
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  // Special Day Modal CRUD State
  const [isOpenDateModal, setIsOpenDateModal] = useState(false);
  const [dateTitle, setDateTitle] = useState("");
  const [dateType, setDateType] = useState<SpecialDateType>("anniversary");
  const [dateValue, setDateValue] = useState("");
  const [dateDesc, setDateDesc] = useState("");
  const [dateRepeat, setDateRepeat] = useState(true);
  const [dateError, setDateError] = useState("");

  // Period Tracking setup Modal state
  const [isOpenPeriodModal, setIsOpenPeriodModal] = useState(false);
  const [lastPeriodDate, setLastPeriodDate] = useState("");
  const [cycleLength, setCycleLength] = useState(28);
  const [periodLength, setPeriodLength] = useState(5);
  const [sharePeriod, setSharePeriod] = useState(true);
  const [periodError, setPeriodError] = useState("");

  // Custom Confirm Modal state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Selected date details modal
  const [selectedDayEvents, setSelectedDayEvents] = useState<{
    date: Date;
    events: Array<{ type: string; title: string; emoji: string; desc?: string | null }>;
  } | null>(null);

  // Sync state values on initial server props change
  useEffect(() => {
    setSpecialDates((current) => {
      const combined = [...current, ...initialSpecialDates];
      return Array.from(new Map(combined.map((item) => [item.id, item])).values()).sort((a, b) => a.date.localeCompare(b.date));
    });
  }, [initialSpecialDates]);

  useEffect(() => {
    setPeriodLogs((current) => {
      const combined = [...current, ...initialPeriodLogs];
      return Array.from(new Map(combined.map((item) => [item.id, item])).values());
    });
  }, [initialPeriodLogs]);

  useEffect(() => {
    setTimelineItems((current) => {
      const combined = [...current, ...initialTimelineItems];
      return Array.from(new Map(combined.map((item) => [item.id, item])).values()).sort((a, b) => {
        const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bTime - aTime;
      });
    });
  }, [initialTimelineItems]);

  // Real-time synchronization
  useEffect(() => {
    if (!coupleId) return;

    const datesChannel = supabase
      .channel(`special_dates_sync:${coupleId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "special_dates" },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            const newDate = payload.new as Tables<"special_dates">;
            setSpecialDates((prev) => {
              if (prev.some((d) => d.id === newDate.id)) return prev;
              return [...prev, newDate].sort((a, b) => a.date.localeCompare(b.date));
            });
          } else if (payload.eventType === "UPDATE") {
            const updatedDate = payload.new as Tables<"special_dates">;
            setSpecialDates((prev) =>
              prev.map((d) => (d.id === updatedDate.id ? updatedDate : d)).sort((a, b) => a.date.localeCompare(b.date))
            );
          } else if (payload.eventType === "DELETE") {
            const deleted = payload.old as { id: string };
            setSpecialDates((prev) => prev.filter((d) => d.id !== deleted.id));
            // Đóng day detail modal nếu đang hiển thị
            setSelectedDayEvents(null);
          }
          startTransition(() => router.refresh());
        }
      )
      .subscribe();

    const handlePeriodChange = (payload: any) => {
      if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
        const newLog = payload.new as Tables<"period_tracking">;
        setPeriodLogs((prev) => {
          const exists = prev.some((p) => p.id === newLog.id);
          if (exists) {
            return prev.map((p) => (p.id === newLog.id ? newLog : p));
          } else {
            return [...prev, newLog];
          }
        });
      } else if (payload.eventType === "DELETE") {
        const oldLog = payload.old as { id: string };
        setPeriodLogs((prev) => prev.filter((p) => p.id !== oldLog.id));
      }
      startTransition(() => router.refresh());
    };

    let periodChannel = supabase.channel(`period_tracking_sync:${profile.id}`);
    periodChannel = periodChannel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "period_tracking" },
      handlePeriodChange
    );
    periodChannel.subscribe();

    const timelineChannel = supabase
      .channel(`timeline_sync:${coupleId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "relationship_timeline" },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            const newItem = payload.new as Tables<"relationship_timeline">;
            setTimelineItems((prev) => {
              if (prev.some((item) => item.id === newItem.id)) return prev;
              return [newItem, ...prev];
            });
          } else if (payload.eventType === "UPDATE") {
            const updatedItem = payload.new as Tables<"relationship_timeline">;
            setTimelineItems((prev) =>
              prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
            );
          } else if (payload.eventType === "DELETE") {
            const deletedItem = payload.old as { id: string };
            setTimelineItems((prev) => prev.filter((item) => item.id !== deletedItem.id));
          }
          startTransition(() => router.refresh());
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(datesChannel);
      supabase.removeChannel(periodChannel);
      supabase.removeChannel(timelineChannel);
    };
  }, [coupleId, profile.id, partnerProfile?.id, supabase]);

  // Calendar Calculations
  const daysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const firstDayIndex = (month: number, year: number) => new Date(year, month, 1).getDay();

  const calendarGrid = useMemo(() => {
    const totalDays = daysInMonth(currentMonth, currentYear);
    const startIdx = firstDayIndex(currentMonth, currentYear);

    // Normalize first day of week to Monday index (0: Mon -> 6: Sun)
    const normalizedStartIdx = startIdx === 0 ? 6 : startIdx - 1;

    const grid = [];
    // Add empty placeholders
    for (let i = 0; i < normalizedStartIdx; i++) {
      grid.push(null);
    }
    // Add actual days
    for (let d = 1; d <= totalDays; d++) {
      grid.push(new Date(currentYear, currentMonth, d));
    }
    return grid;
  }, [currentMonth, currentYear]);

  // Month navigation helpers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Period Tracking Math & PMS Prediction Engine
  const getPeriodDaysForMonth = (tracking: Tables<"period_tracking">, targetYear: number, targetMonth: number): Record<number, { isPeriod: boolean; isPMS: boolean }> => {
    const datesMap: Record<number, { isPeriod: boolean; isPMS: boolean }> = {};
    const baseDate = new Date(tracking.last_period_date);
    const cycle = tracking.cycle_length || 28;
    const len = tracking.period_length || 5;

    // Project forward up to 12 cycles
    for (let i = 0; i < 12; i++) {
      const periodStart = new Date(baseDate.getTime() + i * cycle * 86_400_000);
      const periodEnd = new Date(periodStart.getTime() + len * 86_400_000);

      // PMS starts 4 days before period start
      const pmsStart = new Date(periodStart.getTime() - 4 * 86_400_000);

      // Check dates overlap with targetMonth/targetYear
      let temp = new Date(pmsStart);
      while (temp < periodEnd) {
        if (temp.getMonth() === targetMonth && temp.getFullYear() === targetYear) {
          const d = temp.getDate();
          if (!datesMap[d]) {
            datesMap[d] = { isPeriod: false, isPMS: false };
          }
          if (temp >= periodStart) {
            datesMap[d].isPeriod = true;
          } else {
            datesMap[d].isPMS = true;
          }
        }
        temp.setDate(temp.getDate() + 1);
      }
    }
    return datesMap;
  };

  // Compile active days highlights for indicators
  const getDayHighlights = (day: Date) => {
    const highlights: Array<{ type: string; title: string; emoji: string; desc?: string | null }> = [];
    const dStr = day.toISOString().split("T")[0];
    const month = day.getMonth();
    const dateNum = day.getDate();

    // 1. Anniversary / Milestone dates
    specialDates.forEach((sd) => {
      const sdDate = new Date(sd.date);
      const isMatch = sd.repeat_yearly
        ? sdDate.getMonth() === month && sdDate.getDate() === dateNum
        : sd.date === dStr;

      if (isMatch) {
        const conf = DATE_TYPES[sd.type as SpecialDateType] || { label: "Kỷ niệm", emoji: "❤️" };
        highlights.push({
          type: sd.type,
          title: sd.title,
          emoji: conf.emoji,
          desc: sd.description
        });
      }
    });

    // 2. Period tracking predicted days
    periodLogs.forEach((tracking) => {
      const isOwnLog = tracking.user_id === profile.id;
      const isLogOwnerFemale = isOwnLog 
        ? (profile.gender === "female" || profile.period_tracking_enabled === true)
        : (partnerProfile?.gender === "female" || partnerProfile?.period_tracking_enabled === true);

      if (!isLogOwnerFemale) return;
      if (!isOwnLog && !tracking.share_with_partner) return;

      const parsedDays = getPeriodDaysForMonth(tracking, day.getFullYear(), day.getMonth());
      const dayData = parsedDays[day.getDate()];

      if (dayData?.isPeriod) {
        highlights.push({
          type: "period",
          title: isOwnLog ? "Kỳ kinh nguyệt của tôi 🌸" : `Kỳ kinh nguyệt của ${partnerName} 🌸`,
          emoji: "🌸",
          desc: isOwnLog ? "Theo dõi cơ thể khỏe mạnh" : "Hãy dành nhiều sự chăm sóc ngọt ngào nhé! 🫂"
        });
      } else if (dayData?.isPMS && isOwnLog) {
        // PMS only visible to the user herself for privacy
        highlights.push({
          type: "pms",
          title: "Giai đoạn PMS nhẹ nhàng 🍵",
          emoji: "🍵",
          desc: "Cơ thể có thể nhạy cảm hơn bình thường."
        });
      }
    });

    // 3. Bucket lists planned items
    initialBucketItems.forEach((bucket) => {
      if (bucket.completed_at) {
        const cDate = new Date(bucket.completed_at);
        if (cDate.getMonth() === month && cDate.getDate() === dateNum) {
          highlights.push({ type: "bucket", title: `🎉 Đạt được ước mơ: ${bucket.title}`, emoji: "🎉" });
        }
      }
    });

    // 4. Memory days (Journals cover)
    initialJournalEntries.forEach((journal) => {
      if (journal.created_at) {
        const jDate = new Date(journal.created_at);
        if (jDate.getMonth() === month && jDate.getDate() === dateNum) {
          highlights.push({ type: "journal", title: `✍️ Nhật ký: ${journal.title}`, emoji: "✍️" });
        }
      }
    });

    return highlights;
  };

  // Complete Special Day Creation
  const handleCreateSpecialDate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coupleId || !dateTitle.trim() || !dateValue) {
      setDateError("Vui lòng điền tiêu đề và ngày kỷ niệm.");
      return;
    }

    // Check for duplicates (same type + same date + couple_id)
    const isDuplicate = specialDates.some(
      (sd) => sd.type === dateType && sd.date === dateValue
    );

    if (isDuplicate) {
      setDateError("Sự kiện thuộc loại này vào ngày này đã tồn tại.");
      return;
    }

    if (dateType === "birthday" || dateType === "anniversary") {
      const selectedDate = new Date(dateValue);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (selectedDate > today) {
        setDateError("Ngày sinh nhật hoặc ngày kỷ niệm bắt đầu không thể ở tương lai.");
        return;
      }
    }

    const shouldRepeatYearly = (dateType === "birthday" || dateType === "anniversary") ? true : dateRepeat;

    const supabase = createClient();
    const { error } = await supabase.from("special_dates").insert({
      couple_id: coupleId,
      title: dateTitle.trim(),
      type: dateType,
      date: dateValue,
      description: dateDesc.trim() || null,
      repeat_yearly: shouldRepeatYearly,
      created_by: profile.id
    });

    if (error) {
      setDateError(`Lỗi lưu ngày đặc biệt: ${error.message}`);
    } else {
      // Chèn sự kiện vào timeline - Đảm bảo CHỈ client tạo ra ngày kỷ niệm thực hiện việc ghi DB này!
      await supabase.from("relationship_timeline").insert({
        couple_id: coupleId,
        event_type: "anniversary",
        title: `📅 ${dateTitle.trim()}`,
        description: `Đã thêm một ngày đặc biệt chung: ${dateValue}`
      });

      // Gửi thông báo đến partner
      if (partnerProfile) {
        let typeStr = "ngày kỷ niệm";
        if (dateType === "birthday") typeStr = "ngày sinh nhật";
        else if (dateType === "date") typeStr = "ngày hẹn hò";
        else if (dateType === "milestone") typeStr = "cột mốc quan trọng";

        await supabase.from("notifications").insert({
          couple_id: coupleId,
          user_id: partnerProfile.id,
          sender_id: profile.id,
          type: "anniversary",
          title: `${profile.display_name} vừa thêm một ${typeStr} mới 📅`,
          content: `Sự kiện: "${dateTitle.trim()}" vào ngày ${dateValue.split("-").reverse().join("/")}. Hãy cùng nhau đếm ngược nhé! 💕`,
          link: "/calendar",
        });
      }

      setIsOpenDateModal(false);
      setDateTitle("");
      setDateType("anniversary");
      setDateValue("");
      setDateDesc("");
      setDateRepeat(true);
      setDateError("");
    }
  };

  // Delete Special Date
  const handleDeleteDate = (id: string) => {
    setDeleteId(id);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDeleteDate = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("special_dates").delete().eq("id", deleteId);
    if (error) {
      alert(`Không thể xóa: ${error.message}`);
    } else {
      // Cập nhật local state ngay lập tức — không chờ realtime
      setSpecialDates((prev) => prev.filter((d) => d.id !== deleteId));
      // Nếu đang xem chi tiết ngày chứa kỷ niệm này → đóng modal
      setSelectedDayEvents(null);
    }
    setDeleteId(null);
    setDeleteConfirmOpen(false);
  };

  // Complete Period tracking Setup
  const handleSavePeriodSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lastPeriodDate) {
      setPeriodError("Vui lòng chọn ngày bắt đầu kỳ gần nhất.");
      return;
    }

    const supabase = createClient();

    // Check if period log already exists to perform upsert
    const myLog = periodLogs.find((p) => p.user_id === profile.id);

    if (myLog) {
      const { error } = await supabase
        .from("period_tracking")
        .update({
          last_period_date: lastPeriodDate,
          cycle_length: cycleLength,
          period_length: periodLength,
          share_with_partner: sharePeriod,
          updated_at: new Date().toISOString()
        })
        .eq("id", myLog.id);

      if (error) {
        setPeriodError(`Không thể cập nhật: ${error.message}`);
      } else {
        setIsOpenPeriodModal(false);
      }
    } else {
      const { error } = await supabase.from("period_tracking").insert({
        user_id: profile.id,
        last_period_date: lastPeriodDate,
        cycle_length: cycleLength,
        period_length: periodLength,
        share_with_partner: sharePeriod
      });

      if (error) {
        setPeriodError(`Không thể tạo: ${error.message}`);
      } else {
        setIsOpenPeriodModal(false);
      }
    }
  };

  // Open day inspector details click
  const handleDayClick = (day: Date | null) => {
    if (!day) return;
    const events = getDayHighlights(day);
    setSelectedDayEvents({ date: day, events });
  };

  // Partner Subtle Gentle Period Banner prediction
  const partnerPeriodTracking = periodLogs.find((p) => partnerProfile && p.user_id === partnerProfile.id);

  const partnerSubtleNotification = useMemo(() => {
    if (!partnerPeriodTracking) return null;
    const isPartnerEnabled = partnerProfile?.gender === "female" || partnerProfile?.period_tracking_enabled === true;
    if (!isPartnerEnabled || !partnerPeriodTracking.share_with_partner) return null;

    const baseDate = new Date(partnerPeriodTracking.last_period_date);
    const cycle = partnerPeriodTracking.cycle_length || 28;
    const today = new Date();

    // Find next period start
    let nextStart = new Date(baseDate);
    while (nextStart < today) {
      nextStart.setTime(nextStart.getTime() + cycle * 86_400_000);
    }

    const diffDays = Math.ceil((nextStart.getTime() - today.getTime()) / 86_400_000);

    if (diffDays <= 4 && diffDays >= 0) {
      return {
        days: diffDays,
        message: `🌸 Có thể người ấy sắp đến kỳ nhạy cảm trong vài ngày tới (${diffDays} ngày nữa). Hãy ôm chặt và dành nhiều sự quan tâm dịu dàng xoa dịu họ nhé! 🫂`
      };
    }
    return null;
  }, [partnerPeriodTracking]);

  // Combined narrative love timeline combining all entries/photos/milestones
  const loveTimelineStory = useMemo(() => {
    const events: Array<{
      date: Date;
      type: string;
      title: string;
      desc?: string | null;
      emoji: string;
    }> = [];

    // Add Special Dates
    specialDates.forEach((sd) => {
      events.push({
        date: new Date(sd.date),
        type: "anniversary",
        title: sd.title,
        desc: sd.description || "Ngày đặc biệt đánh dấu tình yêu.",
        emoji: DATE_TYPES[sd.type as SpecialDateType]?.emoji || "📅"
      });
    });

    // Add Completed Bucket list
    initialBucketItems.forEach((b) => {
      if (b.completed_at) {
        events.push({
          date: new Date(b.completed_at),
          type: "bucket",
          title: `🎉 Chinh phục ước mơ: ${b.title}`,
          desc: b.description ? parseDreamDescription(b.description).text : "Ước nguyện tương lai đạt thành hiện thực.",
          emoji: "✨"
        });
      }
    });

    // Add Diary Journals
    initialJournalEntries.forEach((j) => {
      if (j.created_at) {
        events.push({
          date: new Date(j.created_at),
          type: "journal",
          title: `✍️ Viết trang Nhật ký: ${j.title}`,
          desc: "Một trang hồi ký chứa chan câu chuyện đôi mình vừa được lưu giữ.",
          emoji: "📓"
        });
      }
    });

    // Sort descending
    return events.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [specialDates, initialBucketItems, initialJournalEntries]);

  // Months label
  const MONTHS_NAMES = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"];

  return (
    <div className="mx-auto max-w-5xl space-y-6">

      {/* Immersive Header Banner */}
      <header className="rounded-3xl border border-[var(--color-border)]/50 bg-[var(--color-card)] p-5 shadow-[var(--app-shadow)] text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-300 via-amber-200 to-indigo-300 animate-pulse" />
        <CalendarIcon className="size-6 text-[var(--color-accent)] mx-auto mb-2 animate-bounce" />
        <h1 className="text-2xl font-black tracking-tight">Kỷ niệm chung</h1>
        <p className="mt-1 text-xs text-[var(--color-muted)] font-semibold max-w-lg mx-auto">
          Lịch hồi ức và dòng chảy thời gian của tụi mình. Cùng nhau theo dõi ngày quan trọng, dự đoán chu kỳ chăm sóc sức khỏe của đối phương và ôn lại câu chuyện ngọt ngào.
        </p>

        <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
          <button
            onClick={() => setIsOpenDateModal(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-primary)] px-4.5 py-2 text-xs font-black text-white hover:bg-[var(--color-primary-hover)] transition active:scale-95 shadow-md"
          >
            <Plus className="size-4" /> Thêm Ngày kỷ niệm ❤️
          </button>
          {profile.gender === "female" && (
            <button
              onClick={() => setIsOpenPeriodModal(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4.5 py-2 text-xs font-black text-[var(--color-text)] hover:bg-[var(--color-soft)] transition active:scale-95"
            >
              <Droplet className="size-4 text-rose-500 animate-pulse" fill="currentColor" /> Theo dõi Kỳ dâu 🌸
            </button>
          )}
        </div>

        {profile.gender !== "female" && partnerProfile && partnerProfile.gender === "female" && (
          <div className="mt-3 text-xs font-bold text-[var(--color-muted)] flex items-center justify-center gap-1.5 bg-[var(--color-soft)]/50 py-1.5 px-4 rounded-full border border-[var(--color-border)]/50 w-fit mx-auto animate-fade-in shadow-sm">
            <Droplet className="size-3.5 text-rose-500 animate-pulse" fill="currentColor" />
            {partnerPeriodTracking && partnerPeriodTracking.share_with_partner ? (
              <span>Đang đồng bộ và theo dõi kỳ dâu của {partnerName} 🌸</span>
            ) : (
              <span>{partnerName} chưa bật chia sẻ kỳ dâu với bạn.</span>
            )}
          </div>
        )}
      </header>

      {/* Subtle Gentle Partner Reminder Alert Box */}
      {partnerSubtleNotification && (
        <div className="rounded-3xl border border-pink-200/50 bg-pink-50/40 p-4 shadow-sm animate-pulse max-w-2xl mx-auto flex items-center gap-3">
          <Bell className="size-6 text-pink-500 flex-shrink-0 animate-swing" fill="currentColor" />
          <p className="text-xs font-black text-pink-900 leading-relaxed dark:text-pink-300">
            {partnerSubtleNotification.message}
          </p>
        </div>
      )}

      {queryError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-800">
          {queryError}
        </div>
      )}

      {!coupleId ? (
        <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-card)] p-8 text-center max-w-md mx-auto">
          <AlertCircle className="size-8 text-amber-500 mx-auto mb-2" />
          <p className="text-sm font-bold text-[var(--color-text)]">Chưa kết nối couple</p>
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            Hãy liên kết cặp đôi ở mục Cài đặt để đồng bộ Lịch Kỷ Niệm và dòng chảy thời gian chung.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-[1.5fr_1fr]">

          {/* LEFT: MINI CINEMATIC RELATIONSHIP CALENDAR GRID */}
          <section className="space-y-4">

            <div className="rounded-[2rem] border border-[var(--color-border)]/50 bg-[var(--color-card)]/90 backdrop-blur-md p-5 shadow-[var(--app-shadow)] overflow-hidden">

              {/* Calendar Grid Header navigation */}
              <div className="flex items-center justify-between mb-4 border-b border-[var(--color-border)]/40 pb-3">
                <button
                  onClick={handlePrevMonth}
                  className="p-2 rounded-xl hover:bg-[var(--color-soft)] transition text-[var(--color-muted)]"
                >
                  <ChevronLeft className="size-4" />
                </button>

                <h3 className="font-black text-sm uppercase tracking-widest text-[var(--color-primary)]">
                  {MONTHS_NAMES[currentMonth]} {currentYear}
                </h3>

                <button
                  onClick={handleNextMonth}
                  className="p-2 rounded-xl hover:bg-[var(--color-soft)] transition text-[var(--color-muted)]"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>

              {/* Day of week labels */}
              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((dayName, idx) => (
                  <span key={idx} className="text-[10px] font-black text-[var(--color-faint)] uppercase tracking-wider">
                    {dayName}
                  </span>
                ))}
              </div>

              {/* Monthly Grid */}
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                {calendarGrid.map((day, idx) => {
                  if (!day) return <div key={`empty-${idx}`} className="aspect-square opacity-0 pointer-events-none" />;

                  const dHighlights = getDayHighlights(day);
                  const isToday = new Date().toDateString() === day.toDateString();

                  const hasAnniversary = dHighlights.some((h) => ["anniversary", "milestone", "date", "kiss", "custom"].includes(h.type));
                  const hasBirthday = dHighlights.some((h) => h.type === "birthday");
                  const hasPeriod = dHighlights.some((h) => h.type === "period");
                  const hasPMS = dHighlights.some((h) => h.type === "pms");

                  let borderClass = "border-[var(--color-border)]/20";
                  let bgClass = "bg-[var(--color-soft)]/20 hover:bg-[var(--color-soft)]/50";
                  let glowStyle = {};

                  if (isToday) {
                    borderClass = "border-[var(--color-accent)] ring-1 ring-[var(--color-accent)]/30";
                    bgClass = "bg-[var(--color-soft-strong)]";
                  }

                  if (hasPeriod) {
                    bgClass = "bg-rose-50 text-rose-800 dark:bg-rose-950/20 dark:text-rose-300";
                    borderClass = "border-rose-300/40";
                    glowStyle = { boxShadow: "0 0 10px rgba(244,63,94,0.15)" };
                  } else if (hasPMS) {
                    bgClass = "bg-teal-50 text-teal-800 dark:bg-teal-950/15 dark:text-teal-300";
                    borderClass = "border-teal-200/40";
                  }

                  return (
                    <button
                      key={`day-${day.getDate()}`}
                      onClick={() => handleDayClick(day)}
                      style={glowStyle}
                      className={`aspect-square rounded-2xl border ${borderClass} ${bgClass} p-1.5 flex flex-col items-center justify-between transition-all duration-300 hover:-translate-y-0.5 relative cursor-pointer`}
                    >
                      <span className="text-[10px] font-black">{day.getDate()}</span>

                      {/* Event indicators dot bottom */}
                      <div className="flex items-center gap-0.5 mt-0.5 justify-center w-full">
                        {hasAnniversary && <div className="size-1 rounded-full bg-pink-500 animate-ping" />}
                        {hasBirthday && <Cake className="size-2 text-amber-500 flex-shrink-0" />}
                        {hasPeriod && <Droplet className="size-1.5 text-rose-500 flex-shrink-0" fill="currentColor" />}
                      </div>

                    </button>
                  );
                })}
              </div>

            </div>

            {/* Special Dates list overview */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-[var(--color-faint)]">Danh sách Kỷ niệm quan trọng</h3>

              {specialDates.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {specialDates.map((sd) => {
                    const conf = DATE_TYPES[sd.type as SpecialDateType] || { emoji: "📅", color: "bg-[var(--color-soft)] text-[var(--color-text)]" };
                    return (
                      <div key={sd.id} className={`rounded-2xl border p-3 flex items-start gap-2.5 transition hover:shadow-sm ${conf.color}`}>
                        <div className="text-lg">{conf.emoji}</div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-black text-xs truncate leading-snug">{sd.title}</h4>
                          <p className="text-[9px] font-bold opacity-75 mt-0.5">📅 Ngày: {new Date(sd.date).toLocaleDateString("vi-VN")}</p>
                          {sd.description && (
                            <p className="text-[9px] font-medium opacity-90 mt-1 italic line-clamp-1">"{sd.description}"</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteDate(sd.id)}
                          className="p-1 rounded-lg hover:bg-black/10 text-rose-700 transition flex-shrink-0 self-center"
                          title="Xóa kỷ niệm"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-[var(--color-border)]/20 p-5 text-center bg-[var(--color-card)]/40 italic text-xs text-[var(--color-muted)] font-semibold">
                  Chưa ghi nhận ngày đặc biệt nào của hai bạn. Nhấn thêm ngay kỷ niệm nhé!
                </div>
              )}
            </div>

          </section>

          {/* RIGHT: NARRATIVE VERTICAL LOVE TIMELINE */}
          <section className="space-y-4">
            <h2 className="text-sm font-black uppercase tracking-[0.16em] text-[var(--color-faint)] border-b border-[var(--color-border)]/40 pb-2">
              ⏳ NARRATIVE TIMELINE
            </h2>

            {loveTimelineStory.length > 0 ? (
              <div className="relative border-l border-[var(--color-border)]/60 ml-3 pl-5 space-y-5">

                {loveTimelineStory.map((story, index) => {
                  return (
                    <div key={index} className="relative group">

                      {/* Dot */}
                      <div className="absolute -left-[27px] top-1.5 flex size-4 items-center justify-center rounded-full bg-[var(--color-card)] border border-[var(--color-border)] shadow-sm">
                        <div className="size-1.5 rounded-full bg-[var(--color-accent)] animate-pulse" />
                      </div>

                      {/* Timeline Card */}
                      <div className="rounded-2xl border border-[var(--color-border)]/40 bg-[var(--color-card)] p-3.5 transition hover:-translate-y-0.5 hover:shadow-sm">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">{story.emoji}</span>
                          <span className="text-[9px] font-bold text-[var(--color-faint)]">
                            {new Date(story.date).toLocaleDateString("vi-VN")}
                          </span>
                        </div>
                        <h4 className="font-black text-xs text-[var(--color-text)] mt-1">{story.title}</h4>
                        {story.desc && (
                          <p className="text-[10px] font-semibold text-[var(--color-muted)] mt-1 leading-relaxed italic">
                            "{story.desc}"
                          </p>
                        )}
                      </div>

                    </div>
                  );
                })}

              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-[var(--color-border)] bg-[var(--color-card)]/50 p-8 text-center py-12 flex flex-col items-center justify-center relative overflow-hidden">
                <CalendarIcon className="size-8 text-[var(--color-primary-soft)] mb-3 animate-pulse" />
                <p className="text-xs font-black text-[var(--color-text)]">Dòng chảy thời gian trống trải</p>
                <p className="mt-2 text-[10px] text-[var(--color-muted)] max-w-sm mx-auto leading-relaxed font-semibold">
                  Mỗi cột mốc, mỗi ngày kỷ niệm hẹn hò đều là một chương đẹp trong câu chuyện tình yêu. Hãy đánh dấu lại tại đây để tình yêu luôn được trân trọng mỗi ngày nhé... 📅
                </p>
              </div>
            )}
          </section>

        </div>
      )}

      {/* MODAL 1: ADD SPECIAL DATE */}
      {isOpenDateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/30 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-2xl relative overflow-y-auto max-h-[90vh] animate-scale-up">
            <div className="absolute top-0 left-0 w-full h-1 bg-[var(--color-primary)]" />

            <button
              onClick={() => setIsOpenDateModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[var(--color-soft)] text-[var(--color-muted)] transition"
            >
              <X className="size-4" />
            </button>

            <h2 className="text-base font-black mb-4">❤️ Thêm Ngày kỷ niệm chung</h2>

            {dateError && (
              <div className="mb-3 rounded-xl border border-red-200 bg-red-50 p-2.5 text-[10px] font-bold text-red-700">
                {dateError}
              </div>
            )}

            <form onSubmit={handleCreateSpecialDate} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-[var(--color-faint)] mb-1">
                  Tên ngày đặc biệt
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Kỷ niệm 1 năm yêu nhau, Lần đầu gặp ba..."
                  value={dateTitle}
                  onChange={(e) => setDateTitle(e.target.value)}
                  maxLength={50}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-soft)]/50 p-2 text-xs font-semibold outline-none focus:border-[var(--color-primary)]"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[var(--color-faint)] mb-1">
                    Loại kỷ niệm
                  </label>
                  <CustomSelect
                    value={dateType}
                    onChange={(val) => setDateType(val as any)}
                    options={Object.keys(DATE_TYPES).map((key) => ({
                      value: key,
                      label: DATE_TYPES[key as SpecialDateType].label,
                      emoji: DATE_TYPES[key as SpecialDateType].emoji,
                    }))}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[var(--color-faint)] mb-1">
                    Ngày đặc biệt
                  </label>
                  <input
                    type="date"
                    value={dateValue}
                    onChange={(e) => setDateValue(e.target.value)}
                    max={(dateType === "birthday" || dateType === "anniversary") ? new Date().toISOString().split("T")[0] : undefined}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-soft)]/50 p-2 text-xs font-bold outline-none focus:border-[var(--color-primary)] text-[var(--color-text)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-[var(--color-faint)] mb-1">
                  Mô tả cảm xúc
                </label>
                <textarea
                  placeholder="Một dòng chú thích ngọt ngào cho ngày này..."
                  value={dateDesc}
                  onChange={(e) => setDateDesc(e.target.value)}
                  rows={2}
                  maxLength={200}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-soft)]/50 p-2 text-xs font-semibold outline-none focus:border-[var(--color-primary)] resize-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="dateRepeat"
                  checked={dateRepeat}
                  onChange={(e) => setDateRepeat(e.target.checked)}
                  className="rounded text-[var(--color-primary)]"
                />
                <label htmlFor="dateRepeat" className="text-[10px] font-black uppercase text-[var(--color-muted)] cursor-pointer">
                  Lặp lại hàng năm (Bật cho Sinh nhật / Ngày yêu)
                </label>
              </div>

              <footer className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--color-border)]/40">
                <button
                  onClick={() => setIsOpenDateModal(false)}
                  type="button"
                  className="rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-4.5 py-2.5 text-xs font-black text-[var(--color-muted)] hover:bg-[var(--color-soft)] transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-[var(--color-primary)] px-5 py-2.5 text-xs font-black text-white hover:bg-[var(--color-primary-hover)] transition"
                >
                  Ghi nhớ 💖
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: PERIOD TRACKING SETUP */}
      {isOpenPeriodModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/30 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-2xl relative overflow-y-auto max-h-[90vh] animate-scale-up">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-[var(--color-primary)]" />

            <button
              onClick={() => setIsOpenPeriodModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[var(--color-soft)] text-[var(--color-muted)] transition"
            >
              <X className="size-4" />
            </button>

            <h2 className="text-base font-black mb-5 flex items-center gap-2 text-[var(--color-text)]">
              <Droplet className="size-4 text-[var(--color-primary)]" fill="currentColor" />
              Thiết lập Kỳ dâu chăm sóc sức khỏe
            </h2>

            {periodError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700">
                {periodError}
              </div>
            )}

            <form onSubmit={handleSavePeriodSetup} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-[var(--color-faint)] mb-1.5">
                  Ngày bắt đầu kỳ gần nhất 📅
                </label>
                <input
                  type="date"
                  value={lastPeriodDate}
                  onChange={(e) => setLastPeriodDate(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm font-semibold text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] transition"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[var(--color-faint)] mb-1.5">
                    Chu kỳ kinh nguyệt (ngày)
                  </label>
                  <input
                    type="number"
                    min={20}
                    max={45}
                    value={cycleLength}
                    onChange={(e) => setCycleLength(parseInt(e.target.value) || 28)}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm font-semibold text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] transition"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[var(--color-faint)] mb-1.5">
                    Độ dài một kỳ (ngày)
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={10}
                    value={periodLength}
                    onChange={(e) => setPeriodLength(parseInt(e.target.value) || 5)}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm font-semibold text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] transition"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl bg-[var(--color-soft)] border border-[var(--color-border)] px-4 py-3">
                <input
                  type="checkbox"
                  id="sharePeriod"
                  checked={sharePeriod}
                  onChange={(e) => setSharePeriod(e.target.checked)}
                  className="rounded accent-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                />
                <label htmlFor="sharePeriod" className="text-[10px] font-black uppercase tracking-wide text-[var(--color-text)] cursor-pointer">
                  Đồng bộ chia sẻ dự đoán với đối phương ❤️
                </label>
              </div>

              <p className="text-[10px] text-[var(--color-muted)] font-semibold italic leading-relaxed">
                * Rất riêng tư và nhẹ nhàng: Người ấy sẽ chỉ nhận thông báo nhắc nhở tinh tế ("Có thể người ấy cần quan tâm hơn...", v.v.) để chăm sóc bạn, các thông số chi tiết sẽ được ẩn đi.
              </p>

              <footer className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--color-border)]/50">
                <button
                  onClick={() => setIsOpenPeriodModal(false)}
                  type="button"
                  className="rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-5 py-2.5 text-xs font-black text-[var(--color-muted)] hover:bg-[var(--color-soft)] transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-[var(--color-primary)] px-5 py-2.5 text-xs font-black text-white hover:bg-[var(--color-primary-hover)] transition shadow-sm"
                >
                  Thiết lập 🌸
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: SELECTED DATE DAY INSPECTOR EVENT DETAILED ACTIONS */}
      {selectedDayEvents && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/35 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-2xl relative overflow-y-auto max-h-[90vh] animate-scale-up">

            <button
              onClick={() => setSelectedDayEvents(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[var(--color-soft)] text-[var(--color-muted)] transition"
            >
              <X className="size-4" />
            </button>

            <div className="border-b border-[var(--color-border)]/40 pb-3 mb-4">
              <span className="text-[10px] font-bold text-[var(--color-primary)]">CHI TIẾT KỶ NIỆM NGÀY</span>
              <h2 className="text-base font-black text-[var(--color-text)]">
                📅 {selectedDayEvents.date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", weekday: "long" })}
              </h2>
            </div>

            <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
              {selectedDayEvents.events.length > 0 ? (
                selectedDayEvents.events.map((e, idx) => (
                  <div key={idx} className="rounded-2xl bg-[var(--color-soft)]/50 border border-[var(--color-border)]/30 p-3 flex items-start gap-2.5">
                    <span className="text-base">{e.emoji}</span>
                    <div>
                      <h4 className="font-black text-xs text-[var(--color-text)] leading-snug">{e.title}</h4>
                      {e.desc && (
                        <p className="text-[9px] font-semibold text-[var(--color-muted)] mt-0.5 leading-relaxed">
                          {e.desc}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs font-semibold italic text-[var(--color-muted)] py-4 text-center">
                  Không có sự kiện kỷ niệm nào diễn ra trong ngày này.
                </p>
              )}
            </div>

            <footer className="mt-5 border-t border-[var(--color-border)]/40 pt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => setSelectedDayEvents(null)}
                className="rounded-full bg-[var(--color-primary)] px-5 py-2 text-xs font-black text-white hover:bg-[var(--color-primary-hover)] transition"
              >
                Đóng
              </button>
            </footer>

          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDeleteDate}
        title="Xóa ngày đặc biệt"
        message="Bạn có chắc chắn muốn xóa ngày kỷ niệm đặc biệt này khỏi lịch biểu của hai người không? Hành động này không thể hoàn tác!"
        confirmText="Xóa sự kiện"
        cancelText="Hủy"
        isDangerous={true}
      />
    </div>
  );
}
