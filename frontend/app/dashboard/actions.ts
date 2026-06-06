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
  const todayStr = new Date().toISOString().split("T")[0];
  const { error } = await supabase.from("mood_logs").upsert({
    user_id: user.id,
    couple_id: currentCouple?.couple.id ?? null,
    mood,
    date_key: todayStr,
    created_at: new Date().toISOString()
  }, { onConflict: "user_id,couple_id,date_key" });

  if (error) {
    redirect(`/dashboard?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
