import { AppShell } from "@/components/layout/AppShell";
import { requireOnboardedProfile } from "@/lib/onboarding";
import { getCurrentCouple, getPartnerProfile } from "@/lib/couple";
import { RelationshipCalendar } from "@/components/calendar/RelationshipCalendar";
import type { Tables } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const { user, profile, supabase } = await requireOnboardedProfile();
  const currentCouple = await getCurrentCouple(user.id);

  let partnerProfile = null;
  let specialDates: Tables<"special_dates">[] = [];
  let periodLogs: Tables<"period_tracking">[] = [];
  let timelineItems: Tables<"relationship_timeline">[] = [];
  let bucketItems: Tables<"bucket_list">[] = [];
  let journalEntries: Tables<"diary_entries">[] = [];
  let photos: Tables<"photos">[] = [];
  const queryErrors: string[] = [];

  // Fetch current user's period tracking data
  const userPeriodResult = await supabase
    .from("period_tracking")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (userPeriodResult.error) {
    queryErrors.push(`user_period: ${userPeriodResult.error.message}`);
  } else if (userPeriodResult.data) {
    periodLogs.push(userPeriodResult.data);
  }

  if (currentCouple) {
    const coupleId = currentCouple.couple.id;

    // Fetch partner profile
    try {
      partnerProfile = await getPartnerProfile(user.id, coupleId);
    } catch (error) {
      console.error("Lỗi tải thông tin đối phương:", error);
    }

    if (partnerProfile) {
      // Fetch partner's period tracking data if shared
      const partnerPeriodResult = await supabase
        .from("period_tracking")
        .select("*")
        .eq("user_id", partnerProfile.id)
        .eq("share_with_partner", true)
        .maybeSingle();

      if (partnerPeriodResult.data) {
        periodLogs.push(partnerPeriodResult.data);
      }
    }

    // Fetch special dates
    const specialDatesResult = await supabase
      .from("special_dates")
      .select("*")
      .eq("couple_id", coupleId)
      .order("date", { ascending: true });

    if (specialDatesResult.error) {
      queryErrors.push(`special_dates: ${specialDatesResult.error.message}`);
    } else {
      specialDates = specialDatesResult.data || [];
    }

    // Fetch timeline logs
    const timelineResult = await supabase
      .from("relationship_timeline")
      .select("*")
      .eq("couple_id", coupleId)
      .order("created_at", { ascending: false });

    if (timelineResult.error) {
      queryErrors.push(`relationship_timeline: ${timelineResult.error.message}`);
    } else {
      timelineItems = timelineResult.data || [];
    }

    // Fetch bucket list items
    const bucketResult = await supabase
      .from("bucket_list")
      .select("*")
      .eq("couple_id", coupleId);

    if (!bucketResult.error) {
      bucketItems = bucketResult.data || [];
    }

    // Fetch journals
    const journalsResult = await supabase
      .from("diary_entries")
      .select("*")
      .eq("couple_id", coupleId);

    if (!journalsResult.error) {
      journalEntries = journalsResult.data || [];
    }

    // Fetch photos
    const photosResult = await supabase
      .from("photos")
      .select("*")
      .eq("couple_id", coupleId);

    if (!photosResult.error) {
      photos = photosResult.data || [];
    }
  }

  return (
    <AppShell active="calendar" profile={profile}>
      <RelationshipCalendar
        profile={profile}
        currentCouple={currentCouple}
        partnerProfile={partnerProfile}
        initialSpecialDates={specialDates}
        initialPeriodLogs={periodLogs}
        initialTimelineItems={timelineItems}
        initialBucketItems={bucketItems}
        initialJournalEntries={journalEntries}
        initialPhotos={photos}
        queryError={queryErrors.join(" | ")}
      />
    </AppShell>
  );
}
