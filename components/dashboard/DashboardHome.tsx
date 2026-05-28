"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Cake,
  CalendarDays,
  CalendarHeart,

  Droplet,
  Heart,
  HeartHandshake,
  Mail,
  Sparkles,
  Plus,
} from "lucide-react";
import { CoupleMoodSync } from "./CoupleMoodSync";
import type { CurrentCouple, PartnerProfile } from "@/lib/couple";
import type { Profile } from "@/lib/profile";
import type { Tables } from "@/types/database";

type DashboardHomeProps = {
  profile: Profile;
  currentCouple: CurrentCouple | null;
  partnerProfile: PartnerProfile | null;
  latestMood: Tables<"mood_logs"> | null;
  partnerLatestMood: Tables<"mood_logs"> | null;
  latestLoveNote: Tables<"love_notes"> | null;
  nextBucketItem: Tables<"bucket_list"> | null;
  specialDates: Tables<"special_dates">[];
  periodLogs: Tables<"period_tracking">[];
  queryError?: string;
};

function formatDate(value: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function daysTogether(startDate: string | null) {
  if (!startDate) return null;
  const start = new Date(`${startDate}T00:00:00`);
  const diff = Date.now() - start.getTime();
  return Math.max(1, Math.floor(diff / 86_400_000) + 1);
}

function daysUntilBirthday(birthdayStr: string | null) {
  if (!birthdayStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const bdate = new Date(birthdayStr);
  const nextBirth = new Date(today.getFullYear(), bdate.getMonth(), bdate.getDate());
  if (nextBirth < today) nextBirth.setFullYear(today.getFullYear() + 1);
  const diff = nextBirth.getTime() - today.getTime();
  return Math.ceil(diff / 86_400_000);
}

function getNextSpecialDate(dates: Tables<"special_dates">[]) {
  if (!dates || dates.length === 0) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parsed = dates.map((d) => {
    const nextOccur = new Date(d.date);
    if (d.repeat_yearly) {
      nextOccur.setFullYear(today.getFullYear());
      if (nextOccur < today) nextOccur.setFullYear(today.getFullYear() + 1);
    }
    return { ...d, nextOccur };
  });

  parsed.sort((a, b) => a.nextOccur.getTime() - b.nextOccur.getTime());
  const upcoming = parsed.find((p) => p.nextOccur >= today);
  if (!upcoming) return null;

  const diff = upcoming.nextOccur.getTime() - today.getTime();
  return { ...upcoming, daysLeft: Math.ceil(diff / 86_400_000) };
}

function getPeriodStatus(
  logs: Tables<"period_tracking">[],
  myId: string,
  partnerId: string | undefined,
  partnerName: string,
) {
  const myLog = logs.find((l) => l.user_id === myId);
  const partnerLog = partnerId
    ? logs.find((l) => l.user_id === partnerId && l.share_with_partner)
    : null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (myLog) {
    const lastDate = new Date(myLog.last_period_date);
    const cycle = myLog.cycle_length || 28;
    const len = myLog.period_length || 5;

    let nextStart = new Date(lastDate);
    while (nextStart < today) {
      nextStart.setTime(nextStart.getTime() + cycle * 86_400_000);
    }

    const diffDays = Math.ceil((nextStart.getTime() - today.getTime()) / 86_400_000);

    for (let i = -1; i < 3; i++) {
      const pStart = new Date(lastDate.getTime() + i * cycle * 86_400_000);
      const pEnd = new Date(pStart.getTime() + len * 86_400_000);
      if (today >= pStart && today < pEnd) {
        return { status: "active", daysLeft: 0, message: "Đang trong chu kỳ 🌸", subMessage: "Hãy nghỉ ngơi và uống trà ấm nhé! 🍵" };
      }
    }

    return { status: "predicted", daysLeft: diffDays, message: `Còn ${diffDays} ngày tới kỳ 🌸`, subMessage: `Dự báo: ${nextStart.toLocaleDateString("vi-VN")}` };
  }

  if (partnerLog) {
    const lastDate = new Date(partnerLog.last_period_date);
    const cycle = partnerLog.cycle_length || 28;
    let nextStart = new Date(lastDate);
    while (nextStart < today) {
      nextStart.setTime(nextStart.getTime() + cycle * 86_400_000);
    }
    const diffDays = Math.ceil((nextStart.getTime() - today.getTime()) / 86_400_000);

    if (diffDays <= 4 && diffDays >= 0) {
      return { status: "partner-near", daysLeft: diffDays, message: `Kỳ dâu của ${partnerName} sắp tới`, subMessage: `🌸 Còn ${diffDays} ngày. Hãy ngọt ngào nhé! 🫂` };
    }
    return { status: "partner-shared", daysLeft: diffDays, message: `Dự báo chu kỳ của ${partnerName}`, subMessage: "Đang kết nối bảo mật nhẹ nhàng." };
  }

  return null;
}

function SoftCard({
  children,
  className = "",
  muted = false,
}: {
  children: React.ReactNode;
  className?: string;
  muted?: boolean;
}) {
  return (
    <section
      className={`rounded-[1.5rem] border border-[var(--color-border)] ${
        muted ? "bg-[var(--color-soft)]" : "bg-[var(--color-card)]"
      } p-6 shadow-[0_16px_42px_rgba(136,65,95,0.07)] ${className}`}
    >
      {children}
    </section>
  );
}

function PartnerAvatar({ partner }: { partner: PartnerProfile | null }) {
  if (partner?.avatar_url) {
    return (
      <img
        src={partner.avatar_url}
        alt={partner.display_name}
        className="size-14 rounded-full object-cover ring-2 ring-[var(--color-primary)] shadow-md"
      />
    );
  }

  return (
    <div className="grid size-14 place-items-center rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] text-lg font-black text-white shadow-md ring-2 ring-[var(--color-primary-soft)]">
      {(partner?.display_name ?? "?").slice(0, 1).toUpperCase()}
    </div>
  );
}

/** Vòng tròn đếm ngày countdown */
function CountdownRing({
  days,
  maxDays = 30,
  color = "var(--color-primary)",
}: {
  days: number;
  maxDays?: number;
  color?: string;
}) {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, 1 - days / maxDays));
  const offset = circ * (1 - pct);

  return (
    <div className="relative flex items-center justify-center">
      <svg width={56} height={56} className="-rotate-90">
        <circle cx={28} cy={28} r={r} stroke="var(--color-border)" strokeWidth={4} fill="none" />
        <circle
          cx={28}
          cy={28}
          r={r}
          stroke={color}
          strokeWidth={4}
          fill="none"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      </svg>
      <span className="absolute text-[11px] font-black" style={{ color }}>
        {days}
      </span>
    </div>
  );
}

export function DashboardHome({
  profile,
  currentCouple,
  partnerProfile,
  latestMood,
  partnerLatestMood,
  latestLoveNote,
  nextBucketItem,
  specialDates,
  periodLogs,
  queryError,
}: DashboardHomeProps) {
  const router = useRouter();
  const couple = currentCouple?.couple ?? null;
  const togetherDays = daysTogether(couple?.love_start_date ?? null);
  const togetherCopy = togetherDays
    ? `Hôm nay là ngày thứ ${togetherDays} bên nhau`
    : "Thêm ngày bắt đầu yêu để app đếm từng ngày cho hai bạn";

  const partnerName = partnerProfile?.display_name ?? "Người ấy";
  const partnerBdayDays =
    partnerProfile?.birthday ? daysUntilBirthday(partnerProfile.birthday) : null;
  const nextSpecial = getNextSpecialDate(specialDates);
  const periodStatus = getPeriodStatus(
    periodLogs,
    profile.id,
    partnerProfile?.id,
    partnerName,
  );

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      {/* ───── HEADER ───── */}
      <header className="rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-card)] px-5 py-5 shadow-[0_16px_42px_rgba(136,65,95,0.07)] md:px-7">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-faint)]">
              Xin chào
            </p>
            <h1 className="mt-1 text-2xl font-black md:text-3xl">
              {profile.display_name}
            </h1>
            <p className="mt-1 text-sm font-semibold text-[var(--color-muted)]">
              {togetherCopy}
            </p>
          </div>
          <Link
            href="/settings"
            className="inline-flex w-fit items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-xs font-black text-[var(--color-primary)] transition hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-soft)] active:scale-[0.99]"
          >
            {couple ? "Quản lý kết nối" : "Kết nối ngay"}
          </Link>
        </div>
      </header>

      {queryError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {queryError}
        </div>
      ) : null}

      {/* ───── ROW 1: Ngày bên nhau (8 col) + Trạng thái kết nối (4 col) ───── */}
      <div className="grid gap-4 lg:grid-cols-12">
        {/* Ngày bên nhau — 8 col */}
        <SoftCard className="lg:col-span-8 min-h-56 overflow-hidden p-0">
          <div className="relative grid gap-6 p-7 md:grid-cols-[1.2fr_0.8fr] md:p-9 h-full">
            <div className="absolute right-8 top-7 text-[var(--color-primary)] opacity-20">
              <Sparkles className="size-20" />
            </div>
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-[var(--color-primary-soft)] px-4 py-2 text-xs font-black text-[var(--color-primary)]">
                <CalendarHeart className="size-4" />
                Ngày bên nhau
              </div>
              <div className="flex items-center gap-4">
                <p
                  className="text-8xl font-bold leading-none text-[var(--color-primary)] md:text-9xl"
                  style={{
                    fontFamily:
                      '"Cormorant Garamond", "Playfair Display", Georgia, serif',
                  }}
                >
                  {togetherDays ?? "--"}
                </p>
                <Heart className="size-9 text-[var(--color-accent)]" />
              </div>
              <p className="mt-3 text-base font-bold text-[var(--color-muted)]">
                {couple?.love_start_date
                  ? `Bên nhau từ ${formatDate(couple.love_start_date)}`
                  : "Bạn có thể thêm ngày bắt đầu yêu trong Cài đặt."}
              </p>
            </div>

            <div className="self-end rounded-[1.5rem] bg-[var(--color-soft)] p-5">
              <p className="text-sm font-black text-[var(--color-text)]">
                Một ngày nhỏ cũng đáng được giữ lại.
              </p>
              <p className="mt-2 text-sm font-semibold leading-6 text-[var(--color-muted)]">
                Countdown này sẽ là điểm chạm đầu tiên mỗi khi hai bạn mở app.
              </p>
            </div>
          </div>
        </SoftCard>

        {/* Trạng thái kết nối — 4 col */}
        <SoftCard muted className="lg:col-span-4 flex flex-col justify-between">
          {/* Header row */}
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-faint)]">
                Trạng thái
              </p>
              <p className="mt-1 text-xl font-black">
                {couple ? "Đã kết nối" : "Chưa thành đôi"}
              </p>
            </div>
            <div
              className={`grid size-11 shrink-0 place-items-center rounded-2xl ${
                couple
                  ? "bg-[var(--color-success-soft)] text-[var(--color-success)]"
                  : "bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
              }`}
            >
              <HeartHandshake className="size-5" />
            </div>
          </div>

          {/* Partner info — trực tiếp, không box lồng */}
          {couple ? (
            <div className="mt-5 flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <PartnerAvatar partner={partnerProfile} />
                <div className="min-w-0">
                  <p className="text-lg font-black leading-tight text-[var(--color-text)] truncate">
                    {partnerProfile?.display_name ?? "Đang chờ người ấy"}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-[var(--color-muted)] leading-snug">
                    {couple.love_start_date
                      ? `Bên nhau từ ${formatDate(couple.love_start_date)}`
                      : `Mã mời: ${couple.invite_code}`}
                  </p>
                </div>
              </div>
              <div className="h-px bg-[var(--color-border)] opacity-50" />
              <Link
                href="/settings"
                className="text-xs font-bold text-[var(--color-primary)] hover:underline"
              >
                Quản lý kết nối →
              </Link>
            </div>
          ) : (
            <div className="mt-5">
              <p className="text-sm font-semibold leading-6 text-[var(--color-muted)]">
                Vào Cài đặt để tạo mã kết nối hoặc nhập mã của người ấy.
              </p>
              <Link
                href="/settings"
                className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[var(--color-primary)] px-4 py-2 text-xs font-black text-white hover:opacity-90 transition"
              >
                <Plus className="size-3.5" /> Kết nối ngay
              </Link>
            </div>
          )}
        </SoftCard>
      </div>

      {/* ───── ROW 2: Mood Sync — full width ───── */}
      <CoupleMoodSync
        profile={profile}
        currentCouple={currentCouple}
        partnerProfile={partnerProfile}
        latestMood={latestMood}
        partnerLatestMood={partnerLatestMood}
      />

      {/* ───── ROW 3: Lời nhắn — full width ───── */}
      <SoftCard>
        <div className="mb-4 flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-2xl bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
            <Mail className="size-5" />
          </div>
          <div>
            <p className="font-black">Lời nhắn mới</p>
            <p className="text-sm font-semibold text-[var(--color-muted)]">
              Một góc nhỏ để giữ những câu dịu dàng.
            </p>
          </div>
        </div>
        <p className="rounded-2xl bg-[var(--color-soft)] px-6 py-5 text-sm font-semibold leading-6 text-[var(--color-muted)]">
          {latestLoveNote?.message ?? "Chưa có lời nhắn nào cho couple hiện tại."}
        </p>
      </SoftCard>

      {/* ───── ROW 4: 3 card nhỏ — mỗi cái 4 col (tổng 12) ───── */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Kỳ dâu */}
        <div onClick={() => router.push("/calendar")} className="group block select-none cursor-pointer">
          <SoftCard
            muted
            className="transition duration-300 hover:-translate-y-1 hover:shadow-md hover:border-[var(--color-primary)]/30 h-full flex flex-col gap-4"
          >
            <div className="flex items-start justify-between">
              <div className="grid size-10 place-items-center rounded-2xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] group-hover:scale-110 transition duration-300">
                <Droplet className="size-5 text-rose-500" fill="currentColor" />
              </div>
              {periodStatus && periodStatus.daysLeft > 0 && (
                <CountdownRing
                  days={periodStatus.daysLeft}
                  maxDays={28}
                  color="#f43f5e"
                />
              )}
              {periodStatus?.status === "active" && (
                <span className="rounded-full bg-rose-100 px-2.5 py-1 text-[10px] font-black text-rose-600 animate-pulse">
                  Đang có kỳ
                </span>
              )}
            </div>
            <div>
              <p className="font-black group-hover:text-[var(--color-primary)] transition">
                Kỳ dâu
              </p>
              <p className="mt-1.5 text-xs font-semibold leading-relaxed text-[var(--color-muted)]">
                {periodStatus 
                  ? periodStatus.message 
                  : profile.gender === "female"
                    ? "Cập nhật lịch chu kỳ của bạn để theo dõi sức khỏe và nhận sự ngọt ngào từ người ấy nhé! 🌸"
                    : `Nhắc ${partnerName} bật chia sẻ chu kỳ để bạn ở bên chăm sóc cô ấy chu đáo và dịu dàng hơn nhé! 🫂`}
              </p>
              {periodStatus?.subMessage && (
                <p className="mt-1.5 text-[10px] font-bold text-[var(--color-faint)] italic">
                  {periodStatus.subMessage}
                </p>
              )}
            </div>
            {!periodStatus && (
              <span className="mt-auto inline-flex items-center gap-1 text-xs font-bold text-[var(--color-primary)] opacity-0 group-hover:opacity-100 transition">
                <Plus className="size-3" /> Thêm lịch
              </span>
            )}
          </SoftCard>
        </div>

        {/* Sinh nhật */}
        <div onClick={() => router.push("/calendar")} className="group block select-none cursor-pointer">
          <SoftCard
            muted
            className="transition duration-300 hover:-translate-y-1 hover:shadow-md hover:border-[var(--color-primary)]/30 h-full flex flex-col gap-4"
          >
            <div className="flex items-start justify-between">
              <div className="grid size-10 place-items-center rounded-2xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] group-hover:scale-110 transition duration-300">
                <Cake className="size-5 text-amber-500" />
              </div>
              {partnerBdayDays !== null ? (
                <CountdownRing
                  days={partnerBdayDays}
                  maxDays={365}
                  color="#f59e0b"
                />
              ) : (
                <Link
                  href="/settings"
                  onClick={(e) => e.stopPropagation()}
                  className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-[10px] font-black text-amber-600 hover:bg-amber-100 transition"
                >
                  + Thêm ngày sinh
                </Link>
              )}
            </div>
            <div>
              <p className="font-black group-hover:text-[var(--color-primary)] transition">
                Sinh nhật
              </p>
              <p className="mt-1.5 text-xs font-semibold leading-relaxed text-[var(--color-muted)]">
                {partnerBdayDays !== null
                  ? `Sinh nhật của ${partnerName} còn ${partnerBdayDays} ngày`
                  : `Cập nhật ngày sinh của người ấy để cùng đếm ngược và chuẩn bị buổi thổi nến thật ấm áp nhé! 🎂`}
              </p>
              {partnerBdayDays !== null && partnerBdayDays <= 5 && (
                <p className="mt-1.5 text-[10px] font-black text-amber-600 animate-pulse uppercase tracking-wider">
                  🎁 Chuẩn bị bất ngờ ngay thôi!
                </p>
              )}
            </div>
          </SoftCard>
        </div>

        {/* Kỷ niệm */}
        <div onClick={() => router.push("/calendar")} className="group block select-none cursor-pointer">
          <SoftCard
            muted
            className="transition duration-300 hover:-translate-y-1 hover:shadow-md hover:border-[var(--color-primary)]/30 h-full flex flex-col gap-4"
          >
            <div className="flex items-start justify-between">
              <div className="grid size-10 place-items-center rounded-2xl bg-[var(--color-success-soft)] text-[var(--color-success)] group-hover:scale-110 transition duration-300">
                <CalendarDays className="size-5 text-pink-500" />
              </div>
              {nextSpecial ? (
                <CountdownRing
                  days={nextSpecial.daysLeft}
                  maxDays={365}
                  color="#ec4899"
                />
              ) : (
                <Link
                  href="/calendar"
                  onClick={(e) => e.stopPropagation()}
                  className="rounded-full border border-pink-200 bg-pink-50 px-3 py-1.5 text-[10px] font-black text-pink-600 hover:bg-pink-100 transition"
                >
                  + Thêm sự kiện
                </Link>
              )}
            </div>
            <div>
              <p className="font-black group-hover:text-[var(--color-primary)] transition">
                Kỷ niệm
              </p>
              <p className="mt-1.5 text-xs font-semibold leading-relaxed text-[var(--color-muted)]">
                {nextSpecial
                  ? `${nextSpecial.title} (Còn ${nextSpecial.daysLeft} ngày)`
                  : nextBucketItem?.title
                  ? `Ước mơ sắp tới: ${nextBucketItem.title}`
                  : "Chưa có kỷ niệm sắp tới. Hãy thêm ngày yêu hoặc ngày kỷ niệm đầu tiên hẹn hò nhé! 💖"}
              </p>
              {nextSpecial?.description && (
                <p className="mt-1.5 text-[10px] font-bold text-[var(--color-faint)] italic line-clamp-1">
                  "{nextSpecial.description}"
                </p>
              )}
            </div>
          </SoftCard>
        </div>
      </div>
    </div>
  );
}
