import Link from "next/link";
import {
  BookOpenText,
  Heart,
  HeartHandshake,
  Home,
  Images,
  LogOut,
  Settings,
  Sparkles,
  Calendar,
} from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import type { Profile } from "@/lib/profile";

import { NotificationCenter } from "./NotificationCenter";

export type NavigationKey = "dashboard" | "journal" | "album" | "love" | "future" | "calendar" | "settings";

type AppShellProps = {
  active: NavigationKey;
  profile: Profile;
  children: React.ReactNode;
};

const navigation = [
  {
    href: "/dashboard",
    label: "Home",
    activeKey: "dashboard",
    icon: Home,
  },
  {
    href: "/journal",
    label: "Nhật ký",
    activeKey: "journal",
    icon: BookOpenText,
  },
  {
    href: "/album",
    label: "Album",
    activeKey: "album",
    icon: Images,
  },
  {
    href: "/love",
    label: "Tình yêu",
    activeKey: "love",
    icon: HeartHandshake,
  },
  {
    href: "/future",
    label: "Tương lai",
    activeKey: "future",
    icon: Sparkles,
  },
  {
    href: "/calendar",
    label: "Kỷ niệm",
    activeKey: "calendar",
    icon: Calendar,
  },
  {
    href: "/settings",
    label: "Cài đặt",
    activeKey: "settings",
    icon: Settings,
  },
] as const;

function Avatar({ profile }: { profile: Profile }) {
  if (profile.avatar_url) {
    return (
      <img
        src={profile.avatar_url}
        alt={profile.display_name}
        className="size-11 rounded-full object-cover ring-2 ring-[var(--color-primary-soft)]"
      />
    );
  }

  return (
    <div className="grid size-11 place-items-center rounded-full bg-[var(--color-soft)] text-sm font-black text-[var(--color-primary)] ring-2 ring-[var(--color-primary-soft)]">
      {profile.display_name.slice(0, 1).toUpperCase()}
    </div>
  );
}

export function AppShell({ active, profile, children }: AppShellProps) {
  return (
    <div className="relative min-h-screen text-[var(--color-text)]">
      <NotificationCenter profile={profile} />
      <aside
        className="fixed inset-y-0 left-0 hidden w-72 flex-col p-5 backdrop-blur-xl md:flex"
        style={{
          background: "var(--settings-sidebar-bg)",
          borderRight: "1px solid var(--settings-sidebar-border)",
        }}
      >
        <Link href="/dashboard" className="mb-8 flex items-center gap-3">
          <div className="grid size-12 place-items-center rounded-2xl bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
            <Heart className="size-6" />
          </div>
          <div>
            <p className="text-lg font-black">Couple App</p>
            <p className="text-xs font-bold text-[var(--color-muted)]">
              Pastel romantic space
            </p>
          </div>
        </Link>

        <nav className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.activeKey;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition ${
                  isActive
                    ? "bg-[var(--color-primary)] text-white"
                    : "text-[var(--color-muted)] hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary)]"
                }`}
                style={isActive ? { boxShadow: "var(--settings-active-shadow)" } : {}}
              >
                <Icon className="size-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto rounded-[1.5rem] p-4"
          style={{
            background: "var(--settings-card-bg)",
            border: "1px solid var(--settings-sidebar-border)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
          }}
        >
          <div className="mb-4 flex items-center gap-3">
            <Avatar profile={profile} />
            <div className="min-w-0">
              <p className="truncate text-sm font-black">
                {profile.display_name}
              </p>
              <p className="truncate text-xs font-semibold text-[var(--color-muted)]">
                {profile.email}
              </p>
            </div>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm font-bold text-[var(--color-muted)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] active:scale-[0.99]"
            >
              <LogOut className="size-4" />
              Đăng xuất
            </button>
          </form>
        </div>
      </aside>

      <main className="relative z-10 min-h-screen px-4 pb-28 pt-5 md:ml-72 md:px-8 md:py-8">
        {children}
      </main>

      <nav className="fixed inset-x-3 bottom-3 z-20 grid grid-cols-5 gap-1 rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-card)]/95 p-1.5 shadow-[var(--app-shadow)] backdrop-blur md:hidden">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.activeKey;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[0.68rem] font-black transition ${
                isActive
                  ? "bg-[var(--color-primary)] text-white"
                  : "text-[var(--color-muted)] hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary)]"
              }`}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
