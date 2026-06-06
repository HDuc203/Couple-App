import { AppShell } from "@/components/layout/AppShell";
import { requireOnboardedProfile } from "@/lib/onboarding";
import { getCurrentCouple, getPartnerProfile } from "@/lib/couple";
import { FutureSpace } from "@/components/future/FutureSpace";
import type { Tables } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function FuturePage() {
  const { user, profile, supabase } = await requireOnboardedProfile();
  const currentCouple = await getCurrentCouple(user.id);

  let partnerProfile = null;
  let bucketItems: Tables<"bucket_list">[] = [];
  const queryErrors: string[] = [];

  if (currentCouple) {
    const coupleId = currentCouple.couple.id;

    // Fetch partner profile
    try {
      partnerProfile = await getPartnerProfile(user.id, coupleId);
    } catch (error) {
      console.error("Lỗi khi tải thông tin đối phương:", error);
    }

    // Fetch bucket list items
    const { data, error } = await supabase
      .from("bucket_list")
      .select("*")
      .eq("couple_id", coupleId)
      .order("created_at", { ascending: false });

    if (error) {
      queryErrors.push(`bucket_list: ${error.message}`);
    } else {
      bucketItems = data || [];
    }
  }

  return (
    <AppShell active="future" profile={profile}>
      <FutureSpace
        profile={profile}
        currentCouple={currentCouple}
        partnerProfile={partnerProfile}
        initialItems={bucketItems}
        queryError={queryErrors.join(" | ")}
      />
    </AppShell>
  );
}
