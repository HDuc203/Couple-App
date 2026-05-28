"use client";

import { Heart, LogOut } from "lucide-react";
import { navItems } from "@/components/navigationItems";
import type { AppTab } from "@/types/app";

type SidebarProps = {
  activeTab: AppTab;
  email: string;
  name: string;
  onLogout: () => void;
  onTabChange: (tab: AppTab) => void;
};

export function Sidebar({
  activeTab,
  email,
  name,
  onLogout,
  onTabChange,
}: SidebarProps) {
  return (
    <aside className="hidden flex-col rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-[var(--app-shadow)] lg:sticky lg:top-4 lg:flex lg:min-h-[calc(100vh-2rem)]">
      <div className="rounded-3xl bg-[var(--color-soft)] p-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[var(--color-primary)] shadow-sm">
          <Heart className="h-6 w-6" />
        </div>
        <p className="mt-4 text-lg font-black text-[var(--color-text)]">Couple App</p>
        <p className="mt-1 truncate text-sm text-[var(--color-muted)]">{email}</p>
      </div>

      <nav className="mt-4 grid gap-2">
        {navItems.map((item) => (
          <button
            className={[
              "flex h-12 items-center gap-3 rounded-2xl px-3 text-left text-sm font-black transition",
              "hover:bg-[var(--color-soft)] hover:text-[var(--color-text)] active:scale-[0.99]",
              activeTab === item.id
                ? "bg-[var(--color-primary)] text-white shadow-lg"
                : "text-[var(--color-muted)]",
            ].join(" ")}
            key={item.id}
            onClick={() => onTabChange(item.id)}
            type="button"
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="mt-auto rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-primary)] text-sm font-black text-white">
            {name.trim().charAt(0).toUpperCase() || "U"}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-[var(--color-text)]">{name}</p>
            <p className="truncate text-xs text-[var(--color-muted)]">Mock mode</p>
          </div>
        </div>
        <button
          className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-2xl border border-[var(--color-border)] text-sm font-black text-[var(--color-primary)] transition hover:bg-[var(--color-soft)] active:scale-[0.99]"
          onClick={onLogout}
          type="button"
        >
          <LogOut className="h-4 w-4" />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}
