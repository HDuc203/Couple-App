"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  Image as ImageIcon,
  MessageCircle,
  Smile,
  Heart,
  Star,
  Sparkles,
  Gift,
  MapPin,
  Droplet,
  ArrowRight,
  Music,
  Camera,
  Zap,
} from "lucide-react";
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
  const [tick, setTick] = useState(0);
  const [heartPop, setHeartPop] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  function handleHeartClick() {
    setHeartPop(true);
    setTimeout(() => setHeartPop(false), 600);
  }

  return (
    <div className="home-grid">
      {/* ── HERO BANNER ── */}
      <section className="hero-banner">
        {/* Animated orbs */}
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />
        <div className="hero-orb hero-orb-3" />

        <div className="hero-content">
          {/* Avatar pair */}
          <div className="hero-avatars">
            <div className="hero-avatar hero-avatar-you">
              {name.trim().charAt(0).toUpperCase() || "U"}
              <div className="hero-avatar-ring" />
            </div>
            <button
              aria-label="Thích"
              className={`hero-heart-btn ${heartPop ? "heart-pop" : ""}`}
              onClick={handleHeartClick}
              type="button"
            >
              <Heart className="hero-heart-icon" />
              <span className="hero-heart-pulse" />
            </button>
            <div className="hero-avatar hero-avatar-partner">
              <span>♡</span>
              <div className="hero-avatar-ring" />
            </div>
          </div>

          {/* Label */}
          <p className="hero-label">
            {connected ? `${name} & Người ấy` : `Chào mừng, ${name}`}
          </p>

          {/* Days counter */}
          <div className="hero-days-wrap">
            <span className="hero-days-number">
              {connected ? daysTogether : "–"}
            </span>
            <div className="hero-days-meta">
              <span className="hero-days-unit">
                {connected ? "ngày" : "ngày"}
              </span>
              <span className="hero-days-sub">
                {connected ? "bên nhau 💕" : "chờ kết nối"}
              </span>
            </div>
          </div>

          {/* Quote */}
          <p className="hero-quote">
            {connected
              ? '"Mình cứ dịu dàng với nhau thêm một ngày nữa."'
              : "Kết nối người ấy để bắt đầu hành trình chung 🌸"}
          </p>

          {/* Date from */}
          {connected && (
            <div className="hero-since-badge">
              <Calendar className="hero-since-icon" />
              <span>Từ 21/05/2026</span>
            </div>
          )}
        </div>

        {/* Floating sparkles */}
        <Sparkles className="hero-sparkle hero-sparkle-1" />
        <Sparkles className="hero-sparkle hero-sparkle-2" />
        <Star className="hero-sparkle hero-sparkle-3" />
      </section>

      {/* ── CONNECT PROMPT (if not connected) ── */}
      {!connected && (
        <section className="connect-prompt-card">
          <div className="connect-prompt-glow" />
          <div className="connect-prompt-body">
            <div className="connect-prompt-icon-wrap">
              <Zap className="connect-prompt-icon" />
            </div>
            <div>
              <h2 className="connect-prompt-title">Kết nối người ấy</h2>
              <p className="connect-prompt-desc">
                Mở tính năng countdown, nhật ký chung, album ký ức và anniversary
                reminder khi bạn kết nối đôi.
              </p>
            </div>
          </div>
          <div className="connect-feature-chips">
            {[
              { icon: Calendar, label: "Countdown" },
              { icon: MessageCircle, label: "Nhật ký" },
              { icon: ImageIcon, label: "Album" },
            ].map(({ icon: Icon, label }) => (
              <div className="connect-chip" key={label}>
                <Icon className="connect-chip-icon" />
                <span>{label}</span>
              </div>
            ))}
          </div>
          <button
            className="connect-prompt-btn"
            onClick={onOpenSettings}
            type="button"
          >
            <span>Kết nối ngay</span>
            <ArrowRight className="connect-btn-arrow" />
          </button>
        </section>
      )}

      {/* ── TWO-COLUMN ROW: Mood + Message ── */}
      <div className="home-two-col">
        {/* Mood card */}
        <div className="mood-card glass-card">
          <div className="card-header">
            <div className="card-icon-badge mood-icon-badge">
              <Smile className="card-icon" />
            </div>
            <div>
              <h2 className="card-title">Tâm trạng hôm nay</h2>
              <p className="card-subtitle">Bạn đang cảm thấy thế nào?</p>
            </div>
          </div>
          <div className="mood-selector-wrap">
            <MoodSelector selectedMood={mood} onMoodChange={onMoodChange} />
          </div>
          {/* Active mood display */}
          <div className="mood-active-display">
            <span className="mood-active-emoji">
              {mood === "Vui" ? "😄" : mood === "Yêu" ? "🥰" : mood === "Mệt" ? "😴" : "🥺"}
            </span>
            <span className="mood-active-label">{mood}</span>
          </div>
        </div>

        {/* Message card */}
        <div className="message-card glass-card">
          <div className="card-header">
            <div className="card-icon-badge message-icon-badge">
              <MessageCircle className="card-icon" />
            </div>
            <div>
              <h2 className="card-title">Lời nhắn yêu thương</h2>
              <p className="card-subtitle">Hôm nay • 08:42</p>
            </div>
          </div>
          <div className="message-bubble">
            <p className="message-text">
              Hôm nay mình vẫn chọn nhau. Nhớ uống nước và nghỉ sớm nhé 🌙
            </p>
          </div>
          <div className="message-actions">
            <button className="message-reply-btn" type="button">
              <Heart className="h-3.5 w-3.5" /> Thích
            </button>
            <button className="message-reply-btn" type="button">
              <MessageCircle className="h-3.5 w-3.5" /> Trả lời
            </button>
          </div>
        </div>
      </div>

      {/* ── UPCOMING SECTION ── */}
      <section className="upcoming-section">
        <div className="section-header">
          <div className="section-header-left">
            <div className="section-title-dot" />
            <h2 className="section-title">Sắp tới</h2>
          </div>
          <button className="section-view-all" type="button">
            Xem tất cả <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="upcoming-grid">
          {upcomingItems.map((item) => (
            <UpcomingCard item={item} key={item.id} />
          ))}
        </div>
      </section>

      {/* ── QUICK ACTIONS GRID ── */}
      <section className="quick-actions-section">
        <div className="section-header">
          <div className="section-header-left">
            <div className="section-title-dot" />
            <h2 className="section-title">Tính năng nhanh</h2>
          </div>
        </div>
        <div className="quick-actions-grid">
          <QuickAction
            icon={Camera}
            label="Thêm ảnh"
            desc="Album chung"
            color="pink"
          />
          <QuickAction
            icon={Music}
            label="Bài hát"
            desc="Của mình"
            color="purple"
          />
          <QuickAction
            icon={Gift}
            label="Wish list"
            desc="3 món"
            color="gold"
          />
          <QuickAction
            icon={MapPin}
            label="Địa điểm"
            desc="Bucket list"
            color="mint"
          />
        </div>
      </section>

      {/* ── CONNECTION STATUS / STATS ── */}
      <section className="stats-section">
        <div className="stats-card glass-card">
          <div className="stats-card-glow" />
          <div className="stats-card-body">
            <div className="stats-connection-status">
              <div
                className={`stats-status-dot ${connected ? "stats-status-connected" : "stats-status-pending"}`}
              />
              <span className="stats-status-label">
                {connected ? "Đã thành đôi" : "Chưa kết nối"}
              </span>
            </div>
            <p className="stats-desc">
              {connected
                ? "Không gian chung của hai bạn đang hoạt động."
                : "Kết nối để mở toàn bộ tính năng couple."}
            </p>
            <button
              className="stats-action-btn"
              onClick={onOpenSettings}
              type="button"
            >
              {connected ? "Xem kết nối" : "Nhập mã mời"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="stats-metrics">
            <StatMetric
              icon={Smile}
              label="Tâm trạng"
              value={mood}
              color="pink"
            />
            <div className="stats-divider" />
            <StatMetric
              icon={Calendar}
              label="Kỷ niệm"
              value={connected ? `${daysTogether} ngày` : "—"}
              color="gold"
            />
            <div className="stats-divider" />
            <StatMetric
              icon={Heart}
              label="Yêu thương"
              value="1 lời nhắn"
              color="purple"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

/* ─── Sub-components ─── */

function QuickAction({
  icon: Icon,
  label,
  desc,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  desc: string;
  color: "pink" | "purple" | "gold" | "mint";
}) {
  const colorMap = {
    pink: "qa-pink",
    purple: "qa-purple",
    gold: "qa-gold",
    mint: "qa-mint",
  };
  return (
    <button className={`quick-action-btn ${colorMap[color]}`} type="button">
      <div className="qa-icon-wrap">
        <Icon className="qa-icon" />
      </div>
      <span className="qa-label">{label}</span>
      <span className="qa-desc">{desc}</span>
    </button>
  );
}

function StatMetric({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  color: "pink" | "gold" | "purple";
}) {
  const iconClass =
    color === "pink"
      ? "stat-metric-icon stat-icon-pink"
      : color === "gold"
        ? "stat-metric-icon stat-icon-gold"
        : "stat-metric-icon stat-icon-purple";

  return (
    <div className="stat-metric">
      <Icon className={iconClass} />
      <span className="stat-metric-value">{value}</span>
      <span className="stat-metric-label">{label}</span>
    </div>
  );
}

