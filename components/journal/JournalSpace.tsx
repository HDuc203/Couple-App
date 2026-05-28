"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Calendar,
  Clock,
  Edit2,
  Heart,
  Plus,
  Trash2,
  X,
  Music,
  Lock,
  Unlock,
  Smile,
  Loader2,
  AlertCircle,
  Sparkles,
  Volume2,
  HeartHandshake
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/types/database";
import type { Profile } from "@/lib/profile";
import type { PartnerProfile } from "@/lib/couple";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

type JournalSpaceProps = {
  profile: Profile;
  currentCouple: any;
  partnerProfile: PartnerProfile | null;
  initialEntries: Tables<"diary_entries">[];
  queryError?: string;
};

type ParsedJournalContent = {
  text: string;
  mood: string;
  coverImage: string | null;
  musicUrl: string | null;
  visibility: "couple" | "time-capsule";
  revealDate: string | null;
  authorName: string;
};

// Safe JSON parser for structured contents
function parseJournalContent(rawContent: string, authorDefaultName: string): ParsedJournalContent {
  const clean = rawContent.trim();
  if (clean.startsWith("{") && clean.endsWith("}")) {
    try {
      const parsed = JSON.parse(clean);
      return {
        text: parsed.text || "",
        mood: parsed.mood || "Lãng mạn",
        coverImage: parsed.coverImage || null,
        musicUrl: parsed.musicUrl || null,
        visibility: parsed.visibility || "couple",
        revealDate: parsed.revealDate || null,
        authorName: parsed.authorName || authorDefaultName,
      };
    } catch (e) {
      // Fallback
    }
  }
  return {
    text: rawContent,
    mood: "Kỷ niệm",
    coverImage: null,
    musicUrl: null,
    visibility: "couple",
    revealDate: null,
    authorName: authorDefaultName,
  };
}

// Auto-convert standard Unsplash photo webpage URLs to direct CDN download links
export function resolveDirectImageUrl(urlStr: string | null): string {
  if (!urlStr) return "";
  const url = urlStr.trim();

  if (url.includes("unsplash.com/photos/")) {
    const parts = url.split("unsplash.com/photos/");
    if (parts.length > 1) {
      const slugOrId = parts[1].split("?")[0].split("#")[0]; // remove query/hash
      return `https://unsplash.com/photos/${slugOrId}/download?force=true`;
    }
  }

  return url;
}

// Client-side local file picker compressor to base64
export function compressAndEncodeFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.65);
          resolve(dataUrl);
        } else {
          reject(new Error("Context not available"));
        }
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

// Mood styling rules
const MOOD_DESIGNS: Record<string, { emoji: string; pill: string; glow: string }> = {
  "Vui": { emoji: "😊", pill: "bg-amber-100/80 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50", glow: "rgba(245,158,11,0.12)" },
  "Ấm áp": { emoji: "🧸", pill: "bg-orange-100/80 text-orange-800 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-900/50", glow: "rgba(249,115,22,0.12)" },
  "Lãng mạn": { emoji: "🥰", pill: "bg-pink-100/80 text-pink-800 border-pink-200 dark:bg-pink-950/40 dark:text-pink-300 dark:border-pink-900/50", glow: "rgba(236,72,153,0.15)" },
  "Buồn": { emoji: "😔", pill: "bg-indigo-100/80 text-indigo-800 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900/50", glow: "rgba(99,102,241,0.12)" },
  "Nhớ nhung": { emoji: "🥺", pill: "bg-rose-100/80 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50", glow: "rgba(244,63,94,0.15)" },
  "Kỷ niệm": { emoji: "✨", pill: "bg-purple-100/80 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900/50", glow: "rgba(168,85,247,0.12)" }
};

export function JournalSpace({
  profile,
  currentCouple,
  partnerProfile,
  initialEntries,
  queryError,
}: JournalSpaceProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const coupleId = currentCouple?.couple?.id ?? null;
  const partnerName = partnerProfile?.display_name ?? "Người ấy";

  // State
  const [entries, setEntries] = useState<Tables<"diary_entries">[]>(initialEntries);
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Tables<"diary_entries"> | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [mood, setMood] = useState("Lãng mạn");
  const [musicUrl, setMusicUrl] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [visibility, setVisibility] = useState<"couple" | "time-capsule">("couple");
  const [revealDate, setRevealDate] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [formError, setFormError] = useState("");
  const [isCompressing, setIsCompressing] = useState(false);

  // Custom Confirm Modal state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    try {
      const base64 = await compressAndEncodeFile(file);
      setCoverImage(base64);
    } catch (error) {
      console.error(error);
      setFormError("Không thể nén ảnh này. Vui lòng chọn ảnh khác.");
    } finally {
      setIsCompressing(false);
    }
  };

  // Sync state with server changes
  useEffect(() => {
    setEntries(initialEntries);
  }, [initialEntries]);

  // Real-time synchronization
  useEffect(() => {
    if (!coupleId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`diary_entries_sync:${coupleId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "diary_entries",
          filter: `couple_id=eq.${coupleId}`,
        },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            const newEntry = payload.new as Tables<"diary_entries">;
            setEntries((prev) => [newEntry, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as Tables<"diary_entries">;
            setEntries((prev) =>
              prev.map((item) => (item.id === updated.id ? updated : item))
            );
          } else if (payload.eventType === "DELETE") {
            const deleted = payload.old as { id: string };
            setEntries((prev) => prev.filter((item) => item.id !== deleted.id));
          }

          startTransition(() => {
            router.refresh();
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [coupleId]);

  // Open creation modal
  const handleOpenCreate = () => {
    setEditingEntry(null);
    setTitle("");
    setText("");
    setMood("Lãng mạn");
    setMusicUrl("");
    setCoverImage("");
    setVisibility("couple");
    setRevealDate("");
    setIsPrivate(false);
    setFormError("");
    setIsOpenModal(true);
  };

  // Open edit modal
  const handleOpenEdit = (entry: Tables<"diary_entries">) => {
    const parsed = parseJournalContent(entry.content, profile.display_name);
    setEditingEntry(entry);
    setTitle(entry.title || "");
    setText(parsed.text);
    setMood(parsed.mood);
    setMusicUrl(parsed.musicUrl || "");
    setCoverImage(parsed.coverImage || "");
    setVisibility(parsed.visibility);
    setRevealDate(parsed.revealDate || "");
    setIsPrivate(entry.is_private || false);
    setFormError("");
    setIsOpenModal(true);
  };

  // Handle Form Submission (Create or Edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coupleId) return;

    if (!title.trim() || !text.trim()) {
      setFormError("Vui lòng nhập đầy đủ tiêu đề và nội dung trang nhật ký.");
      return;
    }

    if (visibility === "time-capsule" && !revealDate) {
      setFormError("Vui lòng chọn ngày mở hộp thư thời gian.");
      return;
    }

    const supabase = createClient();

    // Pack extended attributes inside content as JSON
    const contentPayload = JSON.stringify({
      text: text.trim(),
      mood,
      coverImage: coverImage.trim() || null,
      musicUrl: musicUrl.trim() || null,
      visibility,
      revealDate: visibility === "time-capsule" ? revealDate : null,
      authorName: editingEntry
        ? parseJournalContent(editingEntry.content, profile.display_name).authorName
        : profile.display_name,
    });

    if (editingEntry) {
      // UPDATE
      const { error } = await supabase
        .from("diary_entries")
        .update({
          title: title.trim(),
          content: contentPayload,
          is_private: isPrivate,
        })
        .eq("id", editingEntry.id);

      if (error) {
        setFormError(`Lỗi cập nhật: ${error.message}`);
        return;
      }
    } else {
      // CREATE
      const { error } = await supabase.from("diary_entries").insert({
        couple_id: coupleId,
        author_id: profile.id,
        title: title.trim(),
        content: contentPayload,
        is_private: isPrivate,
      });

      if (error) {
        setFormError(`Lỗi lưu: ${error.message}`);
        return;
      }

      // Gửi thông báo đến partner nếu nhật ký là công khai (không riêng tư)
      if (partnerProfile && !isPrivate) {
        await supabase.from("notifications").insert({
          couple_id: coupleId,
          user_id: partnerProfile.id,
          sender_id: profile.id,
          type: "love_note",
          title: `${profile.display_name} vừa viết một trang nhật ký mới 📝`,
          content: `Tiêu đề: "${title.trim() ? title.trim() : "Trang nhật ký mới"}". Cùng xem và sẻ chia câu chuyện nhé! ❤️`,
          link: "/journal",
        });
      }
    }

    setIsOpenModal(false);
    startTransition(() => {
      router.refresh();
    });
  };

  // Delete an entry
  const handleDelete = (id: string) => {
    setDeleteId(id);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    const supabase = createClient();
    const { error } = await supabase.from("diary_entries").delete().eq("id", deleteId);

    if (error) {
      alert(`Không thể xóa nhật ký: ${error.message}`);
    } else {
      startTransition(() => {
        router.refresh();
      });
    }
    setDeleteId(null);
  };

  // Helper check for locked capsules
  const isCapsuleLocked = (revealDateStr: string | null): boolean => {
    if (!revealDateStr) return false;
    const reveal = new Date(revealDateStr);
    return reveal.getTime() > Date.now();
  };

  // Safe formatting dates
  const formatDate = (isoString: string | null) => {
    if (!isoString) return "";
    return new Date(isoString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // "On This Day" Nostalgia Engine
  const today = new Date();
  const onThisDayEntries = entries.filter((entry) => {
    if (!entry.created_at) return false;
    const date = new Date(entry.created_at);
    // Same day, same month, but previous year
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() < today.getFullYear()
    );
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header Info */}
      <header className="rounded-3xl border border-[var(--color-border)]/50 bg-[var(--color-card)] p-5 shadow-[var(--app-shadow)] text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-300 via-[var(--color-primary)] to-amber-200 animate-pulse" />
        <BookOpen className="size-6 text-[var(--color-primary)] mx-auto mb-2" />
        <h1 className="text-2xl font-black tracking-tight">Nhật ký hai đứa</h1>
        <p className="mt-1 text-xs text-[var(--color-muted)] font-semibold max-w-lg mx-auto">
          Cuốn hồi ký chung lãng mạn. Nơi lưu lại từng câu chuyện vui buồn, những khoảnh khắc gắn kết ngọt ngào và các bức thư gửi tương lai.
        </p>

        {coupleId && (
          <button
            onClick={handleOpenCreate}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-5 py-2 text-xs font-black text-white hover:bg-[var(--color-primary-hover)] transition active:scale-95 shadow-md"
          >
            <Plus className="size-4" /> Viết trang mới
          </button>
        )}
      </header>

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
            Hãy kết nối với người ấy trong trang Cài đặt để cùng tạo dựng cuốn nhật ký đôi lứa.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-[1fr_2.5fr]">

          {/* LEFT COLUMN: On This Day & Mood Stats */}
          <aside className="space-y-5">

            {/* On This Day Card */}
            <div className="rounded-3xl border border-[var(--color-border)]/50 bg-[var(--color-card)] p-4 shadow-[var(--app-shadow)] relative overflow-hidden">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="size-4 text-[var(--color-accent)] animate-spin" />
                <h3 className="text-xs font-black uppercase tracking-wider text-[var(--color-primary)]">Ngày này năm xưa</h3>
              </div>

              {onThisDayEntries.length > 0 ? (
                <div className="space-y-3">
                  {onThisDayEntries.slice(0, 1).map((entry) => {
                    const parsed = parseJournalContent(entry.content, partnerName);
                    const moodConf = MOOD_DESIGNS[parsed.mood] || { emoji: "✨" };
                    return (
                      <div key={entry.id} className="rounded-2xl bg-[var(--color-soft)]/50 p-3 border border-[var(--color-border)]/40 relative">
                        <div className="absolute top-2 right-2 text-xs">{moodConf.emoji}</div>
                        <p className="text-[10px] font-bold text-[var(--color-faint)]">
                          {new Date(entry.created_at || "").getFullYear()} — {formatDate(entry.created_at)}
                        </p>
                        <h4 className="font-black text-xs mt-1 truncate">{entry.title}</h4>
                        <p className="text-[11px] font-semibold text-[var(--color-muted)] mt-1.5 line-clamp-3 leading-relaxed">
                          "{parsed.text}"
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[11px] font-semibold text-[var(--color-muted)] leading-relaxed italic">
                  Chưa có kỷ niệm nào của ngày hôm nay vào các năm trước. Hãy viết thêm thật nhiều kỷ niệm nhé! 🥰
                </p>
              )}
            </div>

            {/* Private Space Invitation */}
            <div className="rounded-3xl border border-[var(--color-border)]/30 bg-[var(--color-card)]/40 p-4 text-center">
              <HeartHandshake className="size-5 text-[var(--color-accent)] mx-auto mb-1.5" />
              <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-primary)]">Shared space</p>
              <p className="text-[10px] text-[var(--color-muted)] leading-relaxed mt-1 font-semibold">
                Mọi dòng chữ đều được đồng bộ tức thời và thuộc quyền biên soạn chung của cả 2 bạn.
              </p>
            </div>

          </aside>

          {/* RIGHT COLUMN: Scrapbook Cinematic Timeline */}
          <section className="space-y-4">

            {entries.length > 0 ? (
              <div className="relative border-l border-[var(--color-border)]/60 ml-3 pl-5 sm:pl-7 space-y-6">

                {entries
                  .filter((entry) => entry.author_id === profile.id || !entry.is_private)
                  .map((entry) => {
                    const isOwn = entry.author_id === profile.id;
                    const parsed = parseJournalContent(entry.content, isOwn ? profile.display_name : partnerName);
                    const isLocked = parsed.visibility === "time-capsule" && isCapsuleLocked(parsed.revealDate);
                    const moodStyle = MOOD_DESIGNS[parsed.mood] || { emoji: "✨", pill: "bg-[var(--color-primary-soft)] text-[var(--color-primary)]", glow: "rgba(0,0,0,0)" };

                    return (
                      <div key={entry.id} className="relative group">

                        {/* Timeline dot */}
                        <div className="absolute -left-[27px] sm:-left-[35px] top-1.5 flex size-4.5 items-center justify-center rounded-full bg-[var(--color-card)] border border-[var(--color-border)] shadow-sm">
                          <div className="size-2 rounded-full bg-[var(--color-primary)] animate-pulse" />
                        </div>

                        {/* Polaroid Glassmorphic Journal Card */}
                        <article
                          className="rounded-3xl border border-[var(--color-border)]/40 bg-[var(--color-card)] p-4 sm:p-5 shadow-[0_4px_24px_rgba(0,0,0,0.01)] transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-[var(--color-accent)]/20 relative overflow-hidden"
                          style={{ boxShadow: `0 0 20px ${moodStyle.glow}` }}
                        >
                          {parsed.coverImage && !isLocked && (
                            <div className="mb-4 h-36 w-full rounded-2xl overflow-hidden border border-[var(--color-border)]/30">
                              <img
                                src={resolveDirectImageUrl(parsed.coverImage)}
                                alt="Cover"
                                className="h-full w-full object-cover transform transition duration-500 hover:scale-105"
                              />
                            </div>
                          )}

                          <header className="flex flex-wrap items-start justify-between gap-2 mb-2">
                            <div>
                              <span className="text-[10px] font-bold text-[var(--color-faint)] flex items-center gap-1">
                                <Calendar className="size-3" />
                                {formatDate(entry.created_at)}
                              </span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <h2 className="text-base font-black tracking-tight text-[var(--color-text)]">
                                  {entry.title}
                                </h2>
                                {entry.is_private && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 text-[9px] font-black dark:bg-rose-950/20 dark:text-rose-300 dark:border-rose-900/50">
                                    <Lock className="size-2.5" /> Cá nhân
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {/* Mood Tag */}
                              <span className={`inline-flex rounded-full border px-2 py-0.5 text-[9px] font-black ${moodStyle.pill}`}>
                                {moodStyle.emoji} {parsed.mood}
                              </span>
                              {/* Visibility status */}
                              {parsed.visibility === "time-capsule" && (
                                <span className={`inline-flex rounded-full border px-2 py-0.5 text-[9px] font-black ${isLocked ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-300" : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-300"}`}>
                                  {isLocked ? <Lock className="size-2.5 mr-0.5" /> : <Unlock className="size-2.5 mr-0.5" />}
                                  Capsule
                                </span>
                              )}
                            </div>
                          </header>

                          {/* If locked Time Capsule */}
                          {isLocked ? (
                            <div className="rounded-2xl bg-rose-50/40 dark:bg-rose-950/10 border border-rose-200/50 p-5 text-center my-2">
                              <Lock className="size-8 text-rose-500 mx-auto mb-2 animate-bounce" />
                              <p className="text-xs font-black text-rose-800 dark:text-rose-300">Hộp thư thời gian bị khóa kín 🔒</p>
                              <p className="mt-1 text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                                Người gửi đặt lịch khóa đến ngày: <strong className="font-bold">{formatDate(parsed.revealDate)}</strong>.
                                Hãy kiên nhẫn chờ đến thời khắc mở hộp thư ngọt ngào này nhé! 🥰
                              </p>
                            </div>
                          ) : (
                            // Main Body Text
                            <p className="text-xs sm:text-sm font-semibold text-[var(--color-text)] leading-relaxed whitespace-pre-line italic">
                              "{parsed.text}"
                            </p>
                          )}

                          <footer className="mt-4 border-t border-[var(--color-border)]/40 pt-3 flex flex-wrap items-center justify-between gap-3">
                            <span className="text-[10px] font-bold text-[var(--color-faint)] italic">
                              ✍️ Biên soạn bởi: {parsed.authorName}
                            </span>

                            <div className="flex items-center gap-2">
                              {/* Background Music Mini Player if applicable */}
                              {parsed.musicUrl && !isLocked && (
                                <a
                                  href={parsed.musicUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[9px] font-black text-amber-800 hover:bg-amber-100 transition"
                                >
                                  <Volume2 className="size-3 text-amber-600 animate-pulse" /> Nhạc nền
                                </a>
                              )}

                              {/* CRUD Control buttons */}
                              {(isOwn || profile.id === entry.author_id) && (
                                <div className="flex items-center gap-1 opacity-60 hover:opacity-100 transition duration-300">
                                  <button
                                    onClick={() => handleOpenEdit(entry)}
                                    className="p-1 rounded-lg hover:bg-[var(--color-soft)] text-[var(--color-primary)] transition"
                                    title="Chỉnh sửa nhật ký"
                                  >
                                    <Edit2 className="size-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(entry.id)}
                                    className="p-1 rounded-lg hover:bg-[var(--color-soft)] text-rose-600 transition"
                                    title="Xóa nhật ký"
                                  >
                                    <Trash2 className="size-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </footer>

                        </article>
                      </div>
                    );
                  })}

              </div>
            ) : (
              <div className="rounded-3xl border border-[var(--color-border)]/30 bg-[var(--color-card)]/50 p-8 sm:p-12 text-center py-16 sm:py-24 shadow-[var(--app-shadow)] flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-primary-soft)]/20 rounded-full blur-3xl pointer-events-none" />
                <BookOpen className="size-12 text-[var(--color-primary-soft)] mb-4 animate-bounce" />
                <h3 className="font-black text-base text-[var(--color-text)]">Cuốn hồi ký chưa viết trang nào</h3>
                <p className="mt-2 text-xs text-[var(--color-muted)] max-w-md mx-auto leading-relaxed font-semibold">
                  Hôm nay hai bạn có khoảnh khắc nào đáng nhớ không? Một bữa ăn ngon, một cái nắm tay hay một cái ôm vụng về... Hãy lưu lại những mảnh ký ức ngọt ngào vào trang nhật ký nhé... 📝
                </p>
              </div>
            )}

          </section>

        </div>
      )}

      {/* CREATE & EDIT GLASSMORPHIC DIALOG MODAL */}
      {isOpenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/30 animate-fade-in">

          <div className="w-full max-w-lg rounded-3xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 sm:p-6 shadow-2xl relative overflow-y-auto max-h-[90vh] animate-scale-up">
            <div className="absolute top-0 left-0 w-full h-1 bg-[var(--color-primary)]" />

            <button
              onClick={() => setIsOpenModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[var(--color-soft)] text-[var(--color-muted)] transition"
            >
              <X className="size-4" />
            </button>

            <h2 className="text-lg font-black mb-4">
              {editingEntry ? "✍️ Cập nhật trang nhật ký" : "💖 Viết trang nhật ký mới"}
            </h2>

            {formError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs font-bold text-red-700">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-[var(--color-faint)] mb-1">
                  Tiêu đề câu chuyện
                </label>
                <input
                  type="text"
                  placeholder="Hôm nay tụi mình đã..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={50}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-soft)]/50 p-2 text-xs font-semibold outline-none focus:border-[var(--color-primary)]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-[var(--color-faint)] mb-1">
                  Nội dung nhật ký
                </label>
                <textarea
                  placeholder="Hãy kể lại những điều ngọt ngào ở đây..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={5}
                  maxLength={2000}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-soft)]/50 p-2.5 text-xs font-semibold outline-none focus:border-[var(--color-primary)] resize-none"
                />
              </div>

              {/* Advanced settings row */}
              <div className="grid gap-3 sm:grid-cols-2">

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[var(--color-faint)] mb-1">
                    Cảm xúc chủ đạo
                  </label>
                  <select
                    value={mood}
                    onChange={(e) => setMood(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-soft)]/50 p-2 text-xs font-bold outline-none focus:border-[var(--color-primary)]"
                  >
                    {Object.keys(MOOD_DESIGNS).map((m) => (
                      <option key={m} value={m}>
                        {MOOD_DESIGNS[m].emoji} {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[var(--color-faint)] mb-1">
                    Bản nhạc nền (URL)
                  </label>
                  <input
                    type="url"
                    placeholder="Link Youtube hoặc Spotify..."
                    value={musicUrl}
                    onChange={(e) => setMusicUrl(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-soft)]/50 p-2 text-xs font-semibold outline-none focus:border-[var(--color-primary)]"
                  />
                </div>

              </div>

              <div className="grid gap-3 sm:grid-cols-2">

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[var(--color-faint)] mb-1">
                    Ảnh bìa trang nhật ký
                  </label>

                  <div className="flex flex-col gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-soft)]/30 p-2">
                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer inline-flex items-center justify-center rounded-xl bg-[var(--color-primary)] px-3 py-1.5 text-[10px] font-black text-white hover:bg-[var(--color-primary-hover)] transition active:scale-95">
                        {isCompressing ? "Đang nén..." : "Chọn ảnh từ máy"}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageFileChange}
                          className="hidden"
                          disabled={isCompressing}
                        />
                      </label>
                      <span className="text-[9px] font-bold text-[var(--color-muted)] truncate max-w-[180px]">
                        {coverImage ? (coverImage.startsWith("data:") ? "✓ Ảnh đã chọn từ thiết bị" : "✓ Ảnh từ liên kết") : "Chưa chọn ảnh nào"}
                      </span>
                    </div>

                    <input
                      type="url"
                      placeholder="Hoặc dán URL ảnh có sẵn..."
                      value={coverImage.startsWith("data:") ? "" : coverImage}
                      onChange={(e) => setCoverImage(e.target.value)}
                      className="w-full rounded-lg border border-[var(--color-border)]/50 bg-white/70 p-1.5 text-[10px] font-semibold outline-none focus:border-[var(--color-primary)]"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[var(--color-faint)] mb-1">
                    Chế độ hiển thị
                  </label>
                  <select
                    value={visibility}
                    onChange={(e: any) => setVisibility(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-soft)]/50 p-2 text-xs font-bold outline-none focus:border-[var(--color-primary)]"
                  >
                    <option value="couple">💌 Cùng chia sẻ (Xem ngay)</option>
                    <option value="time-capsule">🔒 Hộp thư thời gian (Khóa lịch)</option>
                  </select>
                </div>

                <div className="flex flex-col justify-end">
                  <div className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-soft)]/50 p-2 h-[2.35rem]">
                    <div className="flex items-center gap-1.5">
                      <Lock className="size-3.5 text-[var(--color-primary)]" />
                      <span className="text-[10px] font-black">Nhật ký riêng tư</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsPrivate(!isPrivate)}
                      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-300 ${isPrivate ? "bg-[var(--color-primary)]" : "bg-[var(--color-border)]"}`}
                    >
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${isPrivate ? "translate-x-4.5" : "translate-x-0.5"}`} />
                    </button>
                  </div>
                </div>

              </div>

              {/* Time Capsule reveal date conditional */}
              {visibility === "time-capsule" && (
                <div className="rounded-2xl border border-rose-100 bg-rose-50/30 p-3 sm:p-4 animate-slide-down">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-rose-800 mb-1">
                    Ngày mở hộp thư thời gian 📅
                  </label>
                  <input
                    type="date"
                    value={revealDate}
                    onChange={(e) => setRevealDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full rounded-xl border border-rose-200 bg-white p-2 text-xs font-bold outline-none focus:border-rose-500 text-rose-800"
                  />
                  <p className="mt-1.5 text-[9px] font-semibold text-rose-600">
                    Trang nhật ký này sẽ tạm thời bị mã hóa khóa kín và đếm ngược, chỉ hiển thị đầy đủ nội dung khi đúng ngày chọn!
                  </p>
                </div>
              )}

              <footer className="mt-5 border-t border-[var(--color-border)]/40 pt-4 flex items-center justify-end gap-2">
                <button
                  onClick={() => setIsOpenModal(false)}
                  type="button"
                  className="rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-2.5 text-xs font-black text-[var(--color-muted)] hover:bg-[var(--color-soft)] transition active:scale-95"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-full bg-[var(--color-primary)] px-5 py-2.5 text-xs font-black text-white hover:bg-[var(--color-primary-hover)] transition active:scale-95 disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {isPending && <Loader2 className="size-3.5 animate-spin" />}
                  {editingEntry ? "Cập nhật" : "Lưu trữ 💖"}
                </button>
              </footer>

            </form>

          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Xóa trang nhật ký"
        message="Bạn có chắc chắn muốn xóa vĩnh viễn trang nhật ký kỷ niệm ngọt ngào này không? Hành động này không thể hoàn tác!"
        confirmText="Xóa nhật ký"
        cancelText="Hủy"
        isDangerous={true}
      />
    </div>
  );
}
