"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentCouple } from "@/lib/couple";
import { requireUser } from "@/lib/auth";
import { createInviteCode } from "@/lib/invite";
import { ensureProfileForUser, displayNameFromEmail } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import type { TablesInsert } from "@/types/database";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function optionalString(formData: FormData, key: string) {
  const value = getString(formData, key);
  return value.length > 0 ? value : null;
}

function redirectToSettings(type: "error" | "message", message: string): never {
  const params = new URLSearchParams({
    [type]: message,
  });
  redirect(`/settings?${params.toString()}`);
}

function normalizeInviteCode(code: string) {
  return code.replace(/\s+/g, "").toUpperCase();
}

export async function updateProfileAction(formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();
  const displayName =
    getString(formData, "display_name") || displayNameFromEmail(user.email);
  const themePreference = getString(formData, "theme_preference");

  const update: TablesInsert<"profiles"> = {
    id: user.id,
    email: user.email ?? "",
    display_name: displayName,
    avatar_url: optionalString(formData, "avatar_url"),
    birthday: optionalString(formData, "birthday"),
    gender: optionalString(formData, "gender"),
    period_tracking_enabled:
      formData.get("period_tracking_enabled") === "on",
    theme_preference: themePreference === "gold" ? "gold" : "pink",
  };

  const { error } = await supabase.from("profiles").upsert(update, {
    onConflict: "id",
  });

  if (error) {
    redirectToSettings("error", `Không thể lưu hồ sơ: ${error.message}`);
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  redirectToSettings("message", "Đã lưu hồ sơ.");
}

export async function createCoupleAction(formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();

  try {
    await ensureProfileForUser(supabase, user);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Không thể tạo hồ sơ.";
    redirectToSettings("error", message);
  }

  const currentCouple = await getCurrentCouple(user.id);
  if (currentCouple) {
    redirectToSettings("message", "Bạn đã có kết nối cặp đôi rồi.");
  }

  const loveStartDate = optionalString(formData, "love_start_date");

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { data: couple, error: coupleError } = await supabase
      .from("couples")
      .insert({
        owner_id: user.id,
        invite_code: createInviteCode(),
        love_start_date: loveStartDate,
      })
      .select("id")
      .single();

    if (coupleError) {
      if (coupleError.code === "23505") {
        continue;
      }

      redirectToSettings(
        "error",
        `Không thể tạo mã kết nối: ${coupleError.message}`,
      );
    }

    const { error: memberError } = await supabase
      .from("couple_members")
      .insert({
        couple_id: couple.id,
        user_id: user.id,
        role: "owner",
      });

    if (memberError) {
      redirectToSettings(
        "error",
        `Đã tạo couple nhưng chưa gán được thành viên: ${memberError.message}`,
      );
    }

    revalidatePath("/settings");
    revalidatePath("/dashboard");
    redirectToSettings("message", "Đã tạo mã kết nối cho bạn.");
  }

  redirectToSettings("error", "Không tạo được mã duy nhất, thử lại nhé.");
}

export async function joinCoupleAction(formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();
  const inviteCode = normalizeInviteCode(getString(formData, "invite_code"));

  if (!inviteCode) {
    redirectToSettings("error", "Vui lòng nhập mã của người ấy.");
  }

  try {
    await ensureProfileForUser(supabase, user);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Không thể tạo hồ sơ.";
    redirectToSettings("error", message);
  }

  const currentCouple = await getCurrentCouple(user.id);
  if (currentCouple) {
    redirectToSettings("message", "Bạn đã có kết nối cặp đôi rồi.");
  }

  const { error: memberError } = await supabase.rpc(
    "join_couple_by_invite_code",
    {
      invite_code_input: inviteCode,
    },
  );

  if (memberError) {
    redirectToSettings("error", `Không thể kết nối: ${memberError.message}`);
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  redirectToSettings("message", "Kết nối thành công.");
}

export async function updateLoveStartDateAction(formData: FormData) {
  const user = await requireUser();
  const currentCouple = await getCurrentCouple(user.id);

  if (!currentCouple) {
    redirectToSettings("error", "Bạn chưa có couple để cập nhật ngày yêu.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("couples")
    .update({
      love_start_date: optionalString(formData, "love_start_date"),
    })
    .eq("id", currentCouple.couple.id);

  if (error) {
    redirectToSettings("error", `Không thể lưu ngày yêu: ${error.message}`);
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  redirectToSettings("message", "Đã lưu ngày bắt đầu yêu.");
}

export async function disconnectCoupleAction() {
  const user = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("couple_members")
    .delete()
    .eq("user_id", user.id);

  if (error) {
    redirectToSettings("error", `Không thể hủy kết nối: ${error.message}`);
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  redirectToSettings("message", "Đã hủy kết nối cặp đôi.");
}
