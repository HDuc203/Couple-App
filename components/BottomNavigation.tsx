"use client";

import { navItems } from "@/components/navigationItems";
import type { AppTab } from "@/types/app";

type BottomNavigationProps = {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
};

export function BottomNavigation({
  activeTab,
  onTabChange,
}: BottomNavigationProps) {
  return (
    <nav className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-5 rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-card)] p-2 shadow-[var(--app-shadow)] lg:hidden">
      {navItems.map((item) => (
        <button
          className={[
            "flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[0.68rem] font-black transition active:scale-[0.98]",
            activeTab === item.id
              ? "bg-[var(--color-primary)] text-white"
              : "text-[var(--color-muted)] hover:bg-[var(--color-soft)]",
          ].join(" ")}
          key={item.id}
          onClick={() => onTabChange(item.id)}
          type="button"
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </button>
      ))}
    </nav>
  );
}
