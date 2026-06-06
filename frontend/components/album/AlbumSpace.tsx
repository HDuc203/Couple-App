"use client";

import { useState, useEffect, useTransition, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Images,
  Plus,
  Trash2,
  FolderPlus,
  Image as ImageIcon,
  MapPin,
  MessageSquare,
  Calendar,
  X,
  Loader2,
  Play,
  Heart,
  AlertCircle,
  Clock,
  Compass
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/types/database";
import type { Profile } from "@/lib/profile";
import type { PartnerProfile } from "@/lib/couple";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

type AlbumSpaceProps = {
  profile: Profile;
  currentCouple: any;
  partnerProfile: PartnerProfile | null;
  initialAlbums: Tables<"photo_albums">[];
  initialPhotos: Tables<"photos">[];
  queryError?: string;
};

type ParsedCaption = {
  text: string;
  comments: Array<{
    id: string;
    authorName: string;
    text: string;
    createdAt: string;
  }>;
};

// Safe JSON parser for structured photo captions & comments
function parsePhotoCaption(rawCaption: string | null): ParsedCaption {
  if (!rawCaption) return { text: "", comments: [] };
  const clean = rawCaption.trim();
  if (clean.startsWith("{") && clean.endsWith("}")) {
    try {
      const parsed = JSON.parse(clean);
      return {
        text: parsed.text || "",
        comments: parsed.comments || [],
      };
    } catch (e) {
      // Fallback
    }
  }
  return {
    text: rawCaption,
    comments: [],
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

// Sample premium Unsplash images to help couple play right away!
const SAMPLE_COUPLE_PHOTOS = [
  "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800&auto=format&fit=crop&q=80", // Sunset hold hands
  "https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800&auto=format&fit=crop&q=80", // Heart shadow
  "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&auto=format&fit=crop&q=80", // Couple laughing
  "https://images.unsplash.com/photo-1464746133101-a2c3f88e0dd9?w=800&auto=format&fit=crop&q=80", // Mountain hug
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&auto=format&fit=crop&q=80"  // Date cafe
];

export function AlbumSpace({
  profile,
  currentCouple,
  partnerProfile,
  initialAlbums,
  initialPhotos,
  queryError,
}: AlbumSpaceProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const supabase = useMemo(() => createClient(), []);

  const coupleId = currentCouple?.couple?.id ?? null;
  const partnerName = partnerProfile?.display_name ?? "Người ấy";

  // State arrays
  const [albums, setAlbums] = useState<Tables<"photo_albums">[]>(initialAlbums);
  const [photos, setPhotos] = useState<Tables<"photos">[]>(initialPhotos);

  // Selected state filters
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | "all">("all");

  // Modals state
  const [isOpenAlbumModal, setIsOpenAlbumModal] = useState(false);
  const [isOpenPhotoModal, setIsOpenPhotoModal] = useState(false);
  const [isOpenSlideshow, setIsOpenSlideshow] = useState(false);
  const [activeSlideshowIndex, setActiveSlideshowIndex] = useState(0);

  // Album creation fields
  const [albumTitle, setAlbumTitle] = useState("");
  const [albumError, setAlbumError] = useState("");
  const [isSavingAlbum, setSavingAlbum] = useState(false);

  // Photo addition fields
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoCaption, setPhotoCaption] = useState("");
  const [photoLocation, setPhotoLocation] = useState("");
  const [photoAlbumId, setPhotoAlbumId] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [isCompressing, setIsCompressing] = useState(false);

  // Custom Confirm Modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => { },
  });

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    try {
      const base64 = await compressAndEncodeFile(file);
      setPhotoUrl(base64);
    } catch (error) {
      console.error(error);
      alert("Không thể nén ảnh này. Vui lòng chọn ảnh khác.");
    } finally {
      setIsCompressing(false);
    }
  };

  // Photo detailed view & comments modal state
  const [selectedPhoto, setSelectedPhoto] = useState<Tables<"photos"> | null>(null);
  const [newCommentText, setNewCommentText] = useState("");

  // Sync server changes
  useEffect(() => {
    setAlbums((current) => {
      const combined = [...current, ...initialAlbums];
      return Array.from(new Map(combined.map((item) => [item.id, item])).values()).sort((a, b) => {
        const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bTime - aTime;
      });
    });
  }, [initialAlbums]);

  useEffect(() => {
    setPhotos((current) => {
      const combined = [...current, ...initialPhotos];
      return Array.from(new Map(combined.map((item) => [item.id, item])).values()).sort((a, b) => {
        const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bTime - aTime;
      });
    });
  }, [initialPhotos]);

  // Real-time synchronization
  useEffect(() => {
    if (!coupleId) return;

    // Subscribe to photo albums channel
    const albumsChannel = supabase
      .channel(`photo_albums:${coupleId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "photo_albums",
        },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            const newAlbum = payload.new as Tables<"photo_albums">;
            setAlbums((prev) => {
              if (prev.some((item) => item.id === newAlbum.id)) return prev;
              return [newAlbum, ...prev];
            });
          } else if (payload.eventType === "UPDATE") {
            const updatedAlbum = payload.new as Tables<"photo_albums">;
            setAlbums((prev) =>
              prev.map((item) => (item.id === updatedAlbum.id ? updatedAlbum : item))
            );
          } else if (payload.eventType === "DELETE") {
            const deleted = payload.old as { id: string };
            setAlbums((prev) => prev.filter((item) => item.id !== deleted.id));
            setPhotos((prev) => prev.filter((p) => p.album_id !== deleted.id));
            setSelectedAlbumId((current) => current === deleted.id ? "all" : current);
          }
          startTransition(() => {
            router.refresh();
          });
        }
      )
      .subscribe();

    // Subscribe to photos channel
    const photosChannel = supabase
      .channel(`photos:${coupleId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "photos",
        },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            const newPhoto = payload.new as Tables<"photos">;
            setPhotos((prev) => {
              if (prev.some((p) => p.id === newPhoto.id)) return prev;
              return [newPhoto, ...prev];
            });
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as Tables<"photos">;
            setPhotos((prev) =>
              prev.map((p) => (p.id === updated.id ? updated : p))
            );
            // Sync detailed photo model if active
            setSelectedPhoto((current) => current?.id === updated.id ? updated : current);
          } else if (payload.eventType === "DELETE") {
            const deleted = payload.old as { id: string };
            setPhotos((prev) => prev.filter((p) => p.id !== deleted.id));
            setSelectedPhoto((current) => current?.id === deleted.id ? null : current);
          }
          startTransition(() => {
            router.refresh();
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(albumsChannel);
      supabase.removeChannel(photosChannel);
    };
  }, [coupleId, supabase]);

  // Create new photo album
  const handleCreateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coupleId || !albumTitle.trim()) {
      setAlbumError("Vui lòng nhập tên album hồi ức.");
      return;
    }

    setSavingAlbum(true);
    const { error } = await supabase.from("photo_albums").insert({
      couple_id: coupleId,
      title: albumTitle.trim(),
      created_by: profile.id,
    });

    if (error) {
      setAlbumError(`Không thể tạo album: ${error.message}`);
      setSavingAlbum(false);
    } else {
      // Gửi thông báo đến partner
      if (partnerProfile) {
        await supabase.from("notifications").insert({
          couple_id: coupleId,
          user_id: partnerProfile.id,
          sender_id: profile.id,
          type: "album",
          title: `${profile.display_name} vừa tạo một hồi ức mới 📸`,
          content: `Album ảnh mới: "${albumTitle.trim()}". Hãy vào thêm những khoảnh khắc ngọt ngào của hai bạn nhé!`,
          link: "/album",
        });
      }

      setIsOpenAlbumModal(false);
      setAlbumTitle("");
      setAlbumError("");
      setSavingAlbum(false);
      startTransition(() => {
        router.refresh();
      });
    }
  };

  // Add photo
  const handleAddPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coupleId) return;

    if (!photoUrl.trim()) {
      setPhotoError("Vui lòng nhập URL ảnh kỷ niệm.");
      return;
    }

    const targetAlbumId = photoAlbumId || null;

    // Pack caption and comments empty array inside JSON
    const packedCaption = JSON.stringify({
      text: photoCaption.trim(),
      comments: [],
    });

    const { error } = await supabase.from("photos").insert({
      couple_id: coupleId,
      album_id: targetAlbumId,
      uploaded_by: profile.id,
      image_url: photoUrl.trim(),
      caption: packedCaption,
      location: photoLocation.trim() || null,
      taken_at: new Date().toISOString(),
    });

    if (error) {
      setPhotoError(`Không thể tải ảnh lên: ${error.message}`);
    } else {
      // Gửi thông báo đến partner
      if (partnerProfile) {
        const capText = photoCaption.trim() ? photoCaption.trim() : "Một hình ảnh đáng nhớ vừa được lưu giữ.";
        await supabase.from("notifications").insert({
          couple_id: coupleId,
          user_id: partnerProfile.id,
          sender_id: profile.id,
          type: "album",
          title: `${profile.display_name} vừa tải lên một kỷ niệm mới 📸`,
          content: capText,
          link: "/album",
        });
      }

      setIsOpenPhotoModal(false);
      setPhotoUrl("");
      setPhotoCaption("");
      setPhotoLocation("");
      setPhotoAlbumId("");
      setPhotoError("");
      startTransition(() => {
        router.refresh();
      });
    }
  };

  // Delete an album
  const handleDeleteAlbum = (albumId: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Xóa album hồi ức",
      message: "Bạn có chắc chắn muốn xóa album này và TOÀN BỘ các bức ảnh bên trong? Hành động này sẽ xóa vĩnh viễn các ảnh thuộc album này.",
      onConfirm: async () => {
        const supabase = createClient();
        
        // 1. Delete all photos in the album
        const { error: photosError } = await supabase
          .from("photos")
          .delete()
          .eq("album_id", albumId);

        if (photosError) {
          alert(`Lỗi khi xóa ảnh trong album: ${photosError.message}`);
          return;
        }

        // 2. Delete the album
        const { error: albumError } = await supabase
          .from("photo_albums")
          .delete()
          .eq("id", albumId);

        if (albumError) {
          alert(`Không thể xóa album: ${albumError.message}`);
        } else {
          // Cập nhật state ngay lập tức
          setAlbums((prev) => prev.filter((a) => a.id !== albumId));
          // Nếu đang xem album vừa xóa → về "all"
          setSelectedAlbumId((current) => current === albumId ? "all" : current);
          // Xóa các ảnh trong album khỏi state local
          setPhotos((prev) => prev.filter((p) => p.album_id !== albumId));
        }
      }
    });
  };

  // Delete a photo
  const handleDeletePhoto = (photoId: string, event?: React.MouseEvent) => {
    if (event) event.stopPropagation();

    setConfirmModal({
      isOpen: true,
      title: "Xóa ảnh kỷ niệm",
      message: "Bạn có muốn xóa bức ảnh kỷ niệm ngọt ngào này khỏi thư viện chung?",
      onConfirm: async () => {
        const supabase = createClient();
        const { error } = await supabase.from("photos").delete().eq("id", photoId);
        if (error) {
          alert(`Lỗi khi xóa ảnh: ${error.message}`);
        } else {
          // Cập nhật state ngay lập tức
          setPhotos((prev) => prev.filter((p) => p.id !== photoId));
          // Đóng detail modal nếu đang xem ảnh này
          setSelectedPhoto((current) => current?.id === photoId ? null : current);
        }
      }
    });
  };

  // Submit comment
  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPhoto || !newCommentText.trim() || !coupleId) return;

    const parsed = parsePhotoCaption(selectedPhoto.caption);
    const newComment = {
      id: Math.random().toString(),
      authorName: profile.display_name,
      text: newCommentText.trim(),
      createdAt: new Date().toISOString(),
    };

    const updatedCaption = JSON.stringify({
      text: parsed.text,
      comments: [...parsed.comments, newComment],
    });

    const supabase = createClient();
    const { error } = await supabase
      .from("photos")
      .update({ caption: updatedCaption })
      .eq("id", selectedPhoto.id);

    if (error) {
      alert(`Không thể gửi bình luận: ${error.message}`);
    } else {
      setNewCommentText("");
      // Local sync details handled dynamically inside RLS listeners
    }
  };

  // Filter photos based on album selection
  const filteredPhotos = photos.filter((photo) => {
    if (selectedAlbumId === "all") return true;
    return photo.album_id === selectedAlbumId;
  });

  // Safe display album name
  const getAlbumName = (albumId: string | null) => {
    if (!albumId) return "Chưa phân mục";
    const found = albums.find((a) => a.id === albumId);
    return found ? found.title : "Album ẩn";
  };

  // ── Cinematic Slideshow state ──
  const [slideshowPlaying, setSlideshowPlaying] = useState(true);
  const [slideshowMusicOn, setSlideshowMusicOn] = useState(true);
  const [slideshowProgress, setSlideshowProgress] = useState(0);
  const [slideshowTransition, setSlideshowTransition] = useState(true);
  const [kenBurnsKey, setKenBurnsKey] = useState(0);
  const [heartParticles, setHeartParticles] = useState<Array<{id:number;x:number;size:number;delay:number;dur:number}>>([]);
  const [birdParticles, setBirdParticles] = useState<Array<{
    id: number;
    y: number;
    size: number;
    delay: number;
    dur: number;
    direction: "left" | "right";
    flapDur: number;
  }>>([]);
  const [customMusicUrl, setCustomMusicUrl] = useState<string>("/slideshow-music.mp3");
  const [customMusicName, setCustomMusicName] = useState<string>("Phép Màu (From Đàn Cá Gỗ)");
  const [starParticles] = useState(() =>
    Array.from({ length: 55 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 0.5 + Math.random() * 2.5,
      dur: 2.5 + Math.random() * 4,
      delay: Math.random() * 5,
    }))
  );
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const musicInputRef = useRef<HTMLInputElement | null>(null);
  const SLIDE_DURATION = 7000; // ms per slide
  const PHOTO_TRANSITION_DURATION = 550; // fold animation duration ms
  const [prevSlideshowIndex, setPrevSlideshowIndex] = useState<number | null>(null);
  const [photoTransitioning, setPhotoTransitioning] = useState(false);

  // Start Playback Slideshow
  const startSlideshow = () => {
    if (filteredPhotos.length === 0) return;
    setActiveSlideshowIndex(0);
    setSlideshowProgress(0);
    setSlideshowPlaying(true);
    setSlideshowMusicOn(true);
    setKenBurnsKey(0);
    // Generate heart particles
    const particles = Array.from({ length: 18 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      size: 0.8 + Math.random() * 1.4,
      delay: Math.random() * 6,
      dur: 5 + Math.random() * 5,
    }));
    setHeartParticles(particles);

    // Generate flying birds
    const birds = Array.from({ length: 6 }, (_, i) => ({
      id: i,
      y: 15 + Math.random() * 55, // avoid extreme top/bottom
      size: 14 + Math.random() * 14, // size in pixels
      delay: Math.random() * 8,
      dur: 10 + Math.random() * 12, // slow, graceful flight
      direction: Math.random() > 0.5 ? ("right" as const) : ("left" as const),
      flapDur: 0.25 + Math.random() * 0.2, // wing flap duration
    }));
    setBirdParticles(birds);

    setIsOpenSlideshow(true);
  };

  const handleNextSlide = useCallback(() => {
    if (photoTransitioning) return;
    const next = (activeSlideshowIndex + 1) % filteredPhotos.length;
    setPrevSlideshowIndex(activeSlideshowIndex);
    setActiveSlideshowIndex(next);
    setSlideshowProgress(0);
    setKenBurnsKey(k => k + 1);
    setPhotoTransitioning(true);
    setTimeout(() => { setPrevSlideshowIndex(null); setPhotoTransitioning(false); }, PHOTO_TRANSITION_DURATION);
  }, [activeSlideshowIndex, filteredPhotos.length, photoTransitioning, PHOTO_TRANSITION_DURATION]);

  const handlePrevSlide = useCallback(() => {
    if (photoTransitioning) return;
    const prev = (activeSlideshowIndex - 1 + filteredPhotos.length) % filteredPhotos.length;
    setPrevSlideshowIndex(activeSlideshowIndex);
    setActiveSlideshowIndex(prev);
    setSlideshowProgress(0);
    setKenBurnsKey(k => k + 1);
    setPhotoTransitioning(true);
    setTimeout(() => { setPrevSlideshowIndex(null); setPhotoTransitioning(false); }, PHOTO_TRANSITION_DURATION);
  }, [activeSlideshowIndex, filteredPhotos.length, photoTransitioning, PHOTO_TRANSITION_DURATION]);

  const handleCloseSlideshow = useCallback(() => {
    setIsOpenSlideshow(false);
    setSlideshowPlaying(false);
    setSlideshowProgress(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, []);

  // Auto-advance timer
  useEffect(() => {
    if (!isOpenSlideshow || !slideshowPlaying) {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      return;
    }
    const tick = 50; // ms
    const steps = SLIDE_DURATION / tick;
    let step = 0;
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    progressTimerRef.current = setInterval(() => {
      step++;
      setSlideshowProgress((step / steps) * 100);
      if (step >= steps) {
        handleNextSlide();
      }
    }, tick);
    return () => { if (progressTimerRef.current) clearInterval(progressTimerRef.current); };
  }, [isOpenSlideshow, slideshowPlaying, activeSlideshowIndex, handleNextSlide]);

  // Music control — supports custom uploaded music
  useEffect(() => {
    if (!isOpenSlideshow) return;
    // Recreate audio when source changes
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    audioRef.current = new Audio(customMusicUrl);
    audioRef.current.loop = true;
    audioRef.current.volume = 0.5;
    if (slideshowMusicOn) {
      audioRef.current.play().catch(() => {});
    }
    return () => { audioRef.current?.pause(); };
  }, [isOpenSlideshow, customMusicUrl]);

  useEffect(() => {
    if (!audioRef.current) return;
    if (slideshowMusicOn) { audioRef.current.play().catch(() => {}); }
    else { audioRef.current.pause(); }
  }, [slideshowMusicOn]);

  function handleMusicUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCustomMusicUrl(url);
    setCustomMusicName(file.name.replace(/\.mp3$/i, "").slice(0, 40));
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, []);

  // Body scroll lock + cover notification bell when slideshow active
  useEffect(() => {
    if (isOpenSlideshow) {
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
  }, [isOpenSlideshow]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">

      {/* 1. Header space */}
      <header className="rounded-3xl border border-[var(--color-border)]/50 bg-[var(--color-card)] p-5 shadow-[var(--app-shadow)] text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-200 via-[var(--color-primary)] to-amber-200" />
        <Images className="size-6 text-[var(--color-accent)] mx-auto mb-2" />
        <h1 className="text-2xl font-black tracking-tight">Hộp ảnh hồi ức</h1>
        <p className="mt-1 text-xs text-[var(--color-muted)] font-semibold max-w-lg mx-auto">
          Tấm gương phản chiếu kỷ niệm của tụi mình. Cùng nhau lưu trữ hình ảnh đẹp, ghi lại địa điểm đã đi qua và cùng thảo luận dịu dàng dưới mỗi tấm ảnh.
        </p>

        {coupleId && (
          <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
            <button
              onClick={() => setIsOpenAlbumModal(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-primary)] px-4.5 py-2 text-xs font-black text-white hover:bg-[var(--color-primary-hover)] transition active:scale-95 shadow-md"
            >
              <FolderPlus className="size-4" /> Tạo Album mới
            </button>
            <button
              onClick={() => setIsOpenPhotoModal(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4.5 py-2 text-xs font-black text-[var(--color-text)] hover:bg-[var(--color-soft)] transition active:scale-95"
            >
              <Plus className="size-4" /> Tải ảnh lên
            </button>
            {filteredPhotos.length > 0 && (
              <button
                onClick={startSlideshow}
                className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 text-amber-800 px-4.5 py-2 text-xs font-black hover:bg-amber-100 transition active:scale-95"
              >
                <Play className="size-4" /> Trình chiếu hồi ức
              </button>
            )}
          </div>
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
            Cần kết nối với đối phương để cùng xem và đăng tải các album kỷ niệm chung.
          </p>
        </div>
      ) : (
        <div className="space-y-6">

          {/* 2. Album category switcher */}
          <nav className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-[var(--color-border)]/40">
            <button
              onClick={() => setSelectedAlbumId("all")}
              className={`rounded-full px-4 py-2 text-xs font-black transition-all flex-shrink-0 ${selectedAlbumId === "all"
                  ? "bg-[var(--color-primary)] text-white shadow-sm"
                  : "bg-[var(--color-card)] border border-[var(--color-border)]/50 hover:bg-[var(--color-soft)] text-[var(--color-muted)]"
                }`}
            >
              Tất cả ảnh ({photos.length})
            </button>

            {albums.map((album) => {
              const albumCount = photos.filter((p) => p.album_id === album.id).length;
              return (
                <div key={album.id} className="relative flex items-center gap-1 flex-shrink-0 group">
                  <button
                    onClick={() => setSelectedAlbumId(album.id)}
                    className={`rounded-full px-4 py-2 text-xs font-black transition-all ${selectedAlbumId === album.id
                        ? "bg-[var(--color-primary)] text-white shadow-sm"
                        : "bg-[var(--color-card)] border border-[var(--color-border)]/50 hover:bg-[var(--color-soft)] text-[var(--color-muted)]"
                      }`}
                  >
                    📂 {album.title} ({albumCount})
                  </button>

                  <button
                    onClick={() => handleDeleteAlbum(album.id)}
                    className="absolute -top-1 -right-1 p-0.5 rounded-full bg-rose-100 text-rose-700 opacity-0 group-hover:opacity-100 hover:scale-110 transition duration-300 shadow-sm border border-rose-200"
                    title="Xóa Album"
                  >
                    <X className="size-2.5" />
                  </button>
                </div>
              );
            })}
          </nav>

          {/* 3. Scrapbook photo polaroid stream gallery layout */}
          {filteredPhotos.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 py-2">

              {filteredPhotos.map((photo, index) => {
                const parsed = parsePhotoCaption(photo.caption);

                // Polaroid Scrapbook styled single card item
                return (
                  <article
                    key={photo.id}
                    onClick={() => setSelectedPhoto(photo)}
                    className="group rounded-2xl border border-[var(--color-border)]/40 bg-[var(--color-card)] p-3 pb-5 shadow-[0_4px_24px_rgba(0,0,0,0.01)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-md hover:border-[var(--color-accent)]/20 cursor-pointer relative overflow-hidden"
                  >
                    {/* Visual polaroid paper styling header */}
                    <div className="relative aspect-square w-full rounded-xl overflow-hidden border border-[var(--color-border)]/20 bg-[var(--color-soft)]/20">
                      <img
                        src={resolveDirectImageUrl(photo.image_url)}
                        alt="Kỷ niệm"
                        loading="lazy"
                        onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=600"; }}
                        className="h-full w-full object-cover transform transition duration-500 group-hover:scale-105"
                      />

                      {/* Delete absolute button */}
                      <button
                        onClick={(e) => handleDeletePhoto(photo.id, e)}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/40 text-white hover:bg-rose-600 transition duration-300 opacity-0 group-hover:opacity-100 backdrop-blur-sm"
                        title="Xóa tấm ảnh này"
                      >
                        <Trash2 className="size-3.5" />
                      </button>

                      {/* Polaroid album name label top left */}
                      <span className="absolute bottom-2 left-2 rounded-lg bg-black/40 text-white px-2 py-0.5 text-[9px] font-black backdrop-blur-sm">
                        {getAlbumName(photo.album_id)}
                      </span>
                    </div>

                    {/* Polaroid Scrapbook bottom text */}
                    <div className="mt-3.5 space-y-1.5 px-1">
                      <p className="text-xs font-bold text-[var(--color-text)] line-clamp-2 leading-relaxed italic">
                        "{parsed.text || "Một khoảnh khắc yên bình..."}"
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-[var(--color-faint)] font-bold">
                        {photo.location ? (
                          <span className="flex items-center gap-0.5 text-[var(--color-primary)]">
                            <MapPin className="size-3" />
                            {photo.location}
                          </span>
                        ) : (
                          <span />
                        )}
                        <span className="flex items-center gap-0.5">
                          <MessageSquare className="size-3" />
                          {parsed.comments.length}
                        </span>
                      </div>
                    </div>

                  </article>
                );
              })}

            </div>
          ) : (
            <div className="rounded-3xl border border-[var(--color-border)]/30 bg-[var(--color-card)]/50 p-8 sm:p-12 text-center py-16 sm:py-24 shadow-[var(--app-shadow)] flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-primary-soft)]/10 rounded-full blur-3xl pointer-events-none" />
              <Images className="size-12 text-[var(--color-primary-soft)] mb-4 animate-bounce" />
              <h3 className="font-black text-base text-[var(--color-text)]">Hộp kỷ niệm trống trải</h3>
              <p className="mt-2 text-xs text-[var(--color-muted)] max-w-md mx-auto leading-relaxed font-semibold">
                Mỗi bức ảnh là một mảnh ghép của hành trình tình yêu. Hãy bắt đầu lấp đầy không gian này bằng những nụ cười rạng rỡ của hai bạn nhé... 📸
              </p>
            </div>
          )}

        </div>
      )}

      {/* MODAL 1: CREATE ALBUM */}
      {isOpenAlbumModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/30">
          <div className="w-full max-w-md rounded-3xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-2xl relative overflow-y-auto max-h-[90vh] animate-scale-up">
            <div className="absolute top-0 left-0 w-full h-1 bg-[var(--color-primary)]" />
            <button
              onClick={() => setIsOpenAlbumModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[var(--color-soft)] text-[var(--color-muted)] transition"
            >
              <X className="size-4" />
            </button>

            <h2 className="text-base font-black mb-4">📂 Tạo Album hồi ức mới</h2>
            {albumError && (
              <div className="mb-3 rounded-xl border border-red-200 bg-red-50 p-2.5 text-[10px] font-bold text-red-700">
                {albumError}
              </div>
            )}

            <form onSubmit={handleCreateAlbum} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-[var(--color-faint)] mb-1">
                  Tên Album kỷ niệm
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Lần Đầu Hẹn Hò, Du Lịch Đà Lạt..."
                  value={albumTitle}
                  onChange={(e) => setAlbumTitle(e.target.value)}
                  maxLength={40}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-soft)]/50 p-2 text-xs font-semibold outline-none focus:border-[var(--color-primary)]"
                />
              </div>

              <footer className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--color-border)]/40">
                <button
                  onClick={() => setIsOpenAlbumModal(false)}
                  type="button"
                  className="rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-2 text-xs font-black text-[var(--color-muted)] hover:bg-[var(--color-soft)] transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-[var(--color-primary)] px-5 py-2 text-xs font-black text-white hover:bg-[var(--color-primary-hover)] transition"
                >
                  Tạo ngay
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: UPLOAD/ADD PHOTO */}
      {isOpenPhotoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/30">
          <div className="w-full max-w-lg rounded-3xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 sm:p-6 shadow-2xl relative overflow-y-auto max-h-[90vh] animate-scale-up">
            <div className="absolute top-0 left-0 w-full h-1 bg-[var(--color-primary)]" />
            <button
              onClick={() => setIsOpenPhotoModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[var(--color-soft)] text-[var(--color-muted)] transition"
            >
              <X className="size-4" />
            </button>

            <h2 className="text-base font-black mb-3">📸 Tải ảnh kỷ niệm lên</h2>

            {photoError && (
              <div className="mb-3 rounded-xl border border-red-200 bg-red-50 p-2.5 text-[10px] font-bold text-red-700">
                {photoError}
              </div>
            )}

            <form onSubmit={handleAddPhoto} className="space-y-4">

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-[var(--color-faint)] mb-1">
                  Chọn ảnh kỷ niệm
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
                    <span className="text-[9px] font-bold text-[var(--color-muted)] truncate max-w-[200px]">
                      {photoUrl ? (photoUrl.startsWith("data:") ? "✓ Ảnh đã chọn từ thiết bị" : "✓ Ảnh từ liên kết") : "Chưa chọn ảnh nào"}
                    </span>
                  </div>

                  <input
                    type="url"
                    placeholder="Hoặc dán link ảnh từ Unsplash, Imgur, Facebook..."
                    value={photoUrl.startsWith("data:") ? "" : photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    className="w-full rounded-lg border border-[var(--color-border)]/50 bg-white/70 p-1.5 text-[10px] font-semibold outline-none focus:border-[var(--color-primary)]"
                  />
                </div>

                {/* Quick samples selection to help test easily */}
                <div className="mt-2.5">
                  <p className="text-[9px] font-black text-[var(--color-faint)] uppercase mb-1.5">Ảnh mẫu siêu đẹp</p>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {SAMPLE_COUPLE_PHOTOS.map((src, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setPhotoUrl(src)}
                        className="size-11 rounded-lg border border-[var(--color-border)]/50 overflow-hidden flex-shrink-0 transition hover:border-[var(--color-primary)] hover:scale-105 active:scale-95"
                      >
                        <img src={src} className="h-full w-full object-cover" alt="sample" onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=600"; }} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-[var(--color-faint)] mb-1">
                  Chú thích bức ảnh
                </label>
                <input
                  type="text"
                  placeholder="Lưu lại cảm nghĩ ngắn về tấm ảnh này..."
                  value={photoCaption}
                  onChange={(e) => setPhotoCaption(e.target.value)}
                  maxLength={100}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-soft)]/50 p-2 text-xs font-semibold outline-none focus:border-[var(--color-primary)]"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[var(--color-faint)] mb-1">
                    Vị trí check-in (Location)
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Star Cafe, Sapa..."
                    value={photoLocation}
                    onChange={(e) => setPhotoLocation(e.target.value)}
                    maxLength={30}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-soft)]/50 p-2 text-xs font-semibold outline-none focus:border-[var(--color-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[var(--color-faint)] mb-1">
                    Xếp vào Album
                  </label>
                  <select
                    value={photoAlbumId}
                    onChange={(e) => setPhotoAlbumId(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-soft)]/50 p-2 text-xs font-bold outline-none focus:border-[var(--color-primary)]"
                  >
                    <option value="">Chưa phân mục</option>
                    {albums.map((a) => (
                      <option key={a.id} value={a.id}>
                        📂 {a.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <footer className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--color-border)]/40">
                <button
                  onClick={() => setIsOpenPhotoModal(false)}
                  type="button"
                  className="rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-2 text-xs font-black text-[var(--color-muted)] hover:bg-[var(--color-soft)] transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-[var(--color-primary)] px-5 py-2 text-xs font-black text-white hover:bg-[var(--color-primary-hover)] transition"
                >
                  Thêm vào Hộp ảnh
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: PHOTO DETAILED VIEW & COLLABORATIVE COMMENT STREAM */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/45">
          <div className="w-full max-w-4xl rounded-3xl border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden shadow-2xl relative animate-scale-up grid md:grid-cols-[1.3fr_1fr] max-h-[85vh]">

            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 z-10 p-1.5 rounded-full bg-black/35 text-white hover:bg-black/50 transition backdrop-blur-sm"
            >
              <X className="size-4" />
            </button>

            {/* Left side: Photo display */}
            <div className="bg-black flex items-center justify-center overflow-hidden h-72 md:h-full relative">
              <img
                src={resolveDirectImageUrl(selectedPhoto.image_url)}
                alt="Detailed Memory"
                onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=600"; }}
                className="max-h-full max-w-full object-contain"
              />
              <span className="absolute bottom-4 left-4 rounded-xl bg-black/40 text-white px-3 py-1 text-[10px] font-black backdrop-blur-sm border border-white/10">
                📂 {getAlbumName(selectedPhoto.album_id)}
              </span>
            </div>

            {/* Right side: Comments & details info */}
            <div className="p-5 sm:p-6 flex flex-col h-full overflow-y-auto max-h-[45vh] md:max-h-none">

              <div className="border-b border-[var(--color-border)]/40 pb-3 mb-3">
                <span className="text-[10px] font-bold text-[var(--color-faint)] flex items-center gap-1">
                  <Calendar className="size-3" /> Chụp vào: {new Date(selectedPhoto.taken_at || "").toLocaleDateString("vi-VN")}
                </span>

                <h3 className="mt-1 text-sm font-black italic text-[var(--color-text)] leading-relaxed">
                  "{parsePhotoCaption(selectedPhoto.caption).text || "Một ngày bên nhau thật yên bình..."}"
                </h3>

                {selectedPhoto.location && (
                  <p className="mt-1.5 text-[10px] font-bold text-[var(--color-primary)] flex items-center gap-0.5">
                    <MapPin className="size-3" /> {selectedPhoto.location}
                  </p>
                )}
              </div>

              {/* Comments display */}
              <div className="flex-1 overflow-y-auto space-y-3 min-h-[120px] pr-1">
                <p className="text-[9px] font-black text-[var(--color-faint)] uppercase tracking-wider">Hội thoại dưới bức ảnh</p>

                {parsePhotoCaption(selectedPhoto.caption).comments.length > 0 ? (
                  <div className="space-y-2.5">
                    {parsePhotoCaption(selectedPhoto.caption).comments.map((comm) => (
                      <div key={comm.id} className="rounded-2xl bg-[var(--color-soft)]/60 border border-[var(--color-border)]/30 p-2.5 relative">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-[var(--color-primary)]">
                            {comm.authorName}
                          </span>
                          <span className="text-[8px] font-bold text-[var(--color-faint)]">
                            {new Date(comm.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className="text-[11px] font-semibold text-[var(--color-text)] mt-1">
                          {comm.text}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] font-semibold text-[var(--color-muted)] italic py-4">
                    Chưa có lời thảo luận nào. Hãy bắt đầu câu chuyện ngọt ngào tại đây nhé! 🥰
                  </p>
                )}
              </div>

              {/* Compose comment form */}
              <form onSubmit={handleSendComment} className="mt-4 pt-3 border-t border-[var(--color-border)]/40 flex gap-2">
                <input
                  type="text"
                  placeholder="Để lại lời nhắn dễ thương..."
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  maxLength={80}
                  className="flex-1 rounded-full border border-[var(--color-border)] bg-[var(--color-soft)]/50 px-3 py-1.5 text-xs font-semibold outline-none focus:border-[var(--color-primary)]"
                />
                <button
                  type="submit"
                  disabled={!newCommentText.trim()}
                  className="rounded-full bg-[var(--color-primary)] px-4 py-1.5 text-xs font-black text-white hover:bg-[var(--color-primary-hover)] transition active:scale-95 disabled:opacity-50"
                >
                  Gửi
                </button>
              </form>

            </div>

          </div>
        </div>
      )}

      {/* ══ CINEMATIC SLIDESHOW — VINYL STYLE ══ */}
      {isOpenSlideshow && filteredPhotos.length > 0 && (() => {
        const currentPhoto = filteredPhotos[activeSlideshowIndex];
        const prevPhoto = prevSlideshowIndex !== null ? filteredPhotos[prevSlideshowIndex] : null;
        const caption = parsePhotoCaption(currentPhoto.caption);
        const arcR = 72;
        const arcCirc = 2 * Math.PI * arcR;
        const arcOffset = arcCirc * (1 - slideshowProgress / 100);

        const getCardStyle = (index: number) => {
          const len = filteredPhotos.length;
          let diff = index - activeSlideshowIndex;
          if (diff > len / 2) diff -= len;
          if (diff < -len / 2) diff += len;

          let translateY = "0px";
          let scale = 1;
          let rotate = "0deg";
          let opacity = 0;
          let zIndex = 0;
          let pointerEvents: "auto" | "none" = "none";

          if (diff === 0) {
            translateY = "0px";
            scale = 1;
            rotate = "0deg";
            opacity = 1;
            zIndex = 20;
            pointerEvents = "auto";
          } else if (diff === -1) {
            translateY = "-55%";
            scale = 0.78;
            rotate = "-6deg";
            opacity = 0.45;
            zIndex = 10;
            pointerEvents = "auto";
          } else if (diff === 1) {
            translateY = "55%";
            scale = 0.78;
            rotate = "6deg";
            opacity = 0.45;
            zIndex = 10;
            pointerEvents = "auto";
          } else if (diff === -2) {
            translateY = "-100%";
            scale = 0.6;
            rotate = "-10deg";
            opacity = 0;
            zIndex = 5;
          } else if (diff === 2) {
            translateY = "100%";
            scale = 0.6;
            rotate = "10deg";
            opacity = 0;
            zIndex = 5;
          } else {
            translateY = diff < 0 ? "-120%" : "120%";
            scale = 0.5;
            rotate = "0deg";
            opacity = 0;
            zIndex = 0;
          }

          return {
            position: "absolute" as const,
            inset: 0,
            transform: `translateY(${translateY}) scale(${scale}) rotate(${rotate})`,
            opacity,
            zIndex,
            pointerEvents,
            transition: "all 700ms cubic-bezier(0.25, 1, 0.5, 1)",
            transformOrigin: "center center",
          };
        };

        return (
          <div
            className="fixed inset-0 z-[9999] flex flex-col select-none"
            style={{ background: "linear-gradient(135deg,#0f0b2a 0%,#1a0f3a 35%,#12182e 65%,#0a0f20 100%)", overflow: "hidden" }}
          >
            {/* Starfield */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {starParticles.map((s) => (
                <div key={s.id} className="absolute rounded-full bg-white" style={{
                  left: `${s.x}%`, top: `${s.y}%`,
                  width: `${s.size}px`, height: `${s.size}px`,
                  opacity: 0.1 + (s.id % 6) * 0.05,
                  animation: `starTwinkle ${s.dur}s ${s.delay}s ease-in-out infinite alternate`,
                }} />
              ))}
            </div>

            {/* Floating hearts */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {heartParticles.map((p) => (
                <div key={p.id} className="absolute bottom-0" style={{
                  left: `${p.x}%`, fontSize: `${p.size * 0.8}rem`,
                  color: "rgba(251,113,133,0.28)",
                  animation: `slideHeartFloat ${p.dur}s ${p.delay}s ease-in infinite`,
                }}>♡</div>
              ))}
            </div>

            {/* Flying birds */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {birdParticles.map((b) => (
                <div
                  key={b.id}
                  className="absolute"
                  style={{
                    top: `${b.y}%`,
                    left: 0,
                    width: `${b.size}px`,
                    height: `${b.size}px`,
                    animation: `${b.direction === "right" ? "birdFlyRight" : "birdFlyLeft"} ${b.dur}s ${b.delay}s linear infinite`,
                  }}
                >
                  <svg
                    viewBox="0 0 100 100"
                    style={{
                      width: "100%",
                      height: "100%",
                      animation: `birdFlap ${b.flapDur}s ease-in-out infinite, birdOscillate 2.5s ease-in-out infinite alternate`,
                      transformOrigin: "center center",
                      color: "rgba(255, 255, 255, 0.28)",
                      fill: "currentColor",
                    }}
                  >
                    <path d="M10,50 Q30,20 50,45 Q70,20 90,50 Q70,40 50,48 Q30,40 10,50 Z" />
                  </svg>
                </div>
              ))}
            </div>

            {/* Shooting stars */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[1, 2, 3].map((id) => (
                <div
                  key={`shooting-${id}`}
                  className="absolute rounded-full bg-gradient-to-l from-white to-transparent"
                  style={{
                    top: `${10 + id * 15}%`,
                    right: `${15 + id * 20}%`,
                    width: "80px",
                    height: "2px",
                    transform: "rotate(-45deg)",
                    opacity: 0,
                    animation: `shootingStar ${8 + id * 4}s ${id * 3}s linear infinite`,
                    boxShadow: "0 0 8px rgba(255,255,255,0.8)",
                  }}
                />
              ))}
            </div>

            {/* PROGRESS BAR — top */}
            <div className="absolute top-0 left-0 right-0 h-[2px] z-30">
              <div style={{
                width: `${slideshowProgress}%`, height: "100%",
                background: "linear-gradient(90deg,#c084fc,#f9a8d4,#fbbf24)",
                boxShadow: "0 0 8px rgba(192,132,252,0.9)",
                transition: "width 0.05s linear",
              }} />
            </div>

            {/* TOP BAR */}
            <div className="relative z-30 flex items-center justify-between px-5 pt-4 pb-1 flex-shrink-0">
              <button
                onClick={handleCloseSlideshow}
                className="flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-black text-white/80 hover:text-white border border-white/15 bg-white/8 hover:bg-white/18 backdrop-blur-sm transition-all hover:scale-105 active:scale-95"
              >
                <X className="size-3.5" /> Đóng
              </button>

              {/* Dot indicators */}
              <div className="flex items-center gap-1.5">
                {filteredPhotos.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      if (photoTransitioning || i === activeSlideshowIndex) return;
                      setPrevSlideshowIndex(activeSlideshowIndex);
                      setActiveSlideshowIndex(i);
                      setSlideshowProgress(0);
                      setKenBurnsKey(k => k + 1);
                      setPhotoTransitioning(true);
                      setTimeout(() => { setPrevSlideshowIndex(null); setPhotoTransitioning(false); }, PHOTO_TRANSITION_DURATION);
                    }}
                    className="rounded-full transition-all"
                    style={{
                      width: i === activeSlideshowIndex ? "1.5rem" : "0.4rem",
                      height: "0.4rem",
                      background: i === activeSlideshowIndex ? "linear-gradient(90deg,#c084fc,#f9a8d4)" : "rgba(255,255,255,0.25)",
                      boxShadow: i === activeSlideshowIndex ? "0 0 8px rgba(192,132,252,0.7)" : "none",
                    }}
                  />
                ))}
              </div>

              <button
                onClick={() => setSlideshowMusicOn(m => !m)}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black text-white/70 border border-white/15 bg-white/8 hover:bg-white/18 backdrop-blur-sm transition-all"
              >
                {slideshowMusicOn ? "🎵" : "🔇"}
              </button>
            </div>

            {/* ══ MAIN: 50/50 COLUMNS ══ */}
            <div className="relative z-10 flex flex-1 min-h-0 items-center">

              {/* ─── LEFT 50%: Vinyl Player ─── */}
              <div className="flex flex-col items-center justify-center gap-4 w-1/2 h-full px-6 py-4">

                {/* Vinyl disc */}
                <div className="relative flex-shrink-0" style={{ width: 190, height: 190 }}>
                  {/* Orbit rings */}
                  {[1, 1.38, 1.70].map((scale, ri) => (
                    <div key={ri} className="absolute rounded-full border border-white/8" style={{
                      width: 190 * scale, height: 190 * scale,
                      top: "50%", left: "50%",
                      transform: `translate(-50%,-50%)`,
                      animation: ri > 0 ? `orbitPulse ${3.5 + ri * 1.5}s ease-in-out infinite alternate` : "none",
                    }} />
                  ))}

                  {/* SVG progress arc */}
                  <svg width="190" height="190" className="absolute inset-0" style={{ transform: "rotate(-90deg)" }}>
                    <circle cx="95" cy="95" r={arcR} stroke="rgba(255,255,255,0.07)" strokeWidth="3.5" fill="none" />
                    <circle cx="95" cy="95" r={arcR}
                      stroke="url(#vinylArc2)" strokeWidth="3.5" fill="none"
                      strokeLinecap="round" strokeDasharray={arcCirc}
                      strokeDashoffset={arcOffset}
                      style={{ transition: "stroke-dashoffset 0.08s linear" }}
                    />
                    <defs>
                      <linearGradient id="vinylArc2" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#c084fc" />
                        <stop offset="100%" stopColor="#fbbf24" />
                      </linearGradient>
                    </defs>
                  </svg>

                  {/* Vinyl disc — ALWAYS spinning */}
                  <div className="absolute inset-0 rounded-full overflow-hidden" style={{
                    background: "radial-gradient(circle at 50% 50%,#2d1b69 0%,#1a0f3a 42%,#0f0b20 100%)",
                    boxShadow: "0 0 40px rgba(192,132,252,0.22), inset 0 0 24px rgba(0,0,0,0.5)",
                    animation: "vinylSpin 4s linear infinite",
                  }}>
                    {[38, 52, 65, 77].map((r, i) => (
                      <div key={i} className="absolute rounded-full border border-white/5"
                        style={{ width: r*2, height: r*2, top: "50%", left: "50%", transform: "translate(-50%,-50%)" }}
                      />
                    ))}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full"
                      style={{ background: "radial-gradient(circle,#fbbf24 0%,#f59e0b 100%)", boxShadow: "0 0 12px rgba(251,191,36,0.85)" }}
                    />
                  </div>

                  {/* Orbiting satellite dots */}
                  <div style={{
                    position: "absolute", top: "50%", left: "50%",
                    width: 8, height: 8, marginTop: -4, marginLeft: -4,
                    borderRadius: "50%", background: "#fbbf24",
                    boxShadow: "0 0 8px rgba(251,191,36,0.95)",
                    transformOrigin: "center center",
                    animation: "orbitDot1 6s linear infinite",
                  }} />
                  <div style={{
                    position: "absolute", top: "50%", left: "50%",
                    width: 6, height: 6, marginTop: -3, marginLeft: -3,
                    borderRadius: "50%", background: "#c084fc",
                    boxShadow: "0 0 6px rgba(192,132,252,0.95)",
                    transformOrigin: "center center",
                    animation: "orbitDot2 9s linear infinite",
                  }} />
                </div>

                {/* Song info */}
                <div className="text-center" style={{ maxWidth: 220 }}>
                  <p className="font-black leading-snug" style={{
                    fontSize: "clamp(0.78rem,1.6vw,0.92rem)",
                    color: "rgba(255,255,255,0.92)", fontStyle: "italic",
                    textShadow: "0 2px 12px rgba(192,132,252,0.5)",
                  }}>
                    {customMusicName}
                  </p>
                  <p className="mt-0.5 text-[10px] font-bold tracking-[0.22em] uppercase" style={{ color: "rgba(192,132,252,0.65)" }}>
                    HỒI ỨC
                  </p>
                  <div className="my-2 h-px" style={{ background: "linear-gradient(90deg,transparent,rgba(192,132,252,0.35),transparent)" }} />

                  {/* Upload music */}
                  <label className="inline-flex items-center gap-1.5 cursor-pointer rounded-full border border-purple-400/35 bg-purple-900/30 hover:bg-purple-800/45 px-3.5 py-1.5 text-xs font-black transition-all hover:scale-105" style={{ color: "rgba(216,180,254,0.9)" }}>
                    ♪ Tải nhạc lên
                    <input ref={musicInputRef} type="file" accept="audio/*" className="hidden" onChange={handleMusicUpload} />
                  </label>
                </div>
              </div>

              {/* ─── RIGHT 50%: Photo + Caption ─── */}
              <div className="flex flex-col items-center justify-center w-1/2 h-full px-6 py-4 gap-4">

                {/* Photo frame container — no overflow hidden, with perspective */}
                <div
                  className="relative flex-shrink-0"
                  style={{
                    width: "100%", maxWidth: 460,
                    height: "clamp(230px, 44vh, 370px)",
                    perspective: "1000px",
                  }}
                >
                  {filteredPhotos.map((photo, index) => {
                    const cardStyle = getCardStyle(index);
                    const isCurrent = index === activeSlideshowIndex;
                    const diff = index - activeSlideshowIndex;
                    const shortestDiff = (() => {
                      const len = filteredPhotos.length;
                      let d = diff;
                      if (d > len / 2) d -= len;
                      if (d < -len / 2) d += len;
                      return d;
                    })();

                    return (
                      <div
                        key={photo.id}
                        onClick={() => {
                          if (shortestDiff === -1) handlePrevSlide();
                          if (shortestDiff === 1) handleNextSlide();
                        }}
                        style={{
                          ...cardStyle,
                          cursor: shortestDiff !== 0 ? "pointer" : "default",
                          boxShadow: isCurrent
                            ? "0 0 55px rgba(192,132,252,0.22), 0 24px 50px rgba(0,0,0,0.6)"
                            : "0 10px 25px rgba(0,0,0,0.4)",
                        }}
                        className="absolute inset-0 rounded-2xl overflow-hidden border border-white/10 bg-black"
                      >
                        {/* The photo image */}
                        <img
                          src={resolveDirectImageUrl(photo.image_url)}
                          alt="Slideshow Memory"
                          onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=600"; }}
                          style={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            animation: isCurrent && slideshowPlaying && !photoTransitioning
                              ? `photoPanDown ${SLIDE_DURATION}ms linear infinite alternate`
                              : "none",
                          }}
                        />

                        {/* Vignette */}
                        <div className="absolute inset-0 pointer-events-none" style={{
                          background: "radial-gradient(ellipse at center,transparent 45%,rgba(0,0,0,0.5) 100%)",
                        }} />

                        {/* Location badge */}
                        {isCurrent && photo.location && (
                          <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-black/45 backdrop-blur-sm px-2.5 py-1 text-[10px] font-bold text-white/80 border border-white/10" style={{ zIndex: 4 }}>
                            <MapPin className="size-3 text-purple-300" /> {photo.location}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Caption */}
                <div
                  key={`cap-${activeSlideshowIndex}`}
                  className="text-center flex-shrink-0"
                  style={{ animation: `slideCaptionIn 0.6s ${PHOTO_TRANSITION_DURATION}ms ease both`, maxWidth: 420 }}
                >
                  <p className="font-black leading-relaxed" style={{
                    fontSize: "clamp(0.85rem,1.8vw,1.05rem)",
                    fontStyle: "italic",
                    color: "rgba(255,255,255,0.9)",
                    textShadow: "0 2px 14px rgba(192,132,252,0.4)",
                  }}>
                    &ldquo;{caption.text || "Mỗi tấm ảnh là một trang nhật ký không lời..."}&rdquo;
                  </p>
                  <p className="mt-1.5 text-xs font-bold tracking-[0.22em]" style={{ color: "rgba(192,132,252,0.55)" }}>
                    — ký niệm —
                  </p>
                  <div className="mt-2 mx-auto h-0.5 rounded-full" style={{ maxWidth: 100, background: "linear-gradient(90deg,transparent,rgba(251,191,36,0.55),transparent)" }} />
                </div>
              </div>

            </div>{/* end 50/50 columns */}
          </div>
        );
      })()}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="Xác nhận xóa"
        cancelText="Hủy"
        isDangerous={true}
      />
    </div>
  );
}
