import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database, Tables } from "@/types/database";

export type Profile = Tables<"profiles">;
export type ThemePreference = "pink" | "gold";

export function displayNameFromEmail(email: string | null | undefined) {
  if (!email) {
    return "Người thương";
  }

  const [name] = email.split("@");
  return name?.trim() || "Người thương";
}

export async function ensureProfileForUser(
  supabase: SupabaseClient<Database>,
  user: User,
  displayName?: string,
) {
  const email = user.email ?? "";
  const fallbackName = displayNameFromEmail(email);

  const { data: existingProfile, error: existingError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existingProfile) {
    return existingProfile;
  }

  const { data, error } = await supabase
    .from("profiles")
    .insert(
      {
        id: user.id,
        email,
        display_name: displayName?.trim() || fallbackName,
        onboarding_completed: false,
      },
    )
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
