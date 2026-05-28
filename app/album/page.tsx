import { AppShell } from "@/components/layout/AppShell";
import { requireOnboardedProfile } from "@/lib/onboarding";
import { getCurrentCouple, getPartnerProfile } from "@/lib/couple";
import { AlbumSpace } from "@/components/album/AlbumSpace";

export const dynamic = "force-dynamic";

export default async function AlbumPage() {
  const { user, profile, supabase } = await requireOnboardedProfile();
  const currentCouple = await getCurrentCouple(user.id);

  let partnerProfile = null;
  let albums: any[] = [];
  let photos: any[] = [];
  const queryErrors: string[] = [];

  if (currentCouple) {
    const coupleId = currentCouple.couple.id;

    // Fetch partner profile
    try {
      partnerProfile = await getPartnerProfile(user.id, coupleId);
    } catch (error) {
      console.error("Lỗi khi tải thông tin đối phương:", error);
    }

    // Fetch albums
    const albumsResult = await supabase
      .from("photo_albums")
      .select("*")
      .eq("couple_id", coupleId)
      .order("created_at", { ascending: false });

    if (albumsResult.error) {
      queryErrors.push(`photo_albums: ${albumsResult.error.message}`);
    } else {
      albums = albumsResult.data || [];
    }

    // Fetch photos
    const photosResult = await supabase
      .from("photos")
      .select("*")
      .eq("couple_id", coupleId)
      .order("created_at", { ascending: false });

    if (photosResult.error) {
      queryErrors.push(`photos: ${photosResult.error.message}`);
    } else {
      photos = photosResult.data || [];
    }
  }

  return (
    <AppShell active="album" profile={profile}>
      <AlbumSpace
        profile={profile}
        currentCouple={currentCouple}
        partnerProfile={partnerProfile}
        initialAlbums={albums}
        initialPhotos={photos}
        queryError={queryErrors.join(" | ")}
      />
    </AppShell>
  );
}
