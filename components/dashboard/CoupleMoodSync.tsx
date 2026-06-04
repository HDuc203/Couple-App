"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Heart, Smile, Send, MessageCircle, Check, Loader2, Sparkles, AlertCircle, Bell, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/types/database";
import type { Profile } from "@/lib/profile";
import type { PartnerProfile } from "@/lib/couple";

type CoupleMoodSyncProps = {
  profile: Profile;
  currentCouple: any;
  partnerProfile: PartnerProfile | null;
  latestMood: Tables<"mood_logs"> | null;
  partnerLatestMood: Tables<"mood_logs"> | null;
};

type MoodConfig = {
  emoji: string;
  label: string;
  pillColor: string;
  bgGlow: string;
  supportText?: string;
  isNegative?: boolean;
};

const MOODS_CONFIG: Record<string, MoodConfig> = {
  "Vui": {
    emoji: "😊",
    label: "Vui",
    pillColor: "bg-amber-100/80 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50",
    bgGlow: "rgba(254, 243, 199, 0.15)",
    supportText: "Thật tuyệt khi thấy người ấy đang vui vẻ hôm nay! 🥰",
    isNegative: false,
  },
  "Yêu": {
    emoji: "🥰",
    label: "Yêu",
    pillColor: "bg-pink-100/80 text-pink-800 border-pink-200 dark:bg-pink-950/40 dark:text-pink-300 dark:border-pink-900/50",
    bgGlow: "rgba(253, 244, 245, 0.2)",
    supportText: "Không gian của hai bạn đang ngập tràn mật ngọt yêu đương! 🌸",
    isNegative: false,
  },
  "Mệt": {
    emoji: "😴",
    label: "Mệt",
    pillColor: "bg-slate-100/80 text-slate-700 border-slate-200 dark:bg-slate-900/50 dark:text-slate-300 dark:border-slate-800/50",
    bgGlow: "rgba(241, 245, 249, 0.1)",
    supportText: "Người ấy hôm nay hơi mệt mỏi... Gửi một cái ôm vỗ về nhé 🫂",
    isNegative: true,
  },
  "Buồn": {
    emoji: "😔",
    label: "Buồn",
    pillColor: "bg-indigo-100/80 text-indigo-800 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900/50",
    bgGlow: "rgba(238, 242, 255, 0.12)",
    supportText: "Có vẻ người ấy đang có chút tâm sự buồn. Hãy lắng nghe họ nhé ❤️",
    isNegative: true,
  },
  "Cáu": {
    emoji: "😡",
    label: "Cáu",
    pillColor: "bg-rose-100/80 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50",
    bgGlow: "rgba(254, 242, 242, 0.15)",
    supportText: "Người ấy hôm nay có chút cáu kỉnh. Hãy dành sự dịu dàng xoa dịu họ 🫂",
    isNegative: true,
  },
  "Nhớ": {
    emoji: "❤️",
    label: "Nhớ",
    pillColor: "bg-red-100/80 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/50",
    bgGlow: "rgba(255, 240, 243, 0.2)",
    supportText: "Người ấy đang rất nhớ bạn! Gửi lời nhắn đáp lại ngay nào 💬",
    isNegative: false,
  },
  "Stress": {
    emoji: "😵",
    label: "Stress",
    pillColor: "bg-purple-100/80 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900/50",
    bgGlow: "rgba(250, 245, 255, 0.12)",
    supportText: "Người ấy đang bị căng thẳng áp lực. Hãy khích lệ họ nhé ☕",
    isNegative: true,
  }
};

const getMoodConfig = (moodStr: string | null): MoodConfig => {
  if (!moodStr) {
    return {
      emoji: "❓",
      label: "Chưa rõ",
      pillColor: "bg-gray-100/50 text-gray-500 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800/40",
      bgGlow: "rgba(249, 250, 251, 0.05)",
      isNegative: false
    };
  }
  const cleanMood = moodStr.trim();
  if (MOODS_CONFIG[cleanMood]) return MOODS_CONFIG[cleanMood];
  for (const [key, cfg] of Object.entries(MOODS_CONFIG)) {
    if (cleanMood.includes(key) || key.includes(cleanMood)) return cfg;
  }
  return {
    emoji: "😊",
    label: cleanMood,
    pillColor: "bg-[var(--color-primary-soft)] text-[var(--color-primary)] border-[var(--color-border)]",
    bgGlow: "rgba(136, 65, 95, 0.05)",
    isNegative: false
  };
};

function formatTime(timestamp: string | null): string {
  if (!timestamp) return "Chưa cập nhật";
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Vừa mới xong";
  if (diffMins < 60) return `${diffMins} phút trước`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  return date.toLocaleDateString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

type ToastMessage = {
  show: boolean;
  message: string;
  type: "mood" | "reaction";
};

export function CoupleMoodSync({
  profile,
  currentCouple,
  partnerProfile,
  latestMood,
  partnerLatestMood,
}: CoupleMoodSyncProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const coupleId = currentCouple?.couple?.id ?? null;

  const [userMood, setUserMood] = useState<Tables<"mood_logs"> | null>(latestMood);
  const [partnerMood, setPartnerMood] = useState<Tables<"mood_logs"> | null>(partnerLatestMood);
  const [selectedMoodLabel, setSelectedMoodLabel] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [showNoteInput, setShowNoteInput] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [reactionSuccess, setReactionSuccess] = useState<"hug" | "care" | "chat" | null>(null);
  const [reactionNote, setReactionNote] = useState<string>("");
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [pulsePartner, setPulsePartner] = useState<boolean>(false);
  const [floatingEmoji, setFloatingEmoji] = useState<string | null>(null);
  const [floatingHearts, setFloatingHearts] = useState<Array<{ id: number; left: number; delay: number }>>([]);
  const heartIdCounter = useRef(0);

  useEffect(() => { setUserMood(latestMood); }, [latestMood]);
  useEffect(() => { setPartnerMood(partnerLatestMood); }, [partnerLatestMood]);

  useEffect(() => {
    if (!coupleId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`couple_sync:${coupleId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "mood_logs", filter: `couple_id=eq.${coupleId}` },
        async (payload) => {
          const newMood = payload.new as Tables<"mood_logs">;
          if (partnerProfile && newMood.user_id === partnerProfile.id) {
            setPartnerMood(newMood);
            setPulsePartner(true);
            const config = getMoodConfig(newMood.mood);
            setFloatingEmoji(config.emoji);
            setToast({ show: true, message: `✨ ${partnerProfile.display_name} vừa cập nhật tâm trạng mới: ${config.emoji} ${config.label}`, type: "mood" });
            if (!config.isNegative) {
              const hearts = Array.from({ length: 5 }).map(() => ({ id: ++heartIdCounter.current, left: Math.random() * 60 + 20, delay: Math.random() * 0.8 }));
              setFloatingHearts(hearts);
              setTimeout(() => setFloatingHearts([]), 3500);
            }
            setTimeout(() => setPulsePartner(false), 2500);
            setTimeout(() => setFloatingEmoji(null), 3000);
            setTimeout(() => setToast(null), 4500);
          } else if (newMood.user_id === profile.id) {
            setUserMood(newMood);
          }
        }
      )
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "love_notes", filter: `couple_id=eq.${coupleId}` },
        async (payload) => {
          const newNote = payload.new as Tables<"love_notes">;
          if (partnerProfile && newNote.sender_id === partnerProfile.id && newNote.receiver_id === profile.id) {
            setToast({ show: true, message: newNote.message, type: "reaction" });
            setPulsePartner(true);
            setTimeout(() => setPulsePartner(false), 2000);
            setTimeout(() => setToast(null), 5000);
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [coupleId, partnerProfile?.id, profile.id]);

  const handleSelectMood = (moodLabel: string) => {
    setSelectedMoodLabel(moodLabel);
    setShowNoteInput(true);
  };

  const handleSaveMood = async () => {
    if (!selectedMoodLabel) return;
    setSaveStatus("saving");
    const supabase = createClient();
    const { error } = await supabase.from("mood_logs").insert({
      user_id: profile.id,
      couple_id: coupleId,
      mood: selectedMoodLabel,
      note: note.trim() || null,
    });
    if (error) {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } else {
      setSaveStatus("success");
      const { data: newestUserMood } = await supabase.from("mood_logs").select("*").eq("user_id", profile.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (newestUserMood) setUserMood(newestUserMood);
      setTimeout(() => { setSaveStatus("idle"); setShowNoteInput(false); setNote(""); setSelectedMoodLabel(""); }, 1200);
      startTransition(() => router.refresh());
    }
  };

  const handleReaction = async (type: "hug" | "care" | "chat") => {
    if (!coupleId || !partnerProfile) return;
    setReactionSuccess(type);
    const supabase = createClient();
    let message = "";
    const partnerConfig = getMoodConfig(partnerMood?.mood ?? null);
    const partnerMoodDisplay = `${partnerConfig.emoji} ${partnerConfig.label}`;
    if (type === "hug") {
      message = `🫂 ${profile.display_name} đã phản hồi tâm trạng "${partnerMoodDisplay}" của bạn bằng một cái ôm thật ấm áp!`;
      if (reactionNote.trim()) message += ` Lời nhắn: "${reactionNote.trim()}"`;
    } else if (type === "care") {
      message = `❤️ ${profile.display_name} đang bày tỏ sự quan tâm đặc biệt phản hồi tâm trạng "${partnerMoodDisplay}" của bạn!`;
      if (reactionNote.trim()) message += ` Lời nhắn: "${reactionNote.trim()}"`;
    } else if (type === "chat") {
      message = `💬 Lời nhắn từ ${profile.display_name} phản hồi tâm trạng "${partnerMoodDisplay}" của bạn: "${reactionNote.trim()}"`;
    }
    const { error } = await supabase.from("love_notes").insert({
      couple_id: coupleId,
      sender_id: profile.id,
      receiver_id: partnerProfile.id,
      message,
      reveal_at: new Date().toISOString(),
      is_read: false,
    });
    if (error) { setReactionSuccess(null); return; }

    // Gửi thông báo đến partner
    let notifTitle = `${profile.display_name} phản hồi tâm trạng của bạn 💌`;
    if (type === "hug") {
      notifTitle = `${profile.display_name} vừa ôm bạn một cái thật ấm áp 🫂`;
    } else if (type === "care") {
      notifTitle = `${profile.display_name} gửi lời quan tâm ngọt ngào đến bạn ❤️`;
    } else if (type === "chat") {
      notifTitle = `${profile.display_name} gửi tin nhắn chia sẻ 💬`;
    }

    await supabase.from("notifications").insert({
      couple_id: coupleId,
      user_id: partnerProfile.id,
      sender_id: profile.id,
      type: "love_note",
      title: notifTitle,
      content: reactionNote.trim() ? reactionNote.trim() : message,
      link: "/love",
    });

    setTimeout(() => { setReactionSuccess(null); setReactionNote(""); }, 1500);
    startTransition(() => router.refresh());
  };

  const userMoodConfig = getMoodConfig(userMood?.mood ?? null);
  const partnerMoodConfig = getMoodConfig(partnerMood?.mood ?? null);
  let dynamicMessage = "Hai bạn đang chia sẻ không gian cảm xúc dịu dàng.";
  if (partnerProfile && partnerMood) {
    dynamicMessage = partnerMoodConfig.supportText || dynamicMessage;
  }
  let moodGlowOverlay = "from-transparent to-transparent";
  if (partnerProfile && partnerMood) {
    moodGlowOverlay = partnerMoodConfig.isNegative
      ? "from-[var(--color-soft)]/5 via-transparent to-[var(--color-soft-strong)]/5"
      : "from-[var(--color-primary-soft)]/5 via-transparent to-[var(--color-soft)]/5";
  }

  return (
    <section className="relative overflow-hidden rounded-[2.2rem] border border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--app-shadow)] transition-all duration-700">

      {/* Mood aura overlay */}
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-tr ${moodGlowOverlay} opacity-80 mix-blend-normal transition-all duration-1000`} />

      {/* Floating Hearts */}
      {floatingHearts.map((heart) => (
        <div
          key={heart.id}
          className="pointer-events-none absolute bottom-0 z-20 animate-float-heart text-pink-400 opacity-60"
          style={{ left: `${heart.left}%`, animationDelay: `${heart.delay}s`, animationDuration: "3s" }}
        >
          <Heart className="size-4.5 fill-pink-400" />
        </div>
      ))}

      {/* Toast */}
      {toast?.show && (
        <div className="absolute left-1/2 top-4 z-40 w-[90%] max-w-md -translate-x-1/2 animate-bounce">
          <div className="flex items-center justify-between gap-3 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/95 px-4 py-2.5 shadow-lg backdrop-blur-md">
            <div className="flex min-w-0 items-center gap-2">
              <Bell className="size-4 text-[var(--color-primary)] flex-shrink-0" />
              <p className="truncate text-xs font-black text-[var(--color-text)] leading-tight">{toast.message}</p>
            </div>
            <button onClick={() => setToast(null)} className="grid size-6 place-items-center rounded-full hover:bg-[var(--color-soft)] text-[var(--color-muted)] transition" type="button">
              <X className="size-3.5" />
            </button>
          </div>
        </div>
      )}

      <div className="relative z-10 p-6 md:p-8">
        {/* ── Header ── */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-xl bg-[var(--color-soft)] text-[var(--color-primary)]">
              <Heart className="size-4 fill-[var(--color-accent)] text-[var(--color-accent)]" />
            </div>
            <div>
              <h2 className="text-sm font-black tracking-tight text-[var(--color-text)]">Couple Mood Sync</h2>
              <p className="text-[9px] font-bold text-[var(--color-faint)] tracking-wider">KẾT NỐI CẢM XÚC REALTIME</p>
            </div>
          </div>
          {coupleId ? (
            <div className="flex items-center gap-1.5 rounded-full bg-[var(--color-success-soft)] px-3 py-1 text-[10px] font-black text-[var(--color-success)] border border-[var(--color-border)]/30">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-success)] opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--color-success)]" />
              </span>
              Realtime Active
            </div>
          ) : (
            <div className="flex items-center gap-1 bg-[var(--color-soft)] px-3 py-1 rounded-full text-[10px] font-black text-[var(--color-primary)] border border-[var(--color-border)]">
              <AlertCircle className="size-3" />
              Chưa kết đôi
            </div>
          )}
        </div>

        {/* ── Presence Stage ── */}
        <div className="relative mx-auto max-w-2xl">
          {/* Dashed bridge line */}
          <div className="absolute left-[28%] right-[28%] top-11 h-px border-t border-dashed border-[var(--color-border)] opacity-50 z-0 hidden sm:block" />

          <div className="relative grid grid-cols-[1fr_auto_1fr] items-start gap-4 sm:gap-6">

            {/* LEFT: You */}
            <div className="flex flex-col items-center gap-2">
              {/* Avatar */}
              <div className="relative z-10 transition-transform duration-300 hover:scale-105">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.display_name}
                    className="size-20 sm:size-24 rounded-full object-cover border-[3px] border-[var(--color-card)] shadow-lg ring-2 ring-[var(--color-border)]"
                  />
                ) : (
                  <div className="grid size-20 sm:size-24 place-items-center rounded-full bg-[var(--color-soft)] text-2xl font-black text-[var(--color-primary)] border-[3px] border-[var(--color-card)] shadow-lg ring-2 ring-[var(--color-border)]">
                    {profile.display_name.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="absolute -bottom-1.5 -right-1.5 flex size-8 place-items-center justify-center rounded-full bg-[var(--color-card)] border-2 border-[var(--color-border)] shadow-md text-lg">
                  {userMoodConfig.emoji}
                </div>
              </div>

              {/* Info */}
              <div className="flex flex-col items-center gap-1.5 text-center">
                <span className="text-[9px] font-black uppercase tracking-wider text-[var(--color-faint)]">Bạn</span>
                <span className="text-base font-black text-[var(--color-text)] truncate max-w-[120px]">{profile.display_name}</span>
                {userMood ? (
                  <>
                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${userMoodConfig.pillColor}`}>
                      {userMoodConfig.emoji} {userMoodConfig.label}
                    </span>
                    <span className="text-[10px] text-[var(--color-faint)]">{formatTime(userMood.created_at)}</span>
                  </>
                ) : (
                  <span className="text-xs italic text-[var(--color-faint)]">Chưa chọn</span>
                )}
              </div>
            </div>

            {/* CENTER: Heart bridge */}
            <div className="flex flex-col items-center justify-start pt-7 relative">
              {floatingEmoji && (
                <div className="absolute -top-12 z-20 animate-bounce text-4xl">{floatingEmoji}</div>
              )}
              <div
                className={`flex size-14 items-center justify-center rounded-full border bg-[var(--color-card)] shadow-lg transition-all duration-500 z-10 ${
                  pulsePartner ? "scale-125 border-[var(--color-accent)] ring-4 ring-[var(--color-primary-soft)]" : "border-[var(--color-border)]"
                }`}
              >
                <Heart
                  className={`size-6 text-[var(--color-accent)] fill-[var(--color-accent)] ${
                    pulsePartner ? "animate-ping" : "animate-[heartbeat_2.5s_infinite_ease-in-out]"
                  }`}
                />
              </div>
              <span className="mt-2 text-[8px] font-black uppercase tracking-[0.2em] text-[var(--color-faint)] hidden sm:block whitespace-nowrap">
                synced feelings
              </span>
            </div>

            {/* RIGHT: Partner */}
            <div className={`flex flex-col items-center gap-2 transition-all duration-500 ${pulsePartner ? "scale-105" : ""}`}>
              {partnerProfile ? (
                <>
                  {/* Avatar */}
                  <div className="relative z-10 transition-transform duration-300 hover:scale-105">
                    {partnerProfile.avatar_url ? (
                      <img
                        src={partnerProfile.avatar_url}
                        alt={partnerProfile.display_name}
                        className="size-20 sm:size-24 rounded-full object-cover border-[3px] border-[var(--color-card)] shadow-lg ring-2 ring-[var(--color-border)]"
                      />
                    ) : (
                      <div className="grid size-20 sm:size-24 place-items-center rounded-full bg-[var(--color-soft)] text-2xl font-black text-[var(--color-primary)] border-[3px] border-[var(--color-card)] shadow-lg ring-2 ring-[var(--color-border)]">
                        {partnerProfile.display_name.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div className="absolute -bottom-1.5 -right-1.5 flex size-8 place-items-center justify-center rounded-full bg-[var(--color-card)] border-2 border-[var(--color-border)] shadow-md text-lg">
                      {partnerMoodConfig.emoji}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex flex-col items-center gap-1.5 text-center">
                    <span className="text-[9px] font-black uppercase tracking-wider text-[var(--color-faint)]">Người ấy</span>
                    <span className="text-base font-black text-[var(--color-text)] truncate max-w-[120px]">{partnerProfile.display_name}</span>
                    {partnerMood ? (
                      <>
                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${partnerMoodConfig.pillColor}`}>
                          {partnerMoodConfig.emoji} {partnerMoodConfig.label}
                        </span>
                        <span className="text-[10px] text-[var(--color-faint)]">{formatTime(partnerMood.created_at)}</span>
                      </>
                    ) : (
                      <span className="text-xs italic text-[var(--color-faint)]">Chưa có</span>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="grid size-20 sm:size-24 place-items-center rounded-full bg-[var(--color-soft)]/40 border-2 border-dashed border-[var(--color-border)] text-2xl text-[var(--color-faint)]">
                    ?
                  </div>
                  <span className="text-[9px] font-bold text-[var(--color-faint)] uppercase tracking-wider">Chưa kết nối</span>
                  <Link
                    href="/settings"
                    className="rounded-full bg-[var(--color-soft)] px-3 py-1 text-[10px] font-black text-[var(--color-primary)] border border-[var(--color-border)] hover:bg-[var(--color-soft-strong)] transition"
                  >
                    Kết nối ngay
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* ── Note bubbles ── */}
          {(userMood?.note || partnerMood?.note) && (
            <div className="mt-7 grid gap-3 sm:grid-cols-2 relative z-10 border-t border-[var(--color-border)]/40 pt-6">
              <div className="flex justify-center sm:justify-end">
                {userMood?.note ? (
                  <div className="max-w-[220px] rounded-2xl rounded-tr-sm bg-[var(--color-soft)]/70 border border-[var(--color-border)] px-4 py-3 text-sm font-semibold italic text-[var(--color-text)] leading-relaxed shadow-sm">
                    <span className="not-italic font-black text-[10px] block mb-1 text-[var(--color-primary)]">Bạn:</span>
                    "{userMood.note}"
                  </div>
                ) : null}
              </div>
              <div className="flex justify-center sm:justify-start">
                {partnerMood?.note ? (
                  <div className="max-w-[220px] rounded-2xl rounded-tl-sm bg-[var(--color-soft)]/50 border border-[var(--color-border)] px-4 py-3 text-sm font-semibold italic text-[var(--color-text)] leading-relaxed shadow-sm">
                    <span className="not-italic font-black text-[10px] block mb-1 text-[var(--color-accent)]">
                      {partnerProfile?.display_name ?? "Người ấy"}:
                    </span>
                    "{partnerMood.note}"
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {/* ── Support message ── */}
          {partnerProfile && partnerMood && (
            <div className="mt-5 flex items-center justify-center gap-2 rounded-2xl bg-[var(--color-soft)]/50 border border-[var(--color-border)] px-5 py-3 text-sm font-bold text-[var(--color-muted)] text-center shadow-[0_4px_12px_rgba(0,0,0,0.03)] transition-all duration-500 max-w-lg mx-auto">
              <Sparkles className="size-4 text-[var(--color-accent)] flex-shrink-0 animate-pulse" />
              <span>{dynamicMessage}</span>
            </div>
          )}

          {/* ── Reaction panel ── */}
          {partnerProfile && partnerMood && (
            <div className="mt-4 w-full max-w-lg mx-auto rounded-2xl bg-[var(--color-soft)]/35 border border-[var(--color-border)] p-4 shadow-sm relative z-10">
              <p className="text-[10px] font-black uppercase tracking-wider text-[var(--color-muted)] mb-3 flex items-center gap-1.5 justify-center">
                <MessageCircle className="size-3.5 text-[var(--color-accent)]" />
                Phản hồi tâm trạng của {partnerProfile.display_name}
              </p>

              <div className="flex flex-col gap-2 bg-[var(--color-card)]/80 border border-[var(--color-border)] rounded-xl p-2 shadow-[inset_0_2px_4px_rgba(0,0,0,0.01)]">
                <textarea
                  placeholder={
                    partnerMoodConfig.isNegative
                      ? `Gửi lời động viên, vỗ về đến ${partnerProfile.display_name}...`
                      : `Nhắn gửi yêu thương phản hồi tâm trạng của ${partnerProfile.display_name}...`
                  }
                  value={reactionNote}
                  onChange={(e) => setReactionNote(e.target.value)}
                  rows={2}
                  maxLength={100}
                  className="w-full resize-none border-0 bg-transparent p-2 text-sm font-semibold outline-none focus:ring-0 text-[var(--color-text)] placeholder-[var(--color-faint)] leading-relaxed"
                />
              </div>

              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="text-[10px] text-[var(--color-faint)] font-bold">{reactionNote.length}/100 kí tự</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleReaction("hug")}
                    disabled={reactionSuccess !== null}
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-3.5 py-2 text-xs font-black text-[var(--color-text)] transition hover:-translate-y-0.5 hover:border-[var(--color-accent)] hover:bg-[var(--color-soft)] active:scale-95 disabled:opacity-50"
                  >
                    {reactionSuccess === "hug" ? "Đã gửi ôm! 🫂" : "🫂 Gửi ôm"}
                  </button>
                  <button
                    onClick={() => handleReaction("care")}
                    disabled={reactionSuccess !== null}
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-3.5 py-2 text-xs font-black text-[var(--color-text)] transition hover:-translate-y-0.5 hover:border-[var(--color-accent)] hover:bg-[var(--color-soft)] active:scale-95 disabled:opacity-50"
                  >
                    {reactionSuccess === "care" ? "Đã quan tâm! ❤️" : "❤️ Quan tâm"}
                  </button>
                  <button
                    onClick={() => handleReaction("chat")}
                    disabled={reactionSuccess !== null || !reactionNote.trim()}
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-primary)] px-3.5 py-2 text-xs font-black text-white transition hover:-translate-y-0.5 hover:bg-[var(--color-primary-hover)] active:scale-95 disabled:opacity-50"
                  >
                    {reactionSuccess === "chat" ? "Đã gửi tin! 💬" : "💬 Nhắn ngay"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Mood Selector ── */}
        <div className="mt-6 border-t border-[var(--color-border)]/50 pt-5">
          <p className="text-xs font-black text-[var(--color-muted)] mb-3 text-center sm:text-left">
            Tâm trạng của bạn lúc này:
          </p>
          <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
            {Object.entries(MOODS_CONFIG).map(([label, config]) => {
              const isSelected = selectedMoodLabel === label;
              return (
                <button
                  key={label}
                  onClick={() => handleSelectMood(label)}
                  type="button"
                  className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-black transition-all duration-300 active:scale-95 ${
                    isSelected
                      ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-sm scale-105"
                      : "bg-[var(--color-soft)]/50 text-[var(--color-text)] border-[var(--color-border)] hover:bg-[var(--color-soft-strong)]/40 hover:-translate-y-0.5"
                  }`}
                >
                  <span>{config.emoji}</span>
                  <span>{config.label}</span>
                </button>
              );
            })}
          </div>

          {/* Note input */}
          <div className={`overflow-hidden transition-all duration-500 ${showNoteInput ? "max-h-44 opacity-100 mt-4" : "max-h-0 opacity-0"}`}>
            <div className="flex flex-col gap-2 rounded-2xl bg-[var(--color-soft)]/30 border border-[var(--color-border)] p-2">
              <textarea
                placeholder={`Viết vài từ về tâm trạng "${selectedMoodLabel}" hôm nay... (tùy chọn)`}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                maxLength={80}
                className="resize-none border-0 bg-transparent p-2 text-sm font-semibold outline-none focus:ring-0 text-[var(--color-text)] placeholder-[var(--color-faint)]"
              />
              <div className="flex items-center justify-between border-t border-[var(--color-border)]/30 pt-2 px-1">
                <span className="text-[10px] text-[var(--color-faint)] font-bold">{note.length}/80 kí tự</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setShowNoteInput(false); setSelectedMoodLabel(""); setNote(""); }}
                    type="button"
                    className="rounded-full px-3 py-1.5 text-xs font-black text-[var(--color-faint)] hover:text-[var(--color-text)] transition"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleSaveMood}
                    disabled={saveStatus === "saving"}
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-primary)] px-5 py-1.5 text-xs font-black text-white hover:bg-[var(--color-primary-hover)] transition shadow-sm active:scale-95 disabled:opacity-50"
                  >
                    {saveStatus === "saving" ? (
                      <><Loader2 className="size-3 animate-spin" /> Đang lưu...</>
                    ) : saveStatus === "success" ? (
                      <><Check className="size-3" /> Đã lưu!</>
                    ) : (
                      <><Send className="size-3" /> Cập nhật</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
