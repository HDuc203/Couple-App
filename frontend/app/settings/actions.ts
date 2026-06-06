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

function redirectToSettings(type: "error" | "message", message: string, tab: string = "couple"): never {
  const params = new URLSearchParams({
    tab,
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
  const gender = optionalString(formData, "gender");
  const birthday = optionalString(formData, "birthday");

  // Validate birthday not in future
  if (birthday) {
    const birthDate = new Date(birthday);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (birthDate > today) {
      redirectToSettings("error", "Ngày sinh không thể ở tương lai.", "profile");
    }
  }

  const update: TablesInsert<"profiles"> = {
    id: user.id,
    email: user.email ?? "",
    display_name: displayName,
    avatar_url: optionalString(formData, "avatar_url"),
    birthday: birthday,
    gender: gender,
    period_tracking_enabled:
      gender === "female" ? (formData.get("period_tracking_enabled") === "on") : false,
    theme_preference: themePreference === "gold" ? "gold" : "pink",
  };

  const { error } = await supabase.from("profiles").upsert(update, {
    onConflict: "id",
  });

  if (error) {
    redirectToSettings("error", `Không thể lưu hồ sơ: ${error.message}`, "profile");
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  redirectToSettings("message", "Đã lưu hồ sơ.", "profile");
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

  if (loveStartDate) {
    const lDate = new Date(loveStartDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (lDate > today) {
      redirectToSettings("error", "Ngày bắt đầu yêu không thể ở tương lai.");
    }
  }

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
    redirectToSettings("error", "Bạn đã có kết nối cặp đôi rồi.");
  }

  // Check if trying to use own invite code
  const { data: ownCouple } = await supabase
    .from("couples")
    .select("invite_code")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (ownCouple && ownCouple.invite_code === inviteCode) {
    redirectToSettings("error", "Không thể sử dụng mã mời của chính mình.");
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

  const loveStartDate = optionalString(formData, "love_start_date");
  if (loveStartDate) {
    const lDate = new Date(loveStartDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (lDate > today) {
      redirectToSettings("error", "Ngày bắt đầu yêu không thể ở tương lai.");
    }
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("couples")
    .update({
      love_start_date: loveStartDate,
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

  // Find the couple this user is in
  const { data: member } = await supabase
    .from("couple_members")
    .select("couple_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (member?.couple_id) {
    // Delete all memberships for this couple to disconnect both partners
    const { error } = await supabase
      .from("couple_members")
      .delete()
      .eq("couple_id", member.couple_id);

    if (error) {
      redirectToSettings("error", `Không thể hủy kết nối: ${error.message}`);
    }

    // Also delete the couple record itself to clean up
    await supabase.from("couples").delete().eq("id", member.couple_id);
  } else {
    // If not in couple_members, check if they own an empty couple
    const { data: ownCouple } = await supabase
      .from("couples")
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle();
    if (ownCouple) {
      await supabase.from("couples").delete().eq("id", ownCouple.id);
    }
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  redirectToSettings("message", "Đã hủy kết nối cặp đôi.");
}
