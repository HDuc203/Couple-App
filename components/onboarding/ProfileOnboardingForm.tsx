import { Heart, Sparkles, UserRound } from "lucide-react";
import { completeProfileOnboardingAction } from "@/app/onboarding/profile/actions";
import { SubmitButton } from "@/components/auth/SubmitButton";
import type { Profile } from "@/lib/profile";

type ProfileOnboardingFormProps = {
  profile: Profile;
  error?: string;
};

const inputClass =
  "w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm font-semibold text-[var(--color-text)] outline-none transition placeholder:text-[var(--color-faint)] focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-soft)]";

function FieldLabel({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <span className="mb-2 block text-sm font-bold text-[var(--color-muted)]">
      {children}
      {required ? <span className="text-[var(--color-primary)]"> *</span> : null}
    </span>
  );
}

export function ProfileOnboardingForm({
  profile,
  error,
}: ProfileOnboardingFormProps) {
  const theme = profile.theme_preference === "gold" ? "gold" : "pink";

  return (
    <main
      data-theme={theme}
      className="min-h-screen bg-[var(--app-gradient)] px-4 py-8 text-[var(--color-text)]"
    >
      <section className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-card)] p-7 shadow-[var(--app-shadow)] lg:sticky lg:top-8 lg:h-fit">
          <div className="mb-8 grid size-14 place-items-center rounded-3xl bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
            <Heart className="size-7" />
          </div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--color-faint)]">
            Onboarding
          </p>
          <h1 className="mt-3 text-3xl font-black leading-tight md:text-5xl">
            Hoàn thiện hồ sơ của bạn
          </h1>
          <p className="mt-4 text-sm font-semibold leading-6 text-[var(--color-muted)]">
            Một vài thông tin cơ bản giúp app cá nhân hóa dashboard, theme và
            các tính năng couple sau này.
          </p>

          <div className="mt-8 grid gap-3">
            <div className="flex items-center gap-3 rounded-2xl bg-[var(--color-soft)] p-4">
              <UserRound className="size-5 text-[var(--color-primary)]" />
              <p className="text-sm font-bold text-[var(--color-muted)]">
                Bạn có thể kết nối couple sau trong Cài đặt.
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-[var(--color-soft)] p-4">
              <Sparkles className="size-5 text-[var(--color-primary)]" />
              <p className="text-sm font-bold text-[var(--color-muted)]">
                Theme sẽ được lưu vào Supabase profile.
              </p>
            </div>
          </div>
        </aside>

        <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-[var(--app-shadow)] md:p-7">
          {error ? (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </div>
          ) : null}

          <form
            action={completeProfileOnboardingAction}
            className="grid gap-4 md:grid-cols-2"
          >
            <label>
              <FieldLabel required>Họ và tên</FieldLabel>
              <input
                name="full_name"
                defaultValue={profile.full_name ?? ""}
                required
                className={inputClass}
                placeholder="Nguyễn Hoa"
              />
            </label>

            <label>
              <FieldLabel required>Tên hiển thị</FieldLabel>
              <input
                name="display_name"
                defaultValue={profile.display_name}
                required
                className={inputClass}
                placeholder="Hoa"
              />
            </label>

            <label>
              <FieldLabel>Nickname</FieldLabel>
              <input
                name="nickname"
                defaultValue={profile.nickname ?? ""}
                className={inputClass}
                placeholder="Bông"
              />
            </label>

            <label>
              <FieldLabel>Số điện thoại</FieldLabel>
              <input
                name="phone"
                type="tel"
                defaultValue={profile.phone ?? ""}
                className={inputClass}
                placeholder="09..."
              />
            </label>

            <label>
              <FieldLabel required>Ngày sinh</FieldLabel>
              <input
                name="birthday"
                type="date"
                defaultValue={profile.birthday ?? ""}
                required
                className={inputClass}
              />
            </label>

            <label>
              <FieldLabel required>Giới tính</FieldLabel>
              <select
                name="gender"
                defaultValue={profile.gender ?? ""}
                required
                className={inputClass}
              >
                <option value="">Chọn giới tính</option>
                <option value="female">Nữ</option>
                <option value="male">Nam</option>
                <option value="other">Khác</option>
              </select>
            </label>

            <label className="md:col-span-2">
              <FieldLabel>Avatar URL</FieldLabel>
              <input
                name="avatar_url"
                type="url"
                defaultValue={profile.avatar_url ?? ""}
                className={inputClass}
                placeholder="https://..."
              />
            </label>

            <fieldset className="md:col-span-2">
              <FieldLabel>Theme</FieldLabel>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-[#efd6de] bg-[#fff3f7] px-4 py-3 text-sm font-black text-[#88415f] transition hover:scale-[1.01]">
                  Pink theme
                  <input
                    type="radio"
                    name="theme_preference"
                    value="pink"
                    defaultChecked={theme === "pink"}
                  />
                </label>
                <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-[#ead7a4] bg-[#fff3cf] px-4 py-3 text-sm font-black text-[#9a6a13] transition hover:scale-[1.01]">
                  Gold theme
                  <input
                    type="radio"
                    name="theme_preference"
                    value="gold"
                    defaultChecked={theme === "gold"}
                  />
                </label>
              </div>
            </fieldset>

            <label className="flex items-center gap-3 rounded-2xl bg-[var(--color-soft)] px-4 py-3 text-sm font-bold text-[var(--color-muted)] md:col-span-2">
              <input
                type="checkbox"
                name="period_tracking_enabled"
                defaultChecked={Boolean(profile.period_tracking_enabled)}
              />
              Bật theo dõi kỳ dâu
            </label>

            <div className="md:col-span-2">
              <SubmitButton pendingText="Đang lưu hồ sơ...">
                Hoàn tất hồ sơ
              </SubmitButton>
            </div>
          </form>
        </section>
      </section>
    </main>
  );
}
