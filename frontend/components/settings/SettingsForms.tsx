import {
  createCoupleAction,
  disconnectCoupleAction,
  joinCoupleAction,
  updateLoveStartDateAction,
  updateProfileAction,
} from "@/app/settings/actions";
import type { CurrentCouple } from "@/lib/couple";
import type { Profile } from "@/lib/profile";

type SettingsFormsProps = {
  profile: Profile;
  currentCouple: CurrentCouple | null;
  error?: string;
  message?: string;
};

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-2 block text-sm font-bold text-[var(--color-muted)]">
      {children}
    </span>
  );
}

const inputClass =
  "w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm font-semibold text-[var(--color-text)] outline-none transition placeholder:text-[var(--color-faint)] focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-soft)]";

const primaryButtonClass =
  "rounded-2xl bg-[var(--color-primary)] px-5 py-3 text-sm font-black text-white transition hover:bg-[var(--color-primary-hover)] active:scale-[0.99]";

const secondaryButtonClass =
  "rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3 text-sm font-black text-[var(--color-primary)] transition hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-soft)] active:scale-[0.99]";

export function SettingsForms({
  profile,
  currentCouple,
  error,
  message,
}: SettingsFormsProps) {
  const theme = profile.theme_preference === "gold" ? "gold" : "pink";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--color-faint)]">
          Cài đặt
        </p>
        <h1 className="mt-2 text-3xl font-black md:text-5xl">
          Hồ sơ và kết nối
        </h1>
      </header>

      {message ? (
        <div className="rounded-2xl border border-[var(--color-success)]/20 bg-[var(--color-success-soft)] px-4 py-3 text-sm font-semibold text-[var(--color-success)]">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : null}

      <section className="rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-[var(--app-shadow)] md:p-7">
        <h2 className="text-xl font-black">Hồ sơ cá nhân</h2>
        <form action={updateProfileAction} className="mt-5 grid gap-4 md:grid-cols-2">
          <label>
            <FieldLabel>Tên hiển thị</FieldLabel>
            <input
              name="display_name"
              defaultValue={profile.display_name}
              className={inputClass}
              required
            />
          </label>

          <label>
            <FieldLabel>Ảnh đại diện URL</FieldLabel>
            <input
              name="avatar_url"
              defaultValue={profile.avatar_url ?? ""}
              className={inputClass}
              placeholder="https://..."
            />
          </label>

          <label>
            <FieldLabel>Ngày sinh</FieldLabel>
            <input
              name="birthday"
              type="date"
              defaultValue={profile.birthday ?? ""}
              className={inputClass}
            />
          </label>

          <label>
            <FieldLabel>Giới tính</FieldLabel>
            <select
              name="gender"
              defaultValue={profile.gender ?? ""}
              className={inputClass}
            >
              <option value="">Chưa chọn</option>
              <option value="female">Nữ</option>
              <option value="male">Nam</option>
              <option value="other">Khác</option>
            </select>
          </label>

          <fieldset className="md:col-span-2">
            <FieldLabel>Theme</FieldLabel>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-[var(--color-border)] bg-[#fff3f7] px-4 py-3 text-sm font-black text-[#88415f]">
                Pink theme
                <input
                  type="radio"
                  name="theme_preference"
                  value="pink"
                  defaultChecked={theme === "pink"}
                />
              </label>
              <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-[#ead7a4] bg-[#fff3cf] px-4 py-3 text-sm font-black text-[#9a6a13]">
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
            <button type="submit" className={primaryButtonClass}>
              Lưu hồ sơ
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-[var(--app-shadow)] md:p-7">
        <h2 className="text-xl font-black">Kết nối cặp đôi</h2>

        {currentCouple ? (
          <div className="mt-5 space-y-5">
            <div className="rounded-2xl bg-[var(--color-soft)] p-4">
              <p className="text-sm font-bold text-[var(--color-muted)]">
                Mã của bạn
              </p>
              <p className="mt-2 text-3xl font-black tracking-[0.2em] text-[var(--color-primary)]">
                {currentCouple.couple.invite_code}
              </p>
              <p className="mt-2 text-sm font-semibold text-[var(--color-muted)]">
                Gửi mã này cho người ấy để cùng vào chung couple.
              </p>
            </div>

            <form
              action={updateLoveStartDateAction}
              className="grid gap-4 md:grid-cols-[1fr_auto]"
            >
              <label>
                <FieldLabel>Ngày bắt đầu yêu</FieldLabel>
                <input
                  name="love_start_date"
                  type="date"
                  defaultValue={currentCouple.couple.love_start_date ?? ""}
                  className={inputClass}
                />
              </label>
              <div className="flex items-end">
                <button type="submit" className={secondaryButtonClass}>
                  Lưu ngày
                </button>
              </div>
            </form>

            <form action={disconnectCoupleAction}>
              <button
                type="submit"
                className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-black text-red-700 transition hover:bg-red-100 active:scale-[0.99]"
              >
                Hủy kết nối
              </button>
            </form>
          </div>
        ) : (
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <form
              action={createCoupleAction}
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-soft)] p-4"
            >
              <h3 className="font-black">Tạo mã kết nối</h3>
              <p className="mt-1 text-sm font-semibold text-[var(--color-muted)]">
                App sẽ sinh invite_code 8 ký tự để bạn gửi cho người ấy.
              </p>
              <label className="mt-4 block">
                <FieldLabel>Ngày bắt đầu yêu</FieldLabel>
                <input
                  name="love_start_date"
                  type="date"
                  className={inputClass}
                />
              </label>
              <button type="submit" className={`${primaryButtonClass} mt-4`}>
                Tạo mã của tôi
              </button>
            </form>

            <form
              action={joinCoupleAction}
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
            >
              <h3 className="font-black">Nhập mã người ấy</h3>
              <p className="mt-1 text-sm font-semibold text-[var(--color-muted)]">
                Nhập invite_code để tham gia cùng couple_id.
              </p>
              <label className="mt-4 block">
                <FieldLabel>Mã mời</FieldLabel>
                <input
                  name="invite_code"
                  className={inputClass}
                  placeholder="AB3X9K2M"
                  autoCapitalize="characters"
                />
              </label>
              <button type="submit" className={`${secondaryButtonClass} mt-4`}>
                Kết nối
              </button>
            </form>
          </div>
        )}
      </section>
    </div>
  );
}
