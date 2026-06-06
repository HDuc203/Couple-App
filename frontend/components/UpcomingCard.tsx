import { Droplet, Gift, MapPin, Clock, type LucideIcon } from "lucide-react";
import type { UpcomingItem } from "@/types/app";

const iconByTone: Record<UpcomingItem["tone"], LucideIcon> = {
  pink: Droplet,
  gold: Gift,
  mint: MapPin,
};

const toneConfig: Record<
  UpcomingItem["tone"],
  { class: string; badge: string; bar: string }
> = {
  pink: {
    class: "upcoming-pink",
    badge: "upcoming-badge-pink",
    bar: "upcoming-bar-pink",
  },
  gold: {
    class: "upcoming-gold",
    badge: "upcoming-badge-gold",
    bar: "upcoming-bar-gold",
  },
  mint: {
    class: "upcoming-mint",
    badge: "upcoming-badge-mint",
    bar: "upcoming-bar-mint",
  },
};

type UpcomingCardProps = {
  item: UpcomingItem;
};

export function UpcomingCard({ item }: UpcomingCardProps) {
  const Icon = iconByTone[item.tone];
  const config = toneConfig[item.tone];

  return (
    <article className={`upcoming-card ${config.class}`}>
      {/* Accent bar */}
      <div className={`upcoming-accent-bar ${config.bar}`} />

      <div className="upcoming-card-inner">
        {/* Icon */}
        <div className="upcoming-icon-wrap">
          <Icon className="upcoming-icon" />
        </div>

        {/* Content */}
        <div className="upcoming-content">
          <h3 className="upcoming-title">{item.title}</h3>
          <p className="upcoming-detail">{item.detail}</p>
        </div>

        {/* Meta badge */}
        <div className={`upcoming-meta-badge ${config.badge}`}>
          <Clock className="h-3 w-3" />
          <span>{item.meta}</span>
        </div>
      </div>
    </article>
  );
}
