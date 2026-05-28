"use server";

import { redirect } from "next/navigation";
import { getOrCreateCurrentProfile } from "@/lib/onboarding";
import type { TablesUpdate } from "@/types/database";

const allowedGenders = new Set(["female", "male", "other"]);
const allowedThemes = new Set(["pink", "gold"]);

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function optionalString(formData: FormData, key: string) {
  const value = getString(formData, key);
  return value.length > 0 ? value : null;
}

function redirectWithError(message: string): never {
  const params = new URLSearchParams({
    error: message,
  });
  redirect(`/onboarding/profile?${params.toString()}`);
}

function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export async function completeProfileOnboardingAction(formData: FormData) {
  const { user, supabase } = await getOrCreateCurrentProfile();
  const fullName = getString(formData, "full_name");
  const displayName = getString(formData, "display_name");
  const birthday = getString(formData, "birthday");
  const gender = getString(formData, "gender");
  const themePreference = getString(formData, "theme_preference");

  if (!fullName) {
    redirectWithError("Vui lòng nhập họ và tên.");
  }

  if (!displayName) {
    redirectWithError("Vui lòng nhập tên hiển thị.");
  }

  if (!birthday || !isIsoDate(birthday)) {
    redirectWithError("Vui lòng chọn ngày sinh hợp lệ.");
  }

  if (!allowedGenders.has(gender)) {
    redirectWithError("Vui lòng chọn giới tính.");
  }

  const update: TablesUpdate<"profiles"> = {
    full_name: fullName,
    display_name: displayName,
    nickname: optionalString(formData, "nickname"),
    phone: optionalString(formData, "phone"),
    birthday,
    gender,
    avatar_url: optionalString(formData, "avatar_url"),
    period_tracking_enabled:
      formData.get("period_tracking_enabled") === "on",
    theme_preference: allowedThemes.has(themePreference)
      ? themePreference
      : "pink",
    onboarding_completed: true,
  };

  const { error } = await supabase
    .from("profiles")
    .update(update)
    .eq("id", user.id);

  if (error) {
    redirectWithError(`Không thể lưu hồ sơ: ${error.message}`);
  }

  redirect("/dashboard");
}
