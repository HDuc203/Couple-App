import { AppShell } from "@/components/layout/AppShell";
import { requireOnboardedProfile } from "@/lib/onboarding";
import { getCurrentCouple, getPartnerProfile } from "@/lib/couple";
import { JournalSpace } from "@/components/journal/JournalSpace";
import type { Tables } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function JournalPage() {
  const { user, profile, supabase } = await requireOnboardedProfile();
  const currentCouple = await getCurrentCouple(user.id);

  let partnerProfile = null;
  let journalEntries: Tables<"diary_entries">[] = [];
  const queryErrors: string[] = [];

  if (currentCouple) {
    const coupleId = currentCouple.couple.id;

    // Fetch partner profile
    try {
      partnerProfile = await getPartnerProfile(user.id, coupleId);
    } catch (error) {
      console.error("Lỗi khi tải thông tin đối phương:", error);
    }

    // Fetch all journal entries for this couple
    const { data, error } = await supabase
      .from("diary_entries")
      .select("*")
      .eq("couple_id", coupleId)
      .order("created_at", { ascending: false });

    if (error) {
      queryErrors.push(`diary_entries: ${error.message}`);
    } else {
      journalEntries = data || [];
    }
  }

  return (
    <AppShell active="journal" profile={profile}>
      <JournalSpace
        profile={profile}
        currentCouple={currentCouple}
        partnerProfile={partnerProfile}
        initialEntries={journalEntries}
        queryError={queryErrors.join(" | ")}
      />
    </AppShell>
  );
}
