"use client";

import { Copy, Link, Plus, SkipForward } from "lucide-react";

type CoupleConnectOnboardingProps = {
  joinCode: string;
  myCode: string | null;
  onCreateCode: () => void;
  onJoinCodeChange: (value: string) => void;
  onJoinSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onSkip: () => void;
  message: string | null;
};

export function CoupleConnectOnboarding({
  joinCode,
  message,
  myCode,
  onCreateCode,
  onJoinCodeChange,
  onJoinSubmit,
  onSkip,
}: CoupleConnectOnboardingProps) {
  async function handleCopy() {
    if (!myCode) {
      return;
    }

    await navigator.clipboard.writeText(myCode);
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8 text-[var(--color-text)]">
      <section className="w-full max-w-5xl rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-[var(--app-shadow)] sm:p-7">
        <p className="text-sm font-black uppercase text-[var(--color-primary)]">
          Kết nối cặp đôi
        </p>
        <h1 className="mt-3 text-4xl font-black leading-tight">
          Bạn muốn kết nối ngay không?
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
          Bạn vẫn có thể dùng app bình thường nếu để sau. Khi kết nối, app sẽ mở
          các tính năng couple như countdown, nhật ký chung, anniversary reminder
          và album chung.
        </p>

        <div className="mt-7 grid gap-4 lg:grid-cols-3">
          <section className="rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-soft)] p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-card)] text-[var(--color-primary)]">
              <Plus className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-xl font-black">Tạo mã kết nối</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
              Sinh invite code để gửi cho đối phương sau.
            </p>
            {myCode ? (
              <div className="mt-4">
                <code className="block rounded-2xl bg-[var(--color-card)] px-4 py-4 text-center text-2xl font-black tracking-[0.2em] text-[var(--color-primary)]">
                  {myCode}
                </code>
                <button
                  className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-[var(--color-border)] text-sm font-black text-[var(--color-primary)] transition hover:bg-[var(--color-card)] active:scale-[0.98]"
                  onClick={handleCopy}
                  type="button"
                >
                  <Copy className="h-4 w-4" />
                  Copy mã
                </button>
              </div>
            ) : (
              <button
                className="mt-4 h-12 w-full rounded-2xl bg-[var(--color-primary)] text-sm font-black text-white transition hover:bg-[var(--color-primary-hover)] active:scale-[0.98]"
                onClick={onCreateCode}
                type="button"
              >
                Tạo mã
              </button>
            )}
          </section>

          <section className="rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-card)] p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-success-soft)] text-[var(--color-success)]">
              <Link className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-xl font-black">Nhập mã người ấy</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
              Nếu đã có mã invite, nhập ở đây để kết nối.
            </p>
            <form className="mt-4 grid gap-3" onSubmit={onJoinSubmit}>
              <input
                className="h-12 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-center text-lg font-black uppercase tracking-[0.18em] text-[var(--color-primary)] outline-none transition focus:border-[var(--color-accent)] focus:ring-4 focus:ring-[var(--color-soft-strong)]"
                maxLength={8}
                onChange={(event) => onJoinCodeChange(event.target.value)}
                placeholder="NHAPMA"
                value={joinCode}
              />
              <button
                className="h-12 rounded-2xl bg-[var(--color-success)] text-sm font-black text-white transition hover:brightness-95 active:scale-[0.98]"
                type="submit"
              >
                Kết nối
              </button>
            </form>
            {message ? (
              <p className="mt-3 rounded-2xl bg-[var(--color-success-soft)] px-4 py-3 text-sm font-bold text-[var(--color-success)]">
                {message}
              </p>
            ) : null}
          </section>

          <section className="rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
              <SkipForward className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-xl font-black">Để sau</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
              Vào Home trước, app sẽ gợi ý kết nối khi cần tính năng couple.
            </p>
            <button
              className="mt-4 h-12 w-full rounded-2xl border border-[var(--color-border)] text-sm font-black text-[var(--color-primary)] transition hover:bg-[var(--color-soft)] active:scale-[0.98]"
              onClick={onSkip}
              type="button"
            >
              Vào app
            </button>
          </section>
        </div>
      </section>
    </main>
  );
}
