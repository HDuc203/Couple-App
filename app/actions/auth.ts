"use server";

import { redirect } from "next/navigation";
import { ensureProfileForUser, displayNameFromEmail } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function safeRedirectPath(path: string) {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return "/dashboard";
  }

  return path;
}

function redirectWithMessage(
  pathname: string,
  type: "error" | "message",
  message: string,
): never {
  const params = new URLSearchParams({
    [type]: message,
  });
  redirect(`${pathname}?${params.toString()}`);
}

function authErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "Email hoặc mật khẩu chưa đúng.";
  }

  if (normalized.includes("already registered")) {
    return "Email này đã được đăng ký.";
  }

  if (normalized.includes("password")) {
    return "Mật khẩu cần tối thiểu 6 ký tự.";
  }

  return message || "Có lỗi xảy ra, bạn thử lại nhé.";
}

function isAlreadyRegisteredError(message: string) {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("already registered") ||
    normalized.includes("user already exists") ||
    normalized.includes("already exists")
  );
}

export async function loginAction(formData: FormData) {
  const email = getString(formData, "email").toLowerCase();
  const password = getString(formData, "password");
  const redirectedFrom = safeRedirectPath(getString(formData, "redirectedFrom"));

  if (!email || !password) {
    redirectWithMessage("/login", "error", "Vui lòng nhập email và mật khẩu.");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirectWithMessage("/login", "error", authErrorMessage(error.message));
  }

  redirect(redirectedFrom);
}

export async function registerAction(formData: FormData) {
  const email = getString(formData, "email").toLowerCase();
  const password = getString(formData, "password");

  if (!email || !password) {
    redirectWithMessage(
      "/register",
      "error",
      "Vui lòng nhập email và mật khẩu.",
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayNameFromEmail(email),
      },
    },
  });

  if (error) {
    if (isAlreadyRegisteredError(error.message)) {
      redirectWithMessage(
        "/login",
        "message",
        "Email này đã có trong Supabase Auth. Nếu bạn từng bấm đăng ký trước đó, hãy đăng nhập bằng mật khẩu đã nhập hoặc dùng email khác.",
      );
    }

    redirectWithMessage("/register", "error", authErrorMessage(error.message));
  }

  if (!data.user) {
    redirectWithMessage(
      "/register",
      "error",
      "Không thể tạo tài khoản lúc này.",
    );
  }

  try {
    await ensureProfileForUser(supabase, data.user);
  } catch (profileError) {
    const message =
      profileError instanceof Error
        ? profileError.message
        : "Không thể tạo hồ sơ.";
    redirectWithMessage("/register", "error", `Không thể tạo hồ sơ: ${message}`);
  }

  if (!data.session) {
    redirectWithMessage(
      "/login",
      "message",
      "Tài khoản đã tạo. Nếu Supabase bật xác nhận email, hãy xác nhận rồi đăng nhập.",
    );
  }

  redirect("/onboarding/profile");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
