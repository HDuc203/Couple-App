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
    <main className="flex min-h-screen items-center justify-center px-4 py-8 text-[var(--color-text)]">
      <section className="grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--app-shadow)] lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative min-h-[34rem] overflow-hidden bg-[var(--color-soft)] p-8">
          <div className="relative z-10 flex h-full flex-col justify-between">
            <div>
              <p className="text-sm font-black uppercase text-[var(--color-primary)]">
                Couple App
              </p>
              <h1 className="mt-5 max-w-xl text-5xl font-black leading-[1.02] text-[var(--color-text)]">
                Yêu nhau mỗi ngày, gọn trong một nơi.
              </h1>
              <p className="mt-5 max-w-lg text-base leading-7 text-[var(--color-muted)]">
                Đăng ký thật nhanh bằng email và mật khẩu. Hồ sơ cá nhân và kết
                nối couple sẽ được hỏi ở bước onboarding ngắn sau đó.
              </p>
            </div>

            <div className="grid gap-3 rounded-3xl border border-[var(--color-border)] bg-white/80 p-4 backdrop-blur">
              <MiniStat label="Bước 1" value="Email + mật khẩu" />
              <MiniStat label="Bước 2" value="Hoàn thiện hồ sơ" />
              <MiniStat label="Bước 3" value="Kết nối hoặc để sau" />
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-[var(--color-soft)] p-1">
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
      <span className="text-sm font-black text-[var(--color-muted)]">{label}</span>
      <span className="flex h-14 items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 transition focus-within:border-[var(--color-accent)] focus-within:ring-4 focus-within:ring-[var(--color-soft-strong)]">
        <Icon className="h-5 w-5 text-[var(--color-faint)]" />
        <input
          className="h-full min-w-0 flex-1 bg-transparent text-base text-[var(--color-text)] outline-none placeholder:text-[var(--color-faint)]"
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
      <span className="text-sm font-bold text-[var(--color-muted)]">{label}</span>
      <span className="text-sm font-black text-[var(--color-text)]">{value}</span>
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
