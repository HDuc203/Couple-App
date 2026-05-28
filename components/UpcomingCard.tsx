import { Droplet, Gift, MapPin, type LucideIcon } from "lucide-react";
import type { UpcomingItem } from "@/types/app";

const iconByTone: Record<UpcomingItem["tone"], LucideIcon> = {
  pink: Droplet,
  gold: Gift,
  mint: MapPin,
};

type UpcomingCardProps = {
  item: UpcomingItem;
};

export function UpcomingCard({ item }: UpcomingCardProps) {
  const Icon = iconByTone[item.tone];
  const iconClass =
    item.tone === "pink"
      ? "bg-[var(--color-primary-soft)] text-[var(--color-accent)]"
      : item.tone === "gold"
        ? "bg-[var(--color-warning-soft)] text-[var(--color-warning)]"
        : "bg-[var(--color-success-soft)] text-[var(--color-success)]";

  return (
    <article className="h-full min-h-[8.75rem] rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-card)] p-4 transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex h-full gap-3">
        <div
          className={[
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl",
            iconClass,
          ].join(" ")}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col items-start">
          <h3 className="font-black text-[var(--color-text)]">{item.title}</h3>
          <p className="mt-1 text-sm font-semibold italic text-[var(--color-faint)]">
            {item.detail}
          </p>
          <span className="mt-auto inline-flex rounded-full border border-[var(--color-border)] bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-black text-[var(--color-primary)]">
            {item.meta}
          </span>
        </div>
      </div>
    </article>
  );
}
