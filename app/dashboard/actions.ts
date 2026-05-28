"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentCouple } from "@/lib/couple";
import { requireOnboardedProfile } from "@/lib/onboarding";

const moods = new Set(["Vui", "Yêu", "Mệt", "Nhớ"]);

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function logMoodAction(formData: FormData) {
  const mood = getString(formData, "mood");

  if (!moods.has(mood)) {
    redirect("/dashboard?error=Mood không hợp lệ");
  }

  const { user, supabase } = await requireOnboardedProfile();
  const currentCouple = await getCurrentCouple(user.id);
  const { error } = await supabase.from("mood_logs").insert({
    user_id: user.id,
    couple_id: currentCouple?.couple.id ?? null,
    mood,
  });

  if (error) {
    redirect(`/dashboard?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
