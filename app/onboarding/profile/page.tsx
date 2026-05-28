import { redirect } from "next/navigation";
import { ProfileOnboardingForm } from "@/components/onboarding/ProfileOnboardingForm";
import {
  getOrCreateCurrentProfile,
  isProfileOnboardingComplete,
} from "@/lib/onboarding";

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

export default async function OnboardingProfilePage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const { profile } = await getOrCreateCurrentProfile();

  if (isProfileOnboardingComplete(profile)) {
    redirect("/dashboard");
  }

  return (
    <ProfileOnboardingForm
      profile={profile}
      error={getSearchValue(params, "error")}
    />
  );
}
