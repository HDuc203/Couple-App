import { AppShell } from "@/components/layout/AppShell";
import { LoveSpace } from "@/components/love/LoveSpace";
import { getCurrentCouple, getPartnerProfile } from "@/lib/couple";
import { requireOnboardedProfile } from "@/lib/onboarding";
import type { Tables } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function LovePage() {
  const { user, profile, supabase } = await requireOnboardedProfile();
  const currentCouple = await getCurrentCouple(user.id);

  let partnerProfile = null;
  let partnerLatestMood = null;
  let loveNotes: Tables<"love_notes">[] = [];
  let initialReactions: Tables<"love_note_reactions">[] = [];

  if (currentCouple) {
    try {
      partnerProfile = await getPartnerProfile(user.id, currentCouple.couple.id);

      if (partnerProfile) {
        // Fetch partner latest mood
        const partnerMoodResult = await supabase
          .from("mood_logs")
          .select("*")
          .eq("user_id", partnerProfile.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!partnerMoodResult.error) {
          partnerLatestMood = partnerMoodResult.data;
        }
      }

      // Fetch latest 30 love notes
      const notesResult = await supabase
        .from("love_notes")
        .select("*")
        .eq("couple_id", currentCouple.couple.id)
        .order("created_at", { ascending: false })
        .limit(30);

      if (!notesResult.error) {
        loveNotes = notesResult.data ?? [];
      }

      // Fetch reactions for all love notes of this couple
      if (loveNotes.length > 0) {
        const noteIds = loveNotes.map((n) => n.id);
        const reactionsResult = await supabase
          .from("love_note_reactions")
          .select("*")
          .in("love_note_id", noteIds);

        if (!reactionsResult.error) {
          initialReactions = reactionsResult.data ?? [];
        }
      }
    } catch (error) {
      console.error("LỖI LOAD DỮ LIỆU TÌNH YÊU:", error);
    }
  }

  return (
    <AppShell active="love" profile={profile}>
      <LoveSpace
        profile={profile}
        currentCouple={currentCouple}
        partnerProfile={partnerProfile}
        initialPartnerMood={partnerLatestMood}
        initialLoveNotes={loveNotes}
        initialReactions={initialReactions}
      />
    </AppShell>
  );
}
