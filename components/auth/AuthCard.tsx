import Link from "next/link";
import { Heart } from "lucide-react";
import { SubmitButton } from "@/components/auth/SubmitButton";

type AuthCardProps = {
  mode: "login" | "register";
  action: (formData: FormData) => Promise<void>;
  error?: string;
  message?: string;
  redirectedFrom?: string;
};

export function AuthCard({
  mode,
  action,
  error,
  message,
  redirectedFrom,
}: AuthCardProps) {
  const isLogin = mode === "login";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--app-gradient)] px-4 py-10">
      <section className="w-full max-w-md rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-card)] p-7 shadow-[var(--app-shadow)]">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid size-12 place-items-center rounded-2xl bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
            <Heart className="size-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--color-muted)]">
              Couple App
            </p>
            <h1 className="text-2xl font-black text-[var(--color-text)]">
              {isLogin ? "Đăng nhập" : "Đăng ký"}
            </h1>
          </div>
        </div>

        {message ? (
          <div className="mb-4 rounded-2xl border border-[var(--color-success)]/20 bg-[var(--color-success-soft)] px-4 py-3 text-sm font-semibold text-[var(--color-success)]">
            {message}
          </div>
        ) : null}

        {error ? (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        ) : null}

        <form action={action} className="space-y-4">
          {isLogin ? (
            <input
              type="hidden"
              name="redirectedFrom"
              value={redirectedFrom || "/dashboard"}
            />
          ) : null}

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-[var(--color-muted)]">
              Email
            </span>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="ban@example.com"
              className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-text)] outline-none transition placeholder:text-[var(--color-faint)] focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-soft)]"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-[var(--color-muted)]">
              Mật khẩu
            </span>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete={isLogin ? "current-password" : "new-password"}
              placeholder="Tối thiểu 6 ký tự"
              className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-text)] outline-none transition placeholder:text-[var(--color-faint)] focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-soft)]"
            />
          </label>

          <SubmitButton pendingText={isLogin ? "Đang đăng nhập..." : "Đang tạo tài khoản..."}>
            {isLogin ? "Đăng nhập" : "Tạo tài khoản"}
          </SubmitButton>
        </form>

        <p className="mt-6 text-center text-sm font-semibold text-[var(--color-muted)]">
          {isLogin ? "Chưa có tài khoản?" : "Đã có tài khoản?"}{" "}
          <Link
            href={isLogin ? "/register" : "/login"}
            className="text-[var(--color-primary)] underline-offset-4 hover:underline"
          >
            {isLogin ? "Đăng ký" : "Đăng nhập"}
          </Link>
        </p>
      </section>
    </main>
  );
}
