"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createCoupleAction, joinCoupleAction, disconnectCoupleAction, updateLoveStartDateAction } from "@/app/settings/actions";
import {
  Bell,
  Camera,
  Calendar,
  CheckCircle2,
  Copy,
  Heart,
  Image as ImageIcon,
  Lock,
  Mail,
  Palette,
  Phone,
  Shield,
  Smartphone,
  Unlink,
  User,
  Users,
  VenusAndMars,
  Loader2,
  Droplet,
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { createClient } from "@/lib/supabase/client";
import type { CurrentCouple } from "@/lib/couple";
import type { Profile } from "@/lib/profile";

type TabId = "profile" | "couple" | "appearance" | "notifications" | "privacy";

const TABS: Array<{ id: TabId; label: string; icon: any }> = [
  { id: "profile", label: "Hồ sơ cá nhân", icon: User },
  { id: "couple", label: "Không gian đôi", icon: Heart },
  { id: "appearance", label: "Giao diện", icon: Palette },
  { id: "notifications", label: "Thông báo", icon: Bell },
  { id: "privacy", label: "Quyền riêng tư", icon: Lock },
];

// ════════════════════════════════════════════════════════════
//  THEME SCENE BACKGROUNDS — each theme is its own world
// ════════════════════════════════════════════════════════════

function PinkBackground() {
  return (
    <>
      {/* Base gradient — animated breathe */}
      <div
        className="absolute inset-0"
        style={{
          background: "var(--settings-bg)",
          animation: "settings-bg-breathe 8s ease-in-out infinite",
        }}
      />
      {/* Large romantic orbs */}
      <div
        className="absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full blur-[90px]"
        style={{
          background: "var(--settings-orb-1)",
          animation: "settings-float-slow 9s ease-in-out infinite",
        }}
      />
      <div
        className="absolute -bottom-20 -right-20 h-[400px] w-[400px] rounded-full blur-[80px]"
        style={{
          background: "var(--settings-orb-2)",
          animation: "settings-float-slow 11s ease-in-out infinite 2s",
        }}
      />
      <div
        className="absolute top-1/2 left-1/2 h-[350px] w-[350px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[100px]"
        style={{
          background: "var(--settings-orb-3)",
          animation: "settings-float-medium 13s ease-in-out infinite 1s",
        }}
      />
      {/* Top-center glow */}
      <div className="absolute inset-0" style={{ background: "var(--settings-glow-center)" }} />
      {/* Vignette */}
      <div className="absolute inset-0" style={{ background: "var(--settings-vignette)" }} />
      {/* Floating petals */}
      {[
        { left: "8%",  size: 18, dur: 12, delay: 0,   rot: 15 },
        { left: "22%", size: 12, dur: 15, delay: 3,   rot: -20 },
        { left: "38%", size: 20, dur: 10, delay: 1.5, rot: 35 },
        { left: "55%", size: 14, dur: 18, delay: 5,   rot: -10 },
        { left: "70%", size: 16, dur: 13, delay: 2,   rot: 25 },
        { left: "85%", size: 10, dur: 16, delay: 4,   rot: -30 },
        { left: "92%", size: 22, dur: 11, delay: 0.5, rot: 5  },
      ].map((p, i) => (
        <div
          key={i}
          className="absolute top-0 pointer-events-none"
          style={{
            left: p.left,
            animation: `settings-petal-fall ${p.dur}s ease-in infinite ${p.delay}s`,
          }}
        >
          <svg width={p.size} height={p.size} viewBox="0 0 24 24" style={{ transform: `rotate(${p.rot}deg)` }}>
            <path d="M12 2 C8 2, 4 6, 4 10 C4 16, 12 22, 12 22 C12 22, 20 16, 20 10 C20 6, 16 2, 12 2Z"
              fill="rgba(255,105,160,0.55)" />
          </svg>
        </div>
      ))}
      {/* Ribbon light streaks */}
      <div className="absolute top-[15%] left-0 right-0 h-px opacity-30"
        style={{ background: "linear-gradient(90deg, transparent, rgba(255,130,180,0.8), transparent)", animation: "settings-light-ray 6s ease-in-out infinite" }} />
      <div className="absolute top-[45%] left-0 right-0 h-px opacity-20"
        style={{ background: "linear-gradient(90deg, transparent, rgba(255,160,200,0.7), transparent)", animation: "settings-light-ray 8s ease-in-out infinite 2s" }} />
    </>
  );
}

function GoldBackground() {
  return (
    <>
      {/* Deep dark base */}
      <div className="absolute inset-0" style={{ background: "var(--settings-bg)" }} />
      {/* Sunset bottom glow */}
      <div
        className="absolute bottom-0 inset-x-0 h-2/3"
        style={{
          background: "linear-gradient(to top, rgba(255,80,0,0.35) 0%, rgba(255,140,20,0.2) 30%, transparent 100%)",
          animation: "settings-float-slow 10s ease-in-out infinite",
        }}
      />
      {/* Warm orbs */}
      <div
        className="absolute -top-24 left-1/2 h-[500px] w-[600px] -translate-x-1/2 rounded-full blur-[120px]"
        style={{ background: "var(--settings-orb-1)", animation: "settings-float-medium 12s ease-in-out infinite" }}
      />
      <div
        className="absolute bottom-0 left-1/2 h-[300px] w-[500px] -translate-x-1/2 rounded-full blur-[80px]"
        style={{ background: "var(--settings-orb-2)", animation: "settings-drift 15s ease-in-out infinite 3s" }}
      />
      {/* Horizon line glow */}
      <div className="absolute inset-0" style={{ background: "var(--settings-glow-center)" }} />
      {/* Cinematic vignette */}
      <div className="absolute inset-0" style={{ background: "var(--settings-vignette)" }} />
      {/* Gold wave lines */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.08] pointer-events-none" viewBox="0 0 1000 600" preserveAspectRatio="none">
        {[0, 40, 80, 120, 160, 200].map((offset, i) => (
          <path key={i}
            d={`M -20 ${320 + offset} Q 250 ${290 + offset} 500 ${320 + offset} T 1020 ${320 + offset}`}
            stroke={i % 2 === 0 ? "#ffd700" : "#ff9900"} strokeWidth={i === 0 ? 2.5 : 1.5} fill="none"
          />
        ))}
      </svg>
      {/* Stars (top section) */}
      {[
        { x: "5%", y: "4%", s: 2.5 }, { x: "18%", y: "2%", s: 1.5 }, { x: "32%", y: "6%", s: 2 },
        { x: "48%", y: "1%", s: 3 }, { x: "62%", y: "5%", s: 1.5 }, { x: "76%", y: "3%", s: 2 },
        { x: "88%", y: "7%", s: 2.5 }, { x: "95%", y: "2%", s: 1.5 }, { x: "25%", y: "14%", s: 1 },
        { x: "68%", y: "12%", s: 1.5 }, { x: "82%", y: "18%", s: 1 },
      ].map((star, i) => (
        <div key={i} className="absolute rounded-full bg-white pointer-events-none"
          style={{
            left: star.x, top: star.y, width: star.s, height: star.s,
            boxShadow: `0 0 ${star.s * 3}px rgba(255,240,180,0.9)`,
            animation: `settings-twinkle ${2.5 + (i % 5) * 1.2}s ease-in-out infinite ${(i * 0.4) % 4}s`,
          }}
        />
      ))}
      {/* Light rays from sun */}
      {[15, 30, -15, -30, 0].map((angle, i) => (
        <div key={i} className="absolute bottom-0 left-1/2 pointer-events-none"
          style={{
            width: 2, height: "55%",
            background: "linear-gradient(to top, rgba(255,180,30,0.18), transparent)",
            transform: `translateX(-50%) rotate(${angle}deg)`,
            transformOrigin: "bottom center",
            animation: `settings-light-ray ${6 + i * 1.5}s ease-in-out infinite ${i * 0.8}s`,
          }}
        />
      ))}
    </>
  );
}

function LotusWhiteBackground() {
  return (
    <>
      {/* ── Clean ivory base ── */}
      <div className="absolute inset-0" style={{ background: "var(--settings-bg)" }} />

      {/* ── Paper texture ── */}
      <div className="absolute inset-0 pointer-events-none" style={{
        opacity: 0.03,
        backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.15) 3px, rgba(0,0,0,0.15) 4px), repeating-linear-gradient(90deg, transparent, transparent 50px, rgba(0,0,0,0.04) 50px, rgba(0,0,0,0.04) 51px)",
      }} />

      {/* ── Warm center glow — breathing ── */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "var(--settings-glow-center)" }} />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 h-[600px] w-[700px] rounded-full blur-[140px] pointer-events-none"
        style={{ background: "rgba(212,180,89,0.09)", animation: "settings-float-slow 12s ease-in-out infinite" }} />

      {/* ══ ANIMATED LOTUS — CENTER HERO ══ */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ top: "5%" }}>
        <div className="relative" style={{ animation: "lotus-float-up 8s ease-in-out infinite" }}>
          {/* Water ripple rings */}
          <div className="absolute left-1/2 bottom-[-10px] -translate-x-1/2 w-[160px] h-[30px] rounded-full border border-[#b3974b]/25"
            style={{ animation: "lotus-ripple 4s ease-in-out infinite" }} />
          <div className="absolute left-1/2 bottom-[-14px] -translate-x-1/2 w-[220px] h-[40px] rounded-full border border-[#b3974b]/15"
            style={{ animation: "lotus-ripple2 4s ease-in-out infinite 0.8s" }} />
          <div className="absolute left-1/2 bottom-[-18px] -translate-x-1/2 w-[300px] h-[52px] rounded-full border border-[#b3974b]/08"
            style={{ animation: "lotus-ripple 5s ease-in-out infinite 1.6s" }} />

          {/* Main lotus SVG */}
          <svg width="280" height="260" viewBox="0 0 280 260" fill="none">
            <defs>
              <radialGradient id="wl-petal-grad" cx="50%" cy="70%" r="60%">
                <stop offset="0%" stopColor="#fff9f0" stopOpacity="0.95"/>
                <stop offset="60%" stopColor="#fdf0e8" stopOpacity="0.85"/>
                <stop offset="100%" stopColor="#f5e8d5" stopOpacity="0.7"/>
              </radialGradient>
              <radialGradient id="wl-stamen" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fff3c0"/>
                <stop offset="100%" stopColor="#e0b86a"/>
              </radialGradient>
            </defs>
            {/* Outer petals — slow sway */}
            <g style={{ transformOrigin: "140px 200px", animation: "lotus-sway 7s ease-in-out infinite" }}>
              <path d="M140 195 C136 155 122 118 126 88 C130 68 150 68 154 88 C158 118 144 155 140 195Z"
                fill="url(#wl-petal-grad)" stroke="#b3974b" strokeWidth="0.8" opacity="0.9"/>
              <path d="M140 195 C112 178 88 155 84 126 C80 106 98 96 112 110 C124 128 134 168 140 195Z"
                fill="url(#wl-petal-grad)" stroke="#b3974b" strokeWidth="0.7" opacity="0.8"/>
              <path d="M140 195 C168 178 192 155 196 126 C200 106 182 96 168 110 C156 128 146 168 140 195Z"
                fill="url(#wl-petal-grad)" stroke="#b3974b" strokeWidth="0.7" opacity="0.8"/>
              <path d="M140 195 C96 180 68 162 64 135 C60 115 78 106 94 118 C108 134 130 172 140 195Z"
                fill="url(#wl-petal-grad)" stroke="#b3974b" strokeWidth="0.6" opacity="0.65"/>
              <path d="M140 195 C184 180 212 162 216 135 C220 115 202 106 186 118 C172 134 150 172 140 195Z"
                fill="url(#wl-petal-grad)" stroke="#b3974b" strokeWidth="0.6" opacity="0.65"/>
            </g>
            {/* Inner petals — faster sway offset */}
            <g style={{ transformOrigin: "140px 200px", animation: "lotus-sway-reverse 5.5s ease-in-out infinite 1s" }}>
              <path d="M140 195 C132 168 124 142 126 118 C130 106 150 106 154 118 C156 142 148 168 140 195Z"
                fill="#fff8f2" stroke="#c4a170" strokeWidth="0.9" opacity="0.95"/>
              <path d="M140 195 C120 182 106 164 106 144 C106 130 120 122 130 132 C136 146 140 176 140 195Z"
                fill="#fff8f2" stroke="#c4a170" strokeWidth="0.8" opacity="0.85"/>
              <path d="M140 195 C160 182 174 164 174 144 C174 130 160 122 150 132 C144 146 140 176 140 195Z"
                fill="#fff8f2" stroke="#c4a170" strokeWidth="0.8" opacity="0.85"/>
            </g>
            {/* Stamen center */}
            <circle cx="140" cy="192" r="14" fill="url(#wl-stamen)" opacity="0.9"
              style={{ animation: "lotus-ripple 3s ease-in-out infinite" }}/>
            <circle cx="140" cy="192" r="8" fill="#fff3c0" opacity="0.95"/>
            <circle cx="140" cy="192" r="3.5" fill="#e0b86a"/>
            {/* Stem */}
            <path d="M140 206 C138 220 136 235 134 250" stroke="#b3974b" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
            {/* Lily pad */}
            <ellipse cx="140" cy="215" rx="55" ry="10" fill="#d4e8c0" fillOpacity="0.3" stroke="#8a9e6a" strokeWidth="0.8" opacity="0.6"/>
            <path d="M140 205 L140 215" stroke="#8a9e6a" strokeWidth="0.6" opacity="0.5"/>
          </svg>
        </div>
      </div>

      {/* ══ SIDE LOTUSES — small, staggered ══ */}
      {/* Left lotus */}
      <div className="absolute bottom-[15%] left-[8%] pointer-events-none"
        style={{ animation: "lotus-float-up2 9s ease-in-out infinite 2s" }}>
        <svg width="100" height="90" viewBox="0 0 100 90" fill="none">
          <path d="M50 70 C48 54 42 38 44 24 C46 16 54 16 56 24 C58 38 52 54 50 70Z" fill="#fdf5ec" stroke="#b3974b" strokeWidth="0.7" opacity="0.7"/>
          <path d="M50 70 C36 62 26 50 26 38 C26 28 36 24 44 32 C48 44 50 62 50 70Z" fill="#fdf5ec" stroke="#b3974b" strokeWidth="0.6" opacity="0.6"/>
          <path d="M50 70 C64 62 74 50 74 38 C74 28 64 24 56 32 C52 44 50 62 50 70Z" fill="#fdf5ec" stroke="#b3974b" strokeWidth="0.6" opacity="0.6"/>
          <circle cx="50" cy="68" r="5" fill="#e8c87a" opacity="0.7"/>
          <ellipse cx="50" cy="76" rx="20" ry="4" fill="#d4e8b0" fillOpacity="0.4" stroke="#8a9e6a" strokeWidth="0.5"/>
        </svg>
      </div>
      {/* Right lotus — bud */}
      <div className="absolute bottom-[20%] right-[10%] pointer-events-none"
        style={{ animation: "lotus-float-up 11s ease-in-out infinite 4s" }}>
        <svg width="70" height="80" viewBox="0 0 70 80" fill="none">
          <path d="M35 60 C33 44 28 28 30 16 C32 8 38 8 40 16 C42 28 37 44 35 60Z" fill="#fff0e8" stroke="#b3974b" strokeWidth="0.7" opacity="0.75"/>
          <path d="M35 60 C24 54 18 42 20 32 C22 24 30 22 34 30 C36 42 36 56 35 60Z" fill="#fff0e8" stroke="#b3974b" strokeWidth="0.6" opacity="0.6"/>
          <path d="M35 60 C46 54 52 42 50 32 C48 24 40 22 36 30 C34 42 34 56 35 60Z" fill="#fff0e8" stroke="#b3974b" strokeWidth="0.6" opacity="0.6"/>
          <circle cx="35" cy="58" r="4" fill="#e0b86a" opacity="0.65"/>
        </svg>
      </div>

      {/* ══ GOLD INK DECORATIVE FRAME ══ */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1000 700" fill="none">
        {/* Top border */}
        <line x1="60" y1="28" x2="940" y2="28" stroke="#b3974b" strokeWidth="1.2" opacity="0.2"/>
        <line x1="60" y1="33" x2="940" y2="33" stroke="#b3974b" strokeWidth="0.4" strokeDasharray="12 6" opacity="0.14"/>
        <line x1="60" y1="672" x2="940" y2="672" stroke="#b3974b" strokeWidth="1.2" opacity="0.2"/>
        {/* Diamond ornament center */}
        <path d="M500 22 L507 30 L500 38 L493 30Z" fill="#b3974b" fillOpacity="0.3"/>
        {/* Corner flourishes */}
        <g opacity="0.25">
          <path d="M60 65 Q100 65 100 105" stroke="#b3974b" strokeWidth="1.2" fill="none"/>
          <path d="M60 65 Q60 105 100 105" stroke="#b3974b" strokeWidth="0.5" fill="none"/>
          <circle cx="60" cy="65" r="3" fill="#b3974b"/>
          <path d="M940 65 Q900 65 900 105" stroke="#b3974b" strokeWidth="1.2" fill="none"/>
          <path d="M940 65 Q940 105 900 105" stroke="#b3974b" strokeWidth="0.5" fill="none"/>
          <circle cx="940" cy="65" r="3" fill="#b3974b"/>
          <path d="M60 635 Q100 635 100 595" stroke="#b3974b" strokeWidth="1.2" fill="none"/>
          <circle cx="60" cy="635" r="3" fill="#b3974b"/>
          <path d="M940 635 Q900 635 900 595" stroke="#b3974b" strokeWidth="1.2" fill="none"/>
          <circle cx="940" cy="635" r="3" fill="#b3974b"/>
        </g>
        {/* Water lines */}
        <path d="M0 580 Q250 565 500 580 T1000 575" stroke="#b3974b" strokeWidth="0.6" opacity="0.12" fill="none"/>
        <path d="M0 595 Q250 580 500 595 T1000 590" stroke="#b3974b" strokeWidth="0.4" opacity="0.08" fill="none"/>
        <path d="M0 610 Q250 595 500 610 T1000 605" stroke="#b3974b" strokeWidth="0.3" opacity="0.06" fill="none"/>
      </svg>
      <div className="absolute inset-0" style={{ background: "var(--settings-vignette)" }} />
    </>
  );
}

function MintBackground() {
  return (
    <>
      {/* ── Sage green animated base ── */}
      <div className="absolute inset-0"
        style={{ background: "var(--settings-bg)", animation: "settings-bg-breathe 10s ease-in-out infinite" }} />

      {/* ── Watercolor blob layers ── */}
      <div className="absolute -top-32 -left-32 h-[520px] w-[520px] rounded-full blur-[100px] pointer-events-none"
        style={{ background: "rgba(59,92,74,0.28)", animation: "mint-watercolor-drift 13s ease-in-out infinite" }} />
      <div className="absolute top-[20%] right-[-10%] h-[400px] w-[380px] rounded-full blur-[80px] pointer-events-none"
        style={{ background: "rgba(100,160,120,0.2)", animation: "mint-watercolor-drift 16s ease-in-out infinite 3s" }} />
      <div className="absolute bottom-[-8%] left-[30%] h-[380px] w-[480px] rounded-full blur-[110px] pointer-events-none"
        style={{ background: "rgba(196,161,90,0.18)", animation: "settings-drift 18s ease-in-out infinite 2s" }} />
      <div className="absolute top-[-5%] right-[30%] h-[300px] w-[350px] rounded-full blur-[90px] pointer-events-none"
        style={{ background: "rgba(140,190,160,0.22)", animation: "settings-float-slow 14s ease-in-out infinite 5s" }} />

      {/* ── Natural light from top-left ── */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "var(--settings-glow-center)" }} />

      {/* ══ ANIMATED BOTANICAL FERNS — CORNERS ══ */}
      {/* Bottom-left LARGE fern — sways */}
      <div className="absolute bottom-0 left-0 pointer-events-none"
        style={{ transformOrigin: "0% 100%", animation: "leaf-sway-left 8s ease-in-out infinite" }}>
        <svg width="320" height="420" viewBox="0 0 320 420" fill="none">
          {/* Main stem */}
          <path d="M40 420 C70 340 130 280 160 200" stroke="#3b5c4a" strokeWidth="3" strokeLinecap="round" opacity="0.55"/>
          {/* Left fronds */}
          <path d="M75 380 C50 320 30 270 20 220 C0 230 -10 280 20 330Z" fill="#3b5c4a" fillOpacity="0.18" stroke="#3b5c4a" strokeWidth="1" opacity="0.7"/>
          <path d="M70 375 C30 320 10 260 0 210" stroke="#3b5c4a" strokeWidth="1" strokeDasharray="8 6" opacity="0.3"/>
          <path d="M100 320 C70 265 50 215 40 165 C20 175 10 225 40 275Z" fill="#3b5c4a" fillOpacity="0.15" stroke="#3b5c4a" strokeWidth="1" opacity="0.65"/>
          <path d="M125 265 C95 215 80 168 78 120 C58 130 48 180 78 228Z" fill="#3b5c4a" fillOpacity="0.13" stroke="#3b5c4a" strokeWidth="0.8" opacity="0.6"/>
          {/* Right fronds */}
          <path d="M95 360 C130 305 160 255 175 205 C155 202 130 240 105 290Z" fill="#4a7060" fillOpacity="0.2" stroke="#3b5c4a" strokeWidth="1" opacity="0.65"/>
          <path d="M118 300 C150 248 175 200 188 152 C168 150 145 188 120 238Z" fill="#4a7060" fillOpacity="0.16" stroke="#3b5c4a" strokeWidth="0.9" opacity="0.6"/>
          <path d="M140 238 C168 190 188 145 196 100 C178 99 157 136 136 184Z" fill="#4a7060" fillOpacity="0.13" stroke="#3b5c4a" strokeWidth="0.8" opacity="0.55"/>
          {/* Tip leaf */}
          <path d="M155 205 C175 170 185 135 182 100 C170 110 158 145 150 180Z" fill="#3b5c4a" fillOpacity="0.2" stroke="#3b5c4a" strokeWidth="0.8"/>
        </svg>
      </div>

      {/* Top-right fern — sways opposite */}
      <div className="absolute top-0 right-0 pointer-events-none"
        style={{ transformOrigin: "100% 0%", animation: "leaf-sway-right 9s ease-in-out infinite 1.5s" }}>
        <svg width="300" height="400" viewBox="0 0 300 400" fill="none">
          <path d="M260 0 C240 80 190 140 170 210" stroke="#3b5c4a" strokeWidth="3" strokeLinecap="round" opacity="0.5"/>
          <path d="M240 25 C265 85 278 140 285 195 C300 185 305 135 278 88Z" fill="#3b5c4a" fillOpacity="0.18" stroke="#3b5c4a" strokeWidth="1" opacity="0.65"/>
          <path d="M222 80 C248 138 258 193 260 245 C278 235 282 185 258 138Z" fill="#3b5c4a" fillOpacity="0.15" stroke="#3b5c4a" strokeWidth="0.9" opacity="0.6"/>
          <path d="M200 140 C218 195 222 248 218 298 C234 290 238 240 220 192Z" fill="#3b5c4a" fillOpacity="0.13" stroke="#3b5c4a" strokeWidth="0.8" opacity="0.55"/>
          <path d="M220 50 C188 95 165 145 155 195 C172 195 194 158 215 112Z" fill="#4a7060" fillOpacity="0.2" stroke="#3b5c4a" strokeWidth="1" opacity="0.6"/>
          <path d="M202 110 C170 155 148 203 142 252 C158 250 180 213 202 168Z" fill="#4a7060" fillOpacity="0.16" stroke="#3b5c4a" strokeWidth="0.8" opacity="0.55"/>
        </svg>
      </div>

      {/* Small accent leaf — top-left, sways */}
      <div className="absolute top-[5%] left-[5%] pointer-events-none"
        style={{ transformOrigin: "50% 100%", animation: "lotus-sway 11s ease-in-out infinite 3s" }}>
        <svg width="120" height="100" viewBox="0 0 120 100" fill="none">
          <path d="M20 100 C45 70 80 50 95 25 C75 18 50 38 30 65Z" fill="#3b5c4a" fillOpacity="0.2" stroke="#3b5c4a" strokeWidth="1.2"/>
          <path d="M20 100 C50 78 80 58 95 28" stroke="#3b5c4a" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
          <path d="M45 85 C65 64 82 46 90 26" stroke="#3b5c4a" strokeWidth="0.6" opacity="0.3"/>
        </svg>
      </div>

      {/* ══ CENTRAL ANIMATED LOTUS ══ */}
      <div className="absolute inset-0 flex items-end justify-center pointer-events-none" style={{ paddingBottom: "5%" }}>
        <div className="relative" style={{ animation: "lotus-float-up 10s ease-in-out infinite 1s" }}>
          {/* Lily pad + water ripples */}
          <div className="absolute left-1/2 -translate-x-1/2" style={{ bottom: "-8px", width: "200px" }}>
            <svg width="200" height="60" viewBox="0 0 200 60" fill="none">
              <ellipse cx="100" cy="30" rx="80" ry="18" fill="#3b5c4a" fillOpacity="0.25" stroke="#3b5c4a" strokeWidth="1.2"/>
              <path d="M100 12 L100 30" stroke="#3b5c4a" strokeWidth="1" opacity="0.5"/>
              <path d="M40 28 Q100 18 160 28" stroke="#3b5c4a" strokeWidth="0.6" opacity="0.35"/>
              <ellipse cx="100" cy="34" rx="100" ry="14" fill="none" stroke="#3b5c4a" strokeWidth="0.7" opacity="0.3"
                style={{ animation: "lotus-ripple 4s ease-in-out infinite" }}/>
              <ellipse cx="100" cy="38" rx="130" ry="18" fill="none" stroke="#3b5c4a" strokeWidth="0.4" opacity="0.2"
                style={{ animation: "lotus-ripple2 4s ease-in-out infinite 1s" }}/>
            </svg>
          </div>
          {/* Lotus bloom */}
          <svg width="220" height="200" viewBox="0 0 220 200" fill="none">
            <defs>
              <radialGradient id="ml-petal" cx="50%" cy="65%" r="55%">
                <stop offset="0%" stopColor="#e8f4ee" stopOpacity="0.95"/>
                <stop offset="100%" stopColor="#c8ddd3" stopOpacity="0.8"/>
              </radialGradient>
              <radialGradient id="ml-gold" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fff3c0"/>
                <stop offset="100%" stopColor="#c4a15a"/>
              </radialGradient>
            </defs>
            {/* Outer petals */}
            <g style={{ transformOrigin: "110px 160px", animation: "lotus-sway 8s ease-in-out infinite" }}>
              <path d="M110 155 C107 128 98 102 101 78 C104 62 116 62 119 78 C122 102 113 128 110 155Z"
                fill="url(#ml-petal)" stroke="#3b5c4a" strokeWidth="1" opacity="0.9"/>
              <path d="M110 155 C88 140 72 120 71 98 C70 82 84 74 96 86 C104 100 108 136 110 155Z"
                fill="url(#ml-petal)" stroke="#3b5c4a" strokeWidth="0.9" opacity="0.8"/>
              <path d="M110 155 C132 140 148 120 149 98 C150 82 136 74 124 86 C116 100 112 136 110 155Z"
                fill="url(#ml-petal)" stroke="#3b5c4a" strokeWidth="0.9" opacity="0.8"/>
              <path d="M110 155 C68 142 48 124 47 102 C46 84 62 76 78 90 C92 108 104 140 110 155Z"
                fill="url(#ml-petal)" stroke="#3b5c4a" strokeWidth="0.8" opacity="0.65"/>
              <path d="M110 155 C152 142 172 124 173 102 C174 84 158 76 142 90 C128 108 116 140 110 155Z"
                fill="url(#ml-petal)" stroke="#3b5c4a" strokeWidth="0.8" opacity="0.65"/>
            </g>
            {/* Inner petals */}
            <g style={{ transformOrigin: "110px 160px", animation: "lotus-sway-reverse 6s ease-in-out infinite 1.5s" }}>
              <path d="M110 155 C104 136 98 116 100 98 C103 88 117 88 120 98 C122 116 116 136 110 155Z"
                fill="#d8eee2" stroke="#4a7060" strokeWidth="0.9" opacity="0.95"/>
              <path d="M110 155 C94 146 84 130 84 114 C84 102 95 96 104 106 C108 118 110 144 110 155Z"
                fill="#d8eee2" stroke="#4a7060" strokeWidth="0.8" opacity="0.85"/>
              <path d="M110 155 C126 146 136 130 136 114 C136 102 125 96 116 106 C112 118 110 144 110 155Z"
                fill="#d8eee2" stroke="#4a7060" strokeWidth="0.8" opacity="0.85"/>
            </g>
            {/* Stamen */}
            <circle cx="110" cy="152" r="12" fill="url(#ml-gold)" opacity="0.9" style={{ animation: "lotus-ripple 3.5s ease-in-out infinite" }}/>
            <circle cx="110" cy="152" r="6" fill="#fff8c0" opacity="0.95"/>
            <circle cx="110" cy="152" r="3" fill="#c4a15a"/>
            {/* Stem */}
            <path d="M110 163 C108 175 106 188 104 200" stroke="#3b5c4a" strokeWidth="2.5" strokeLinecap="round" opacity="0.45"/>
          </svg>
        </div>
      </div>

      {/* ── Floating botanical particles ── */}
      {[
        { x:"15%", y:"25%", size:10, dur:14, delay:0 },
        { x:"80%", y:"40%", size:8, dur:12, delay:2 },
        { x:"60%", y:"15%", size:6, dur:16, delay:4 },
        { x:"25%", y:"70%", size:9, dur:11, delay:1.5 },
        { x:"90%", y:"65%", size:7, dur:15, delay:3 },
      ].map((p, i) => (
        <div key={i} className="absolute pointer-events-none"
          style={{ left: p.x, top: p.y, animation: `settings-petal-fall ${p.dur}s ease-in-out infinite ${p.delay}s` }}>
          <svg width={p.size} height={p.size} viewBox="0 0 20 20" fill="none">
            <path d="M10 2 C6 2 2 6 2 10 C2 16 10 20 10 20 C10 20 18 16 18 10 C18 6 14 2 10 2Z"
              fill="#3b5c4a" fillOpacity="0.45"/>
          </svg>
        </div>
      ))}

      {/* ── Watercolor wash strokes ── */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1000 700" fill="none">
        <path d="M0 250 Q200 225 450 255 Q650 280 1000 245" stroke="#3b5c4a" strokeWidth="1.5" opacity="0.06" fill="none"/>
        <path d="M0 420 Q250 398 500 422 Q750 446 1000 415" stroke="#3b5c4a" strokeWidth="1" opacity="0.05" fill="none"/>
        <path d="M0 560 Q300 542 600 565 T1000 555" stroke="#3b5c4a" strokeWidth="0.8" opacity="0.04" fill="none"/>
      </svg>
      <div className="absolute inset-0" style={{ background: "var(--settings-vignette)" }} />
    </>
  );
}

function DarkNavyBackground() {
  const stars = [
    {x:"3%",y:"3%",s:2.5,b:8},{x:"12%",y:"1%",s:1.5,b:5},{x:"24%",y:"5%",s:2,b:6},
    {x:"38%",y:"2%",s:3.5,b:12},{x:"52%",y:"1%",s:1.5,b:5},{x:"66%",y:"4%",s:2,b:7},
    {x:"79%",y:"2%",s:3,b:10},{x:"91%",y:"6%",s:1.5,b:5},{x:"97%",y:"1%",s:2,b:7},
    {x:"8%",y:"15%",s:1,b:3},{x:"20%",y:"12%",s:2,b:6},{x:"35%",y:"18%",s:1,b:3},
    {x:"50%",y:"10%",s:2.5,b:8},{x:"64%",y:"16%",s:1,b:3},{x:"75%",y:"11%",s:2,b:6},
    {x:"86%",y:"19%",s:1,b:3},{x:"94%",y:"14%",s:2.5,b:8},{x:"16%",y:"28%",s:1,b:3},
    {x:"42%",y:"25%",s:2,b:6},{x:"70%",y:"30%",s:1,b:3},{x:"88%",y:"26%",s:1.5,b:5},
    {x:"5%",y:"45%",s:1,b:3},{x:"28%",y:"42%",s:2,b:6},{x:"55%",y:"48%",s:1,b:3},
    {x:"80%",y:"44%",s:2.5,b:8},{x:"96%",y:"40%",s:1,b:3},{x:"18%",y:"60%",s:1.5,b:4},
    {x:"45%",y:"65%",s:1,b:3},{x:"72%",y:"58%",s:2,b:5},{x:"93%",y:"62%",s:1,b:3},
    {x:"33%",y:"75%",s:1,b:3},{x:"61%",y:"78%",s:1.5,b:4},{x:"84%",y:"72%",s:1,b:3},
  ];

  const goldDust = [
    {x:"12%",y:"80%",s:3},{x:"25%",y:"72%",s:2},{x:"38%",y:"85%",s:2.5},
    {x:"52%",y:"75%",s:3},{x:"65%",y:"82%",s:2},{x:"78%",y:"70%",s:2.5},
    {x:"88%",y:"78%",s:3},{x:"18%",y:"65%",s:2},{x:"44%",y:"68%",s:2.5},
    {x:"70%",y:"62%",s:2},{x:"92%",y:"55%",s:3},{x:"8%",y:"58%",s:2},
  ];

  return (
    <>
      {/* ── Deep dark base ── */}
      <div className="absolute inset-0" style={{ background: "var(--settings-bg)" }} />

      {/* ── Nebula orbs — animated shift ── */}
      <div className="absolute top-[-15%] left-[15%] h-[700px] w-[700px] rounded-full blur-[140px] pointer-events-none"
        style={{ background: "rgba(20,40,110,0.6)", animation: "nebula-shift 18s ease-in-out infinite" }} />
      <div className="absolute top-[-10%] right-[10%] h-[500px] w-[600px] rounded-full blur-[120px] pointer-events-none"
        style={{ background: "rgba(10,20,70,0.5)", animation: "nebula-shift 24s ease-in-out infinite 4s" }} />
      <div className="absolute bottom-[-10%] left-[-5%] h-[500px] w-[550px] rounded-full blur-[110px] pointer-events-none"
        style={{ background: "rgba(15,30,90,0.45)", animation: "settings-float-medium 20s ease-in-out infinite 2s" }} />
      {/* Gold nebula accent */}
      <div className="absolute top-[35%] right-[8%] h-[300px] w-[350px] rounded-full blur-[100px] pointer-events-none"
        style={{ background: "rgba(224,184,106,0.1)", animation: "settings-drift 22s ease-in-out infinite 6s" }} />
      <div className="absolute bottom-[20%] left-[10%] h-[250px] w-[280px] rounded-full blur-[90px] pointer-events-none"
        style={{ background: "rgba(200,160,80,0.08)", animation: "settings-float-slow 16s ease-in-out infinite 3s" }} />

      {/* ── Blue center nebula glow ── */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "var(--settings-glow-center)" }} />

      {/* ── Dense star field ── */}
      {stars.map((star, i) => (
        <div key={i} className="absolute rounded-full bg-white pointer-events-none"
          style={{
            left: star.x, top: star.y, width: star.s, height: star.s,
            boxShadow: `0 0 ${star.b}px rgba(255,255,230,0.95)`,
            animation: `settings-twinkle ${2 + (i % 7) * 1.1}s ease-in-out infinite ${(i * 0.32) % 5}s`,
          }}
        />
      ))}

      {/* ══ CENTRAL GOLD LOTUS — HERO ══ */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative" style={{ animation: "lotus-float-up 12s ease-in-out infinite 1s" }}>
          {/* Outer aura rings */}
          <div className="absolute inset-0 -m-16 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(224,184,106,0.12) 0%, transparent 70%)", animation: "lotus-ripple2 5s ease-in-out infinite" }}/>
          <div className="absolute inset-0 -m-8 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(224,184,106,0.18) 0%, transparent 60%)", animation: "lotus-ripple 4s ease-in-out infinite 1s" }}/>

          <svg width="300" height="280" viewBox="0 0 300 280" fill="none" style={{ animation: "dark-lotus-glow 5s ease-in-out infinite" }}>
            <defs>
              <radialGradient id="dk-gold-petal" cx="50%" cy="65%" r="60%">
                <stop offset="0%" stopColor="#fff8c0" stopOpacity="0.95"/>
                <stop offset="50%" stopColor="#e0b86a" stopOpacity="0.85"/>
                <stop offset="100%" stopColor="#b8840a" stopOpacity="0.7"/>
              </radialGradient>
              <radialGradient id="dk-mid-petal" cx="50%" cy="60%" r="55%">
                <stop offset="0%" stopColor="#fff3a0" stopOpacity="0.9"/>
                <stop offset="100%" stopColor="#c8960a" stopOpacity="0.75"/>
              </radialGradient>
              <radialGradient id="dk-stamen" cx="50%" cy="40%" r="50%">
                <stop offset="0%" stopColor="#ffffff"/>
                <stop offset="60%" stopColor="#fff8c0"/>
                <stop offset="100%" stopColor="#e0b86a"/>
              </radialGradient>
              <filter id="dk-glow-filter" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="4" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>
            {/* Outermost petals — slow sway */}
            <g style={{ transformOrigin: "150px 220px", animation: "lotus-sway 9s ease-in-out infinite" }} filter="url(#dk-glow-filter)">
              <path d="M150 215 C146 178 134 142 138 108 C142 88 158 88 162 108 C166 142 154 178 150 215Z"
                fill="url(#dk-gold-petal)" opacity="0.9"/>
              <path d="M150 215 C120 196 100 170 99 144 C98 124 114 114 128 128 C138 148 146 188 150 215Z"
                fill="url(#dk-gold-petal)" opacity="0.78"/>
              <path d="M150 215 C180 196 200 170 201 144 C202 124 186 114 172 128 C162 148 154 188 150 215Z"
                fill="url(#dk-gold-petal)" opacity="0.78"/>
              <path d="M150 215 C100 200 74 178 72 152 C70 130 88 120 106 134 C120 154 138 192 150 215Z"
                fill="url(#dk-gold-petal)" opacity="0.6"/>
              <path d="M150 215 C200 200 226 178 228 152 C230 130 212 120 194 134 C180 154 162 192 150 215Z"
                fill="url(#dk-gold-petal)" opacity="0.6"/>
            </g>
            {/* Mid petals — opposite sway */}
            <g style={{ transformOrigin: "150px 220px", animation: "lotus-sway-reverse 7s ease-in-out infinite 1.5s" }} filter="url(#dk-glow-filter)">
              <path d="M150 215 C144 192 136 168 138 148 C141 134 159 134 162 148 C164 168 156 192 150 215Z"
                fill="url(#dk-mid-petal)" opacity="0.95"/>
              <path d="M150 215 C130 204 118 186 118 168 C118 154 130 146 140 158 C144 174 148 202 150 215Z"
                fill="url(#dk-mid-petal)" opacity="0.88"/>
              <path d="M150 215 C170 204 182 186 182 168 C182 154 170 146 160 158 C156 174 152 202 150 215Z"
                fill="url(#dk-mid-petal)" opacity="0.88"/>
            </g>
            {/* Innermost petals */}
            <g style={{ transformOrigin: "150px 220px", animation: "lotus-sway 5s ease-in-out infinite 2s" }}>
              <path d="M150 215 C146 200 142 184 143 170 C145 160 155 160 157 170 C158 184 154 200 150 215Z"
                fill="#fff8e0" opacity="0.98" stroke="#e0c060" strokeWidth="0.5"/>
              <path d="M150 215 C140 208 134 196 134 184 C134 174 142 168 148 176 C150 188 150 208 150 215Z"
                fill="#fff8e0" opacity="0.9"/>
              <path d="M150 215 C160 208 166 196 166 184 C166 174 158 168 152 176 C150 188 150 208 150 215Z"
                fill="#fff8e0" opacity="0.9"/>
            </g>
            {/* Stamen — glowing center */}
            <circle cx="150" cy="212" r="16" fill="url(#dk-stamen)" opacity="0.95" filter="url(#dk-glow-filter)"/>
            <circle cx="150" cy="212" r="9" fill="#ffffff" opacity="0.98"/>
            <circle cx="150" cy="212" r="4.5" fill="#e0b86a"/>
            <circle cx="150" cy="212" r="2" fill="#fff8c0"/>
            {/* Water ripples from base */}
            <ellipse cx="150" cy="230" rx="55" ry="10" stroke="rgba(224,184,106,0.3)" strokeWidth="1" fill="none"
              style={{ animation: "lotus-ripple 4s ease-in-out infinite" }}/>
            <ellipse cx="150" cy="234" rx="80" ry="14" stroke="rgba(224,184,106,0.18)" strokeWidth="0.7" fill="none"
              style={{ animation: "lotus-ripple2 4.5s ease-in-out infinite 1s" }}/>
            <ellipse cx="150" cy="240" rx="110" ry="18" stroke="rgba(224,184,106,0.1)" strokeWidth="0.5" fill="none"
              style={{ animation: "lotus-ripple 5.5s ease-in-out infinite 2s" }}/>
          </svg>
        </div>
      </div>

      {/* ══ SIDE GOLD LOTUS BUDS ══ */}
      <div className="absolute left-[6%] bottom-[22%] pointer-events-none"
        style={{ animation: "lotus-float-up2 14s ease-in-out infinite 3s" }}>
        <svg width="80" height="90" viewBox="0 0 80 90" fill="none" style={{ animation: "dark-lotus-glow 7s ease-in-out infinite 2s" }}>
          <defs><radialGradient id="dk-bud1" cx="50%" cy="70%" r="60%"><stop offset="0%" stopColor="#fff3a0"/><stop offset="100%" stopColor="#b8840a"/></radialGradient></defs>
          <path d="M40 75 C38 60 32 44 34 30 C36 22 44 22 46 30 C48 44 42 60 40 75Z" fill="url(#dk-bud1)" opacity="0.8"/>
          <path d="M40 75 C28 66 22 54 23 42 C24 34 32 30 38 38 C40 52 40 68 40 75Z" fill="url(#dk-bud1)" opacity="0.65"/>
          <path d="M40 75 C52 66 58 54 57 42 C56 34 48 30 42 38 C40 52 40 68 40 75Z" fill="url(#dk-bud1)" opacity="0.65"/>
          <circle cx="40" cy="73" r="5" fill="#e0b86a" opacity="0.9"/>
          <ellipse cx="40" cy="80" rx="25" ry="5" stroke="rgba(224,184,106,0.3)" strokeWidth="0.8" fill="none"/>
        </svg>
      </div>

      <div className="absolute right-[8%] top-[35%] pointer-events-none"
        style={{ animation: "lotus-sway 13s ease-in-out infinite 5s" }}>
        <svg width="65" height="75" viewBox="0 0 65 75" fill="none" style={{ animation: "dark-lotus-glow 9s ease-in-out infinite 4s" }}>
          <defs><radialGradient id="dk-bud2" cx="50%" cy="65%" r="55%"><stop offset="0%" stopColor="#fff0a0"/><stop offset="100%" stopColor="#c09020"/></radialGradient></defs>
          <path d="M32 65 C30 52 26 38 28 26 C30 18 36 18 38 26 C40 38 34 52 32 65Z" fill="url(#dk-bud2)" opacity="0.75"/>
          <path d="M32 65 C22 58 17 46 18 36 C19 28 26 24 30 32 C32 44 32 60 32 65Z" fill="url(#dk-bud2)" opacity="0.6"/>
          <path d="M32 65 C42 58 47 46 46 36 C45 28 38 24 34 32 C32 44 32 60 32 65Z" fill="url(#dk-bud2)" opacity="0.6"/>
          <circle cx="32" cy="63" r="4" fill="#e0b86a" opacity="0.85"/>
        </svg>
      </div>

      {/* ── Gold dust rising from bottom ── */}
      {goldDust.map((p, i) => (
        <div key={i} className="absolute rounded-full pointer-events-none"
          style={{
            left: p.x, top: p.y, width: p.s, height: p.s,
            background: "rgba(224,184,106,0.9)",
            boxShadow: `0 0 ${p.s * 5}px rgba(224,184,106,0.8)`,
            animation: `gold-dust-float ${8 + (i % 5) * 1.4}s ease-out infinite ${(i * 0.55) % 6}s`,
          }}
        />
      ))}

      {/* ── Cinematic light rays ── */}
      {[-40, -20, 0, 20, 40, -60, 60].map((angle, i) => (
        <div key={i} className="absolute top-0 left-1/2 pointer-events-none"
          style={{
            width: i % 3 === 0 ? 2 : 1,
            height: i % 3 === 0 ? "60%" : "45%",
            background: `linear-gradient(to bottom, rgba(224,184,106,${i % 3 === 0 ? "0.18" : "0.1"}), transparent)`,
            transform: `translateX(-50%) rotate(${angle}deg)`,
            transformOrigin: "top center",
            animation: `settings-light-ray ${8 + i * 1.2}s ease-in-out infinite ${i * 0.7}s`,
          }}
        />
      ))}

      {/* ── Deep cinematic vignette ── */}
      <div className="absolute inset-0" style={{ background: "var(--settings-vignette)" }} />
    </>
  );
}

// ════════════════════════════════════════════════════════════
//  SETTINGS INNER — uses theme context
// ════════════════════════════════════════════════════════════

function SettingsInner({
  profile,
  currentCouple,
  partner,
}: {
  profile: Profile;
  currentCouple: CurrentCouple | null;
  partner: Profile | null;
}) {
  const { theme } = useTheme();
  const searchParams = useSearchParams();
  const errorMsg = searchParams.get("error");
  const successMsg = searchParams.get("message");
  const tabParam = searchParams.get("tab") as TabId | null;

  const [activeTab, setActiveTab] = useState<TabId>(() => {
    if (tabParam && ["profile", "couple", "appearance", "notifications", "privacy"].includes(tabParam)) {
      return tabParam;
    }
    return "profile";
  });

  useEffect(() => {
    if (tabParam && ["profile", "couple", "appearance", "notifications", "privacy"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="px-2">
        <p className="text-sm font-black uppercase tracking-[0.2em]"
          style={{ color: "var(--settings-header-accent)", opacity: 0.7 }}>
          Cài đặt
        </p>
        <h1 className="mt-2 text-3xl font-black md:text-5xl" style={{ color: "var(--color-text)" }}>
          Cấu hình chung
        </h1>
      </header>

      <div className="flex flex-col gap-6 md:flex-row md:items-start">

        {/* Sidebar Nav */}
        <nav
          className="flex shrink-0 flex-row gap-2 overflow-x-auto rounded-[2rem] p-2 md:w-64 md:flex-col"
          style={{
            background: "var(--settings-sidebar-bg)",
            border: "1px solid var(--settings-sidebar-border)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
          }}
        >
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-3 rounded-[1.5rem] px-5 py-4 text-left text-sm font-bold transition-all duration-300 whitespace-nowrap"
                style={isActive ? {
                  background: "var(--color-primary)",
                  color: theme === "gold" || theme === "lotus-dark" ? "var(--color-bg)" : "white",
                  boxShadow: "var(--settings-active-shadow)",
                } : {
                  color: "var(--color-muted)",
                  background: "transparent",
                }}
                onMouseEnter={e => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.background = "var(--color-primary-soft)";
                }}
                onMouseLeave={e => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Content Area */}
        <main className="min-w-0 flex-1">
          <div
            className="rounded-[2.5rem] p-6 backdrop-blur-md md:p-10 transition-all duration-700"
            style={{
              background: "var(--settings-card-bg)",
              border: "1px solid var(--settings-card-ring)",
              boxShadow: "var(--theme-glow), 0 24px 60px rgba(0,0,0,0.08)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
            }}
          >
            {errorMsg && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-800 animate-slide-down">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800 animate-slide-down">
                {successMsg}
              </div>
            )}

            {activeTab === "profile"       && <ProfileSection profile={profile} />}
            {activeTab === "couple"        && <CoupleSection currentCouple={currentCouple} partner={partner} />}
            {activeTab === "appearance"    && <AppearanceSection />}
            {activeTab === "notifications" && <NotificationsSection />}
            {activeTab === "privacy"       && <PrivacySection profile={profile} />}
          </div>
        </main>
      </div>
    </div>
  );
}

export function SettingsView({
  profile,
  currentCouple,
  partner,
}: {
  profile: Profile;
  currentCouple: CurrentCouple | null;
  partner: Profile | null;
}) {
  return <SettingsInner profile={profile} currentCouple={currentCouple} partner={partner} />;
}


// --- SECTIONS ---

function ProfileSection({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [displayName, setDisplayName] = useState(profile.display_name || "");
  const [email] = useState(profile.email || "");
  const [phone, setPhone] = useState(profile.phone || "");
  const [birthday, setBirthday] = useState(profile.birthday || "");
  const [gender, setGender] = useState(profile.gender || "female");
  const [bio, setBio] = useState(profile.nickname || "");

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!displayName.trim()) {
      setErrorMsg("Tên hiển thị không được để trống.");
      return;
    }
    setErrorMsg("");
    setSuccessMsg("");
    setIsSaving(true);

    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim(),
        phone: phone.trim() || null,
        birthday: birthday || null,
        gender: gender,
        nickname: bio.trim() || null,
      })
      .eq("id", profile.id);

    setIsSaving(false);

    if (error) {
      setErrorMsg(`Lỗi lưu hồ sơ: ${error.message}`);
    } else {
      setSuccessMsg("Cập nhật hồ sơ cá nhân thành công! 🎉");
      startTransition(() => {
        router.refresh();
      });
      setTimeout(() => setSuccessMsg(""), 4000);
    }
  };

  const triggerAvatarUpload = () => {
    const fileInput = document.getElementById("avatar-upload-input");
    fileInput?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 250;
        const MAX_HEIGHT = 250;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);

        setErrorMsg("");
        setIsSaving(true);
        const supabase = createClient();
        const { error } = await supabase
          .from("profiles")
          .update({ avatar_url: dataUrl })
          .eq("id", profile.id);

        setIsSaving(false);
        if (error) {
          setErrorMsg(`Không thể tải lên ảnh đại diện: ${error.message}`);
        } else {
          setSuccessMsg("Cập nhật ảnh đại diện thành công! 📸");
          startTransition(() => {
            router.refresh();
          });
          setTimeout(() => setSuccessMsg(""), 4000);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-black text-[var(--color-text)]">Hồ sơ cá nhân</h2>
        <p className="mt-1 text-sm font-medium text-[var(--color-muted)]">
          Quản lý thông tin cá nhân của bạn trên ứng dụng.
        </p>
      </div>

      {errorMsg && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-800 animate-slide-down">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800 animate-slide-down">
          {successMsg}
        </div>
      )}

      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        <div className="relative group">
          <input
            type="file"
            id="avatar-upload-input"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
          <div className="flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-[2.5rem] bg-[var(--color-primary-soft)] text-4xl font-black text-[var(--color-primary)] shadow-inner ring-4 ring-[var(--color-surface)]">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt="Avatar"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                src={profile.avatar_url}
              />
            ) : (
              profile.display_name?.trim().charAt(0).toUpperCase() || "U"
            )}
          </div>
          <button
            onClick={triggerAvatarUpload}
            type="button"
            className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary)] text-white shadow-lg transition hover:scale-110 cursor-pointer"
            title="Đổi ảnh đại diện"
          >
            <Camera className="h-5 w-5" />
          </button>
        </div>

        <div className="w-full flex-1 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Tên hiển thị"
              icon={User}
              value={displayName}
              onChange={(e: any) => setDisplayName(e.target.value)}
            />
            <Field
              label="Email"
              icon={Mail}
              value={email}
              disabled
            />
          </div>
          <Field
            label="Số điện thoại"
            icon={Phone}
            value={phone}
            onChange={(e: any) => setPhone(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Ngày sinh"
          type="date"
          icon={Calendar}
          value={birthday}
          onChange={(e: any) => setBirthday(e.target.value)}
        />
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-bold text-[var(--color-muted)]">
            <VenusAndMars className="h-4 w-4" />
            Giới tính
          </label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="h-[3.25rem] w-full rounded-2xl border-none bg-[var(--color-surface)] px-4 font-semibold text-[var(--color-text)] outline-none ring-1 ring-[var(--color-border)] transition focus:ring-2 focus:ring-[var(--color-primary)] cursor-pointer"
          >
            <option value="female">Nữ</option>
            <option value="male">Nam</option>
            <option value="other">Khác</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-bold text-[var(--color-muted)]">
          Tiểu sử (Bio)
        </label>
        <textarea
          rows={3}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="w-full resize-none rounded-2xl border-none bg-[var(--color-surface)] p-4 font-medium text-[var(--color-text)] outline-none ring-1 ring-[var(--color-border)] transition focus:ring-2 focus:ring-[var(--color-primary)]"
          placeholder="Giới thiệu đôi nét về bạn..."
        />
      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-2xl bg-[var(--color-primary)] px-8 py-3.5 text-sm font-black text-white shadow-lg transition hover:bg-[var(--color-primary-hover)] hover:shadow-xl active:scale-95 disabled:opacity-55 flex items-center gap-1.5 cursor-pointer"
        >
          {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
          Lưu thay đổi
        </button>
      </div>
    </div>
  );
}

function CoupleSection({
  currentCouple,
  partner,
}: {
  currentCouple: CurrentCouple | null;
  partner: Profile | null;
}) {
  const [copied, setCopied] = useState(false);
  const [activeAction, setActiveAction] = useState<"create" | "join" | null>(null);

  const handleCopy = () => {
    if (currentCouple) {
      navigator.clipboard.writeText(currentCouple.couple.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-black text-[var(--color-text)]">Không gian đôi</h2>
        <p className="mt-1 text-sm font-medium text-[var(--color-muted)]">
          Quản lý kết nối và những kỷ niệm chung của hai bạn.
        </p>
      </div>

      {currentCouple ? (
        partner ? (
          // STATE 1: Connected successfully with a partner
          <div className="space-y-6">
            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] p-8 text-center text-white shadow-lg">
              <div className="absolute inset-0 bg-white/10 opacity-50 mix-blend-overlay"></div>
              <div className="relative z-10 flex flex-col items-center justify-center">
                <div className="mb-4 flex -space-x-4">
                  <div className="h-16 w-16 rounded-full border-4 border-white bg-[var(--color-soft-strong)]" />
                  <div className="h-16 w-16 rounded-full border-4 border-white bg-[var(--color-warning-soft)] animate-bounce" />
                </div>
                <h3 className="text-2xl font-black flex items-center gap-2">
                  <Heart className="h-6 w-6 fill-white text-white animate-pulse" />
                  Đã kết đôi thành công
                </h3>
                <p className="mt-2 text-lg font-medium text-white/90">
                  Hai bạn đang chia sẻ một không gian chung
                </p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-[2rem] bg-[var(--color-surface)] p-6 ring-1 ring-[var(--color-border)]">
                <h4 className="mb-4 text-sm font-black uppercase tracking-wider text-[var(--color-faint)]">Trạng thái</h4>
                <div className="space-y-4">
                  <div className="rounded-xl bg-[var(--color-soft)] p-4 text-sm font-bold text-[var(--color-text)]">
                    Đã kết nối với <strong>{partner.display_name || partner.email}</strong>! Cùng nhau khám phá nhật ký, album ảnh và các tính năng thú vị nhé.
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-between rounded-[2rem] bg-[var(--color-soft)] p-6 ring-1 ring-[var(--color-border)]">
                <div>
                  <h4 className="text-sm font-black uppercase tracking-wider text-[var(--color-faint)]">Mã kết nối của hai bạn</h4>
                  <div className="mt-4 flex items-center justify-center rounded-[1.5rem] border border-dashed border-[var(--color-primary)] bg-white py-6">
                    <span className="text-4xl font-black tracking-[0.25em] text-[var(--color-primary)]">
                      {currentCouple.couple.invite_code}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleCopy}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-primary)] py-3 text-sm font-black text-white transition hover:bg-[var(--color-primary-hover)] active:scale-95 cursor-pointer"
                >
                  {copied ? <CheckCircle2 className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                  {copied ? "Đã copy mã" : "Copy mã chia sẻ"}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-6 border-t border-[var(--color-border)]">
              <form action={updateLoveStartDateAction} className="flex items-center gap-4">
                <div className="text-sm">
                  <p className="font-bold text-[var(--color-text)]">Ngày yêu nhau</p>
                  <input
                    type="date"
                    name="love_start_date"
                    defaultValue={currentCouple.couple.love_start_date || ""}
                    className="mt-1 h-10 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-xs font-bold text-[var(--color-text)] outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>
                <button
                  type="submit"
                  className="mt-6 rounded-xl bg-[var(--color-soft)] px-4 py-2 text-xs font-black text-[var(--color-primary)] hover:bg-[var(--color-soft-strong)] transition cursor-pointer"
                >
                  Lưu ngày
                </button>
              </form>
              <form action={disconnectCoupleAction}>
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-50 transition cursor-pointer"
                >
                  <Unlink className="h-4 w-4" /> Hủy kết nối
                </button>
              </form>
            </div>
          </div>
        ) : (
          // STATE 2: User generated a code but nobody has joined yet
          <div className="space-y-6">
            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[var(--color-primary-soft)] to-[var(--color-surface)] p-8 text-center text-[var(--color-text)] border border-dashed border-[var(--color-primary)] shadow-sm">
              <div className="relative z-10 flex flex-col items-center justify-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-soft-strong)] text-[var(--color-primary)]">
                  <Users className="h-8 w-8 animate-pulse" />
                </div>
                <h3 className="text-2xl font-black flex items-center gap-2 text-[var(--color-primary)]">
                  Đang chờ người ấy kết nối...
                </h3>
                <p className="mt-2 text-sm font-medium text-[var(--color-muted)] max-w-md leading-relaxed">
                  Gửi mã kết nối bên dưới cho người thương của bạn. Khi họ nhập mã này ở tài khoản của họ, không gian đôi của hai bạn sẽ tự động được kích hoạt.
                </p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-[2rem] bg-[var(--color-surface)] p-6 ring-1 ring-[var(--color-border)]">
                <h4 className="mb-4 text-sm font-black uppercase tracking-wider text-[var(--color-faint)]">Hướng dẫn kết nối</h4>
                <div className="space-y-4 text-sm text-[var(--color-muted)] font-semibold leading-relaxed">
                  <p>1. Sao chép <strong>Mã kết nối</strong> ở khung bên phải.</p>
                  <p>2. Gửi mã này cho đối phương của bạn.</p>
                  <p>3. Người ấy cần vào <strong>Cài đặt &gt; Không gian đôi &gt; Nhập mã mời</strong> và điền mã này để hoàn tất ghép đôi.</p>
                </div>
              </div>

              <div className="flex flex-col justify-between rounded-[2rem] bg-[var(--color-soft)] p-6 ring-1 ring-[var(--color-border)]">
                <div>
                  <h4 className="text-sm font-black uppercase tracking-wider text-[var(--color-faint)]">Mã kết nối của bạn</h4>
                  <div className="mt-4 flex items-center justify-center rounded-[1.5rem] border border-dashed border-[var(--color-primary)] bg-white py-6">
                    <span className="text-4xl font-black tracking-[0.25em] text-[var(--color-primary)]">
                      {currentCouple.couple.invite_code}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleCopy}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-primary)] py-3 text-sm font-black text-white transition hover:bg-[var(--color-primary-hover)] active:scale-95 cursor-pointer"
                >
                  {copied ? <CheckCircle2 className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                  {copied ? "Đã copy mã" : "Copy mã chia sẻ"}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-6 border-t border-[var(--color-border)]">
              <form action={updateLoveStartDateAction} className="flex items-center gap-4">
                <div className="text-sm">
                  <p className="font-bold text-[var(--color-text)]">Ngày yêu nhau</p>
                  <input
                    type="date"
                    name="love_start_date"
                    defaultValue={currentCouple.couple.love_start_date || ""}
                    className="mt-1 h-10 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-xs font-bold text-[var(--color-text)] outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>
                <button
                  type="submit"
                  className="mt-6 rounded-xl bg-[var(--color-soft)] px-4 py-2 text-xs font-black text-[var(--color-primary)] hover:bg-[var(--color-soft-strong)] transition cursor-pointer"
                >
                  Lưu ngày
                </button>
              </form>
              <form action={disconnectCoupleAction}>
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-[var(--color-muted)] hover:bg-red-50 hover:text-red-500 transition cursor-pointer"
                  title="Hủy bỏ mã mời và quay lại trạng thái độc thân"
                >
                  <Unlink className="h-4 w-4" /> Hủy mã kết nối
                </button>
              </form>
            </div>
          </div>
        )
      ) : activeAction === "create" ? (
        <div className="flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] py-12 px-6 text-center animate-in fade-in zoom-in-95 duration-300">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-soft)]">
            <Heart className="h-8 w-8 text-[var(--color-primary)] animate-pulse" />
          </div>
          <h3 className="mt-4 text-xl font-black text-[var(--color-text)]">Tạo mã kết nối mới</h3>
          <p className="mt-2 max-w-sm text-sm text-[var(--color-muted)]">
            Ứng dụng sẽ tạo một mã kết nối ngẫu nhiên gồm 8 ký tự. Bạn có thể gửi mã này cho người ấy để kết nối.
          </p>
          <form action={createCoupleAction} className="mt-6 w-full max-w-sm space-y-4">
            <Field
              label="Ngày bắt đầu yêu (tùy chọn)"
              name="love_start_date"
              type="date"
              icon={Calendar}
            />
            <div className="flex gap-4 justify-center pt-2">
              <button
                type="submit"
                className="rounded-2xl bg-[var(--color-primary)] px-6 py-3.5 text-sm font-black text-white shadow-lg transition hover:bg-[var(--color-primary-hover)] active:scale-95 cursor-pointer"
              >
                Tạo mã của tôi
              </button>
              <button
                type="button"
                onClick={() => setActiveAction(null)}
                className="rounded-2xl bg-[var(--color-soft)] px-6 py-3.5 text-sm font-black text-[var(--color-text)] transition hover:bg-[var(--color-soft-strong)] active:scale-95 cursor-pointer"
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      ) : activeAction === "join" ? (
        <div className="flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] py-12 px-6 text-center animate-in fade-in zoom-in-95 duration-300">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-soft)]">
            <Users className="h-8 w-8 text-[var(--color-primary)]" />
          </div>
          <h3 className="mt-4 text-xl font-black text-[var(--color-text)]">Nhập mã mời của người ấy</h3>
          <p className="mt-2 max-w-sm text-sm text-[var(--color-muted)]">
            Nhập mã gồm 8 ký tự mà người ấy gửi cho bạn để bắt đầu không gian chung của hai người.
          </p>
          <form action={joinCoupleAction} className="mt-6 w-full max-w-sm space-y-4">
            <div className="space-y-2 text-left">
              <label className="flex items-center gap-2 text-sm font-bold text-[var(--color-muted)]">
                Mã mời (invite code)
              </label>
              <input
                required
                name="invite_code"
                placeholder="AB3X9K2M"
                maxLength={8}
                className="h-[3.25rem] w-full rounded-2xl border-none bg-[var(--color-surface)] px-4 font-black text-center text-xl tracking-[0.2em] text-[var(--color-primary)] outline-none ring-1 ring-[var(--color-border)] transition focus:ring-2 focus:ring-[var(--color-primary)] uppercase"
              />
            </div>
            <div className="flex gap-4 justify-center pt-2">
              <button
                type="submit"
                className="rounded-2xl bg-[var(--color-primary)] px-6 py-3.5 text-sm font-black text-white shadow-lg transition hover:bg-[var(--color-primary-hover)] active:scale-95 cursor-pointer"
              >
                Kết nối ngay
              </button>
              <button
                type="button"
                onClick={() => setActiveAction(null)}
                className="rounded-2xl bg-[var(--color-soft)] px-6 py-3.5 text-sm font-black text-[var(--color-text)] transition hover:bg-[var(--color-soft-strong)] active:scale-95 cursor-pointer"
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] py-16 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-soft)]">
            <Users className="h-10 w-10 text-[var(--color-primary)]" />
          </div>
          <h3 className="mt-4 text-xl font-black text-[var(--color-text)]">Bạn đang độc thân?</h3>
          <p className="mt-2 max-w-sm text-sm text-[var(--color-muted)]">
            Tạo mã để mời người ấy hoặc nhập mã người ấy gửi để bắt đầu không gian chung.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <button
              onClick={() => setActiveAction("create")}
              className="rounded-2xl bg-[var(--color-primary)] px-8 py-3.5 text-sm font-black text-white shadow-lg transition hover:bg-[var(--color-primary-hover)] hover:shadow-xl active:scale-95 cursor-pointer"
            >
              Tạo mã kết nối
            </button>
            <button
              onClick={() => setActiveAction("join")}
              className="rounded-2xl bg-[var(--color-soft)] px-8 py-3.5 text-sm font-black text-[var(--color-primary)] transition hover:bg-[var(--color-soft-strong)] active:scale-95 cursor-pointer"
            >
              Nhập mã mời
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  EXPLOSIVE THEME CARDS
// ════════════════════════════════════════════════════════════

function AppearanceSection() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--color-faint)]">
          Visual Identity
        </p>
        <h2 className="mt-1 text-4xl font-black text-[var(--color-text)] tracking-tight leading-none">
          Thế giới của bạn
        </h2>
        <p className="mt-3 text-sm text-[var(--color-muted)] max-w-md leading-relaxed">
          Mỗi giao diện là một vũ trụ cảm xúc riêng — từ ánh sáng, bóng đổ, đến từng nét họa tiết.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">

        {/* ══ SOFT PINK ══════════════════════════════════════════ */}
        <button
          onClick={() => setTheme("pink")}
          className={[
            "group relative flex flex-col overflow-hidden rounded-[2.5rem] text-left transition-all duration-500 cursor-pointer",
            theme === "pink"
              ? "shadow-[0_0_0_2px_rgba(255,105,180,0.7),0_30px_80px_rgba(255,60,130,0.4),0_10px_40px_rgba(200,80,120,0.3)] scale-[1.02]"
              : "shadow-[0_8px_40px_rgba(255,150,180,0.2)] hover:-translate-y-2 hover:shadow-[0_24px_70px_rgba(255,105,180,0.35)] hover:scale-[1.01]",
          ].join(" ")}
          style={{ background: "linear-gradient(150deg,#fff0f7 0%,#ffe0ef 50%,#ffd6e7 100%)" }}
        >
          {/* Scene */}
          <div className="relative h-56 w-full overflow-hidden">
            {/* Layered blurry orbs */}
            <div className="absolute -top-12 -left-12 h-52 w-52 rounded-full bg-[#ffb6d9] opacity-60 blur-3xl animate-[pulse_5s_ease-in-out_infinite]" />
            <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-[#ff69b4] opacity-30 blur-2xl animate-[pulse_7s_ease-in-out_infinite_1s]" />
            <div className="absolute bottom-0 left-1/2 h-32 w-32 -translate-x-1/2 rounded-full bg-[#ffa0c8] opacity-50 blur-2xl animate-[pulse_6s_ease-in-out_infinite_2s]" />

            {/* Ribbon streaks */}
            <div className="absolute top-12 left-0 h-1 w-2/3 rounded-full bg-gradient-to-r from-transparent via-white/50 to-transparent rotate-[-8deg]" />
            <div className="absolute top-20 right-0 h-0.5 w-1/2 rounded-full bg-gradient-to-l from-transparent via-white/40 to-transparent rotate-[6deg]" />
            <div className="absolute top-32 left-1/4 h-0.5 w-1/3 rounded-full bg-gradient-to-r from-transparent via-[#ff69b4]/30 to-transparent rotate-[-3deg]" />

            {/* Floating micro-hearts */}
            {[
              { x: "18%", y: "30%", s: 10, op: 0.5 },
              { x: "78%", y: "18%", s: 7, op: 0.4 },
              { x: "88%", y: "55%", s: 12, op: 0.3 },
              { x: "12%", y: "68%", s: 8, op: 0.4 },
              { x: "55%", y: "72%", s: 6, op: 0.3 },
            ].map((h, i) => (
              <div
                key={i}
                className="absolute animate-bounce"
                style={{ left: h.x, top: h.y, opacity: h.op, animationDuration: `${2 + i * 0.7}s`, animationDelay: `${i * 0.4}s` }}
              >
                <Heart fill="#ff4fa0" stroke="none" style={{ width: h.s, height: h.s }} />
              </div>
            ))}

            {/* Central glass card */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative flex h-24 w-24 items-center justify-center rounded-[2rem] border border-white/70 bg-white/30 backdrop-blur-md shadow-[0_8px_40px_rgba(255,100,160,0.35),inset_0_1px_0_rgba(255,255,255,0.7),inset_0_-1px_0_rgba(200,80,130,0.1)]">
                <Heart
                  className="drop-shadow-[0_0_20px_rgba(255,20,100,0.7)]"
                  fill="#ff2d78"
                  fillOpacity={0.95}
                  stroke="none"
                  style={{ width: 44, height: 44 }}
                />
                {/* Specular highlight */}
                <div className="absolute top-3 left-4 h-1.5 w-8 rounded-full bg-white/80 rotate-[-25deg]" />
                <div className="absolute top-5 left-5 h-1 w-4 rounded-full bg-white/50 rotate-[-25deg]" />
              </div>
            </div>

            {/* Top-right label badge */}
            <div className="absolute top-4 right-4 rounded-full border border-[#ff69b4]/40 bg-white/30 px-3 py-1 backdrop-blur-sm">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#d63a7a]">Romantic</span>
            </div>
          </div>

          {/* Info */}
          <div className="relative px-7 pb-6 pt-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#d87093]/70">pastel · dreamy</p>
                <h3 className="mt-0.5 text-2xl font-black text-[#b83068]">Soft Pink</h3>
                <p className="mt-1.5 text-xs font-medium text-[#d87093]/80 leading-relaxed">
                  Mộng mơ · Nhẹ nhàng · Tình yêu trong trẻo
                </p>
              </div>
              <div className={[
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-300",
                theme === "pink"
                  ? "bg-[#ff2d78] text-white shadow-[0_0_20px_rgba(255,45,120,0.6)] scale-110"
                  : "bg-white/60 border border-[#ffb6c1] text-[#ff69b4] opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100",
              ].join(" ")}>
                {theme === "pink" ? <CheckCircle2 className="h-5 w-5" /> : <Heart className="h-4 w-4" />}
              </div>
            </div>
          </div>
        </button>

        {/* ══ SUNSET GOLD ═══════════════════════════════════════ */}
        <button
          onClick={() => setTheme("gold")}
          className={[
            "group relative flex flex-col overflow-hidden rounded-[2.5rem] text-left transition-all duration-500 cursor-pointer",
            theme === "gold"
              ? "shadow-[0_0_0_2px_rgba(218,165,32,0.8),0_30px_80px_rgba(180,100,0,0.5),0_10px_40px_rgba(218,165,32,0.3)] scale-[1.02]"
              : "shadow-[0_8px_40px_rgba(180,120,0,0.2)] hover:-translate-y-2 hover:shadow-[0_24px_70px_rgba(218,165,32,0.4)] hover:scale-[1.01]",
          ].join(" ")}
          style={{ background: "linear-gradient(150deg,#12080000 0%,#1c0e02 30%,#0c0501 100%)" }}
        >
          <div className="relative h-56 w-full overflow-hidden">
            {/* Deep atmosphere */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0f0500] via-[#1a0800] to-[#2d1200]" />

            {/* Horizon glow */}
            <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-[#ff6b00] via-[#ff9500]/70 to-transparent" />
            <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-[#cc3300]/80 to-transparent" />

            {/* Sun disk */}
            <div className="absolute bottom-10 left-1/2 h-20 w-20 -translate-x-1/2 rounded-full"
              style={{
                background: "radial-gradient(circle, #fff8c0 0%, #ffdc40 40%, #ff8800 100%)",
                boxShadow: "0 0 30px 10px rgba(255,200,50,0.6), 0 0 80px 30px rgba(255,120,0,0.3), 0 0 150px 60px rgba(200,50,0,0.15)",
              }}
            />

            {/* Sun rays */}
            <svg className="absolute bottom-10 left-1/2 -translate-x-1/2" width="200" height="200" viewBox="-100 -100 200 200" style={{ transform: "translateX(-50%) translateY(50%)" }}>
              {Array.from({ length: 16 }).map((_, i) => {
                const angle = (i * 360) / 16;
                const isLong = i % 4 === 0;
                return (
                  <line key={i}
                    x1="0" y1={isLong ? "-20" : "-18"}
                    x2="0" y2={isLong ? "-65" : "-45"}
                    stroke={isLong ? "rgba(255,220,80,0.6)" : "rgba(255,180,50,0.35)"}
                    strokeWidth={isLong ? 2 : 1}
                    strokeLinecap="round"
                    transform={`rotate(${angle})`}
                  />
                );
              })}
            </svg>

            {/* Gold shimmer wave lines */}
            <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 400 220" preserveAspectRatio="none">
              {[0, 18, 36, 54, 72].map((offset, i) => (
                <path
                  key={i}
                  d={`M -10 ${130 + offset} Q 100 ${110 + offset} 200 ${130 + offset} T 410 ${130 + offset}`}
                  stroke={i % 2 === 0 ? "#ffd700" : "#ff9900"}
                  strokeWidth={i === 0 ? 2 : 1}
                  fill="none"
                />
              ))}
            </svg>

            {/* Stars */}
            {[{x:"12%",y:"12%",s:2},{x:"30%",y:"7%",s:1.5},{x:"55%",y:"9%",s:2.5},{x:"75%",y:"5%",s:1.5},{x:"92%",y:"14%",s:2},{x:"85%",y:"28%",s:1.5}].map((s, i) => (
              <div key={i} className="absolute rounded-full bg-white animate-pulse"
                style={{ left: s.x, top: s.y, width: s.s, height: s.s, boxShadow: `0 0 ${s.s*3}px rgba(255,255,220,0.8)`, animationDuration: `${2+i*0.5}s` }}
              />
            ))}

            {/* Elegant label */}
            <div className="absolute top-4 left-4 rounded-full border border-[#ffd700]/30 bg-[#ffd700]/10 px-3 py-1 backdrop-blur-sm">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#ffd700]/80">Luxury</span>
            </div>
          </div>

          <div className="relative px-7 pb-6 pt-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#daa520]/60">gold · sunset</p>
                <h3 className="mt-0.5 text-2xl font-black" style={{ background: "linear-gradient(90deg,#ffd700,#ff9500,#ffd700)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  Sunset Gold
                </h3>
                <p className="mt-1.5 text-xs font-medium text-[#8b7030] leading-relaxed">
                  Hoàng hôn · Sang trọng · Tình yêu chín muồi
                </p>
              </div>
              <div className={[
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-300",
                theme === "gold"
                  ? "text-[#0c0500] shadow-[0_0_20px_rgba(255,215,0,0.7)] scale-110"
                  : "border border-[#daa520]/30 text-[#daa520] opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100",
              ].join(" ")}
              style={theme === "gold" ? { background: "linear-gradient(135deg,#ffd700,#ff9900)" } : {}}
              >
                {theme === "gold" ? <CheckCircle2 className="h-5 w-5" /> : <Heart className="h-4 w-4" />}
              </div>
            </div>
          </div>
        </button>

        {/* ══ WHITE LOTUS ═══════════════════════════════════════ */}
        <button
          onClick={() => setTheme("lotus-white")}
          className={[
            "group relative flex flex-col overflow-hidden rounded-[2.5rem] text-left transition-all duration-500 cursor-pointer",
            theme === "lotus-white"
              ? "shadow-[0_0_0_2px_rgba(179,151,75,0.6),0_30px_80px_rgba(160,130,50,0.25),0_10px_40px_rgba(179,151,75,0.15)] scale-[1.02]"
              : "shadow-[0_8px_40px_rgba(180,150,75,0.12)] hover:-translate-y-2 hover:shadow-[0_24px_70px_rgba(179,151,75,0.25)] hover:scale-[1.01]",
          ].join(" ")}
          style={{ background: "linear-gradient(150deg,#fefdfb 0%,#faf7ef 50%,#f5f1e5 100%)" }}
        >
          <div className="relative h-56 w-full overflow-hidden">
            {/* Subtle paper texture */}
            <div className="absolute inset-0 opacity-[0.03]"
              style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.08) 3px,rgba(0,0,0,0.08) 4px)" }}
            />
            {/* Soft warm glow center */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,180,89,0.08),transparent_70%)]" />

            {/* Full editorial lotus illustration */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 220" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Decorative gold border top */}
              <line x1="40" y1="15" x2="360" y2="15" stroke="#b3974b" strokeWidth="0.8" />
              <line x1="40" y1="18" x2="360" y2="18" stroke="#b3974b" strokeWidth="0.3" strokeDasharray="6 3" />
              {/* Diamond ornament */}
              <path d="M 200 10 L 204 15 L 200 20 L 196 15 Z" fill="#b3974b" fillOpacity="0.6" />

              {/* Left lotus leaf */}
              <path d="M 30 215 C 70 155, 130 125, 165 145 C 145 165, 100 185, 55 215 Z"
                stroke="#b3974b" strokeWidth="1.2" fill="#b3974b" fillOpacity="0.07" />
              <path d="M 40 215 Q 90 170 165 145" stroke="#b3974b" strokeWidth="0.8" strokeDasharray="5 4" />
              <path d="M 100 192 Q 130 170 162 148" stroke="#b3974b" strokeWidth="0.5" />
              <path d="M 72 205 Q 108 183 158 152" stroke="#b3974b" strokeWidth="0.4" />

              {/* Right lotus leaf */}
              <path d="M 370 215 C 330 155, 270 125, 235 145 C 255 165, 300 185, 345 215 Z"
                stroke="#b3974b" strokeWidth="1.2" fill="#b3974b" fillOpacity="0.07" />
              <path d="M 360 215 Q 310 170 235 145" stroke="#b3974b" strokeWidth="0.8" strokeDasharray="5 4" />

              {/* Center Lotus bloom */}
              {/* Outermost petals */}
              <path d="M 200 165 C 196 138 186 112 190 85 C 194 67 206 67 210 85 C 214 112 204 138 200 165 Z"
                stroke="#b3974b" strokeWidth="1.3" fill="#b3974b" fillOpacity="0.09" />
              <path d="M 200 165 C 178 148 158 130 154 104 C 152 85 167 76 180 89 C 190 104 195 140 200 165 Z"
                stroke="#b3974b" strokeWidth="1.2" fill="#b3974b" fillOpacity="0.07" />
              <path d="M 200 165 C 222 148 242 130 246 104 C 248 85 233 76 220 89 C 210 104 205 140 200 165 Z"
                stroke="#b3974b" strokeWidth="1.2" fill="#b3974b" fillOpacity="0.07" />
              {/* Mid petals */}
              <path d="M 200 165 C 168 152 145 140 140 114 C 138 96 155 88 170 100 C 182 116 193 148 200 165 Z"
                stroke="#b3974b" strokeWidth="1" fill="#b3974b" fillOpacity="0.05" />
              <path d="M 200 165 C 232 152 255 140 260 114 C 262 96 245 88 230 100 C 218 116 207 148 200 165 Z"
                stroke="#b3974b" strokeWidth="1" fill="#b3974b" fillOpacity="0.05" />
              {/* Inner petals */}
              <path d="M 200 165 C 188 148 178 130 180 110 C 185 100 200 100 200 165 Z"
                stroke="#b3974b" strokeWidth="0.8" fill="#b3974b" fillOpacity="0.12" />
              <path d="M 200 165 C 212 148 222 130 220 110 C 215 100 200 100 200 165 Z"
                stroke="#b3974b" strokeWidth="0.8" fill="#b3974b" fillOpacity="0.12" />
              {/* Stamen */}
              <circle cx="200" cy="163" r="9" fill="#b3974b" fillOpacity="0.2" stroke="#b3974b" strokeWidth="1" />
              <circle cx="200" cy="163" r="5" fill="#b3974b" fillOpacity="0.5" />
              <circle cx="200" cy="163" r="2" fill="#b3974b" fillOpacity="0.8" />

              {/* Stem + water */}
              <path d="M 200 172 C 198 185 196 200 194 220" stroke="#b3974b" strokeWidth="1.5" strokeLinecap="round" />
              <ellipse cx="200" cy="208" rx="28" ry="5" stroke="#b3974b" strokeWidth="0.7" fillOpacity="0" />
              <ellipse cx="200" cy="210" rx="50" ry="8" stroke="#b3974b" strokeWidth="0.4" fillOpacity="0" />

              {/* Decorative corner motifs */}
              <path d="M 40 205 Q 50 190 65 185" stroke="#b3974b" strokeWidth="0.8" strokeDasharray="3 3" />
              <path d="M 360 205 Q 350 190 335 185" stroke="#b3974b" strokeWidth="0.8" strokeDasharray="3 3" />
            </svg>
          </div>

          <div className="relative px-7 pb-6 pt-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-[#b3974b]/60">zen · 禅 · minimal</p>
                <h3 className="mt-0.5 text-xl font-black uppercase tracking-[0.12em] text-[#7a6535]">White Lotus</h3>
                <p className="mt-1.5 text-xs font-light tracking-wide text-[#b3a98f] leading-relaxed">
                  Tinh khiết · Tối giản · Thanh tao vĩnh cửu
                </p>
              </div>
              <div className={[
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all duration-300",
                theme === "lotus-white"
                  ? "border-[#b3974b] bg-[#b3974b]/15 text-[#b3974b] shadow-[0_0_20px_rgba(179,151,75,0.35)] scale-110"
                  : "border-[#b3974b]/20 text-[#b3974b]/60 opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100",
              ].join(" ")}>
                {theme === "lotus-white" ? <CheckCircle2 className="h-5 w-5" /> : <Heart className="h-4 w-4" />}
              </div>
            </div>
          </div>
        </button>

        {/* ══ MINT LOTUS ════════════════════════════════════════ */}
        <button
          onClick={() => setTheme("lotus-mint")}
          className={[
            "group relative flex flex-col overflow-hidden rounded-[2.5rem] text-left transition-all duration-500 cursor-pointer",
            theme === "lotus-mint"
              ? "shadow-[0_0_0_2px_rgba(59,92,74,0.6),0_30px_80px_rgba(59,92,74,0.3),0_10px_40px_rgba(100,160,120,0.2)] scale-[1.02]"
              : "shadow-[0_8px_40px_rgba(80,130,100,0.15)] hover:-translate-y-2 hover:shadow-[0_24px_70px_rgba(59,92,74,0.3)] hover:scale-[1.01]",
          ].join(" ")}
          style={{ background: "linear-gradient(150deg,#e6f0ea 0%,#d4e8db 50%,#c8dfd0 100%)" }}
        >
          <div className="relative h-56 w-full overflow-hidden">
            {/* Watercolor wash blobs */}
            <div className="absolute -top-16 -left-16 h-56 w-56 rounded-full bg-[#a8c8b8] opacity-35 blur-3xl" />
            <div className="absolute top-8 right-0 h-36 w-36 rounded-full bg-[#c4a15a] opacity-18 blur-2xl" />
            <div className="absolute bottom-0 left-1/3 h-32 w-48 rounded-full bg-[#88b89e] opacity-25 blur-3xl" />

            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 220" fill="none">
              {/* Big fern/botanical leaves left */}
              <path d="M 10 220 C 40 155, 95 118, 135 130 C 115 155, 70 180, 25 220 Z"
                fill="#3b5c4a" fillOpacity="0.15" stroke="#3b5c4a" strokeWidth="1.2" />
              <path d="M 18 220 Q 65 162 135 130" stroke="#3b5c4a" strokeWidth="0.9" strokeDasharray="6 5" />
              <path d="M 80 192 Q 108 170 132 135" stroke="#3b5c4a" strokeWidth="0.6" />
              <path d="M 52 208 Q 88 183 130 140" stroke="#3b5c4a" strokeWidth="0.5" />
              <path d="M 38 220 Q 75 195 120 158" stroke="#3b5c4a" strokeWidth="0.4" />

              {/* Right botanical */}
              <path d="M 390 220 C 360 155, 305 118, 265 130 C 285 155, 330 180, 375 220 Z"
                fill="#3b5c4a" fillOpacity="0.12" stroke="#3b5c4a" strokeWidth="1.2" />
              <path d="M 382 220 Q 335 162 265 130" stroke="#3b5c4a" strokeWidth="0.9" strokeDasharray="6 5" />

              {/* Center lotus bloom mint style */}
              {/* Large lily pad */}
              <ellipse cx="200" cy="195" rx="65" ry="12" fill="#3b5c4a" fillOpacity="0.10" stroke="#3b5c4a" strokeWidth="1" />
              <path d="M 155 195 Q 200 185 245 195" stroke="#3b5c4a" strokeWidth="0.5" />
              {/* Center cut in pad */}
              <path d="M 200 183 L 200 195" stroke="#3b5c4a" strokeWidth="0.8" />

              {/* Lotus petals - botanical style */}
              <path d="M 200 175 C 197 152 188 130 192 105 C 196 90 204 90 208 105 C 212 130 203 152 200 175 Z"
                fill="#c4a15a" fillOpacity="0.3" stroke="#c4a15a" strokeWidth="1.5" />
              <path d="M 200 175 C 182 160 165 148 162 124 C 160 108 173 100 184 112 C 193 126 197 158 200 175 Z"
                fill="#3b5c4a" fillOpacity="0.18" stroke="#3b5c4a" strokeWidth="1.3" />
              <path d="M 200 175 C 218 160 235 148 238 124 C 240 108 227 100 216 112 C 207 126 203 158 200 175 Z"
                fill="#3b5c4a" fillOpacity="0.18" stroke="#3b5c4a" strokeWidth="1.3" />
              <path d="M 200 175 C 172 166 150 155 147 132 C 145 114 162 108 175 120 C 187 135 196 162 200 175 Z"
                fill="#3b5c4a" fillOpacity="0.11" stroke="#3b5c4a" strokeWidth="1" />
              <path d="M 200 175 C 228 166 250 155 253 132 C 255 114 238 108 225 120 C 213 135 204 162 200 175 Z"
                fill="#3b5c4a" fillOpacity="0.11" stroke="#3b5c4a" strokeWidth="1" />
              {/* Stamen gold */}
              <circle cx="200" cy="173" r="8" fill="#c4a15a" fillOpacity="0.45" stroke="#c4a15a" strokeWidth="1.2" />
              <circle cx="200" cy="173" r="4" fill="#c4a15a" fillOpacity="0.75" />

              {/* Side buds */}
              <path d="M 150 172 Q 148 158 153 147 Q 158 158 156 172 Z"
                fill="#3b5c4a" fillOpacity="0.25" stroke="#3b5c4a" strokeWidth="0.8" />
              <path d="M 152 172 Q 148 165 153 147" stroke="#3b5c4a" strokeWidth="0.5" />
              <path d="M 250 168 Q 248 154 253 143 Q 258 154 256 168 Z"
                fill="#3b5c4a" fillOpacity="0.22" stroke="#3b5c4a" strokeWidth="0.8" />

              {/* Stem */}
              <path d="M 200 183 Q 200 190 200 196" stroke="#3b5c4a" strokeWidth="2" strokeLinecap="round" />
              {/* Outer water ripple */}
              <ellipse cx="200" cy="200" rx="95" ry="15" stroke="#3b5c4a" strokeWidth="0.4" fillOpacity="0" />
            </svg>
          </div>

          <div className="relative px-7 pb-6 pt-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#3b5c4a]/60">botanical · healing</p>
                <h3 className="mt-0.5 text-2xl font-black text-[#2a4035]">Mint Lotus</h3>
                <p className="mt-1.5 text-xs font-medium text-[#62756a] leading-relaxed">
                  Thiên nhiên · Chữa lành · Bình yên tuyệt đối
                </p>
              </div>
              <div className={[
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-300",
                theme === "lotus-mint"
                  ? "bg-[#3b5c4a] text-white shadow-[0_0_20px_rgba(59,92,74,0.5)] scale-110"
                  : "border border-[#3b5c4a]/30 text-[#3b5c4a]/60 opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100",
              ].join(" ")}>
                {theme === "lotus-mint" ? <CheckCircle2 className="h-5 w-5" /> : <Heart className="h-4 w-4" />}
              </div>
            </div>
          </div>
        </button>

        {/* ══ DARK NAVY (wide card) ══════════════════════════════ */}
        <button
          onClick={() => setTheme("lotus-dark")}
          className={[
            "group relative col-span-1 sm:col-span-2 flex flex-col sm:flex-row overflow-hidden rounded-[2.5rem] text-left transition-all duration-500 cursor-pointer",
            theme === "lotus-dark"
              ? "shadow-[0_0_0_2px_rgba(224,184,106,0.7),0_30px_100px_rgba(0,0,0,0.6),0_0_80px_rgba(224,184,106,0.25)] scale-[1.01]"
              : "shadow-[0_12px_50px_rgba(0,0,0,0.4)] hover:-translate-y-2 hover:shadow-[0_28px_90px_rgba(0,0,0,0.5),0_0_60px_rgba(224,184,106,0.15)] hover:scale-[1.005]",
          ].join(" ")}
          style={{ background: "linear-gradient(135deg,#04080f 0%,#0a1020 40%,#04080f 100%)" }}
        >
          {/* Scene - left half on desktop */}
          <div className="relative h-64 w-full overflow-hidden sm:h-auto sm:w-[55%]">
            {/* Deep space */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_35%_40%,rgba(20,40,90,0.7),transparent_65%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_65%_60%,rgba(80,40,5,0.35),transparent_60%)]" />

            {/* Nebula dust */}
            <div className="absolute top-1/4 left-1/4 h-48 w-48 rounded-full bg-[#1a2a6c] opacity-20 blur-3xl animate-[pulse_8s_ease-in-out_infinite]" />
            <div className="absolute bottom-1/4 right-1/4 h-32 w-32 rounded-full bg-[#e0b86a] opacity-8 blur-3xl animate-[pulse_10s_ease-in-out_infinite_2s]" />

            {/* Dense star field */}
            {[
              {x:"8%",y:"10%",s:2.5,b:8},{x:"22%",y:"5%",s:1.5,b:5},{x:"38%",y:"12%",s:2,b:6},{x:"55%",y:"4%",s:3,b:10},
              {x:"70%",y:"8%",s:1.5,b:4},{x:"85%",y:"14%",s:2,b:7},{x:"93%",y:"6%",s:1.5,b:5},{x:"15%",y:"28%",s:1,b:3},
              {x:"48%",y:"32%",s:1.5,b:5},{x:"78%",y:"25%",s:1,b:3},{x:"90%",y:"38%",s:2,b:6},{x:"5%",y:"55%",s:1.5,b:4},
              {x:"32%",y:"58%",s:1,b:3},{x:"62%",y:"52%",s:2,b:7},{x:"80%",y:"62%",s:1.5,b:4},{x:"20%",y:"78%",s:1,b:3},
              {x:"68%",y:"80%",s:1.5,b:5},{x:"44%",y:"72%",s:2,b:6},
            ].map((star, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-white animate-pulse"
                style={{
                  left: star.x, top: star.y,
                  width: star.s, height: star.s,
                  boxShadow: `0 0 ${star.b}px rgba(255,255,240,0.9)`,
                  animationDuration: `${2.5 + (i % 5) * 1.2}s`,
                  animationDelay: `${(i * 0.35) % 4}s`,
                }}
              />
            ))}

            {/* Central glowing lotus */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                {/* Multi-layer aura */}
                <div className="absolute inset-0 -m-10 rounded-full bg-[#e0b86a] opacity-[0.06] blur-2xl animate-[pulse_4s_ease-in-out_infinite]" />
                <div className="absolute inset-0 -m-5 rounded-full bg-[#e0b86a] opacity-[0.08] blur-xl animate-[pulse_4s_ease-in-out_infinite_1s]" />

                <svg width="130" height="130" viewBox="0 0 130 130" fill="none">
                  <defs>
                    <radialGradient id="lotusGold" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#fff8c0" />
                      <stop offset="60%" stopColor="#e0b86a" />
                      <stop offset="100%" stopColor="#b8840a" />
                    </radialGradient>
                    <filter id="lotusGlow" x="-60%" y="-60%" width="220%" height="220%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  {/* Petals */}
                  <path d="M 65 65 C 62 50 55 35 58 22 C 61 14 69 14 72 22 C 75 35 68 50 65 65 Z"
                    fill="url(#lotusGold)" fillOpacity="0.9" filter="url(#lotusGlow)" />
                  <path d="M 65 65 C 50 62 35 55 22 58 C 14 61 14 69 22 72 C 35 75 50 68 65 65 Z"
                    fill="url(#lotusGold)" fillOpacity="0.75" filter="url(#lotusGlow)" />
                  <path d="M 65 65 C 80 62 95 55 108 58 C 116 61 116 69 108 72 C 95 75 80 68 65 65 Z"
                    fill="url(#lotusGold)" fillOpacity="0.75" filter="url(#lotusGlow)" />
                  <path d="M 65 65 C 62 80 55 95 58 108 C 61 116 69 116 72 108 C 75 95 68 80 65 65 Z"
                    fill="url(#lotusGold)" fillOpacity="0.65" filter="url(#lotusGlow)" />
                  {/* Diagonal petals */}
                  <path d="M 65 65 C 52 52 41 38 44 25 C 47 17 55 17 58 25 C 62 38 65 58 65 65 Z"
                    fill="url(#lotusGold)" fillOpacity="0.55" />
                  <path d="M 65 65 C 78 52 89 38 86 25 C 83 17 75 17 72 25 C 68 38 65 58 65 65 Z"
                    fill="url(#lotusGold)" fillOpacity="0.55" />
                  <path d="M 65 65 C 52 78 41 89 44 102 C 47 110 55 110 58 102 C 62 89 65 72 65 65 Z"
                    fill="url(#lotusGold)" fillOpacity="0.45" />
                  <path d="M 65 65 C 78 78 89 89 86 102 C 83 110 75 110 72 102 C 68 89 65 72 65 65 Z"
                    fill="url(#lotusGold)" fillOpacity="0.45" />
                  {/* Center */}
                  <circle cx="65" cy="65" r="10" fill="url(#lotusGold)" filter="url(#lotusGlow)" />
                  <circle cx="65" cy="65" r="5" fill="#fff8c0" />
                </svg>
              </div>
            </div>

            {/* Gold shimmer line bottom */}
            <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#e0b86a]/50 to-transparent" />
          </div>

          {/* Info - right half */}
          <div className="relative flex flex-col justify-center px-8 py-8 sm:w-[45%]">
            {/* Gold vertical accent */}
            <div className="absolute left-0 top-8 bottom-8 w-px bg-gradient-to-b from-transparent via-[#e0b86a]/30 to-transparent hidden sm:block" />

            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.45em] text-[#e0b86a]/50">midnight luxury</p>
              <h3 className="mt-2 text-4xl font-black leading-none" style={{
                background: "linear-gradient(135deg,#c8a050 0%,#fff3a0 40%,#e0b86a 70%,#c8a050 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                filter: "drop-shadow(0 0 20px rgba(224,184,106,0.4))",
              }}>
                Dark Navy
              </h3>
              <p className="mt-3 text-sm font-medium text-[#8b9bb4] leading-relaxed">
                Bí ẩn · Điện ảnh<br />Tình yêu trưởng thành
              </p>

              {/* Star rating */}
              <div className="mt-4 flex items-center gap-1.5">
                {["★","★","★","★","★"].map((s, i) => (
                  <span key={i} className="text-sm text-[#e0b86a] drop-shadow-[0_0_8px_rgba(224,184,106,0.8)]" style={{ animationDelay: `${i * 0.2}s` }}>{s}</span>
                ))}
                <span className="ml-1 text-xs text-[#5a6b8c] font-medium">Premium</span>
              </div>
            </div>

            <div className="mt-6">
              {theme === "lotus-dark" ? (
                <div className="inline-flex items-center gap-2 rounded-full border border-[#e0b86a]/40 bg-[#e0b86a]/10 px-5 py-2.5 text-sm font-bold text-[#e0b86a] shadow-[0_0_25px_rgba(224,184,106,0.2),inset_0_1px_0_rgba(255,255,255,0.05)]">
                  <CheckCircle2 className="h-4 w-4" />
                  Đang sử dụng
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 rounded-full border border-[#e0b86a]/20 px-5 py-2.5 text-sm font-bold text-[#e0b86a]/50 opacity-0 group-hover:opacity-100 group-hover:border-[#e0b86a]/40 transition-all duration-400">
                  <Heart className="h-4 w-4" />
                  Chọn theme này
                </div>
              )}
            </div>
          </div>
        </button>

      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════

function NotificationsSection() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-black text-[var(--color-text)]">Thông báo</h2>
        <p className="mt-1 text-sm font-medium text-[var(--color-muted)]">
          Đừng bỏ lỡ những khoảnh khắc quan trọng.
        </p>
      </div>

      <div className="space-y-4">
        <ToggleRow icon={Calendar} title="Anniversary Reminder" desc="Nhắc nhở trước các ngày kỷ niệm quan trọng 1 ngày." defaultOn={true} />
        <ToggleRow icon={Heart} title="Nhật ký chung" desc="Thông báo khi người ấy viết nhật ký mới." defaultOn={true} />
        <ToggleRow icon={Bell} title="Daily Question" desc="Nhắc nhở trả lời câu hỏi mỗi tối lúc 21:00." defaultOn={false} />
        <ToggleRow icon={Users} title="Streak Reminder" desc="Thông báo chuỗi ngày tương tác liên tiếp." defaultOn={true} />
      </div>
    </div>
  );
}

function PrivacySection({ profile }: { profile: Profile }) {
  const [sharePeriod, setSharePeriod] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadPrivacySettings() {
      try {
        const { data, error } = await supabase
          .from("period_tracking")
          .select("share_with_partner")
          .eq("user_id", profile.id)
          .maybeSingle();

        if (!error && data) {
          setSharePeriod(data.share_with_partner);
        }
      } catch (err) {
        console.error("Lỗi tải cấu hình bảo mật:", err);
      } finally {
        setLoading(false);
      }
    }
    loadPrivacySettings();
  }, [profile.id]);

  const handleSharePeriodChange = async (checked: boolean) => {
    setSharePeriod(checked);
    const { error: updateError } = await supabase
      .from("period_tracking")
      .update({ share_with_partner: checked, updated_at: new Date().toISOString() })
      .eq("user_id", profile.id);

    if (updateError) {
      // Nếu chưa có record kỳ dâu, ta sẽ tạo mới bản ghi mặc định
      await supabase
        .from("period_tracking")
        .insert({
          user_id: profile.id,
          last_period_date: new Date().toISOString().split("T")[0],
          cycle_length: 28,
          period_length: 5,
          notifications_enabled: true,
          share_with_partner: checked,
        });
    }
  };

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center text-[var(--color-muted)]">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--color-primary)]" />
        <span className="ml-2 text-xs font-bold">Đang tải cấu hình quyền riêng tư...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-black text-[var(--color-text)]">Quyền riêng tư</h2>
        <p className="mt-1 text-sm font-medium text-[var(--color-muted)]">
          Bảo vệ dữ liệu và không gian riêng tư của hai bạn.
        </p>
      </div>

      <div className="space-y-4">
        <ToggleRow 
          icon={Droplet} 
          title="Chia sẻ kỳ dâu với đối phương" 
          desc="Cho phép người thương xem dự báo chu kỳ kinh nguyệt của bạn trên Dashboard để họ chăm sóc bạn tốt hơn." 
          defaultOn={sharePeriod} 
          onChange={handleSharePeriodChange}
        />
        <ToggleRow 
          icon={Lock} 
          title="Riêng tư nhật ký cá nhân" 
          desc="Cho phép bạn chọn ẩn nhật ký để chỉ một mình bạn xem được (sử dụng thuộc tính riêng tư khi viết nhật ký)." 
          defaultOn={true} 
          disabled={true}
        />
        <ToggleRow 
          icon={Smartphone} 
          title="Khóa App bằng PIN" 
          desc="Yêu cầu nhập mã PIN bảo mật khi mở ứng dụng." 
          defaultOn={false} 
        />
        <ToggleRow 
          icon={Shield} 
          title="Mã hóa đầu cuối (End-to-end encrypted)" 
          desc="Dữ liệu lời yêu thương và nhật ký được bảo mật tuyệt đối." 
          defaultOn={true} 
          disabled={true}
        />
      </div>
    </div>
  );
}

// --- UTILS ---

function Field({ label, icon: Icon, type = "text", ...props }: any) {
  return (
    <div className="space-y-2 w-full">
      <label className="flex items-center gap-2 text-sm font-bold text-[var(--color-muted)]">
        {Icon && <Icon className="h-4 w-4" />}
        {label}
      </label>
      <input
        type={type}
        className="h-[3.25rem] w-full rounded-2xl border-none bg-[var(--color-surface)] px-4 font-semibold text-[var(--color-text)] outline-none ring-1 ring-[var(--color-border)] transition focus:ring-2 focus:ring-[var(--color-primary)] disabled:opacity-60"
        {...props}
      />
    </div>
  );
}

function ToggleRow({ icon: Icon, title, desc, defaultOn, onChange, disabled = false }: any) {
  const [isOn, setIsOn] = useState(defaultOn);

  useEffect(() => {
    setIsOn(defaultOn);
  }, [defaultOn]);

  const handleToggle = () => {
    if (disabled) return;
    const nextVal = !isOn;
    setIsOn(nextVal);
    if (onChange) onChange(nextVal);
  };

  return (
    <div className={`flex items-center justify-between rounded-[2rem] bg-[var(--color-surface)] p-6 ring-1 ring-[var(--color-border)] ${disabled ? "opacity-75" : ""}`}>
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--color-soft)] text-[var(--color-primary)]">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h4 className="font-bold text-[var(--color-text)]">{title}</h4>
          <p className="mt-0.5 text-xs font-medium text-[var(--color-muted)] sm:text-sm">{desc}</p>
        </div>
      </div>
      <button
        onClick={handleToggle}
        disabled={disabled}
        className={[
          "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-300",
          isOn ? "bg-[var(--color-success)]" : "bg-[var(--color-border)]",
          disabled ? "cursor-not-allowed" : "cursor-pointer"
        ].join(" ")}
      >
        <span
          className={[
            "inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-300",
            isOn ? "translate-x-6" : "translate-x-1",
          ].join(" ")}
        />
      </button>
    </div>
  );
}
