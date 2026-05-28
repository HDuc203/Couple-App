import { AppShell } from "@/components/layout/AppShell";
import { SettingsView } from "@/components/settings/SettingsView";
import { getCurrentCouple } from "@/lib/couple";
import { requireOnboardedProfile } from "@/lib/onboarding";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SettingsPage({ searchParams }: PageProps) {
  const { user, profile } = await requireOnboardedProfile();
  const currentCouple = await getCurrentCouple(user.id);

  return (
    <AppShell active="settings" profile={profile}>
      <SettingsView
        profile={profile}
        currentCouple={currentCouple}
      />
    </AppShell>
  );
}
