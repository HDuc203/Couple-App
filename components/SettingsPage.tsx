"use client";

import { Calendar, CheckCircle2, Copy, Image, Link, Unlink, User, VenusAndMars } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import type { Gender, MockUser, ThemeMode, UserProfile } from "@/types/app";

type SettingsPageProps = {
  copied: boolean;
  joinCode: string;
  message: string | null;
  onConnect: (event: React.FormEvent<HTMLFormElement>) => void;
  onCopy: () => void;
  onCreateCode: () => void;
  onDisconnect: () => void;
  onJoinCodeChange: (value: string) => void;
  onLoveStartDateChange: (value: string) => void;
  onProfileUpdate: (profile: UserProfile) => void;
  user: MockUser;
};

const genderOptions: Array<{ label: string; value: Gender }> = [
  { label: "Nữ", value: "female" },
  { label: "Nam", value: "male" },
  { label: "Khác", value: "other" },
  { label: "Không muốn nói", value: "prefer-not-to-say" },
];

export function SettingsPage({
  copied,
  joinCode,
  message,
  onConnect,
  onCopy,
  onCreateCode,
  onDisconnect,
  onJoinCodeChange,
  onLoveStartDateChange,
  onProfileUpdate,
  user,
}: SettingsPageProps) {
  const { theme, setTheme } = useTheme();

  function updateProfile<K extends keyof UserProfile>(field: K, value: UserProfile[K]) {
    onProfileUpdate({ ...user.profile, [field]: value });
  }

  return (
    <div className="grid gap-5 p-4 pb-24 sm:p-5 lg:pb-5">
      <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-soft)] p-5">
        <SectionTitle title="Cài đặt giao diện" />
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
          Chọn theme pastel cho toàn app. Lựa chọn sẽ được lưu trong localStorage.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <ThemeChoice
            active={theme === "pink"}
            description="Hồng dịu, mềm và romantic."
            label="Pink theme"
            onClick={() => setTheme("pink")}
            tone="pink"
          />
          <ThemeChoice
            active={theme === "gold"}
            description="Vàng kim ấm, sáng và sang hơn."
            label="Gold theme"
            onClick={() => setTheme("gold")}
            tone="gold"
          />
        </div>
      </section>

      <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-card)] p-5">
        <SectionTitle title="Hồ sơ cá nhân" />
        <div className="mt-5 grid gap-5">
          <div className="flex flex-col gap-4 rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-soft)] p-4 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--color-primary)] text-2xl font-black text-white">
              {user.profile.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt="Avatar preview"
                  className="h-full w-full object-cover"
                  src={user.profile.avatarUrl}
                />
              ) : (
                user.profile.displayName.trim().charAt(0).toUpperCase() || "U"
              )}
            </div>
            <div className="min-w-0 flex-1">
              <FormField
                icon={Image}
                label="Ảnh đại diện"
                onChange={(value) => updateProfile("avatarUrl", value)}
                placeholder="Dán URL ảnh hoặc để trống"
                value={user.profile.avatarUrl}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              icon={User}
              label="Tên hiển thị"
              onChange={(value) => updateProfile("displayName", value)}
              placeholder="Tên của bạn"
              value={user.profile.displayName}
            />
            <FormField
              icon={Calendar}
              label="Ngày sinh"
              onChange={(value) => updateProfile("birthDate", value)}
              type="date"
              value={user.profile.birthDate}
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
                    user.profile.gender === option.value
                      ? "border-[var(--color-accent)] bg-[var(--color-soft-strong)] text-[var(--color-primary)]"
                      : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)]",
                  ].join(" ")}
                  key={option.value}
                  onClick={() => updateProfile("gender", option.value)}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-card)] p-5">
        <SectionTitle title="Kết nối cặp đôi" />
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
          User chưa connect vẫn dùng app bình thường. Kết nối sẽ mở countdown,
          nhật ký chung, anniversary reminder và album chung.
        </p>

        <div className="mt-5 grid gap-5 xl:grid-cols-2">
          <div className="rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-soft)] p-5">
            <SectionTitle title="Mã của bạn" />
            {user.myCode ? (
              <>
                <code className="mt-4 block rounded-3xl border border-[var(--color-border)] bg-[var(--color-card)] px-5 py-5 text-center text-4xl font-black tracking-[0.22em] text-[var(--color-primary)]">
                  {user.myCode}
                </code>
                <button
                  className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-primary)] text-sm font-black text-white transition hover:bg-[var(--color-primary-hover)] active:scale-[0.98]"
                  onClick={onCopy}
                  type="button"
                >
                  <Copy className="h-4 w-4" />
                  {copied ? "Đã copy" : "Copy mã"}
                </button>
              </>
            ) : (
              <>
                <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
                  Bạn chưa tạo mã. Tạo mã khi muốn gửi invite cho đối phương.
                </p>
                <button
                  className="mt-4 h-12 w-full rounded-2xl bg-[var(--color-primary)] text-sm font-black text-white transition hover:bg-[var(--color-primary-hover)] active:scale-[0.98]"
                  onClick={onCreateCode}
                  type="button"
                >
                  Tạo mã kết nối
                </button>
              </>
            )}
          </div>

          <div className="rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
            <SectionTitle title="Nhập mã người ấy" />
            <form className="mt-4 grid gap-3" onSubmit={onConnect}>
              <input
                className="h-14 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 text-center text-xl font-black uppercase tracking-[0.22em] text-[var(--color-primary)] outline-none transition placeholder:text-[var(--color-faint)] focus:border-[var(--color-accent)] focus:ring-4 focus:ring-[var(--color-soft-strong)]"
                maxLength={8}
                onChange={(event) => onJoinCodeChange(event.target.value)}
                placeholder="NHAPMA"
                value={joinCode}
              />
              <button
                className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--color-success)] text-sm font-black text-white transition hover:brightness-95 active:scale-[0.98]"
                type="submit"
              >
                <Link className="h-4 w-4" />
                Kết nối
              </button>
            </form>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <FormField
            icon={Calendar}
            label="Ngày bắt đầu yêu"
            onChange={onLoveStartDateChange}
            type="date"
            value={user.loveStartDate ?? ""}
          />
          <button
            className="h-14 rounded-2xl border border-[var(--color-border)] px-5 text-sm font-black text-[var(--color-primary)] transition hover:bg-[var(--color-soft)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!user.connectedCode}
            onClick={onDisconnect}
            type="button"
          >
            <span className="inline-flex items-center gap-2">
              <Unlink className="h-4 w-4" />
              Hủy kết nối
            </span>
          </button>
        </div>

        {message ? (
          <p className="mt-4 rounded-2xl bg-[var(--color-success-soft)] px-4 py-3 text-sm font-bold text-[var(--color-success)]">
            {message}
          </p>
        ) : null}

        {user.connectedCode ? (
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm font-bold text-[var(--color-success)]">
            <CheckCircle2 className="h-4 w-4" />
            Đang kết nối với mã {user.connectedCode}
          </div>
        ) : null}
      </section>
    </div>
  );
}

function ThemeChoice({
  active,
  description,
  label,
  onClick,
  tone,
}: {
  active: boolean;
  description: string;
  label: string;
  onClick: () => void;
  tone: ThemeMode;
}) {
  const swatchClass = tone === "pink" ? "bg-[#d96f93]" : "bg-[#d6a63f]";

  return (
    <button
      className={[
        "rounded-[1.5rem] border p-4 text-left transition hover:-translate-y-0.5 active:scale-[0.99]",
        active
          ? "border-[var(--color-accent)] bg-[var(--color-card)] shadow-lg"
          : "border-[var(--color-border)] bg-[var(--color-surface)]",
      ].join(" ")}
      onClick={onClick}
      type="button"
    >
      <span className={["block h-8 w-8 rounded-full", swatchClass].join(" ")} />
      <span className="mt-4 block text-base font-black text-[var(--color-text)]">
        {label}
      </span>
      <span className="mt-1 block text-sm leading-6 text-[var(--color-muted)]">
        {description}
      </span>
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

function SectionTitle({ title }: { title: string }) {
  return (
    <h2 className="text-sm font-black uppercase tracking-[0.14em] text-[var(--color-faint)]">
      {title}
    </h2>
  );
}
