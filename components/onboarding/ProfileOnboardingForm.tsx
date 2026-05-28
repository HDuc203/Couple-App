import { Heart, Sparkles, UserRound } from "lucide-react";
import { completeProfileOnboardingAction } from "@/app/onboarding/profile/actions";
import { SubmitButton } from "@/components/auth/SubmitButton";
import type { Profile } from "@/lib/profile";

type ProfileOnboardingFormProps = {
  profile: Profile;
  error?: string;
};

const inputClass =
  "w-full rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 px-4 py-3 text-sm font-semibold text-zinc-900 dark:text-white outline-none transition placeholder:text-zinc-400 focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-soft)]";

function FieldLabel({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <span className="mb-2 block text-sm font-black text-zinc-700 dark:text-zinc-300">
      {children}
      {required ? <span className="text-red-500 font-bold"> *</span> : null}
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
      className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-100 to-indigo-100 dark:from-zinc-950 dark:via-zinc-900 dark:to-purple-950/20 px-4 py-8 text-zinc-800 dark:text-zinc-100"
    >
      <section className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="rounded-[2rem] border border-pink-200/80 bg-white/95 dark:bg-zinc-900/95 p-7 shadow-[0_20px_50px_rgba(136,65,95,0.1)] lg:sticky lg:top-8 lg:h-fit backdrop-blur-md">
          <div className="mb-8 grid size-14 place-items-center rounded-3xl bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
            <Heart className="size-7" />
          </div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--color-primary)]">
            Onboarding
          </p>
          <h1 className="mt-3 text-3xl font-black leading-tight md:text-5xl text-zinc-800 dark:text-white">
            Hoàn thiện hồ sơ của bạn
          </h1>
          <p className="mt-4 text-sm font-semibold leading-6 text-zinc-500 dark:text-zinc-400">
            Một vài thông tin cơ bản giúp app cá nhân hóa dashboard, theme và
            các tính năng couple sau này.
          </p>

          <div className="mt-8 grid gap-3">
            <div className="flex items-center gap-3 rounded-2xl bg-pink-50 dark:bg-zinc-800/80 p-4 border border-pink-100/40 dark:border-zinc-700/50">
              <UserRound className="size-5 text-[var(--color-primary)]" />
              <p className="text-sm font-bold text-zinc-600 dark:text-zinc-300">
                Bạn có thể kết nối couple sau trong Cài đặt.
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-pink-50 dark:bg-zinc-800/80 p-4 border border-pink-100/40 dark:border-zinc-700/50">
              <Sparkles className="size-5 text-[var(--color-primary)]" />
              <p className="text-sm font-bold text-zinc-600 dark:text-zinc-300">
                Theme sẽ được lưu vào Supabase profile.
              </p>
            </div>
          </div>
        </aside>

        <section className="rounded-[2rem] border border-pink-200/80 bg-white/95 dark:bg-zinc-900/95 p-5 shadow-[0_20px_50px_rgba(136,65,95,0.1)] md:p-7 backdrop-blur-md">
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
                <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-pink-200 dark:border-pink-900/60 bg-pink-50/50 dark:bg-pink-950/20 px-4 py-3 text-sm font-black text-[#88415f] dark:text-pink-300 transition hover:scale-[1.01]">
                  Pink theme
                  <input
                    type="radio"
                    name="theme_preference"
                    value="pink"
                    defaultChecked={theme === "pink"}
                  />
                </label>
                <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/30 dark:bg-amber-950/20 px-4 py-3 text-sm font-black text-[#9a6a13] dark:text-amber-300 transition hover:scale-[1.01]">
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

            <label className="flex items-center gap-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/50 dark:border-zinc-700/50 px-4 py-3 text-sm font-bold text-zinc-600 dark:text-zinc-300 md:col-span-2 cursor-pointer">
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
