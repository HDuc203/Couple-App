import { redirect } from "next/navigation";
import { getCurrentProfile, requireUser } from "@/lib/auth";
import { ensureProfileForUser, type Profile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";

export function isProfileOnboardingComplete(profile: Profile | null) {
  if (!profile) {
    return false;
  }

  return Boolean(
    profile.onboarding_completed &&
      profile.full_name?.trim() &&
      profile.display_name?.trim() &&
      profile.birthday &&
      profile.gender?.trim(),
  );
}

export async function getOrCreateCurrentProfile() {
  const user = await requireUser();
  const supabase = await createClient();
  const profile =
    (await getCurrentProfile(user.id)) ??
    (await ensureProfileForUser(supabase, user));

  return {
    user,
    profile,
    supabase,
  };
}

export async function requireOnboardedProfile() {
  const result = await getOrCreateCurrentProfile();

  if (!isProfileOnboardingComplete(result.profile)) {
    redirect("/onboarding/profile");
  }

  return result;
}
