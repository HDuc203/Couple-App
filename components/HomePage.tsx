"use client";

import { Calendar, Image as ImageIcon, MessageCircle, Smile } from "lucide-react";
import { MoodSelector } from "@/components/MoodSelector";
import { UpcomingCard } from "@/components/UpcomingCard";
import type { UpcomingItem } from "@/types/app";

type HomePageProps = {
  connected: boolean;
  daysTogether: number;
  mood: string;
  name: string;
  onMoodChange: (mood: string) => void;
  onOpenSettings: () => void;
  upcomingItems: UpcomingItem[];
};

export function HomePage({
  connected,
  daysTogether,
  mood,
  name,
  onMoodChange,
  onOpenSettings,
  upcomingItems,
}: HomePageProps) {
  return (
    <div className="grid gap-4 p-4 pb-24 sm:p-5 lg:pb-5">
      <section className="relative overflow-hidden rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-5">
        <LotusDecoration />
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-3 flex w-fit items-center justify-center -space-x-2">
            <AvatarBubble label={name} />
            <AvatarBubble label="Người ấy" muted />
          </div>
          <p className="text-sm font-black uppercase text-[var(--color-faint)]">
            {connected ? `${name} và người ấy` : `${name}, chào mừng bạn`}
          </p>
          <p className="mt-2 text-6xl font-black leading-none text-[var(--color-primary)] sm:text-7xl">
            {connected ? daysTogether : "--"}
          </p>
          <p className="mt-2 text-sm font-black uppercase text-[var(--color-muted)]">
            {connected ? "ngày bên nhau" : "countdown mở sau khi kết nối"}
          </p>
          <p className="mt-2 text-sm font-semibold italic text-[var(--color-accent)]">
            {connected
              ? '"Mình cứ dịu dàng với nhau thêm một ngày nữa."'
              : "Bạn có thể dùng app trước và kết nối người ấy sau."}
          </p>
        </div>
      </section>

      {!connected ? (
        <section className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-card)] p-5">
          <SectionTitle title="Gợi ý kết nối" />
          <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
            Kết nối couple để mở countdown, nhật ký chung, anniversary reminder
            và album chung.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <FeatureHint icon={Calendar} label="Countdown" />
            <FeatureHint icon={MessageCircle} label="Nhật ký chung" />
            <FeatureHint icon={ImageIcon} label="Album chung" />
          </div>
          <button
            className="mt-4 h-12 rounded-2xl bg-[var(--color-primary)] px-5 text-sm font-black text-white transition hover:bg-[var(--color-primary-hover)] active:scale-[0.98]"
            onClick={onOpenSettings}
            type="button"
          >
            Kết nối trong Cài đặt
          </button>
        </section>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card>
          <SectionTitle title="Tâm trạng hôm nay" />
          <div className="mt-4">
            <MoodSelector selectedMood={mood} onMoodChange={onMoodChange} />
          </div>
        </Card>

        <Card>
          <SectionTitle title="Lời nhắn mới" />
          <div className="mt-4 rounded-2xl bg-[var(--color-soft)] p-4">
            <p className="text-sm font-semibold leading-6 text-[var(--color-muted)]">
              Hôm nay mình vẫn chọn nhau. Nhớ uống nước và nghỉ sớm nhé.
            </p>
          </div>
        </Card>
      </section>

      <section>
        <SectionTitle title="Sắp tới" />
        <div className="mt-4 grid items-stretch gap-4 md:grid-cols-3">
          {upcomingItems.map((item) => (
            <UpcomingCard item={item} key={item.id} />
          ))}
        </div>
      </section>

      <section className="grid gap-4 rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-card)] p-5 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <SectionTitle title="Trạng thái kết nối" />
          <p className="mt-2 text-xl font-black text-[var(--color-text)]">
            {connected ? "Đã thành đôi" : "Chưa thành đôi"}
          </p>
          <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
            {connected
              ? "Hai bạn đã có không gian chung trong demo."
              : "Bạn chưa cần kết nối ngay. Khi sẵn sàng, vào Cài đặt để tạo hoặc nhập mã."}
          </p>
        </div>
        <button
          className="h-12 rounded-2xl bg-[var(--color-primary)] px-5 text-sm font-black text-white transition hover:bg-[var(--color-primary-hover)] active:scale-[0.98]"
          onClick={onOpenSettings}
          type="button"
        >
          {connected ? "Xem kết nối" : "Nhập mã mời"}
        </button>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <SideStat icon={Smile} label="Mood" value={mood} />
        <SideStat
          icon={Calendar}
          label="Kỷ niệm"
          value={connected ? `${daysTogether} ngày` : "Chưa kết nối"}
        />
        <SideStat icon={MessageCircle} label="Tình yêu" value="1 lời nhắn" />
      </section>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-card)] p-5">
      {children}
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <h2 className="text-sm font-black uppercase tracking-[0.14em] text-[var(--color-faint)]">
      {title}
    </h2>
  );
}

function FeatureHint({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-[var(--color-soft)] px-4 py-3">
      <Icon className="h-4 w-4 text-[var(--color-primary)]" />
      <span className="text-sm font-black text-[var(--color-text)]">{label}</span>
    </div>
  );
}

function SideStat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3">
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4 text-[var(--color-primary)]" />
        <span className="text-sm font-bold text-[var(--color-muted)]">{label}</span>
      </div>
      <span className="text-sm font-black text-[var(--color-text)]">{value}</span>
    </div>
  );
}

function AvatarBubble({ label, muted = false }: { label: string; muted?: boolean }) {
  return (
    <div
      className={[
        "flex h-11 w-11 items-center justify-center rounded-full border-2 border-white text-sm font-black shadow-sm",
        muted
          ? "bg-[var(--color-soft-strong)] text-[var(--color-primary)]"
          : "bg-[var(--color-primary)] text-white",
      ].join(" ")}
    >
      {label.trim().charAt(0).toUpperCase() || "U"}
    </div>
  );
}

function LotusDecoration() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden opacity-80"
    >
      <div className="absolute left-[8%] top-[14%] h-24 w-24 rounded-full bg-[#cfe8d9]" />
      <div className="absolute right-[7%] top-[18%] h-20 w-24 rounded-full bg-[#cfe8d9]" />
      <div className="absolute left-[12%] top-[9%] h-20 w-px rotate-12 bg-[#97b49c]" />
      <div className="absolute right-[14%] top-[11%] h-20 w-px -rotate-12 bg-[#97b49c]" />
      <div className="absolute left-[10%] top-[7%] h-9 w-9 rounded-full bg-[#f4bfd0]" />
      <div className="absolute right-[12%] top-[8%] h-9 w-9 rounded-full bg-[#f4bfd0]" />
      <div className="absolute left-1/2 top-[19%] h-14 w-48 -translate-x-1/2 rounded-full bg-[#eef8f2]" />
    </div>
  );
}
