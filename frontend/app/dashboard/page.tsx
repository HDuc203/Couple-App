import { DashboardHome } from "@/components/dashboard/DashboardHome";
import { AppShell } from "@/components/layout/AppShell";
import { getCurrentCouple, getPartnerProfile } from "@/lib/couple";
import { requireOnboardedProfile } from "@/lib/onboarding";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getSearchValue(
  params: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { user, profile, supabase } = await requireOnboardedProfile();
  const currentCouple = await getCurrentCouple(user.id);
  const queryErrors: string[] = [];
  const actionError = getSearchValue(params, "error");

  if (actionError) {
    queryErrors.push(actionError);
  }

  const latestMoodResult = await supabase
    .from("mood_logs")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestMoodResult.error) {
    queryErrors.push(`mood_logs: ${latestMoodResult.error.message}`);
  }

  let latestLoveNote = null;
  let nextBucketItem = null;
  let partnerProfile = null;
  let partnerLatestMood = null;
  let notebookNotes: import("@/types/database").Tables<"partner_notes">[] = [];

  if (currentCouple) {
    try {
      partnerProfile = await getPartnerProfile(user.id, currentCouple.couple.id);
      if (partnerProfile) {
        const partnerMoodResult = await supabase
          .from("mood_logs")
          .select("*")
          .eq("user_id", partnerProfile.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (partnerMoodResult.error) {
          queryErrors.push(`partner_mood: ${partnerMoodResult.error.message}`);
        } else {
          partnerLatestMood = partnerMoodResult.data;
        }
      }
    } catch (error) {
      queryErrors.push(
        `partner_profile: ${
          error instanceof Error ? error.message : "Không thể tải người ấy"
        }`,
      );
    }

    const latestLoveNoteResult = await supabase
      .from("love_notes")
      .select("*")
      .eq("couple_id", currentCouple.couple.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestLoveNoteResult.error) {
      queryErrors.push(`love_notes: ${latestLoveNoteResult.error.message}`);
    }

    latestLoveNote = latestLoveNoteResult.data;

    const nextBucketItemResult = await supabase
      .from("bucket_list")
      .select("*")
      .eq("couple_id", currentCouple.couple.id)
      .eq("is_completed", false)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (nextBucketItemResult.error) {
      queryErrors.push(`bucket_list: ${nextBucketItemResult.error.message}`);
    }

    nextBucketItem = nextBucketItemResult.data;

    // Fetch special dates for countdown & theme styling
    const specialDatesResult = await supabase
      .from("special_dates")
      .select("*")
      .eq("couple_id", currentCouple.couple.id)
      .order("date", { ascending: true });

    if (specialDatesResult.error) {
      queryErrors.push(`special_dates: ${specialDatesResult.error.message}`);
    }

    // Fetch period tracking setup status
    const periodTrackingResult = await supabase
      .from("period_tracking")
      .select("*");

    if (periodTrackingResult.error) {
      queryErrors.push(`period_tracking: ${periodTrackingResult.error.message}`);
    }

    // Fetch partner_notes for notebook preview
    const notebookNotesResult = await supabase
      .from("partner_notes")
      .select("*")
      .eq("couple_id", currentCouple.couple.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (notebookNotesResult.error) {
      queryErrors.push(`partner_notes: ${notebookNotesResult.error.message}`);
    } else {
      notebookNotes = notebookNotesResult.data || [];
    }

    return (
      <AppShell active="dashboard" profile={profile}>
        <DashboardHome
          profile={profile}
          currentCouple={currentCouple}
          partnerProfile={partnerProfile}
          latestMood={latestMoodResult.data}
          partnerLatestMood={partnerLatestMood}
          latestLoveNote={latestLoveNote}
          nextBucketItem={nextBucketItem}
          specialDates={specialDatesResult.data || []}
          periodLogs={periodTrackingResult.data || []}
          notebookNotes={notebookNotes}
          queryError={queryErrors.length > 0 ? queryErrors.join(" | ") : undefined}
        />
      </AppShell>
    );
  }

  return (
    <AppShell active="dashboard" profile={profile}>
      <DashboardHome
        profile={profile}
        currentCouple={currentCouple}
        partnerProfile={partnerProfile}
        latestMood={latestMoodResult.data}
        partnerLatestMood={partnerLatestMood}
        latestLoveNote={latestLoveNote}
        nextBucketItem={nextBucketItem}
        specialDates={[]}
        periodLogs={[]}
        notebookNotes={[]}
        queryError={queryErrors.length > 0 ? queryErrors.join(" | ") : undefined}
      />
    </AppShell>
  );

}
