import { AppShell } from "@/components/layout/AppShell";
import { SettingsView } from "@/components/settings/SettingsView";
import { getCurrentCouple, getPartnerProfile } from "@/lib/couple";
import { requireOnboardedProfile } from "@/lib/onboarding";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SettingsPage({ searchParams }: PageProps) {
  const { user, profile } = await requireOnboardedProfile();
  const currentCouple = await getCurrentCouple(user.id);
  const partner = currentCouple ? await getPartnerProfile(user.id, currentCouple.couple.id) : null;

  return (
    <AppShell active="settings" profile={profile}>
      <Suspense fallback={
        <div className="flex h-48 items-center justify-center text-[var(--color-muted)]">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent" />
        </div>
      }>
        <SettingsView
          profile={profile}
          currentCouple={currentCouple}
          partner={partner}
        />
      </Suspense>
    </AppShell>
  );
}
