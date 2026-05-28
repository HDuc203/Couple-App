"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Plus,
  Trash2,
  Check,
  Calendar,
  X,
  Loader2,
  AlertCircle,
  Clock,
  Compass,
  Heart,
  BookOpen,
  Images,
  Star,
  CheckCircle2
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/types/database";
import type { Profile } from "@/lib/profile";
import type { PartnerProfile } from "@/lib/couple";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

type FutureSpaceProps = {
  profile: Profile;
  currentCouple: any;
  partnerProfile: PartnerProfile | null;
  initialItems: Tables<"bucket_list">[];
  queryError?: string;
};

type ParsedDescription = {
  text: string;
  category: string;
  moodTag: "Planned" | "Someday";
};

// Safe JSON parser for extended dream details
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

const CATEGORY_ICONS: Record<string, string> = {
  "Du lịch": "✈️",
  "Ăn uống & Hẹn hò": "☕",
  "Tổ ấm chung": "🏠",
  "Thú cưng": "🐶",
  "Giải trí": "🎨",
  "Ước mơ": "✨"
};

const CATEGORIES_LIST = [
  "Du lịch",
  "Ăn uống & Hẹn hò",
  "Tổ ấm chung",
  "Thú cưng",
  "Giải trí",
  "Ước mơ"
];

export function FutureSpace({
  profile,
  currentCouple,
  partnerProfile,
  initialItems,
  queryError,
}: FutureSpaceProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const coupleId = currentCouple?.couple?.id ?? null;
  const partnerName = partnerProfile?.display_name ?? "Người ấy";

  // State
  const [items, setItems] = useState<Tables<"bucket_list">[]>(initialItems);
  const [isOpenModal, setIsOpenModal] = useState(false);

  // Creation Form states
  const [title, setTitle] = useState("");
  const [descText, setDescText] = useState("");
  const [category, setCategory] = useState("Ước mơ");
  const [moodTag, setMoodTag] = useState<"Planned" | "Someday">("Someday");
  const [formError, setFormError] = useState("");

  // Post-completion celebration popup state
  const [completedDream, setCompletedDream] = useState<Tables<"bucket_list"> | null>(null);

  // Automatic memory transition state
  const [transitionTarget, setTransitionTarget] = useState<"journal" | "album" | null>(null);
  const [transTitle, setTransTitle] = useState("");
  const [transContent, setTransContent] = useState("");

  // Custom Confirm Modal state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Sync state values on initial server props change
  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  // Real-time synchronization
  useEffect(() => {
    if (!coupleId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`bucket_list_sync:${coupleId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bucket_list",
          filter: `couple_id=eq.${coupleId}`,
        },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            const newItem = payload.new as Tables<"bucket_list">;
            setItems((prev) => [newItem, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as Tables<"bucket_list">;
            setItems((prev) =>
              prev.map((item) => (item.id === updated.id ? updated : item))
            );
          } else if (payload.eventType === "DELETE") {
            const deleted = payload.old as { id: string };
            setItems((prev) => prev.filter((item) => item.id !== deleted.id));
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

  // Open modal
  const handleOpenCreate = () => {
    setTitle("");
    setDescText("");
    setCategory("Ước mơ");
    setMoodTag("Someday");
    setFormError("");
    setIsOpenModal(true);
  };

  // Submit Dream Card
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coupleId || !title.trim()) {
      setFormError("Vui lòng nhập tên mục tiêu tương lai.");
      return;
    }

    const supabase = createClient();
    const packedDescription = JSON.stringify({
      text: descText.trim(),
      category,
      moodTag,
    });

    const { error } = await supabase.from("bucket_list").insert({
      couple_id: coupleId,
      created_by: profile.id,
      title: title.trim(),
      description: packedDescription,
      is_completed: false,
    });

    if (error) {
      setFormError(`Lỗi lưu ước mơ: ${error.message}`);
    } else {
      // Gửi thông báo đến partner
      if (partnerProfile) {
        await supabase.from("notifications").insert({
          couple_id: coupleId,
          user_id: partnerProfile.id,
          sender_id: profile.id,
          type: "bucket_list",
          title: `${profile.display_name} vừa viết thêm một ước mơ chung ✨`,
          content: `Kế hoạch mới: "${title.trim()}". Cùng nhau lên lịch thực hiện nhé! 🚀`,
          link: "/future",
        });
      }

      setIsOpenModal(false);
      startTransition(() => {
        router.refresh();
      });
    }
  };

  // Toggle is_completed state
  const handleToggleComplete = async (item: Tables<"bucket_list">) => {
    const nextStatus = !item.is_completed;
    const supabase = createClient();

    const { error } = await supabase
      .from("bucket_list")
      .update({
        is_completed: nextStatus,
        completed_at: nextStatus ? new Date().toISOString() : null,
      })
      .eq("id", item.id);

    if (error) {
      alert(`Lỗi lưu trạng thái: ${error.message}`);
    } else {
      // Gửi thông báo đến partner
      if (partnerProfile && nextStatus) {
        await supabase.from("notifications").insert({
          couple_id: coupleId,
          user_id: partnerProfile.id,
          sender_id: profile.id,
          type: "bucket_list",
          title: `Chúng ta đã hoàn thành một ước mơ! 🎉`,
          content: `Ước mơ "${item.title}" vừa được hoàn thành cùng nhau! Một kỷ niệm đẹp nữa đã được lưu lại! ✨`,
          link: "/future",
        });
      }

      // Trigger romantic celebration modal if dream completed
      if (nextStatus) {
        setCompletedDream(item);
      }
      startTransition(() => {
        router.refresh();
      });
    }
  };

  // Delete a dream
  const handleDelete = (id: string) => {
    setDeleteId(id);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    const supabase = createClient();
    const { error } = await supabase.from("bucket_list").delete().eq("id", deleteId);

    if (error) {
      alert(`Không thể xóa: ${error.message}`);
    } else {
      startTransition(() => {
        router.refresh();
      });
    }
    setDeleteId(null);
  };

  // Handle Post-completion Memory Transition (Create Journal or Album)
  const handleTransitionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coupleId || !transTitle.trim()) return;

    const supabase = createClient();

    if (transitionTarget === "journal") {
      const packedJournal = JSON.stringify({
        text: transContent.trim(),
        mood: "Kỷ niệm",
        coverImage: null,
        musicUrl: null,
        visibility: "couple",
        revealDate: null,
        authorName: profile.display_name,
      });

      const { error } = await supabase.from("diary_entries").insert({
        couple_id: coupleId,
        author_id: profile.id,
        title: transTitle.trim(),
        content: packedJournal,
      });

      if (error) {
        alert(`Không thể tạo nhật ký: ${error.message}`);
      } else {
        alert("🎉 Đã chuyển đổi vinh danh ước mơ này thành trang nhật ký chung ngọt ngào!");
        setTransitionTarget(null);
        setCompletedDream(null);
        router.push("/journal");
      }
    } else if (transitionTarget === "album") {
      const { error } = await supabase.from("photo_albums").insert({
        couple_id: coupleId,
        title: transTitle.trim(),
        created_by: profile.id,
      });

      if (error) {
        alert(`Không thể tạo album: ${error.message}`);
      } else {
        alert("🎉 Đã tạo album ảnh chung để sẵn sàng tải hình kỷ niệm!");
        setTransitionTarget(null);
        setCompletedDream(null);
        router.push("/album");
      }
    }
  };

  const handleOpenTransition = (target: "journal" | "album") => {
    if (!completedDream) return;
    setTransitionTarget(target);
    setTransTitle(completedDream.title);
    setTransContent(
      target === "journal"
        ? `Tụi mình đã cùng nhau hoàn thành ước mơ "${completedDream.title}" vào ngày hôm nay! Đây là hồi ức tuyệt vời đánh dấu chặng đường bên nhau...`
        : ""
    );
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">

      {/* 1. Header display */}
      <header className="rounded-3xl border border-[var(--color-border)]/50 bg-[var(--color-card)] p-5 shadow-[var(--app-shadow)] text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-300 via-[var(--color-primary)] to-pink-200 animate-pulse" />
        <Sparkles className="size-6 text-[var(--color-primary)] mx-auto mb-2 animate-bounce" />
        <h1 className="text-2xl font-black tracking-tight">Tương lai đôi mình</h1>
        <p className="mt-1 text-xs text-[var(--color-muted)] font-semibold max-w-lg mx-auto">
          Những ước mơ, mong ước và kế hoạch cho ngôi nhà chung, những chuyến đi hay bất kỳ điều ngọt ngào nào cả hai hứa sẽ làm cùng nhau.
        </p>

        {coupleId && (
          <button
            onClick={handleOpenCreate}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-5 py-2 text-xs font-black text-white hover:bg-[var(--color-primary-hover)] transition active:scale-95 shadow-md"
          >
            <Plus className="size-4" /> Thêm ước nguyện ✨
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
            Hãy liên kết tài khoản cùng người ấy để bắt đầu phác họa bức tranh tương lai đôi lứa.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">

          {/* LEFT SIDE: Dreams In Progress (Someday / Planned) */}
          <section className="space-y-4">
            <h2 className="text-sm font-black uppercase tracking-[0.16em] text-[var(--color-faint)] border-b border-[var(--color-border)]/40 pb-2">
              🧭 ĐANG ẤP Ủ ({items.filter((i) => !i.is_completed).length})
            </h2>

            {items.filter((i) => !i.is_completed).length > 0 ? (
              <div className="space-y-4">
                {items
                  .filter((i) => !i.is_completed)
                  .map((item) => {
                    const parsed = parseDreamDescription(item.description);
                    const categoryIcon = CATEGORY_ICONS[parsed.category] || "✨";

                    // Starry dream card overlay
                    return (
                      <article
                        key={item.id}
                        className="group rounded-2xl border border-[var(--color-border)]/40 bg-[var(--color-card)] p-4 shadow-[0_4px_24px_rgba(0,0,0,0.01)] transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-[var(--color-accent)]/30 relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-100/10 to-pink-100/5 blur-2xl pointer-events-none" />

                        <div className="flex items-start gap-3">
                          {/* Checkmark button */}
                          <button
                            onClick={() => handleToggleComplete(item)}
                            className="size-5 rounded-full border border-[var(--color-border)] flex items-center justify-center text-transparent hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition flex-shrink-0 mt-0.5"
                            title="Đánh dấu hoàn thành"
                          >
                            <Check className="size-3.5" />
                          </button>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-black text-[var(--color-text)]">
                                {categoryIcon} {item.title}
                              </span>
                              <span className={`inline-flex rounded-full border px-1.5 py-0.5 text-[8px] font-black ${parsed.moodTag === "Planned" ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/20" : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20"}`}>
                                {parsed.moodTag}
                              </span>
                            </div>

                            {parsed.text && (
                              <p className="mt-1 text-xs font-semibold text-[var(--color-muted)] leading-relaxed italic">
                                "{parsed.text}"
                              </p>
                            )}

                            <div className="mt-3.5 flex items-center justify-between border-t border-[var(--color-border)]/40 pt-2 text-[9px] text-[var(--color-faint)] font-bold">
                              <span>✍️ Khởi tạo bởi: {item.created_by === profile.id ? "Bạn" : partnerName}</span>
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="text-rose-600 hover:underline transition inline-flex items-center gap-0.5 opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 className="size-3" /> Xóa
                              </button>
                            </div>

                          </div>
                        </div>

                      </article>
                    );
                  })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-soft)]/30 p-6 sm:p-8 text-center py-10 shadow-sm relative overflow-hidden flex flex-col items-center justify-center">
                <Sparkles className="size-8 text-[var(--color-primary-soft)] mb-3 animate-pulse" />
                <p className="text-xs font-black text-[var(--color-text)]">Chưa có ước mơ ấp ủ</p>
                <p className="mt-2 text-[10px] text-[var(--color-muted)] max-w-xs mx-auto leading-relaxed font-semibold">
                  Hai bạn có giấc mơ chung nào muốn cùng nhau thực hiện không? Hãy cùng viết ra đây để biến từng ước mơ nhỏ bé thành hiện thực nhé... ✨
                </p>
              </div>
            )}
          </section>

          {/* RIGHT SIDE: Completed Dreams (Milestones) */}
          <section className="space-y-4">
            <h2 className="text-sm font-black uppercase tracking-[0.16em] text-[var(--color-faint)] border-b border-[var(--color-border)]/40 pb-2">
              🎉 ĐÃ ĐẠT ĐƯỢC ({items.filter((i) => i.is_completed).length})
            </h2>

            {items.filter((i) => i.is_completed).length > 0 ? (
              <div className="space-y-4">
                {items
                  .filter((i) => i.is_completed)
                  .map((item) => {
                    const parsed = parseDreamDescription(item.description);
                    const categoryIcon = CATEGORY_ICONS[parsed.category] || "✨";

                    return (
                      <article
                        key={item.id}
                        className="group rounded-2xl border border-[var(--color-border)]/30 bg-[var(--color-soft)]/50 p-4 relative overflow-hidden"
                      >
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => handleToggleComplete(item)}
                            className="size-5 rounded-full bg-[var(--color-success-soft)] border border-[var(--color-success)] flex items-center justify-center text-[var(--color-success)] flex-shrink-0 mt-0.5"
                            title="Đánh dấu chưa hoàn thành"
                          >
                            <CheckCircle2 className="size-3.5" />
                          </button>

                          <div className="min-w-0 flex-1">
                            <span className="text-sm font-bold text-[var(--color-text)] line-through decoration-emerald-500 decoration-2">
                              {categoryIcon} {item.title}
                            </span>

                            {parsed.text && (
                              <p className="mt-1 text-xs font-semibold text-[var(--color-faint)] leading-relaxed italic line-through">
                                "{parsed.text}"
                              </p>
                            )}

                            <div className="mt-3.5 flex items-center justify-between border-t border-[var(--color-border)]/20 pt-2 text-[9px] text-[var(--color-faint)] font-bold">
                              <span>🎉 Đạt được: {new Date(item.completed_at || "").toLocaleDateString("vi-VN")}</span>
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="text-rose-600 hover:underline transition inline-flex items-center gap-0.5 opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 className="size-3" /> Xóa
                              </button>
                            </div>

                          </div>
                        </div>
                      </article>
                    );
                  })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-soft)]/30 p-6 sm:p-8 text-center py-10 shadow-sm relative overflow-hidden flex flex-col items-center justify-center">
                <Heart className="size-8 text-[var(--color-primary-soft)] mb-3 animate-pulse" />
                <p className="text-xs font-black text-[var(--color-text)]">Chưa có dấu mốc nào</p>
                <p className="mt-2 text-[10px] text-[var(--color-muted)] max-w-xs mx-auto leading-relaxed font-semibold">
                  Mỗi thử thách hoàn thành là một dấu chân đẹp trên con đường hạnh phúc. Cùng bắt đầu hành trình chinh phục các mong ước chung nhé... 💕
                </p>
              </div>
            )}
          </section>

        </div>
      )}

      {/* CREATE GLASSMORPHIC MODAL DIALOG */}
      {isOpenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/30">
          <div className="w-full max-w-md rounded-3xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-2xl relative overflow-y-auto max-h-[90vh] animate-scale-up">
            <div className="absolute top-0 left-0 w-full h-1 bg-[var(--color-primary)]" />

            <button
              onClick={() => setIsOpenModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[var(--color-soft)] text-[var(--color-muted)] transition"
            >
              <X className="size-4" />
            </button>

            <h2 className="text-base font-black mb-4">✨ Thêm mục ước nguyện mới</h2>

            {formError && (
              <div className="mb-3 rounded-xl border border-red-200 bg-red-50 p-2.5 text-[10px] font-bold text-red-700">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-[var(--color-faint)] mb-1">
                  Hai đứa ước muốn sẽ...
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Đi Đà Lạt ngắm mưa, nuôi mèo mun chung..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={40}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-soft)]/50 p-2 text-xs font-semibold outline-none focus:border-[var(--color-primary)]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-[var(--color-faint)] mb-1">
                  Mô tả lãng mạn
                </label>
                <textarea
                  placeholder="Kể về mong ước này một cách chi tiết..."
                  value={descText}
                  onChange={(e) => setDescText(e.target.value)}
                  rows={3}
                  maxLength={500}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-soft)]/50 p-2 text-xs font-semibold outline-none focus:border-[var(--color-primary)] resize-none"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[var(--color-faint)] mb-1">
                    Phân mục
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-soft)]/50 p-2 text-xs font-bold outline-none focus:border-[var(--color-primary)]"
                  >
                    {CATEGORIES_LIST.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[var(--color-faint)] mb-1">
                    Trạng thái ước nguyện
                  </label>
                  <select
                    value={moodTag}
                    onChange={(e: any) => setMoodTag(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-soft)]/50 p-2 text-xs font-bold outline-none focus:border-[var(--color-primary)]"
                  >
                    <option value="Someday">✨ Một Ngày Nào Đó</option>
                    <option value="Planned">📅 Đã Có Kế Hoạch</option>
                  </select>
                </div>
              </div>

              <footer className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--color-border)]/40">
                <button
                  onClick={() => setIsOpenModal(false)}
                  type="button"
                  className="rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-2.5 text-xs font-black text-[var(--color-muted)] hover:bg-[var(--color-soft)] transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-[var(--color-primary)] px-5 py-2.5 text-xs font-black text-white hover:bg-[var(--color-primary-hover)] transition"
                >
                  Ước nguyện 💖
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* POST-COMPLETION CELEBRATION DUAL TRANSITION POPUP */}
      {completedDream && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/45">
          <div className="w-full max-w-lg rounded-3xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 sm:p-6 shadow-2xl text-center relative overflow-y-auto max-h-[90vh] animate-scale-up">

            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-300 via-pink-400 to-indigo-300 animate-pulse" />

            <button
              onClick={() => setCompletedDream(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[var(--color-soft)] text-[var(--color-muted)] transition"
            >
              <X className="size-4" />
            </button>

            {/* Standard celebration form */}
            {!transitionTarget ? (
              <div className="space-y-4 py-3">
                <div className="relative inline-flex items-center justify-center">
                  <div className="absolute inset-0 bg-pink-300/20 blur-xl rounded-full scale-150 animate-ping" />
                  <Heart className="size-12 text-pink-500 animate-bounce" fill="currentColor" />
                </div>

                <h2 className="text-lg font-black text-[var(--color-text)]">
                  Ước mơ đã thành hiện thực! 🎉
                </h2>

                <p className="text-xs font-semibold text-[var(--color-muted)] leading-relaxed max-w-md mx-auto">
                  Chúc mừng hai bạn đã hoàn thành dự định tương lai: <strong className="text-[var(--color-primary)]">"{completedDream.title}"</strong>.
                  Khoảnh khắc tuyệt vời này rất xứng đáng được lưu giữ để mãi mãi không bao giờ phai nhạt!
                </p>

                <p className="text-[10px] font-black text-[var(--color-faint)] uppercase">BẠN MUỐN LƯU GIỮ KỶ NIỆM NÀY QUA?</p>

                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => handleOpenTransition("journal")}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-primary)] px-4 py-2 text-xs font-black text-white hover:bg-[var(--color-primary-hover)] transition"
                  >
                    <BookOpen className="size-3.5" /> Tạo Nhật ký
                  </button>
                  <button
                    onClick={() => handleOpenTransition("album")}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-xs font-black text-[var(--color-text)] hover:bg-[var(--color-soft)] transition"
                  >
                    <Images className="size-3.5" /> Tạo Album ảnh
                  </button>
                </div>
              </div>
            ) : (
              // Pre-filled memory form dialog
              <div className="text-left animate-slide-down">
                <h3 className="text-sm font-black mb-3">
                  {transitionTarget === "journal" ? "✍️ Ghi lại Nhật ký Kỷ niệm" : "📸 Tạo Album Kỷ niệm"}
                </h3>

                <form onSubmit={handleTransitionSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-wider text-[var(--color-faint)] mb-1">
                      Tiêu đề kỷ niệm
                    </label>
                    <input
                      type="text"
                      value={transTitle}
                      onChange={(e) => setTransTitle(e.target.value)}
                      maxLength={50}
                      className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-soft)]/50 p-2 text-xs font-bold outline-none focus:border-[var(--color-primary)]"
                    />
                  </div>

                  {transitionTarget === "journal" && (
                    <div>
                      <label className="block text-[9px] font-black uppercase tracking-wider text-[var(--color-faint)] mb-1">
                        Câu chuyện kỷ niệm
                      </label>
                      <textarea
                        value={transContent}
                        onChange={(e) => setTransContent(e.target.value)}
                        rows={4}
                        maxLength={1000}
                        className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-soft)]/50 p-2 text-xs font-semibold outline-none focus:border-[var(--color-primary)] resize-none"
                      />
                    </div>
                  )}

                  <footer className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--color-border)]/40">
                    <button
                      onClick={() => setTransitionTarget(null)}
                      type="button"
                      className="rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-4.5 py-2 text-xs font-black text-[var(--color-muted)] hover:bg-[var(--color-soft)] transition"
                    >
                      Quay lại
                    </button>
                    <button
                      type="submit"
                      className="rounded-full bg-[var(--color-primary)] px-5 py-2 text-xs font-black text-white hover:bg-[var(--color-primary-hover)] transition"
                    >
                      Hoàn tất vinh danh 💖
                    </button>
                  </footer>
                </form>
              </div>
            )}

          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Xóa mục tiêu tương lai"
        message="Bạn có chắc chắn muốn xóa mục tiêu tương lai này khỏi danh sách chung của hai người không?"
        confirmText="Xóa mục tiêu"
        cancelText="Hủy"
        isDangerous={true}
      />
    </div>
  );
}
