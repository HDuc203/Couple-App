"use client";

import { useState, useEffect, useTransition } from "react";
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
    setAlbums(initialAlbums);
  }, [initialAlbums]);

  useEffect(() => {
    setPhotos(initialPhotos);
  }, [initialPhotos]);

  // Real-time synchronization
  useEffect(() => {
    if (!coupleId) return;

    const supabase = createClient();

    // Subscribe to photo albums channel
    const albumsChannel = supabase
      .channel(`photo_albums_sync:${coupleId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "photo_albums",
          filter: `couple_id=eq.${coupleId}`,
        },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            const newAlbum = payload.new as Tables<"photo_albums">;
            setAlbums((prev) => [newAlbum, ...prev]);
          } else if (payload.eventType === "DELETE") {
            const deleted = payload.old as { id: string };
            setAlbums((prev) => prev.filter((item) => item.id !== deleted.id));
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
      .channel(`photos_sync:${coupleId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "photos",
          filter: `couple_id=eq.${coupleId}`,
        },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            const newPhoto = payload.new as Tables<"photos">;
            setPhotos((prev) => [newPhoto, ...prev]);
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
  }, [coupleId]);

  // Create new photo album
  const handleCreateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coupleId || !albumTitle.trim()) {
      setAlbumError("Vui lòng nhập tên album hồi ức.");
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.from("photo_albums").insert({
      couple_id: coupleId,
      title: albumTitle.trim(),
      created_by: profile.id,
    });

    if (error) {
      setAlbumError(`Không thể tạo album: ${error.message}`);
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
    const supabase = createClient();

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
      message: "Bạn có chắc chắn muốn xóa album này? Lưu ý: Các bức ảnh trong album sẽ KHÔNG bị xóa mà sẽ chuyển về trạng thái Chưa phân mục.",
      onConfirm: async () => {
        const supabase = createClient();
        const { error } = await supabase.from("photo_albums").delete().eq("id", albumId);
        if (error) {
          alert(`Không thể xóa album: ${error.message}`);
        } else {
          // Cập nhật state ngay lập tức
          setAlbums((prev) => prev.filter((a) => a.id !== albumId));
          // Nếu đang xem album vừa xóa → về "all"
          setSelectedAlbumId((current) => current === albumId ? "all" : current);
          // Ảnh trong album đó → album_id sẽ null (DB CASCADE), cập nhật local
          setPhotos((prev) => prev.map((p) => p.album_id === albumId ? { ...p, album_id: null } : p));
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

  // Start Playback Slideshow
  const startSlideshow = () => {
    if (filteredPhotos.length === 0) return;
    setActiveSlideshowIndex(0);
    setIsOpenSlideshow(true);
  };

  const handleNextSlide = () => {
    setActiveSlideshowIndex((prev) => (prev + 1) % filteredPhotos.length);
  };

  const handlePrevSlide = () => {
    setActiveSlideshowIndex((prev) => (prev - 1 + filteredPhotos.length) % filteredPhotos.length);
  };

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
                        <img src={src} className="h-full w-full object-cover" alt="sample" />
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

      {/* FULLSCREEN PLAYBACK SLIDESHOW INTERACTIVE CAROUSEL */}
      {isOpenSlideshow && filteredPhotos.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in">

          <button
            onClick={() => setIsOpenSlideshow(false)}
            className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition z-10"
          >
            <X className="size-5" />
          </button>

          <div className="relative w-full max-w-3xl aspect-[4/3] flex items-center justify-center p-4">

            {/* Slide Image */}
            <div className="w-full h-full flex flex-col items-center justify-center">

              <img
                src={resolveDirectImageUrl(filteredPhotos[activeSlideshowIndex].image_url)}
                alt="Slideshow slide"
                className="max-h-[70vh] max-w-full object-contain rounded-2xl border border-white/10 shadow-2xl animate-fade-in"
                key={activeSlideshowIndex} // Key forces fade restart on change
              />

              {/* Chú thích bottom overlay info */}
              <div className="mt-4 text-center text-white/95 max-w-lg">
                <p className="text-xs font-bold text-white/60 mb-0.5">
                  TẤM ẢNH {activeSlideshowIndex + 1} TRÊN {filteredPhotos.length}
                </p>
                <h3 className="text-sm font-black italic">
                  "{parsePhotoCaption(filteredPhotos[activeSlideshowIndex].caption).text || "Hồi ức ngọt ngào chung..."}"
                </h3>
                {filteredPhotos[activeSlideshowIndex].location && (
                  <p className="text-[10px] text-teal-300 font-bold flex items-center justify-center gap-0.5 mt-1">
                    <MapPin className="size-3" /> {filteredPhotos[activeSlideshowIndex].location}
                  </p>
                )}
              </div>

            </div>

            {/* Slideshow Arrows navigations */}
            <button
              onClick={handlePrevSlide}
              className="absolute left-4 p-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-black transition-all hover:scale-105 active:scale-95"
            >
              ❮
            </button>
            <button
              onClick={handleNextSlide}
              className="absolute right-4 p-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-black transition-all hover:scale-105 active:scale-95"
            >
              ❯
            </button>

          </div>

        </div>
      )}

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
