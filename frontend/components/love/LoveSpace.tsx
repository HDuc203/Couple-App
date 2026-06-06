"use client";

import { useState, useEffect, useTransition, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Heart, Check, Loader2, Sparkles, AlertCircle, HeartHandshake, Inbox, Clock, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/types/database";
import type { Profile } from "@/lib/profile";
import type { PartnerProfile } from "@/lib/couple";

type LoveNoteReaction = Tables<"love_note_reactions">;

type LoveSpaceProps = {
  profile: Profile;
  currentCouple: any;
  partnerProfile: PartnerProfile | null;
  initialPartnerMood: Tables<"mood_logs"> | null;
  initialLoveNotes: Tables<"love_notes">[];
  initialReactions: LoveNoteReaction[];
};

// ─── Mood helpers (unchanged) ────────────────────────────────────────────────
type MoodConfig = {
  emoji: string; label: string; pillColor: string;
  bgGlow: string; supportText?: string; isNegative?: boolean;
};

const MOODS_CONFIG: Record<string, MoodConfig> = {
  "Vui": { emoji: "😊", label: "Vui", pillColor: "bg-amber-100/80 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50", bgGlow: "rgba(254,243,199,0.15)", supportText: "Thật tuyệt khi thấy người ấy đang vui vẻ hôm nay! 🥰" },
  "Yêu": { emoji: "🥰", label: "Yêu", pillColor: "bg-pink-100/80 text-pink-800 border-pink-200 dark:bg-pink-950/40 dark:text-pink-300 dark:border-pink-900/50", bgGlow: "rgba(253,244,245,0.2)", supportText: "Không gian của hai bạn đang ngập tràn mật ngọt yêu đương! 🌸" },
  "Mệt": { emoji: "😴", label: "Mệt", pillColor: "bg-slate-100/80 text-slate-700 border-slate-200 dark:bg-slate-900/50 dark:text-slate-300 dark:border-slate-800/50", bgGlow: "rgba(241,245,249,0.1)", supportText: "Người ấy hôm nay hơi mệt mỏi... Gửi một cái ôm vỗ về nhé 🫂", isNegative: true },
  "Buồn": { emoji: "😔", label: "Buồn", pillColor: "bg-indigo-100/80 text-indigo-800 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900/50", bgGlow: "rgba(238,242,255,0.12)", supportText: "Có vẻ người ấy đang có chút tâm sự buồn. Hãy lắng nghe họ nhé ❤️", isNegative: true },
  "Cáu": { emoji: "😡", label: "Cáu", pillColor: "bg-rose-100/80 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50", bgGlow: "rgba(254,242,242,0.15)", supportText: "Người ấy hôm nay có chút cáu kỉnh. Hãy dành sự dịu dàng xoa dịu họ 🫂", isNegative: true },
  "Nhớ": { emoji: "❤️", label: "Nhớ", pillColor: "bg-red-100/80 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/50", bgGlow: "rgba(255,240,243,0.2)", supportText: "Người ấy đang rất nhớ bạn! Gửi lời nhắn đáp lại ngay nào 💬" },
  "Stress": { emoji: "😵", label: "Stress", pillColor: "bg-purple-100/80 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900/50", bgGlow: "rgba(250,245,255,0.12)", supportText: "Người ấy đang bị căng thẳng áp lực. Hãy khích lệ họ nhé ☕", isNegative: true },
};

const getMoodConfig = (moodStr: string | null): MoodConfig => {
  if (!moodStr) return { emoji: "❓", label: "Chưa rõ", pillColor: "bg-gray-100/50 text-gray-500 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400", bgGlow: "rgba(249,250,251,0.05)" };
  const clean = moodStr.trim();
  if (MOODS_CONFIG[clean]) return MOODS_CONFIG[clean];
  for (const [k, v] of Object.entries(MOODS_CONFIG)) {
    if (clean.includes(k) || k.includes(clean)) return v;
  }
  return { emoji: "😊", label: clean, pillColor: "bg-[var(--color-primary-soft)] text-[var(--color-primary)] border-[var(--color-border)]", bgGlow: "rgba(136,65,95,0.05)" };
};

function formatTime(ts: string | null): string {
  if (!ts) return "Chưa cập nhật";
  const d = new Date(ts), now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (diff < 1) return "Vừa mới xong";
  if (diff < 60) return `${diff} phút trước`;
  const h = Math.floor(diff / 60);
  if (h < 24) return `${h} giờ trước`;
  return d.toLocaleDateString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" });
}

type ParsedNote = { icon: string; header: string; body: string; isCustom: boolean };

function parseLoveNote(msg: string, senderName: string, partnerName: string): ParsedNote {
  const m = msg.trim();
  if (m.startsWith("🫂")) {
    const match = m.match(/Lời nhắn:\s*["']?([^"']+)["']?/);
    return { icon: "🫂", header: `${senderName} đã gửi một cái ôm`, body: match ? match[1] : "Một cái ôm dành cho bạn", isCustom: !!match };
  }
  if (m.startsWith("❤️")) {
    const match = m.match(/Lời nhắn:\s*["']?([^"']+)["']?/);
    return { icon: "❤️", header: `${senderName} đang bày tỏ quan tâm`, body: match ? match[1] : "Có mình ở đây nha", isCustom: !!match };
  }
  if (m.startsWith("💬")) {
    const match = m.match(/:\s*["']?([^"']+)["']?/);
    return { icon: "💬", header: `Lời nhắn từ ${senderName}`, body: match ? match[1] : m.replace(/^💬\s*/, ""), isCustom: true };
  }
  return { icon: "💌", header: `Lời yêu thương từ ${senderName}`, body: m, isCustom: true };
}

// ─── Reaction config ─────────────────────────────────────────────────────────
type ReactionType = "heart" | "hug_back" | "touched" | "gentle";

const REACTION_CONFIG: Record<ReactionType, { emoji: string; label: string }> = {
  heart: { emoji: "❤️", label: "Cảm nhận" },
  hug_back: { emoji: "🫂", label: "Ôm lại" },
  touched: { emoji: "🥺", label: "Thương" },
  gentle: { emoji: "✨", label: "Dịu dàng" },
};

// ─── ReactionPicker ───────────────────────────────────────────────────────────
function ReactionPicker({
  visible,
  myReaction,
  onSelect,
  saving,
}: {
  visible: boolean;
  myReaction: ReactionType | null;
  onSelect: (r: ReactionType) => void;
  saving: boolean;
}) {
  return (
    <div
      className={`
        absolute -top-11 left-1/2 -translate-x-1/2 z-20
        flex items-center gap-1 rounded-full
        border border-[var(--color-border)]
        bg-[var(--color-card)]/90 backdrop-blur-md
        px-2.5 py-1.5 shadow-lg
        transition-all duration-200
        ${visible ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"}
      `}
    >
      {(Object.entries(REACTION_CONFIG) as [ReactionType, { emoji: string; label: string }][]).map(([type, cfg]) => {
        const isSelected = myReaction === type;
        return (
          <button
            key={type}
            onClick={(e) => { e.stopPropagation(); onSelect(type); }}
            disabled={saving}
            title={cfg.label}
            type="button"
            className={`
              relative flex size-8 items-center justify-center rounded-full text-base
              transition-all duration-150 active:scale-90 disabled:opacity-50
              ${isSelected
                ? "bg-[var(--color-primary-soft)] ring-2 ring-[var(--color-primary)]/40 scale-110"
                : "hover:bg-[var(--color-soft)] hover:scale-110"
              }
            `}
          >
            {cfg.emoji}
            {isSelected && (
              <span className="absolute -top-0.5 -right-0.5 flex size-2.5 items-center justify-center rounded-full bg-[var(--color-primary)]">
                <Check className="size-1.5 text-white" />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── ReactionDisplay ─────────────────────────────────────────────────────────
function ReactionDisplay({
  myReaction,
  partnerReaction,
  myName,
  partnerName,
  fadeIn,
}: {
  myReaction: ReactionType | null;
  partnerReaction: ReactionType | null;
  myName: string;
  partnerName: string;
  fadeIn: boolean;
}) {
  if (!myReaction && !partnerReaction) return null;

  return (
    <div
      className={`
        mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1
        border-t border-[var(--color-border)]/30 pt-2
        transition-all duration-500
        ${fadeIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"}
      `}
    >
      {myReaction && (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[var(--color-muted)]">
          {REACTION_CONFIG[myReaction].emoji}
          <span className="text-[var(--color-primary)] font-black">Bạn</span>
          đã {REACTION_CONFIG[myReaction].label.toLowerCase()}
        </span>
      )}
      {partnerReaction && (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[var(--color-muted)]">
          {REACTION_CONFIG[partnerReaction].emoji}
          <span className="font-black" style={{ color: "var(--color-accent)" }}>{partnerName}</span>
          đã {REACTION_CONFIG[partnerReaction].label.toLowerCase()}
        </span>
      )}
    </div>
  );
}

// ─── LoveNoteCard ─────────────────────────────────────────────────────────────
function LoveNoteCard({
  note,
  profile,
  partnerName,
  myReaction,
  partnerReaction,
  onReact,
  onHide,
}: {
  note: Tables<"love_notes">;
  profile: Profile;
  partnerName: string;
  myReaction: ReactionType | null;
  partnerReaction: ReactionType | null;
  onReact: (noteId: string, type: ReactionType) => Promise<void>;
  onHide: (noteId: string, isHidden: boolean) => Promise<void>;
}) {
  const isSenderMe = note.sender_id === profile.id;
  const senderName = isSenderMe ? "Bạn" : partnerName;
  const parsed = parseLoveNote(note.message, senderName, partnerName);

  const [pickerVisible, setPickerVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Fade in reaction display when reaction first appears
  useEffect(() => {
    if (myReaction || partnerReaction) {
      setTimeout(() => setFadeIn(true), 50);
    }
  }, [myReaction, partnerReaction]);

  // Close picker when clicking outside
  useEffect(() => {
    if (!pickerVisible) return;
    const handler = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setPickerVisible(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [pickerVisible]);

  const handleReact = async (type: ReactionType) => {
    setSaving(true);
    setPickerVisible(false);
    await onReact(note.id, type);
    setSaving(false);
    // Subtle pulse on card
    setPulse(true);
    setTimeout(() => setPulse(false), 600);
  };

  return (
    <div
      ref={cardRef}
      className={`
        group relative overflow-visible rounded-2xl border
        bg-[var(--color-card)] p-4
        transition-all duration-300 cursor-pointer
        hover:-translate-y-0.5 hover:shadow-md hover:border-[var(--color-accent)]/30
        ${pulse ? "ring-2 ring-[var(--color-primary)]/20 shadow-[0_0_20px_rgba(var(--color-primary-rgb,136,65,95),0.12)]" : "border-[var(--color-border)]/40 shadow-[0_2px_16px_rgba(0,0,0,0.03)]"}
      `}
      onClick={() => setPickerVisible((v) => !v)}
    >
      {/* Hover aura */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-transparent via-[var(--color-soft)]/0 to-[var(--color-soft-strong)]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      {/* Reaction picker — floats above card */}
      <ReactionPicker
        visible={pickerVisible}
        myReaction={myReaction}
        onSelect={handleReact}
        saving={saving}
      />

      <div className="flex items-start gap-3">
        {/* Icon badge */}
        <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-[var(--color-soft)] border border-[var(--color-border)]/20 text-lg shadow-sm">
          {parsed.icon}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-black text-[var(--color-primary)] dark:text-[var(--color-accent)] leading-tight flex items-center gap-1.5">
              {parsed.header}
              {note.is_hidden && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.5 text-[8px] font-black dark:bg-rose-950/20 dark:text-rose-300 dark:border-rose-900/50">
                  <EyeOff className="size-2" /> Đã ẩn
                </span>
              )}
            </span>
            <span className="shrink-0 text-[9px] font-semibold text-[var(--color-faint)] flex items-center">
              {formatTime(note.created_at)}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onHide(note.id, !note.is_hidden);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[var(--color-soft)] text-[var(--color-faint)] hover:text-[var(--color-primary)] transition ml-1.5 cursor-pointer"
                title={note.is_hidden ? "Bỏ ẩn lời nhắn" : "Ẩn khỏi dòng thời gian"}
              >
                {note.is_hidden ? <Eye className="size-3 text-emerald-500" /> : <EyeOff className="size-3" />}
              </button>
            </span>
          </div>

          <p className="mt-1.5 text-xs font-semibold italic text-[var(--color-text)] leading-relaxed">
            "{parsed.body}"
          </p>

          {/* Tap hint — only when no reaction yet */}
          {!myReaction && !pickerVisible && (
            <p className="mt-1.5 text-[9px] text-[var(--color-faint)] opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              Chạm để phản hồi cảm xúc
            </p>
          )}

          {/* Reaction display */}
          <ReactionDisplay
            myReaction={myReaction}
            partnerReaction={partnerReaction}
            myName={profile.display_name}
            partnerName={partnerName}
            fadeIn={fadeIn}
          />
        </div>
      </div>

      {/* Saving indicator */}
      {saving && (
        <div className="absolute right-3 top-3">
          <Loader2 className="size-3 animate-spin text-[var(--color-primary)]" />
        </div>
      )}
    </div>
  );
}

// ─── Main LoveSpace Component ─────────────────────────────────────────────────
export function LoveSpace({
  profile,
  currentCouple,
  partnerProfile,
  initialPartnerMood,
  initialLoveNotes,
  initialReactions,
}: LoveSpaceProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const supabase = useMemo(() => createClient(), []);

  const coupleId = currentCouple?.couple?.id ?? null;
  const partnerName = partnerProfile?.display_name ?? "Người ấy";

  const [partnerMood, setPartnerMood] = useState<Tables<"mood_logs"> | null>(initialPartnerMood);
  const [loveNotes, setLoveNotes] = useState<Tables<"love_notes">[]>(initialLoveNotes);
  const [messageText, setMessageText] = useState("");
  const [reactionSuccess, setReactionSuccess] = useState<"hug" | "care" | "chat" | null>(null);
  const [showHiddenNotes, setShowHiddenNotes] = useState(false);
  const composerRef = useRef<HTMLTextAreaElement>(null);

  const partnerProfileRef = useRef(partnerProfile);
  const profileRef = useRef(profile);

  useEffect(() => {
    partnerProfileRef.current = partnerProfile;
  }, [partnerProfile]);

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  // reactions: map[love_note_id] → { mine: LoveNoteReaction | null, partner: LoveNoteReaction | null }
  const [reactions, setReactions] = useState<Map<string, { mine: LoveNoteReaction | null; partner: LoveNoteReaction | null }>>(() => {
    const map = new Map<string, { mine: LoveNoteReaction | null; partner: LoveNoteReaction | null }>();
    for (const r of initialReactions) {
      const existing = map.get(r.love_note_id) ?? { mine: null, partner: null };
      if (r.user_id === profile.id) {
        map.set(r.love_note_id, { ...existing, mine: r });
      } else if (partnerProfile && r.user_id === partnerProfile.id) {
        map.set(r.love_note_id, { ...existing, partner: r });
      }
    }
    return map;
  });

  useEffect(() => {
    // Initial client sync for fresh mood
    const syncFreshPartnerMood = async () => {
      if (!partnerProfile) return;
      const { data: pMood } = await supabase
        .from("mood_logs")
        .select("*")
        .eq("user_id", partnerProfile.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (pMood) {
        setPartnerMood((current) => {
          if (!current) return pMood;
          const currentMilli = current.created_at ? new Date(current.created_at).getTime() : 0;
          const freshMilli = pMood.created_at ? new Date(pMood.created_at).getTime() : 0;
          return freshMilli > currentMilli ? pMood : current;
        });
      }
    };
    syncFreshPartnerMood();
  }, [partnerProfile?.id, supabase]);

  useEffect(() => {
    if (initialPartnerMood) {
      setPartnerMood((current) => {
        if (!current) return initialPartnerMood;
        const currentMilli = current.created_at ? new Date(current.created_at).getTime() : 0;
        const propMilli = initialPartnerMood.created_at ? new Date(initialPartnerMood.created_at).getTime() : 0;
        return propMilli > currentMilli ? initialPartnerMood : current;
      });
    } else {
      setPartnerMood(null);
    }
  }, [initialPartnerMood]);

  useEffect(() => {
    setLoveNotes((current) => {
      // Deduplicate and merge prop notes and local notes, then sort by created_at descending
      const combined = [...current, ...initialLoveNotes];
      const unique = Array.from(new Map(combined.map((item) => [item.id, item])).values());
      return unique.sort((a, b) => {
        const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bTime - aTime;
      });
    });
  }, [initialLoveNotes]);

  const handleHideNote = useCallback(async (noteId: string, isHidden: boolean) => {
    setLoveNotes((prev) =>
      prev.map((n) => (n.id === noteId ? { ...n, is_hidden: isHidden } : n))
    );
    await supabase
      .from("love_notes")
      .update({ is_hidden: isHidden })
      .eq("id", noteId);
  }, [supabase]);

  // ── Realtime subscription ──
  useEffect(() => {
    if (!coupleId) return;

    console.log('[LOVE REALTIME] Subscribing with coupleId:', coupleId);
    let channel = supabase.channel(`love_space_sync:${coupleId}`);

    // Listen to mood changes
    channel = channel.on("postgres_changes", {
      event: "*", schema: "public", table: "mood_logs",
    }, (payload) => {
      console.log('[REALTIME mood event in LoveSpace]', payload);
      const partnerProfileVal = partnerProfileRef.current;
      if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
        const nm = payload.new as Tables<"mood_logs">;
        if (partnerProfileVal && nm.user_id === partnerProfileVal.id) {
          setPartnerMood(nm);
        }
      } else if (payload.eventType === "DELETE") {
        const oldMood = payload.old as { id: string };
        setPartnerMood((current) => (current && oldMood.id === current.id ? null : current));
      }
    });

    // Listen to love notes changes
    channel = channel.on("postgres_changes", {
      event: "*", schema: "public", table: "love_notes",
    }, (payload) => {
      console.log('[LOVE REALTIME note event]', payload);
      if (payload.eventType === "INSERT") {
        const nn = payload.new as Tables<"love_notes">;
        setLoveNotes((prev) => {
          if (prev.some((item) => item.id === nn.id)) return prev;
          return [nn, ...prev].slice(0, 30);
        });
        startTransition(() => {
          router.refresh();
        });
      } else if (payload.eventType === "UPDATE") {
        const nn = payload.new as Tables<"love_notes">;
        setLoveNotes((prev) => prev.map((item) => item.id === nn.id ? nn : item));
        startTransition(() => {
          router.refresh();
        });
      } else if (payload.eventType === "DELETE") {
        const oldNote = payload.old as { id: string };
        setLoveNotes((prev) => prev.filter((item) => item.id !== oldNote.id));
        startTransition(() => {
          router.refresh();
        });
      }
    });

    const partnerId = partnerProfileRef.current?.id;
    const myId = profileRef.current.id;

    // Listen to reactions of self and partner
    channel = channel.on("postgres_changes", {
      event: "*", schema: "public", table: "love_note_reactions",
    }, (payload) => {
      if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
        const nr = payload.new as LoveNoteReaction;
        if (nr.user_id === myId) {
          setReactions((prev) => {
            const map = new Map(prev);
            const existing = map.get(nr.love_note_id) ?? { mine: null, partner: null };
            map.set(nr.love_note_id, { ...existing, mine: nr });
            return map;
          });
        } else if (partnerId && nr.user_id === partnerId) {
          setReactions((prev) => {
            const map = new Map(prev);
            const existing = map.get(nr.love_note_id) ?? { mine: null, partner: null };
            map.set(nr.love_note_id, { ...existing, partner: nr });
            return map;
          });
        }
      } else if (payload.eventType === "DELETE") {
        const oldReaction = payload.old as { id: string };
        setReactions((prev) => {
          const map = new Map(prev);
          for (const [noteId, val] of map.entries()) {
            if (val.mine?.id === oldReaction.id) {
              map.set(noteId, { ...val, mine: null });
              break;
            }
            if (val.partner?.id === oldReaction.id) {
              map.set(noteId, { ...val, partner: null });
              break;
            }
          }
          return map;
        });
      }
    });

    channel.subscribe((status) => {
      console.log('[LOVE REALTIME status]', status);
    });

    return () => { supabase.removeChannel(channel); };
  }, [coupleId, supabase]);

  // ── Handle react to note ──
  const handleReactToNote = useCallback(async (noteId: string, type: ReactionType) => {
    // Optimistic update first
    const existing = reactions.get(noteId) ?? { mine: null, partner: null };
    const optimisticReaction: LoveNoteReaction = {
      id: existing.mine?.id ?? Math.random().toString(),
      love_note_id: noteId,
      user_id: profile.id,
      reaction_type: type,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setReactions((prev) => {
      const map = new Map(prev);
      map.set(noteId, { ...existing, mine: optimisticReaction });
      return map;
    });

    if (existing.mine) {
      // UPDATE existing reaction
      const { error } = await supabase
        .from("love_note_reactions")
        .update({ reaction_type: type, updated_at: new Date().toISOString() })
        .eq("id", existing.mine.id);
      if (error) {
        console.error("Update reaction error:", error.message, error.code, error.details);
        // Rollback optimistic update
        setReactions((prev) => {
          const map = new Map(prev);
          map.set(noteId, existing);
          return map;
        });
      }
    } else {
      // INSERT new reaction (upsert fallback)
      const { error } = await supabase
        .from("love_note_reactions")
        .upsert({
          love_note_id: noteId,
          user_id: profile.id,
          reaction_type: type,
          updated_at: new Date().toISOString(),
        }, { onConflict: "love_note_id,user_id" });
      if (error) {
        console.error("Insert reaction error:", error.message, error.code, error.details);
        // Rollback optimistic update
        setReactions((prev) => {
          const map = new Map(prev);
          map.set(noteId, existing);
          return map;
        });
      }
    }
  }, [reactions, profile.id, supabase]);

  // ── Send love note ──
  const handleReaction = async (type: "hug" | "care" | "chat") => {
    if (!coupleId || !partnerProfile) return;
    setReactionSuccess(type);

    const partnerConfig = getMoodConfig(partnerMood?.mood ?? null);
    const pmd = `${partnerConfig.emoji} ${partnerConfig.label}`;
    let message = "";

    if (type === "hug") {
      message = messageText.trim()
        ? `🫂 ${profile.display_name} đã phản hồi tâm trạng "${pmd}" của bạn bằng một cái ôm thật ấm áp! Lời nhắn: "${messageText.trim()}"`
        : `🫂 Một cái ôm dành cho bạn`;
    } else if (type === "care") {
      message = messageText.trim()
        ? `❤️ ${profile.display_name} đang bày tỏ sự quan tâm đặc biệt phản hồi tâm trạng "${pmd}" của bạn! Lời nhắn: "${messageText.trim()}"`
        : `❤️ Có mình ở đây nha`;
    } else {
      message = messageText.trim()
        ? `💬 Lời nhắn từ ${profile.display_name} phản hồi tâm trạng "${pmd}" của bạn: "${messageText.trim()}"`
        : `💬 Người ấy đang nghĩ về bạn`;
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
    let notifTitle = `${profile.display_name} vừa gửi tin nhắn yêu thương 💌`;
    if (type === "hug") {
      notifTitle = `${profile.display_name} vừa gửi cho bạn một cái ôm thật ấm áp 🫂`;
    } else if (type === "care") {
      notifTitle = `${profile.display_name} gửi lời quan tâm ngọt ngào đến bạn ❤️`;
    } else if (type === "chat") {
      notifTitle = `${profile.display_name} gửi lời chia sẻ, trò chuyện 💬`;
    }

    await supabase.from("notifications").insert({
      couple_id: coupleId,
      user_id: partnerProfile.id,
      sender_id: profile.id,
      type: "love_note",
      title: notifTitle,
      content: messageText.trim() ? messageText.trim() : message,
      link: "/love",
    });

    setTimeout(() => { setReactionSuccess(null); setMessageText(""); }, 1200);
    startTransition(() => router.refresh());
  };

  const partnerMoodConfig = getMoodConfig(partnerMood?.mood ?? null);

  return (
    <div className="mx-auto max-w-2xl space-y-6">

      {/* ── Header ── */}
      <header className="relative overflow-hidden rounded-3xl border border-[var(--color-border)]/50 bg-[var(--color-card)] p-4 text-center shadow-[var(--app-shadow)] max-w-lg mx-auto">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--color-accent)]/20 via-[var(--color-primary)] to-[var(--color-accent)]/20 animate-pulse" />
        <HeartHandshake className="size-6 text-[var(--color-accent)] mx-auto mb-2 animate-[heartbeat_3s_infinite_ease-in-out]" />
        <h1 className="text-xl font-black tracking-tight">Phản hồi cảm xúc</h1>
        <p className="mt-1 text-xs text-[var(--color-muted)] font-semibold leading-relaxed">
          Không gian nhỏ yên tĩnh để lắng nghe, thấu cảm và chăm sóc thế giới nội tâm của nhau mỗi ngày.
        </p>
      </header>

      {/* ── Partner Mood + Composer ── */}
      {partnerProfile ? (
        <div className="relative overflow-hidden rounded-[2.2rem] border border-[var(--color-border)]/60 bg-[var(--color-card)]/90 backdrop-blur-md p-5 sm:p-7 shadow-[var(--app-shadow)]">
          <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-[var(--color-success-soft)] px-2.5 py-0.5 text-[9px] font-black text-[var(--color-success)] border border-[var(--color-border)]/30">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-success)] opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--color-success)]" />
            </span>
            Realtime Active
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="relative mb-3 flex items-center justify-center">
              <div className="absolute inset-0 bg-[var(--color-soft)]/20 blur-xl rounded-full scale-125" />
              {partnerProfile.avatar_url ? (
                <img src={partnerProfile.avatar_url} alt={partnerProfile.display_name}
                  className="size-16 sm:size-20 rounded-full object-cover border-[3px] border-[var(--color-card)] ring-2 ring-[var(--color-border)]" />
              ) : (
                <div className="grid size-16 sm:size-20 place-items-center rounded-full bg-[var(--color-soft)] text-lg font-black text-[var(--color-primary)] border-[3px] border-[var(--color-card)] ring-2 ring-[var(--color-border)]">
                  {partnerProfile.display_name.slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 flex size-6 sm:size-7 place-items-center justify-center rounded-full bg-[var(--color-card)] border border-[var(--color-border)] shadow-md text-base sm:text-lg">
                {partnerMoodConfig.emoji}
              </div>
            </div>

            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-faint)]">
              TÂM TRẠNG CỦA {partnerName.toUpperCase()}
            </p>

            {partnerMood ? (
              <div className="mt-1 flex flex-col items-center max-w-md">
                <span className={`inline-flex rounded-full border px-3.5 py-0.5 text-xs font-black tracking-wide ${partnerMoodConfig.pillColor}`}>
                  {partnerMoodConfig.emoji} {partnerMoodConfig.label}
                </span>
                {partnerMood.note ? (
                  <p className="mt-3.5 rounded-2xl bg-[var(--color-soft)]/75 border border-[var(--color-border)] px-4 py-2.5 text-xs font-semibold italic text-[var(--color-text)] leading-relaxed">
                    "{partnerMood.note}"
                  </p>
                ) : (
                  <p className="mt-2.5 text-xs font-semibold italic text-[var(--color-muted)]">
                    {partnerName} đang trải qua một ngày yên lành.
                  </p>
                )}
                <span className="mt-2 text-[9px] font-semibold text-[var(--color-faint)] flex items-center gap-1">
                  <Clock className="size-3" />
                  Cập nhật: {formatTime(partnerMood.created_at)}
                </span>
              </div>
            ) : (
              <p className="mt-3 text-xs font-semibold italic text-[var(--color-muted)]">
                {partnerName} chưa cập nhật cảm xúc hôm nay.
              </p>
            )}
          </div>

          {/* Composer */}
          {partnerMood && (
            <div className="mt-6 border-t border-[var(--color-border)]/50 pt-5 max-w-md mx-auto">
              <div className="flex flex-col gap-2 bg-[var(--color-soft)]/30 border border-[var(--color-border)] rounded-2xl p-2.5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.01)] transition-all duration-300 focus-within:border-[var(--color-accent)] focus-within:ring-1 focus-within:ring-[var(--color-accent)]">
                <textarea
                  ref={composerRef}
                  placeholder={partnerMoodConfig.isNegative
                    ? `Gửi lời động viên, vỗ về đến ${partnerName}...`
                    : `Nhắn gửi yêu thương phản hồi cảm xúc hôm nay của ${partnerName}...`}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  rows={2}
                  maxLength={100}
                  className="w-full resize-none border-0 bg-transparent p-1.5 text-xs font-semibold outline-none focus:ring-0 text-[var(--color-text)] placeholder-[var(--color-faint)] leading-relaxed"
                />
              </div>
              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="text-[9px] text-[var(--color-faint)] font-bold">{messageText.length}/100 kí tự</span>
                <div className="flex items-center gap-1">
                  {(["hug", "care", "chat"] as const).map((t) => (
                    <button key={t} onClick={() => handleReaction(t)} disabled={reactionSuccess !== null}
                      type="button"
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1.5 text-[10px] font-black transition hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 ${t === "chat"
                          ? "border-transparent bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]"
                          : "border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text)] hover:border-[var(--color-accent)] hover:bg-[var(--color-soft)]"
                        }`}
                    >
                      {reactionSuccess === t
                        ? t === "hug" ? "Đã gửi ôm! 🫂" : t === "care" ? "Đã quan tâm! ❤️" : "Đã gửi tin! 💬"
                        : t === "hug" ? "🫂 Gửi ôm" : t === "care" ? "❤️ Quan tâm" : "💬 Nhắn ngay"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-card)] p-8 text-center max-w-md mx-auto">
          <AlertCircle className="size-8 text-amber-500 mx-auto mb-2" />
          <p className="text-sm font-bold text-[var(--color-text)]">Chưa kết nối với đối phương</p>
          <p className="mt-1 text-xs text-[var(--color-muted)] leading-relaxed">
            Vào Cài đặt để tạo mã mời hoặc kết nối với tài khoản của người ấy để bắt đầu đồng bộ cảm xúc.
          </p>
        </div>
      )}

      {/* ── Lời yêu thương section ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--color-border)]/40 pb-2">
          <h2 className="text-sm font-black uppercase tracking-[0.18em] text-[var(--color-faint)]">
            Lời yêu thương
          </h2>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowHiddenNotes(!showHiddenNotes)}
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 border text-[9px] font-black transition active:scale-95 cursor-pointer ${showHiddenNotes
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-300"
                  : "bg-[var(--color-card)] text-[var(--color-muted)] border-[var(--color-border)]"
                }`}
              title={showHiddenNotes ? "Ẩn các tin nhắn đã đánh dấu ẩn" : "Hiển thị các tin nhắn đã đánh dấu ẩn"}
            >
              {showHiddenNotes ? <Eye className="size-3" /> : <EyeOff className="size-3" />}
              {showHiddenNotes ? "Đang xem tin ẩn" : "Xem tin ẩn"}
            </button>
            <span className="text-[10px] font-bold text-[var(--color-faint)] uppercase">
              {loveNotes.filter((n) => showHiddenNotes ? true : !n.is_hidden).length} khoảnh khắc
            </span>
          </div>
        </div>

        {/* Reaction hint */}
        {loveNotes.length > 0 && (
          <p className="text-[10px] text-[var(--color-faint)] text-center italic">
            ✨ Chạm vào một thẻ để phản hồi cảm xúc nhẹ nhàng
          </p>
        )}

        {loveNotes.filter((n) => showHiddenNotes ? true : !n.is_hidden).length > 0 ? (
          <div className="grid gap-3 sm:gap-4 max-w-xl mx-auto py-2">
            {loveNotes
              .filter((note) => showHiddenNotes ? true : !note.is_hidden)
              .map((note) => {
                const noteReactions = reactions.get(note.id) ?? { mine: null, partner: null };
                return (
                  <LoveNoteCard
                    key={note.id}
                    note={note}
                    profile={profile}
                    partnerName={partnerName}
                    myReaction={noteReactions.mine?.reaction_type as ReactionType | null}
                    partnerReaction={noteReactions.partner?.reaction_type as ReactionType | null}
                    onReact={handleReactToNote}
                    onHide={handleHideNote}
                  />
                );
              })}
          </div>
        ) : (
          <div className="rounded-3xl border border-[var(--color-border)]/30 bg-[var(--color-card)]/50 p-8 sm:p-12 text-center max-w-xl mx-auto py-16 shadow-[var(--app-shadow)] flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-24 h-24 bg-pink-100/30 rounded-full blur-3xl pointer-events-none" />
            <Inbox className="size-12 text-[var(--color-primary-soft)] mb-4 animate-pulse" />
            <p className="text-xs font-black text-[var(--color-text)]">Chưa có lời yêu thương nào</p>
            <p className="mt-2 text-xs text-[var(--color-muted)] max-w-sm mx-auto leading-relaxed font-semibold">
              Những lời yêu thương chưa nói, hãy gửi cho người ấy một chiếc ôm ấm áp hay một lời nhắn ngọt ngào để lấp đầy không gian này nhé... 💌
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
