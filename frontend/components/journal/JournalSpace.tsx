"use client";

import { useState, useEffect, useTransition, useMemo, useCallback } from "react";
import { uploadToCloudinary, uploadAudioToCloudinary } from "@/lib/cloudinary";
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
  HeartHandshake,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Search,
  Filter,
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  MapPin
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/types/database";
import type { Profile } from "@/lib/profile";
import type { PartnerProfile } from "@/lib/couple";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { CustomSelect } from "@/components/ui/CustomSelect";

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
  images?: string[];
  musicUrl: string | null;
  musicTitle?: string | null;
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
        images: parsed.images || (parsed.coverImage ? [parsed.coverImage] : []),
        musicUrl: parsed.musicUrl || null,
        musicTitle: parsed.musicTitle || null,
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
    images: [],
    musicUrl: null,
    musicTitle: null,
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
  "Vui vẻ": { emoji: "🥰", pill: "bg-amber-100/80 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50", glow: "rgba(245,158,11,0.15)" },
  "Lãng mạn": { emoji: "💝", pill: "bg-pink-100/80 text-pink-800 border-pink-200 dark:bg-pink-950/40 dark:text-pink-300 dark:border-pink-900/50", glow: "rgba(236,72,153,0.18)" },
  "Giận dỗi": { emoji: "🥺", pill: "bg-indigo-100/80 text-indigo-800 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900/50", glow: "rgba(99,102,241,0.15)" },
  "Đi chơi xa": { emoji: "🚗", pill: "bg-emerald-100/80 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50", glow: "rgba(16,185,129,0.15)" },
  "Ăn uống": { emoji: "🍕", pill: "bg-rose-100/80 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50", glow: "rgba(244,63,94,0.15)" },
  "Ấm áp": { emoji: "🧸", pill: "bg-orange-100/80 text-orange-800 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-900/50", glow: "rgba(249,115,22,0.12)" },
  "Nhớ nhung": { emoji: "💖", pill: "bg-pink-100/80 text-pink-800 border-pink-200 dark:bg-pink-950/40 dark:text-pink-300 dark:border-pink-900/50", glow: "rgba(236,72,153,0.15)" },
  "Kỷ niệm": { emoji: "✨", pill: "bg-purple-100/80 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900/50", glow: "rgba(168,85,247,0.12)" },
  // Backward compatibility
  "Vui": { emoji: "😊", pill: "bg-amber-100/80 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50", glow: "rgba(245,158,11,0.12)" },
  "Buồn": { emoji: "😔", pill: "bg-indigo-100/80 text-indigo-800 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900/50", glow: "rgba(99,102,241,0.12)" }
};

function getBoundedAspectRatio(rawAspect: number | undefined): number {
  if (!rawAspect) return 4 / 3; // default fallback
  // Cap aspect ratio between 9/16 (0.5625) and 16/9 (1.777)
  if (rawAspect < 9 / 16) return 9 / 16;
  if (rawAspect > 16 / 9) return 16 / 9;
  return rawAspect;
}

export function JournalSpace({
  profile,
  currentCouple,
  partnerProfile,
  initialEntries,
  queryError,
}: JournalSpaceProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const supabase = useMemo(() => createClient(), []);

  const coupleId = currentCouple?.couple?.id ?? null;
  const partnerName = partnerProfile?.display_name ?? "Người ấy";

  // Core Diary State
  const [entries, setEntries] = useState<Tables<"diary_entries">[]>(initialEntries);
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Tables<"diary_entries"> | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [mood, setMood] = useState("Lãng mạn");
  const [musicUrl, setMusicUrl] = useState("");
  const [musicTitle, setMusicTitle] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [coverImage, setCoverImage] = useState(""); // Kept for compatibility
  const [visibility, setVisibility] = useState<"couple" | "time-capsule">("couple");
  const [revealDate, setRevealDate] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [formError, setFormError] = useState("");
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Music Selector state
  const [songsList, setSongsList] = useState<any[]>([]);
  const [searchSongQuery, setSearchSongQuery] = useState("");
  const [isUploadingSong, setIsUploadingSong] = useState(false);
  const [selectedSongFile, setSelectedSongFile] = useState<File | null>(null);
  const [songUploadTitle, setSongUploadTitle] = useState("");
  const [showMusicSelector, setShowMusicSelector] = useState(false);
  const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(null);
  const [previewPlayingUrl, setPreviewPlayingUrl] = useState<string | null>(null);

  // Timeline Audio Player state
  const [playingEntryId, setPlayingEntryId] = useState<string | null>(null);
  const [activeAudio, setActiveAudio] = useState<HTMLAudioElement | null>(null);

  // Fullscreen Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Card highlight scroll state
  const [highlightedEntryId, setHighlightedEntryId] = useState<string | null>(null);

  // Detailed Entry popup modal state
  const [selectedDetailEntry, setSelectedDetailEntry] = useState<Tables<"diary_entries"> | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedMoodFilter, setSelectedMoodFilter] = useState("all");
  const [showMoodDropdown, setShowMoodDropdown] = useState(false);

  // Custom Confirm Modal state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Dynamic aspect ratio cache for single-image rendering
  const [imageAspects, setImageAspects] = useState<Record<string, number>>({});

  // Image multiple compression logic
  const handleImageFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsCompressing(true);
    try {
      const base64Promises = files.map(file => compressAndEncodeFile(file));
      const base64s = await Promise.all(base64Promises);
      setImages((prev) => [...prev, ...base64s]);
    } catch (error) {
      console.error(error);
      setFormError("Không thể nén một số ảnh. Vui lòng chọn ảnh khác.");
    } finally {
      setIsCompressing(false);
    }
  };

  // Fetch couple custom songs
  const fetchSongs = useCallback(async () => {
    if (!coupleId) return;
    const { data, error } = await supabase
      .from("slideshow_songs")
      .select("*")
      .eq("couple_id", coupleId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setSongsList(data);
    }
  }, [coupleId, supabase]);

  useEffect(() => {
    if (isOpenModal) {
      fetchSongs();
    }
  }, [isOpenModal, fetchSongs]);

  // Sync state with server changes
  useEffect(() => {
    setEntries((current) => {
      const combined = [...current, ...initialEntries];
      const unique = Array.from(new Map(combined.map((item) => [item.id, item])).values());
      return unique.sort((a, b) => {
        const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bTime - aTime;
      });
    });
  }, [initialEntries]);

  // Real-time synchronization
  useEffect(() => {
    if (!coupleId) return;

    const channel = supabase
      .channel(`diary_entries_sync:${coupleId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "diary_entries",
        },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            const newEntry = payload.new as Tables<"diary_entries">;
            setEntries((prev) => {
              if (prev.some((item) => item.id === newEntry.id)) return prev;
              return [newEntry, ...prev];
            });
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
  }, [coupleId, supabase, router]);

  // Open creation modal
  const handleOpenCreate = () => {
    setEditingEntry(null);
    setTitle("");
    setText("");
    setMood("Lãng mạn");
    setMusicUrl("");
    setMusicTitle("");
    setImages([]);
    setCoverImage("");
    setVisibility("couple");
    setRevealDate("");
    setIsPrivate(false);
    setFormError("");
    setShowMusicSelector(false);
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
    setMusicTitle(parsed.musicTitle || "");
    setImages(parsed.images || (parsed.coverImage ? [parsed.coverImage] : []));
    setCoverImage(parsed.coverImage || "");
    setVisibility(parsed.visibility);
    setRevealDate(parsed.revealDate || "");
    setIsPrivate(entry.is_private || false);
    setFormError("");
    setShowMusicSelector(false);
    setIsOpenModal(true);
  };

  // Song preview toggle
  const togglePreviewSong = (url: string) => {
    if (previewPlayingUrl === url) {
      previewAudio?.pause();
      setPreviewPlayingUrl(null);
    } else {
      previewAudio?.pause();
      const audio = new Audio(url);
      audio.volume = 0.5;
      audio.play().catch(e => console.log(e));
      setPreviewAudio(audio);
      setPreviewPlayingUrl(url);
      audio.onended = () => setPreviewPlayingUrl(null);
    }
  };

  // Stop music preview when writing modal closes
  useEffect(() => {
    if (!isOpenModal && previewAudio) {
      previewAudio.pause();
      setPreviewPlayingUrl(null);
    }
  }, [isOpenModal, previewAudio]);

  // Timeline Audio toggle
  const toggleEntryAudio = (entryId: string, url: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    if (playingEntryId === entryId) {
      activeAudio?.pause();
      setPlayingEntryId(null);
      setActiveAudio(null);
    } else {
      activeAudio?.pause();
      const audio = new Audio(url);
      audio.volume = 0.35;
      audio.loop = true;
      audio.play().catch(err => console.log("Audio play error:", err));
      setPlayingEntryId(entryId);
      setActiveAudio(audio);
    }
  };

  // Stop audio on unmount
  useEffect(() => {
    return () => {
      if (activeAudio) activeAudio.pause();
    };
  }, [activeAudio]);

  const handleCloseDetail = useCallback(() => {
    setSelectedDetailEntry(null);
    if (activeAudio) {
      activeAudio.pause();
      setPlayingEntryId(null);
      setActiveAudio(null);
    }
  }, [activeAudio]);

  // Body scroll lock + cover notification bell when overlays are active
  useEffect(() => {
    const isOverlayActive = lightboxOpen || selectedDetailEntry !== null;
    if (isOverlayActive) {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      document.body.classList.add('slideshow-active');
    } else {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      document.body.classList.remove('slideshow-active');
    }
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      document.body.classList.remove('slideshow-active');
    };
  }, [lightboxOpen, selectedDetailEntry]);

  // Handle Escape key to close overlays
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (lightboxOpen) {
          setLightboxOpen(false);
        } else if (selectedDetailEntry !== null) {
          handleCloseDetail();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, selectedDetailEntry, handleCloseDetail]);


  // Detailed Entry popup helper functions
  const handleOpenDetail = (entry: Tables<"diary_entries">, parsed: ParsedJournalContent, isLocked: boolean) => {
    setSelectedDetailEntry(entry);
    if (parsed.musicUrl && !isLocked) {
      if (playingEntryId !== entry.id) {
        activeAudio?.pause();
        const audio = new Audio(parsed.musicUrl);
        audio.volume = 0.35;
        audio.loop = true;
        audio.play().catch(err => console.log("Audio play error:", err));
        setPlayingEntryId(entry.id);
        setActiveAudio(audio);
      }
    }
  };

  // Fullscreen Lightbox helper functions
  const openLightbox = (imgs: string[], index: number) => {
    setLightboxImages(imgs);
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const handlePrevLightbox = () => {
    setLightboxIndex((prev) => (prev === 0 ? lightboxImages.length - 1 : prev - 1));
  };

  const handleNextLightbox = () => {
    setLightboxIndex((prev) => (prev === lightboxImages.length - 1 ? 0 : prev + 1));
  };

  // Scrolling navigation helper
  const scrollToEntry = (entryId: string) => {
    const element = document.getElementById(`entry-${entryId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedEntryId(entryId);
      setTimeout(() => {
        setHighlightedEntryId(null);
      }, 3000);
    }
  };

  // Save new song to Cloudinary & DB
  const handleSongUploadSubmit = async () => {
    if (!selectedSongFile || !songUploadTitle.trim() || !coupleId || !profile?.id) return;

    setIsUploadingSong(true);
    try {
      const uploadedUrl = await uploadAudioToCloudinary(selectedSongFile, "slideshow_songs");
      const { data, error } = await supabase
        .from("slideshow_songs")
        .insert({
          couple_id: coupleId,
          title: songUploadTitle.trim(),
          url: uploadedUrl,
          created_by: profile.id,
        })
        .select()
        .single();

      if (error) {
        alert(`Lỗi khi lưu bài hát: ${error.message}`);
      } else {
        setSelectedSongFile(null);
        setSongUploadTitle("");
        fetchSongs();
        if (data) {
          setMusicUrl(data.url);
          setMusicTitle(data.title);
        }
      }
    } catch (err: any) {
      alert(`Lỗi tải nhạc: ${err.message}`);
    } finally {
      setIsUploadingSong(false);
    }
  };

  const handleDeleteSong = async (songId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!confirm("Bạn có chắc chắn muốn xóa bài hát này khỏi danh sách?")) return;

    const { error } = await supabase
      .from("slideshow_songs")
      .delete()
      .eq("id", songId);

    if (error) {
      alert(`Lỗi khi xóa bài hát: ${error.message}`);
    } else {
      fetchSongs();
      const songToDelete = songsList.find((s) => s.id === songId);
      if (songToDelete && musicUrl === songToDelete.url) {
        setMusicUrl("");
        setMusicTitle("");
      }
    }
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

    setFormError("");
    setIsSubmitting(true);

    try {
      const uploadedUrls: string[] = [];
      for (const img of images) {
        if (img.startsWith("data:")) {
          const uploadedUrl = await uploadToCloudinary(img, "journals");
          uploadedUrls.push(uploadedUrl);
        } else {
          uploadedUrls.push(img);
        }
      }

      const firstImage = uploadedUrls[0] || null;

      const contentPayload = JSON.stringify({
        text: text.trim(),
        mood,
        coverImage: firstImage, // backward compatibility
        images: uploadedUrls,
        musicUrl: musicUrl.trim() || null,
        musicTitle: musicTitle.trim() || null,
        visibility,
        revealDate: visibility === "time-capsule" ? revealDate : null,
        authorName: editingEntry
          ? parseJournalContent(editingEntry.content, profile.display_name).authorName
          : profile.display_name,
      });

      if (editingEntry) {
        if (editingEntry.author_id !== profile.id) {
          setFormError("Bạn không có quyền chỉnh sửa nhật ký này.");
          setIsSubmitting(false);
          return;
        }
        const { error } = await supabase
          .from("diary_entries")
          .update({
            title: title.trim(),
            content: contentPayload,
            is_private: isPrivate,
          })
          .eq("id", editingEntry.id)
          .eq("author_id", profile.id);

        if (error) {
          setFormError(`Lỗi cập nhật: ${error.message}`);
          setIsSubmitting(false);
          return;
        }
      } else {
        const { error } = await supabase.from("diary_entries").insert({
          couple_id: coupleId,
          author_id: profile.id,
          title: title.trim(),
          content: contentPayload,
          is_private: isPrivate,
        });

        if (error) {
          setFormError(`Lỗi lưu: ${error.message}`);
          setIsSubmitting(false);
          return;
        }

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
    } catch (uploadError: any) {
      setFormError(`Lỗi tải ảnh lên Cloudinary: ${uploadError.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete an entry
  const handleDelete = (id: string) => {
    setDeleteId(id);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    const targetEntry = entries.find((e) => e.id === deleteId);
    if (!targetEntry || targetEntry.author_id !== profile.id) {
      alert("Bạn không có quyền xóa nhật ký này.");
      setDeleteId(null);
      return;
    }
    const { error } = await supabase.from("diary_entries").delete().eq("id", deleteId).eq("author_id", profile.id);

    if (error) {
      alert(`Không thể xóa nhật ký: ${error.message}`);
    } else {
      startTransition(() => {
        router.refresh();
      });
    }
    setDeleteId(null);
  };

  const isCapsuleLocked = (revealDateStr: string | null): boolean => {
    if (!revealDateStr) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const reveal = new Date(revealDateStr);
    reveal.setHours(0, 0, 0, 0);
    return reveal.getTime() > today.getTime();
  };

  const formatDate = (isoString: string | null) => {
    if (!isoString) return "";
    return new Date(isoString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Available Years selector memo
  const availableYears = useMemo(() => {
    const yearsSet = new Set<string>();
    entries.forEach((entry) => {
      if (entry.created_at) {
        yearsSet.add(new Date(entry.created_at).getFullYear().toString());
      }
    });
    return Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
  }, [entries]);

  const yearOptions = useMemo(() => {
    return [
      { value: "all", label: "Tất cả năm", emoji: "📅" },
      ...availableYears.map(year => ({ value: year, label: `Năm ${year}`, emoji: "📆" }))
    ];
  }, [availableYears]);

  const monthOptions = useMemo(() => {
    return [
      { value: "all", label: "Tất cả tháng", emoji: "🌙" },
      ...Array.from({ length: 12 }, (_, i) => {
        const m = (i + 1).toString();
        return { value: m, label: `Tháng ${m}`, emoji: "🌸" };
      })
    ];
  }, []);

  // Filtered entries memo
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const isAuthor = entry.author_id === profile.id;
      if (!isAuthor && entry.is_private) return false;

      const parsed = parseJournalContent(entry.content, isAuthor ? profile.display_name : partnerName);

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesTitle = entry.title?.toLowerCase().includes(query);
        const matchesText = parsed.text.toLowerCase().includes(query);
        if (!matchesTitle && !matchesText) return false;
      }

      if (selectedYear !== "all" && entry.created_at) {
        const entryYear = new Date(entry.created_at).getFullYear().toString();
        if (entryYear !== selectedYear) return false;
      }

      if (selectedMonth !== "all" && entry.created_at) {
        const entryMonth = (new Date(entry.created_at).getMonth() + 1).toString();
        if (entryMonth !== selectedMonth) return false;
      }

      if (selectedMoodFilter !== "all") {
        if (parsed.mood !== selectedMoodFilter) return false;
      }

      return true;
    });
  }, [entries, searchQuery, selectedYear, selectedMonth, selectedMoodFilter, profile.id, partnerName]);

  // "On This Day" Nostalgia filter
  const today = new Date();
  const onThisDayEntries = useMemo(() => {
    return entries.filter((entry) => {
      if (!entry.created_at) return false;
      const date = new Date(entry.created_at);
      return (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() < today.getFullYear()
      );
    });
  }, [entries, today]);

  // Scroll reveal animation observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.05,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    const elements = document.querySelectorAll(".scroll-reveal");
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
      observer.disconnect();
    };
  }, [filteredEntries]);

  const renderImageGrid = (imgs: string[], entryId: string, clickable: boolean = true) => {
    if (imgs.length === 1) {
      const imgUrl = resolveDirectImageUrl(imgs[0]);
      const aspect = imageAspects[imgUrl] || 4 / 3;
      const boundedAspect = getBoundedAspectRatio(aspect);

      return (
        <div
          onClick={clickable ? (e) => {
            e.stopPropagation();
            openLightbox(imgs, 0);
          } : undefined}
          className={`overflow-hidden w-full ${clickable ? "cursor-zoom-in" : "cursor-pointer"}`}
          style={{
            aspectRatio: boundedAspect,
            maxHeight: clickable ? "60vh" : "380px",
          }}
        >
          <img
            src={imgUrl}
            alt="Cover"
            onLoad={(e) => {
              const { naturalWidth, naturalHeight } = e.currentTarget;
              if (naturalWidth && naturalHeight) {
                const ratio = naturalWidth / naturalHeight;
                if (imageAspects[imgUrl] !== ratio) {
                  setImageAspects((prev) => ({ ...prev, [imgUrl]: ratio }));
                }
              }
            }}
            className="h-full w-full object-cover transform transition duration-500 hover:scale-103"
          />
        </div>
      );
    }

    if (imgs.length === 2) {
      return (
        <div className={`grid grid-cols-2 gap-1.5 aspect-[16/9] ${clickable ? "cursor-zoom-in" : "cursor-pointer"}`}>
          {imgs.map((img, idx) => (
            <div
              key={idx}
              onClick={clickable ? (e) => {
                e.stopPropagation();
                openLightbox(imgs, idx);
              } : undefined}
              className="overflow-hidden h-full"
            >
              <img
                src={resolveDirectImageUrl(img)}
                alt={`Grid ${idx}`}
                className="h-full w-full object-cover transform transition duration-500 hover:scale-105"
              />
            </div>
          ))}
        </div>
      );
    }

    if (imgs.length === 3) {
      return (
        <div className={`grid grid-cols-3 gap-1.5 aspect-[16/10] ${clickable ? "cursor-zoom-in" : "cursor-pointer"}`}>
          <div
            onClick={clickable ? (e) => {
              e.stopPropagation();
              openLightbox(imgs, 0);
            } : undefined}
            className="col-span-2 overflow-hidden h-full"
          >
            <img
              src={resolveDirectImageUrl(imgs[0])}
              alt="Grid 0"
              className="h-full w-full object-cover transform transition duration-500 hover:scale-103"
            />
          </div>
          <div className="grid grid-rows-2 gap-1.5 h-full">
            {imgs.slice(1, 3).map((img, idx) => (
              <div
                key={idx}
                onClick={clickable ? (e) => {
                  e.stopPropagation();
                  openLightbox(imgs, idx + 1);
                } : undefined}
                className="overflow-hidden h-full"
              >
                <img
                  src={resolveDirectImageUrl(img)}
                  alt={`Grid ${idx + 1}`}
                  className="h-full w-full object-cover transform transition duration-500 hover:scale-105"
                />
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className={`grid grid-cols-2 gap-1.5 aspect-[16/11] ${clickable ? "cursor-zoom-in" : "cursor-pointer"}`}>
        {imgs.slice(0, 3).map((img, idx) => (
          <div
            key={idx}
            onClick={clickable ? (e) => {
              e.stopPropagation();
              openLightbox(imgs, idx);
            } : undefined}
            className="overflow-hidden h-full"
          >
            <img
              src={resolveDirectImageUrl(img)}
              alt={`Grid ${idx}`}
              className="h-full w-full object-cover transform transition duration-500 hover:scale-105"
            />
          </div>
        ))}
        <div
          onClick={clickable ? (e) => {
            e.stopPropagation();
            openLightbox(imgs, 3);
          } : undefined}
          className="relative overflow-hidden h-full"
        >
          <img
            src={resolveDirectImageUrl(imgs[3])}
            alt="Grid 3"
            className="h-full w-full object-cover transform transition duration-500 hover:scale-105"
          />
          {imgs.length > 4 && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="text-white font-black text-sm">+{imgs.length - 4}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderDiaryCard = (
    entry: Tables<"diary_entries">,
    parsed: ParsedJournalContent,
    isLocked: boolean,
    moodStyle: any,
    isOwn: boolean
  ) => {
    const isHighlighted = highlightedEntryId === entry.id;
    return (
      <article
        id={`entry-${entry.id}`}
        onClick={() => handleOpenDetail(entry, parsed, isLocked)}
        className={`rounded-3xl border bg-[var(--color-card)] p-4 sm:p-5 shadow-[0_4px_24px_rgba(0,0,0,0.01)] transition-all duration-300 relative overflow-hidden group cursor-pointer ${isHighlighted
          ? "border-amber-400 ring-4 ring-amber-100/50 scale-103 shadow-md"
          : "border-[var(--color-border)]/40 hover:-translate-y-1 hover:shadow-md hover:border-[var(--color-primary)]/20"
          }`}
        style={{ boxShadow: isHighlighted ? undefined : `0 0 20px ${moodStyle.glow}` }}
      >
        {playingEntryId === entry.id && (
          <div className="absolute right-6 top-10 pointer-events-none select-none flex flex-col gap-2">
            <span className="text-sm text-amber-500 animate-[floatNote_3s_infinite_ease-in-out]">🎵</span>
            <span className="text-sm text-amber-500 animate-[floatNote_4s_infinite_ease-in-out_1s] ml-3">🎶</span>
          </div>
        )}

        <div className={`flex flex-col ${parsed.images && parsed.images.length > 0 && !isLocked ? "md:flex-row gap-5 items-stretch" : ""}`}>
          {parsed.images && parsed.images.length > 0 && !isLocked && (
            <div className="w-full md:w-52 lg:w-60 xl:w-64 flex-shrink-0 rounded-2xl overflow-hidden border border-[var(--color-border)]/30 bg-[var(--color-soft)]/20 self-start">
              {renderImageGrid(parsed.images, entry.id, false)}
            </div>
          )}

          <div className="flex-1 flex flex-col justify-between min-w-0 space-y-3">
            <div>
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
                  <span className={`inline-flex rounded-full border px-2 py-0.5 text-[9px] font-black transition-transform duration-200 group-hover:scale-105 ${moodStyle.pill}`}>
                    {moodStyle.emoji} {parsed.mood}
                  </span>
                  {parsed.visibility === "time-capsule" && (
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[9px] font-black ${isLocked ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-300" : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-300"}`}>
                      {isLocked ? <Lock className="size-2.5 mr-0.5" /> : <Unlock className="size-2.5 mr-0.5" />}
                      Capsule
                    </span>
                  )}
                </div>
              </header>

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
                <p className="text-xs sm:text-sm font-semibold text-[var(--color-text)] leading-relaxed whitespace-pre-line italic">
                  "{parsed.text}"
                </p>
              )}
            </div>

            <footer className="mt-4 border-t border-[var(--color-border)]/40 pt-3 flex flex-wrap items-center justify-between gap-3">
              <span className="text-[10px] font-bold text-[var(--color-faint)] italic">
                ✍️ Biên soạn bởi: {parsed.authorName}
              </span>
            </footer>
          </div>
        </div>
      </article>
    );
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(24px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .scroll-reveal {
          opacity: 0;
          transform: translateY(28px);
          transition: opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1), transform 0.9s cubic-bezier(0.16, 1, 0.3, 1);
          will-change: opacity, transform;
        }
        .scroll-reveal.revealed {
          opacity: 1;
          transform: translateY(0);
        }
        @keyframes soundWave {
          0% { height: 4px; }
          100% { height: 12px; }
        }
        @keyframes floatNote {
          0% { transform: translateY(0) scale(0.6) rotate(0deg); opacity: 0; }
          20% { opacity: 0.8; }
          80% { opacity: 0.3; }
          100% { transform: translateY(-50px) scale(1.1) rotate(25deg); opacity: 0; }
        }
        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.18); }
        }

        /* Hide scrollbars for any scrollbar-none container */
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        /* Hide notification center bell when slideshow is active */
        body.slideshow-active button[title="Trung tâm thông báo"],
        body.slideshow-active .fixed.top-5.right-5 {
          display: none !important;
        }
      `}</style>

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
        <div className="space-y-6">

          {/* Top Widgets Grid: Symmetrical side-by-side cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Box 1: Ngày này năm xưa */}
            {onThisDayEntries.length > 0 ? (
              <div className="rounded-3xl border border-[var(--color-border)]/50 bg-[var(--color-card)] p-5 shadow-[var(--app-shadow)] relative overflow-hidden md:h-[240px] flex flex-col justify-between group">
                <div className="flex items-center gap-2 mb-2 border-b border-[var(--color-border)]/30 pb-2">
                  <Sparkles className="size-5 text-[var(--color-accent)] animate-spin" />
                  <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-[var(--color-primary)]">Ngày này năm xưa</h3>
                </div>

                <div className="flex-1 overflow-y-auto pr-0.5 scrollbar-none flex items-center">
                  {onThisDayEntries.slice(0, 1).map((entry) => {
                    const isOwn = entry.author_id === profile.id;
                    const parsed = parseJournalContent(entry.content, isOwn ? profile.display_name : partnerName);
                    const isLocked = parsed.visibility === "time-capsule" && isCapsuleLocked(parsed.revealDate) && !isOwn;
                    const moodConf = MOOD_DESIGNS[parsed.mood] || { emoji: "✨" };
                    const yearsAgo = today.getFullYear() - new Date(entry.created_at || "").getFullYear();

                    return (
                      <div
                        key={entry.id}
                        onClick={() => scrollToEntry(entry.id)}
                        className="w-full rounded-2xl bg-[var(--color-soft)]/50 p-3 border border-[var(--color-border)]/40 relative cursor-pointer hover:border-[var(--color-primary)]/50 transition duration-200 group flex items-center gap-3.5 h-[120px] shadow-sm hover:shadow"
                      >
                        <div className="absolute top-2.5 right-2.5 text-base">{moodConf.emoji}</div>

                        {parsed.images && parsed.images.length > 0 && !isLocked ? (
                          <div className="size-16 sm:size-20 rounded-xl overflow-hidden border border-[var(--color-border)]/20 flex-shrink-0">
                            <img
                              src={resolveDirectImageUrl(parsed.images[0])}
                              alt="Thumbnail"
                              className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                            />
                          </div>
                        ) : null}

                        <div className="min-w-0 flex-1 flex flex-col justify-between h-full py-0.5">
                          <div>
                            <p className="text-[10px] sm:text-xs font-black text-[var(--color-accent)]">
                              ⭐ {yearsAgo} năm trước ({formatDate(entry.created_at)})
                            </p>
                            <h4 className="font-black text-xs sm:text-sm mt-0.5 truncate group-hover:text-[var(--color-primary)] transition">{entry.title}</h4>
                          </div>
                          {isLocked ? (
                            <p className="text-[10px] font-semibold text-rose-500 leading-relaxed italic">
                              🔒 Hộp thư thời gian đang khóa
                            </p>
                          ) : (
                            <p className="text-[10px] sm:text-xs font-semibold text-[var(--color-muted)] line-clamp-2 leading-relaxed italic">
                              "{parsed.text}"
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-card)]/50 p-6 shadow-[var(--app-shadow)] text-center relative overflow-hidden flex flex-col items-center justify-center md:h-[240px] w-full animate-fade-in">
                <Sparkles className="size-8 text-[var(--color-accent)] mb-2 animate-bounce" />
                <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-[var(--color-primary)] mb-1">Ngày này năm xưa</h3>
                <p className="text-xs sm:text-sm font-semibold text-[var(--color-muted)] leading-relaxed italic mb-4 max-w-sm">
                  Chưa có kỷ niệm của ngày hôm nay vào các năm trước.
                </p>
                <button
                  type="button"
                  onClick={handleOpenCreate}
                  className="w-full max-w-xs inline-flex items-center justify-center gap-1.5 rounded-2xl bg-[var(--color-primary)] px-5 py-3 text-sm font-black text-white hover:bg-[var(--color-primary-hover)] transition active:scale-95 shadow-md cursor-pointer"
                >
                  <Plus className="size-4" /> Tạo kỷ niệm mới 💖
                </button>
              </div>
            )}

            {/* Box 2: Tìm kiếm & Lọc kỷ niệm */}
            <div className="flex flex-col justify-between bg-[var(--color-card)] border border-[var(--color-border)]/50 rounded-3xl p-5 shadow-sm relative z-30 md:h-[240px]">
              <div className="flex items-center gap-2 mb-2 border-b border-[var(--color-border)]/30 pb-2">
                <Search className="size-5 text-[var(--color-primary)]" />
                <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-[var(--color-primary)]">Tìm kiếm & Lọc kỷ niệm</h3>
              </div>

              <div className="flex flex-col gap-3.5 flex-1 justify-center">
                {/* Row 1: Search Input */}
                <div className="relative w-full">
                  <input
                    type="text"
                    placeholder="Tìm theo từ khóa..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-soft)]/40 pl-11 pr-4 py-3 h-11 text-sm sm:text-base font-semibold outline-none focus:border-[var(--color-primary)] text-[var(--color-text)] transition-all duration-200"
                  />
                  <Search className="absolute left-4 top-3.5 size-4.5 text-[var(--color-faint)]" />
                </div>

                {/* Row 2: Year and Month Selects */}
                <div className="grid grid-cols-2 gap-3.5 w-full">
                  <CustomSelect
                    value={selectedYear}
                    onChange={setSelectedYear}
                    options={yearOptions}
                    className="w-full"
                  />

                  <CustomSelect
                    value={selectedMonth}
                    onChange={setSelectedMonth}
                    options={monthOptions}
                    className="w-full"
                  />
                </div>

                {/* Row 3: Mood Filter popover trigger button */}
                <div className="relative w-full">
                  <button
                    type="button"
                    onClick={() => setShowMoodDropdown(!showMoodDropdown)}
                    className={`inline-flex h-11 w-full items-center justify-between rounded-xl border px-3 py-2 text-sm font-extrabold transition-all cursor-pointer ${selectedMoodFilter !== "all"
                      ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)]/30 text-[var(--color-primary)] animate-[pulse_2s_infinite]"
                      : "border-[var(--color-border)]/50 bg-[var(--color-soft)]/20 text-[var(--color-text)] hover:border-[var(--color-primary)]/45"
                      }`}
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      <Filter className="size-4.5 text-[var(--color-faint)]" />
                      <span className="truncate">
                        {selectedMoodFilter === "all"
                          ? "Lọc theo cảm xúc"
                          : `Cảm xúc: ${MOOD_DESIGNS[selectedMoodFilter]?.emoji || "✨"} ${selectedMoodFilter}`}
                      </span>
                    </span>
                    <ChevronDown className={`h-4.5 w-4.5 text-[var(--color-faint)] transition-transform duration-300 ${showMoodDropdown ? "rotate-180" : ""}`} />
                  </button>
                  {showMoodDropdown && (
                    <>
                      <div className="fixed inset-0 z-35" onClick={() => setShowMoodDropdown(false)} />
                      <div className="absolute left-0 right-0 mt-2 rounded-2xl border border-[var(--color-border)]/50 bg-[var(--color-card)] p-3 shadow-xl z-40 animate-[scaleUp_0.2s_ease-out]">
                        <p className="text-[10px] font-black uppercase tracking-wider text-[var(--color-faint)] px-2 mb-2">Lọc theo cảm xúc</p>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMoodFilter("all");
                              setShowMoodDropdown(false);
                            }}
                            className={`w-full px-3 py-2.5 rounded-xl text-left text-sm font-extrabold flex items-center gap-2 transition-all ${selectedMoodFilter === "all"
                              ? "bg-[var(--color-primary)] text-white shadow-sm"
                              : "hover:bg-[var(--color-soft)] text-[var(--color-text)]"
                              }`}
                          >
                            🌈 Tất cả
                          </button>
                          {Object.keys(MOOD_DESIGNS)
                            .filter(m => m !== "Vui" && m !== "Buồn")
                            .map((m) => {
                              const mConf = MOOD_DESIGNS[m];
                              const isActive = selectedMoodFilter === m;
                              return (
                                <button
                                  key={m}
                                  type="button"
                                  onClick={() => {
                                    setSelectedMoodFilter(m);
                                    setShowMoodDropdown(false);
                                  }}
                                  className={`w-full px-3 py-2.5 rounded-xl text-left text-sm font-extrabold flex items-center gap-2 transition-all ${isActive
                                    ? "bg-[var(--color-primary)] text-white shadow-sm"
                                    : "hover:bg-[var(--color-soft)] text-[var(--color-text)]"
                                    }`}
                                  >
                                  <span>{mConf.emoji}</span>
                                  <span className="whitespace-nowrap">{m}</span>
                                </button>
                              );
                            })}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

            </div>
          </div>


          {filteredEntries.length > 0 ? (
        <div className="relative w-full py-4 pl-10 md:pl-0">
          {/* Timeline line: Left on mobile, Centered on desktop */}
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-[2px] bg-gradient-to-b from-[var(--color-primary)]/30 via-[var(--color-accent)]/40 to-[var(--color-primary)]/20 -translate-x-1/2" />

          <div className="space-y-8 md:space-y-12">
            {filteredEntries.map((entry, idx) => {
              const isOwn = entry.author_id === profile.id;
              const parsed = parseJournalContent(entry.content, isOwn ? profile.display_name : partnerName);
              const isLocked = parsed.visibility === "time-capsule" && isCapsuleLocked(parsed.revealDate) && !isOwn;
              const moodStyle = MOOD_DESIGNS[parsed.mood] || { emoji: "✨", pill: "bg-[var(--color-primary-soft)] text-[var(--color-primary)]", glow: "rgba(0,0,0,0)" };

              return (
                <div
                  key={entry.id}
                  className={`relative w-full flex flex-col md:flex-row items-center justify-between scroll-reveal ${idx % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                    }`}
                >
                  {/* Timeline Card - Full width on mobile, 45% width on desktop */}
                  <div className="w-full md:w-[calc(50%-2rem)]">
                    {renderDiaryCard(entry, parsed, isLocked, moodStyle, isOwn)}
                  </div>

                  {/* Spacer to push content to one side on desktop */}
                  <div className="hidden md:block w-[calc(50%-2rem)]" />

                  {/* Heart Marker on Timeline line */}
                  <div className="absolute left-[-24px] md:left-1/2 md:-translate-x-1/2 top-6 z-10 flex items-center justify-center">
                    <div
                      className="flex size-7 items-center justify-center rounded-full bg-[var(--color-card)] border border-[var(--color-border)] shadow-md transition-all duration-300 hover:scale-120 hover:rotate-12 cursor-pointer"
                      style={{ boxShadow: `0 0 12px ${moodStyle.glow}` }}
                    >
                      <Heart className="size-3.5 fill-[var(--color-accent)] text-[var(--color-accent)] animate-[heartbeat_1.5s_infinite]" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-[var(--color-border)]/30 bg-[var(--color-card)]/50 p-8 sm:p-12 text-center py-16 sm:py-24 shadow-[var(--app-shadow)] flex flex-col items-center justify-center relative overflow-hidden animate-fade-in">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-primary-soft)]/20 rounded-full blur-3xl pointer-events-none" />
          <BookOpen className="size-12 text-[var(--color-primary-soft)] mb-4 animate-bounce" />
          <h3 className="font-black text-base text-[var(--color-text)]">Không tìm thấy trang nhật ký nào</h3>
          <p className="mt-2 text-xs text-[var(--color-muted)] max-w-md mx-auto leading-relaxed font-semibold">
            Hãy thử thay đổi từ khóa tìm kiếm hoặc các bộ lọc cảm xúc để ôn lại các kỷ niệm cũ nhé... 📝
          </p>
        </div>
      )}

    </div>
  )}

{/* CREATE & EDIT GLASSMORPHIC DIALOG MODAL */ }
{
  isOpenModal && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/30 animate-fade-in">

      <div className="w-full max-w-lg rounded-3xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 sm:p-6 shadow-2xl relative overflow-y-auto scrollbar-none max-h-[90vh] animate-scale-up">
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
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-soft)]/50 p-2.5 text-xs font-semibold outline-none focus:border-[var(--color-primary)] resize-none text-[var(--color-text)]"
            />
          </div>

          {/* Mood Visual Grid Selection */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase tracking-wider text-[var(--color-faint)]">
              Cảm xúc chủ đạo 💝
            </label>
            <div className="grid grid-cols-4 gap-2">
              {Object.keys(MOOD_DESIGNS)
                .filter(m => m !== "Vui" && m !== "Buồn")
                .map((m) => {
                  const mConf = MOOD_DESIGNS[m];
                  const isActive = mood === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMood(m)}
                      className={`flex flex-col items-center justify-center p-2 rounded-2xl border transition-all duration-200 ${isActive
                        ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] scale-103 shadow-sm font-bold"
                        : "border-[var(--color-border)]/45 bg-[var(--color-card)] hover:bg-[var(--color-soft)]/45 hover:-translate-y-0.5"
                        }`}
                    >
                      <span className="text-xl animate-[pulse_2s_infinite]">{mConf.emoji}</span>
                      <span className="text-[10px] font-black text-[var(--color-text)] mt-1">{m}</span>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Background Music Picker Dropdown */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-[var(--color-faint)] mb-1">
              Nhạc nền kỷ niệm 🎵
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMusicSelector(!showMusicSelector)}
                className="w-full text-left rounded-xl border border-[var(--color-border)] bg-[var(--color-soft)]/50 p-2.5 text-xs font-bold outline-none flex items-center justify-between hover:border-[var(--color-primary)]"
              >
                <span className="truncate flex items-center gap-1.5">
                  <Music className="size-3.5 text-[var(--color-primary)]" />
                  {musicTitle ? `Bài hát: ${musicTitle}` : "Không chọn nhạc nền"}
                </span>
                <span className="text-[10px] text-[var(--color-primary)] font-black">
                  {showMusicSelector ? "Đóng" : "Chọn nhạc"}
                </span>
              </button>

              {showMusicSelector && (
                <div className="absolute left-0 right-0 z-40 mt-1 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-3 shadow-xl max-h-[260px] overflow-y-auto space-y-2.5 animate-scale-up">

                  {/* Audio upload form inside dropdown list */}
                  <div className="bg-[var(--color-soft)]/60 border border-[var(--color-border)]/30 rounded-xl p-2 text-[10px] space-y-2">
                    <p className="font-black text-[var(--color-faint)] uppercase tracking-wider">Tải nhạc mới từ máy (.mp3)</p>
                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer inline-flex items-center justify-center rounded-lg bg-[var(--color-primary)] px-2.5 py-1.5 text-[9px] font-black text-white hover:bg-[var(--color-primary-hover)] transition active:scale-95">
                        {selectedSongFile ? "Tệp khác" : "Chọn file MP3"}
                        <input
                          type="file"
                          accept="audio/mp3,audio/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setSelectedSongFile(file);
                              setSongUploadTitle(file.name.replace(/\.[^/.]+$/, "").slice(0, 40));
                            }
                          }}
                          className="hidden"
                          disabled={isUploadingSong}
                        />
                      </label>
                      <span className="truncate max-w-[150px] font-semibold text-[var(--color-muted)]">
                        {selectedSongFile ? selectedSongFile.name : "Chưa chọn file"}
                      </span>
                    </div>

                    {selectedSongFile && (
                      <div className="flex gap-1.5 items-center">
                        <input
                          type="text"
                          placeholder="Tên bài hát hiển thị..."
                          value={songUploadTitle}
                          onChange={(e) => setSongUploadTitle(e.target.value)}
                          className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-2 py-1 text-[9px] font-semibold outline-none focus:border-[var(--color-primary)] text-[var(--color-text)]"
                          maxLength={40}
                        />
                        <button
                          type="button"
                          onClick={handleSongUploadSubmit}
                          disabled={isUploadingSong}
                          className="rounded-lg bg-[var(--color-primary)] px-3 py-1 text-[9px] font-black text-white hover:bg-[var(--color-primary-hover)] transition disabled:opacity-50 inline-flex items-center gap-1"
                        >
                          {isUploadingSong && <Loader2 className="size-2.5 animate-spin" />}
                          Lưu
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Search */}
                  <input
                    type="text"
                    placeholder="Tìm bài hát..."
                    value={searchSongQuery}
                    onChange={(e) => setSearchSongQuery(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-soft)]/30 px-3 py-1.5 text-[10px] font-semibold outline-none focus:border-[var(--color-primary)] text-[var(--color-text)]"
                  />

                  {/* Songs list */}
                  <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-0.5">
                    {/* System default */}
                    {("Phép Màu (From Đàn Cá Gỗ)".toLowerCase().includes(searchSongQuery.toLowerCase())) && (
                      <div className="flex items-center justify-between p-1.5 rounded-lg border border-[var(--color-border)]/30 hover:bg-[var(--color-soft)]/50 text-[10px]">
                        <button
                          type="button"
                          onClick={() => {
                            setMusicUrl("/slideshow-music.mp3");
                            setMusicTitle("Phép Màu (From Đàn Cá Gỗ)");
                            setShowMusicSelector(false);
                          }}
                          className="flex-1 text-left font-black text-[var(--color-text)]"
                        >
                          🎵 Phép Màu (From Đàn Cá Gỗ)
                        </button>
                        <button
                          type="button"
                          onClick={() => togglePreviewSong("/slideshow-music.mp3")}
                          className="p-1 text-[var(--color-primary)] font-black hover:underline ml-1"
                        >
                          {previewPlayingUrl === "/slideshow-music.mp3" ? "Dừng" : "Nghe thử"}
                        </button>
                      </div>
                    )}

                    {/* No background music option */}
                    {("Không nhạc nền".toLowerCase().includes(searchSongQuery.toLowerCase())) && (
                      <div className="flex items-center justify-between p-1.5 rounded-lg border border-[var(--color-border)]/30 hover:bg-[var(--color-soft)]/50 text-[10px]">
                        <button
                          type="button"
                          onClick={() => {
                            setMusicUrl("");
                            setMusicTitle("");
                            setShowMusicSelector(false);
                          }}
                          className="flex-1 text-left font-bold text-rose-600"
                        >
                          ❌ Không dùng nhạc nền
                        </button>
                      </div>
                    )}

                    {songsList.filter(s => s.title.toLowerCase().includes(searchSongQuery.toLowerCase())).map((song) => (
                      <div key={song.id} className="flex items-center justify-between p-1.5 rounded-lg border border-[var(--color-border)]/30 hover:bg-[var(--color-soft)]/50 text-[10px]">
                        <button
                          type="button"
                          onClick={() => {
                            setMusicUrl(song.url);
                            setMusicTitle(song.title);
                            setShowMusicSelector(false);
                          }}
                          className="flex-1 text-left font-bold text-[var(--color-text)] truncate mr-2"
                        >
                          🎶 {song.title}
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => togglePreviewSong(song.url)}
                            className="text-[var(--color-primary)] font-black hover:underline"
                          >
                            {previewPlayingUrl === song.url ? "Dừng" : "Nghe"}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteSong(song.id, e)}
                            className="text-rose-600 hover:text-rose-800"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Multiple Images Selector preview */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase tracking-wider text-[var(--color-faint)]">
              Bộ sưu tập hình ảnh (Chọn nhiều ảnh)
            </label>

            <div className="flex flex-col gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-soft)]/30 p-3">
              <div className="flex items-center gap-3">
                <label className="cursor-pointer inline-flex items-center justify-center rounded-xl bg-[var(--color-primary)] px-3 py-1.5 text-xs font-black text-white hover:bg-[var(--color-primary-hover)] transition active:scale-95">
                  {isCompressing ? "Đang nén..." : "Tải ảnh từ máy"}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageFilesChange}
                    className="hidden"
                    disabled={isCompressing}
                  />
                </label>
                <span className="text-[10px] font-bold text-[var(--color-muted)]">
                  {images.length > 0 ? `Đã chọn ${images.length} ảnh` : "Chưa chọn ảnh nào"}
                </span>
              </div>

              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="Hoặc dán liên kết ảnh khác..."
                  id="image-url-input"
                  className="flex-1 rounded-xl border border-[var(--color-border)]/50 bg-white/70 px-2.5 py-1.5 text-[10px] font-semibold outline-none focus:border-[var(--color-primary)] text-[var(--color-text)]"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const val = (e.target as HTMLInputElement).value.trim();
                      if (val) {
                        setImages((prev) => [...prev, val]);
                        (e.target as HTMLInputElement).value = "";
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    const input = document.getElementById("image-url-input") as HTMLInputElement;
                    const val = input?.value.trim();
                    if (val) {
                      setImages((prev) => [...prev, val]);
                      input.value = "";
                    }
                  }}
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-1.5 text-[10px] font-black hover:bg-[var(--color-soft)] text-[var(--color-text)]"
                >
                  Thêm
                </button>
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-4 gap-2 pt-2 border-t border-[var(--color-border)]/40 max-h-[140px] overflow-y-auto">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-[var(--color-border)]/40 bg-white shadow-sm">
                      <img
                        src={resolveDirectImageUrl(img)}
                        alt={`Preview ${idx}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImages((prev) => prev.filter((_, i) => i !== idx));
                        }}
                        className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full hover:bg-black/85 transition"
                      >
                        <X className="size-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Visibility and Private settings */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-[var(--color-faint)] mb-1">
                Chế độ hiển thị
              </label>
              <select
                value={visibility}
                onChange={(e: any) => setVisibility(e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-soft)]/50 p-2 text-xs font-bold outline-none focus:border-[var(--color-primary)] text-[var(--color-text)]"
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
              disabled={isPending || isSubmitting || isCompressing}
              className="rounded-full bg-[var(--color-primary)] px-5 py-2.5 text-xs font-black text-white hover:bg-[var(--color-primary-hover)] transition active:scale-95 disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              {(isPending || isSubmitting) && <Loader2 className="size-3.5 animate-spin" />}
              {isSubmitting ? "Đang lưu..." : editingEntry ? "Cập nhật" : "Lưu trữ 💖"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  )
}

{/* DETAILED ENTRY MODAL */ }
{
  selectedDetailEntry && (() => {
    const entry = selectedDetailEntry;
    const isOwn = entry.author_id === profile.id;
    const parsed = parseJournalContent(entry.content, isOwn ? profile.display_name : partnerName);
    const isLocked = parsed.visibility === "time-capsule" && isCapsuleLocked(parsed.revealDate) && !isOwn;
    const moodStyle = MOOD_DESIGNS[parsed.mood] || { emoji: "✨", pill: "bg-[var(--color-primary-soft)] text-[var(--color-primary)]", glow: "rgba(0,0,0,0)" };

    return (
      <div
        onClick={handleCloseDetail}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/40 animate-fade-in"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl rounded-3xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 sm:p-7 shadow-2xl relative overflow-y-auto scrollbar-none max-h-[90vh] space-y-4 animate-scale-up"
          style={{ boxShadow: `0 10px 40px ${moodStyle.glow}` }}
        >
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-pink-300 via-[var(--color-primary)] to-amber-200" />

          <header className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--color-border)]/40 pb-4">
            <div>
              <span className="text-[10px] font-bold text-[var(--color-faint)] flex items-center gap-1">
                <Calendar className="size-3.5" />
                {formatDate(entry.created_at)}
              </span>
              <h2 className="text-xl font-black tracking-tight text-[var(--color-text)] mt-1">
                {entry.title}
              </h2>
              <p className="text-[10px] font-bold text-[var(--color-muted)] mt-1.5">
                ✍️ Biên soạn bởi: <span className="font-extrabold text-[var(--color-text)]">{parsed.authorName}</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-black ${moodStyle.pill}`}>
                {moodStyle.emoji} {parsed.mood}
              </span>
              {parsed.visibility === "time-capsule" && (
                <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-black ${isLocked ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
                  {isLocked ? <Lock className="size-3.5 mr-1" /> : <Unlock className="size-3.5 mr-1" />}
                  Hộp thư thời gian
                </span>
              )}
            </div>
          </header>

          {isLocked ? (
            <div className="rounded-2xl bg-rose-50/40 border border-rose-200 p-6 text-center my-4">
              <Lock className="size-12 text-rose-500 mx-auto mb-3 animate-bounce" />
              <p className="text-sm font-black text-rose-800">Hộp thư thời gian bị khóa kín 🔒</p>
              <p className="mt-2 text-xs font-semibold text-rose-600">
                Người gửi đặt lịch khóa đến ngày: <strong className="font-bold">{formatDate(parsed.revealDate)}</strong>.
                Hãy kiên nhẫn chờ đến thời khắc mở hộp thư nhé! 🥰
              </p>
            </div>
          ) : (
            <div className="space-y-5 py-2">
              <p className="text-sm sm:text-base font-medium text-[var(--color-text)] leading-relaxed whitespace-pre-line bg-[var(--color-soft)]/30 p-4 sm:p-5 rounded-2xl border border-[var(--color-border)]/20 italic">
                "{parsed.text}"
              </p>

              {/* Detailed images (clickable here!) */}
              {parsed.images && parsed.images.length > 0 && (
                <div className="rounded-2xl overflow-hidden border border-[var(--color-border)]/30 bg-[var(--color-soft)]/20">
                  {renderImageGrid(parsed.images, entry.id, true)}
                </div>
              )}
            </div>
          )}

          <footer className="mt-4 border-t border-[var(--color-border)]/40 pt-4 flex flex-wrap items-center justify-between gap-3">
            {parsed.musicUrl && !isLocked ? (
              <div
                onClick={() => toggleEntryAudio(entry.id, parsed.musicUrl!)}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-black cursor-pointer transition-all ${playingEntryId === entry.id
                  ? "border-amber-400 bg-amber-100/80 text-amber-800 animate-pulse"
                  : "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
                  }`}
              >
                {playingEntryId === entry.id ? (
                  <>
                    <div className="flex items-center gap-0.5 h-3">
                      <div className="w-0.5 h-2.5 bg-amber-600 animate-[soundWave_1s_infinite_alternate]" />
                      <div className="w-0.5 h-3.5 bg-amber-600 animate-[soundWave_0.8s_infinite_alternate_0.2s]" />
                      <div className="w-0.5 h-2 bg-amber-600 animate-[soundWave_1.2s_infinite_alternate_0.1s]" />
                    </div>
                    <span>Đang phát: {parsed.musicTitle || "Nhạc nền"}</span>
                    <Pause className="size-3.5 text-amber-600 ml-1" />
                  </>
                ) : (
                  <>
                    <Volume2 className="size-4 text-amber-600 animate-[bounce_2s_infinite]" />
                    <span>Phát nhạc nền: {parsed.musicTitle || "Nhạc nền"}</span>
                    <Play className="size-3.5 text-amber-600 ml-1" />
                  </>
                )}
              </div>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              {(isOwn || profile.id === entry.author_id) && (
                <>
                  <button
                    onClick={() => {
                      handleCloseDetail();
                      handleOpenEdit(entry);
                    }}
                    className="rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-2 text-xs font-black text-[var(--color-primary)] hover:bg-[var(--color-soft)] transition active:scale-95 flex items-center gap-1.5"
                  >
                    <Edit2 className="size-3.5" /> Chỉnh sửa
                  </button>
                  <button
                    onClick={() => {
                      handleCloseDetail();
                      handleDelete(entry.id);
                    }}
                    className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-black text-rose-700 hover:bg-rose-100 transition active:scale-95 flex items-center gap-1.5"
                  >
                    <Trash2 className="size-3.5" /> Xóa kỷ niệm
                  </button>
                </>
              )}
            </div>
          </footer>
        </div>
      </div>
    );
  })()
}

{/* FULLSCREEN LIGHTBOX OVERLAY */ }
{
  lightboxOpen && (
    <div
      onClick={() => setLightboxOpen(false)}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 animate-fade-in cursor-zoom-out"
    >
      {/* Main image container */}
      <div className="relative flex items-center justify-center max-w-4xl max-h-[80vh] w-full px-4" onClick={(e) => e.stopPropagation()}>
        <img
          src={resolveDirectImageUrl(lightboxImages[lightboxIndex])}
          alt={`Zoomed ${lightboxIndex}`}
          className="max-w-full max-h-[80vh] object-contain rounded-xl select-none"
        />

        {/* Navigation buttons */}
        {lightboxImages.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrevLightbox();
              }}
              className="absolute left-4 p-2.5 rounded-full bg-black/40 hover:bg-black/60 text-white transition active:scale-95 flex items-center justify-center cursor-pointer"
            >
              <ChevronLeft className="size-8" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNextLightbox();
              }}
              className="absolute right-4 p-2.5 rounded-full bg-black/40 hover:bg-black/60 text-white transition active:scale-95 flex items-center justify-center cursor-pointer"
            >
              <ChevronRight className="size-8" />
            </button>
          </>
        )}
      </div>

      {/* Index indicator */}
      <div className="mt-4 text-xs font-bold text-white/70 select-none">
        Hình ảnh {lightboxIndex + 1} / {lightboxImages.length}
      </div>
    </div>
  )
}

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
    </div >
  );
}
