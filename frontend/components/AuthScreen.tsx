"use client";

import { Lock, LogIn, Mail, UserPlus, type LucideIcon } from "lucide-react";
import type { AuthFormState, AuthMode } from "@/types/app";

type AuthScreenProps = {
  authError: string | null;
  authForm: AuthFormState;
  authMode: AuthMode;
  onFieldChange: (field: keyof AuthFormState, value: string) => void;
  onModeChange: (mode: AuthMode) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

export function AuthScreen({
  authError,
  authForm,
  authMode,
  onFieldChange,
  onModeChange,
  onSubmit,
}: AuthScreenProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 via-rose-100 to-indigo-100 dark:from-zinc-950 dark:via-zinc-900 dark:to-purple-950/20 px-4 py-8 text-zinc-800 dark:text-zinc-100">
      <section className="grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-pink-200/80 bg-white/95 dark:bg-zinc-900/95 shadow-[0_20px_50px_rgba(136,65,95,0.12)] lg:grid-cols-[1.05fr_0.95fr] backdrop-blur-md">
        <div className="relative min-h-[34rem] overflow-hidden bg-rose-50/50 dark:bg-zinc-800/40 p-8 border-r border-pink-100 dark:border-zinc-800">
          <div className="relative z-10 flex h-full flex-col justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-[var(--color-primary)]">
                Couple App
              </p>
              <h1 className="mt-5 max-w-xl text-5xl font-black leading-[1.02] text-zinc-800 dark:text-white">
                Yêu nhau mỗi ngày, gọn trong một nơi.
              </h1>
              <p className="mt-5 max-w-lg text-sm font-semibold leading-7 text-zinc-500 dark:text-zinc-400">
                Đăng ký thật nhanh bằng email và mật khẩu. Hồ sơ cá nhân và kết
                nối couple sẽ được hỏi ở bước onboarding ngắn sau đó.
              </p>
            </div>

            <div className="grid gap-3 rounded-3xl border border-pink-100 dark:border-zinc-700 bg-white/90 dark:bg-zinc-900/90 p-4 shadow-sm">
              <MiniStat label="Bước 1" value="Email + mật khẩu" />
              <MiniStat label="Bước 2" value="Hoàn thiện hồ sơ" />
              <MiniStat label="Bước 3" value="Kết nối hoặc để sau" />
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 flex flex-col justify-center">
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-zinc-100 dark:bg-zinc-800 p-1">
            <ModeButton
              active={authMode === "register"}
              icon={UserPlus}
              label="Đăng ký"
              onClick={() => onModeChange("register")}
            />
            <ModeButton
              active={authMode === "login"}
              icon={LogIn}
              label="Đăng nhập"
              onClick={() => onModeChange("login")}
            />
          </div>

          <form className="mt-7 grid gap-4" onSubmit={onSubmit}>
            <FormField
              icon={Mail}
              label="Email"
              onChange={(value) => onFieldChange("email", value)}
              placeholder="you@example.com"
              type="email"
              value={authForm.email}
            />

            <FormField
              icon={Lock}
              label="Mật khẩu"
              onChange={(value) => onFieldChange("password", value)}
              placeholder="Tối thiểu 6 ký tự"
              type="password"
              value={authForm.password}
            />

            {authError ? <ErrorMessage>{authError}</ErrorMessage> : null}

            <button
              className="mt-2 rounded-2xl bg-[var(--color-primary)] px-5 py-4 text-base font-black text-white shadow-lg transition hover:bg-[var(--color-primary-hover)] active:scale-[0.99]"
              type="submit"
            >
              {authMode === "register" ? "Tiếp tục" : "Đăng nhập"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

function ModeButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={[
        "flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-black transition active:scale-[0.99]",
        active ? "bg-white text-[var(--color-primary)] shadow-sm" : "text-[var(--color-muted)]",
      ].join(" ")}
      onClick={onClick}
      type="button"
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function FormField({
  icon: Icon,
  label,
  onChange,
  placeholder,
  type = "text",
  value,
}: {
  icon: LucideIcon;
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: "email" | "password" | "text";
  value: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-black text-zinc-700 dark:text-zinc-300">{label}</span>
      <span className="flex h-14 items-center gap-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 px-4 transition focus-within:border-[var(--color-primary)] focus-within:ring-4 focus-within:ring-[var(--color-primary-soft)]">
        <Icon className="h-5 w-5 text-zinc-400" />
        <input
          className="h-full min-w-0 flex-1 bg-transparent text-base text-zinc-900 dark:text-white outline-none placeholder:text-zinc-400 font-semibold"
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          type={type}
          value={value}
        />
      </span>
    </label>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm font-bold text-zinc-500 dark:text-zinc-400">{label}</span>
      <span className="text-sm font-black text-zinc-800 dark:text-white">{value}</span>
    </div>
  );
}

function ErrorMessage({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-primary-soft)] px-4 py-3 text-sm font-bold text-[var(--color-primary)]">
      {children}
    </p>
  );
}
