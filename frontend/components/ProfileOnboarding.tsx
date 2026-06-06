"use client";

import { Calendar, Image, User, VenusAndMars } from "lucide-react";
import { useState } from "react";
import type { Gender, UserProfile } from "@/types/app";

type ProfileOnboardingProps = {
  initialProfile: UserProfile;
  onComplete: (profile: UserProfile) => void;
};

const genderOptions: Array<{ label: string; value: Gender }> = [
  { label: "Nữ", value: "female" },
  { label: "Nam", value: "male" },
  { label: "Khác", value: "other" },
  { label: "Không muốn nói", value: "prefer-not-to-say" },
];

export function ProfileOnboarding({
  initialProfile,
  onComplete,
}: ProfileOnboardingProps) {
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const isValid = profile.displayName.trim() && profile.birthDate && profile.gender;

  function updateField<K extends keyof UserProfile>(field: K, value: UserProfile[K]) {
    setProfile((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isValid) {
      return;
    }

    onComplete({
      avatarUrl: profile.avatarUrl.trim(),
      displayName: profile.displayName.trim(),
      birthDate: profile.birthDate,
      gender: profile.gender,
    });
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8 text-[var(--color-text)]">
      <section className="w-full max-w-3xl rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-[var(--app-shadow)] sm:p-7">
        <p className="text-sm font-black uppercase text-[var(--color-primary)]">
          Onboarding
        </p>
        <h1 className="mt-3 text-4xl font-black leading-tight">
          Hoàn thiện hồ sơ của bạn
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
          Thêm vài thông tin cơ bản để app cá nhân hóa dashboard. Kết nối couple
          sẽ là bước tiếp theo và có thể bỏ qua.
        </p>

        <form className="mt-7 grid gap-5" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-4 rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-soft)] p-4 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--color-primary)] text-2xl font-black text-white">
              {profile.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt="Avatar preview"
                  className="h-full w-full object-cover"
                  src={profile.avatarUrl}
                />
              ) : (
                profile.displayName.trim().charAt(0).toUpperCase() || "U"
              )}
            </div>
            <div className="min-w-0 flex-1">
              <FormField
                icon={Image}
                label="Ảnh đại diện"
                onChange={(value) => updateField("avatarUrl", value)}
                placeholder="Dán URL ảnh hoặc để trống"
                value={profile.avatarUrl}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              icon={User}
              label="Tên hiển thị"
              onChange={(value) => updateField("displayName", value)}
              placeholder="VD: Minh"
              value={profile.displayName}
            />
            <FormField
              icon={Calendar}
              label="Ngày sinh"
              onChange={(value) => updateField("birthDate", value)}
              type="date"
              value={profile.birthDate}
            />
          </div>

          <div className="grid gap-2">
            <span className="flex items-center gap-2 text-sm font-black text-[var(--color-muted)]">
              <VenusAndMars className="h-4 w-4" />
              Giới tính
            </span>
            <div className="grid gap-2 sm:grid-cols-4">
              {genderOptions.map((option) => (
                <button
                  className={[
                    "rounded-2xl border px-3 py-3 text-sm font-black transition hover:bg-[var(--color-soft)] active:scale-[0.98]",
                    profile.gender === option.value
                      ? "border-[var(--color-accent)] bg-[var(--color-soft-strong)] text-[var(--color-primary)]"
                      : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)]",
                  ].join(" ")}
                  key={option.value}
                  onClick={() => updateField("gender", option.value)}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <button
            className="h-14 rounded-2xl bg-[var(--color-primary)] px-5 py-4 text-sm font-black text-white transition hover:bg-[var(--color-primary-hover)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!isValid}
            type="submit"
          >
            Tiếp tục
          </button>
        </form>
      </section>
    </main>
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
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "date" | "text";
  value: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="flex items-center gap-2 text-sm font-black text-[var(--color-muted)]">
        <Icon className="h-4 w-4" />
        {label}
      </span>
      <input
        className="h-14 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-base text-[var(--color-text)] outline-none transition placeholder:text-[var(--color-faint)] focus:border-[var(--color-accent)] focus:ring-4 focus:ring-[var(--color-soft-strong)]"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
    </label>
  );
}
