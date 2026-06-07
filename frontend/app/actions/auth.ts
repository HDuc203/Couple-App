"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
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
  const fullName = getString(formData, "full_name");

  if (!email || !password) {
    return { success: false, error: "Vui lòng nhập email và mật khẩu." };
  }

  const origin = (await headers()).get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const redirectTo = `${origin}/auth/confirm`;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectTo,
      data: {
        display_name: fullName || displayNameFromEmail(email),
      },
    },
  });

  if (error) {
    if (isAlreadyRegisteredError(error.message)) {
      return {
        success: false,
        error: "Email này đã được đăng ký. Vui lòng đăng nhập hoặc dùng email khác."
      };
    }
    return { success: false, error: authErrorMessage(error.message) };
  }

  if (!data.user) {
    return { success: false, error: "Không thể tạo tài khoản lúc này." };
  }

  // Create profile
  try {
    await ensureProfileForUser(supabase, data.user, fullName);
  } catch (profileError) {
    console.error("Profile creation error on signup:", profileError);
  }

  // If session is immediately created (e.g. email confirmation is disabled in Supabase)
  if (data.session) {
    return { success: true, needsVerification: false };
  }

  // If Supabase requires email verification (data.session is null)
  return { success: true, needsVerification: true, email };
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function forgotPasswordAction(email: string) {
  if (!email || !email.trim()) {
    return { success: false, error: "Vui lòng nhập email." };
  }

  const origin = (await headers()).get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const redirectTo = `${origin}/auth/confirm?next=/reset-password`;

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo,
  });

  if (error) {
    return { success: false, error: authErrorMessage(error.message) };
  }

  return {
    success: true,
    message: "Liên kết khôi phục đã được gửi về email của bạn. Vui lòng kiểm tra hộp thư.",
  };
}

export async function resetPasswordAction(formData: FormData) {
  const password = getString(formData, "password");
  const confirmPassword = getString(formData, "confirm_password");

  if (!password || !confirmPassword) {
    return { success: false, error: "Vui lòng điền đầy đủ mật khẩu." };
  }

  if (password !== confirmPassword) {
    return { success: false, error: "Mật khẩu xác nhận không khớp." };
  }

  if (password.length < 6) {
    return { success: false, error: "Mật khẩu phải chứa ít nhất 6 ký tự." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    return { success: false, error: authErrorMessage(error.message) };
  }

  return { success: true };
}
