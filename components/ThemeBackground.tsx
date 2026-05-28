"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/components/ThemeProvider";
import type { ThemeMode } from "@/types/app";

// ════════════════════════════════════════════════════════════
//  INDIVIDUAL THEME SCENES
// ════════════════════════════════════════════════════════════

function PinkBackground() {
  return (
    <>
      <div className="absolute inset-0"
        style={{ background: "var(--settings-bg)", animation: "settings-bg-breathe 8s ease-in-out infinite" }} />
      <div className="absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full blur-[90px]"
        style={{ background: "var(--settings-orb-1)", animation: "settings-float-slow 9s ease-in-out infinite" }} />
      <div className="absolute -bottom-20 -right-20 h-[400px] w-[400px] rounded-full blur-[80px]"
        style={{ background: "var(--settings-orb-2)", animation: "settings-float-slow 11s ease-in-out infinite 2s" }} />
      <div className="absolute top-1/2 left-1/2 h-[350px] w-[350px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[100px]"
        style={{ background: "var(--settings-orb-3)", animation: "settings-float-medium 13s ease-in-out infinite 1s" }} />
      <div className="absolute inset-0" style={{ background: "var(--settings-glow-center)" }} />
      <div className="absolute inset-0" style={{ background: "var(--settings-vignette)" }} />
      {[
        { left: "8%",  size: 18, dur: 12, delay: 0,   rot: 15 },
        { left: "22%", size: 12, dur: 15, delay: 3,   rot: -20 },
        { left: "38%", size: 20, dur: 10, delay: 1.5, rot: 35 },
        { left: "55%", size: 14, dur: 18, delay: 5,   rot: -10 },
        { left: "70%", size: 16, dur: 13, delay: 2,   rot: 25 },
        { left: "85%", size: 10, dur: 16, delay: 4,   rot: -30 },
        { left: "92%", size: 22, dur: 11, delay: 0.5, rot: 5  },
      ].map((p, i) => (
        <div key={i} className="absolute top-0 pointer-events-none"
          style={{ left: p.left, animation: `settings-petal-fall ${p.dur}s ease-in infinite ${p.delay}s` }}>
          <svg width={p.size} height={p.size} viewBox="0 0 24 24" style={{ transform: `rotate(${p.rot}deg)` }}>
            <path d="M12 2 C8 2, 4 6, 4 10 C4 16, 12 22, 12 22 C12 22, 20 16, 20 10 C20 6, 16 2, 12 2Z"
              fill="rgba(255,105,160,0.55)" />
          </svg>
        </div>
      ))}
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
      <div className="absolute inset-0" style={{ background: "var(--settings-bg)" }} />
      <div className="absolute bottom-0 inset-x-0 h-2/3"
        style={{ background: "linear-gradient(to top, rgba(255,80,0,0.35) 0%, rgba(255,140,20,0.2) 30%, transparent 100%)", animation: "settings-float-slow 10s ease-in-out infinite" }} />
      <div className="absolute -top-24 left-1/2 h-[500px] w-[600px] -translate-x-1/2 rounded-full blur-[120px]"
        style={{ background: "var(--settings-orb-1)", animation: "settings-float-medium 12s ease-in-out infinite" }} />
      <div className="absolute bottom-0 left-1/2 h-[300px] w-[500px] -translate-x-1/2 rounded-full blur-[80px]"
        style={{ background: "var(--settings-orb-2)", animation: "settings-drift 15s ease-in-out infinite 3s" }} />
      <div className="absolute inset-0" style={{ background: "var(--settings-glow-center)" }} />
      <div className="absolute inset-0" style={{ background: "var(--settings-vignette)" }} />
      <svg className="absolute inset-0 w-full h-full opacity-[0.08] pointer-events-none" viewBox="0 0 1000 600" preserveAspectRatio="none">
        {[0, 40, 80, 120, 160, 200].map((offset, i) => (
          <path key={i} d={`M -20 ${320 + offset} Q 250 ${290 + offset} 500 ${320 + offset} T 1020 ${320 + offset}`}
            stroke={i % 2 === 0 ? "#ffd700" : "#ff9900"} strokeWidth={i === 0 ? 2.5 : 1.5} fill="none" />
        ))}
      </svg>
      {[
        { x: "5%", y: "4%", s: 2.5 }, { x: "18%", y: "2%", s: 1.5 }, { x: "32%", y: "6%", s: 2 },
        { x: "48%", y: "1%", s: 3 },  { x: "62%", y: "5%", s: 1.5 }, { x: "76%", y: "3%", s: 2 },
        { x: "88%", y: "7%", s: 2.5 },{ x: "95%", y: "2%", s: 1.5 }, { x: "25%", y: "14%", s: 1 },
        { x: "68%", y: "12%", s: 1.5 },{ x: "82%", y: "18%", s: 1 },
      ].map((star, i) => (
        <div key={i} className="absolute rounded-full bg-white pointer-events-none"
          style={{ left: star.x, top: star.y, width: star.s, height: star.s,
            boxShadow: `0 0 ${star.s * 3}px rgba(255,240,180,0.9)`,
            animation: `settings-twinkle ${2.5 + (i % 5) * 1.2}s ease-in-out infinite ${(i * 0.4) % 4}s` }} />
      ))}
      {[15, 30, -15, -30, 0].map((angle, i) => (
        <div key={i} className="absolute bottom-0 left-1/2 pointer-events-none"
          style={{ width: 2, height: "55%",
            background: "linear-gradient(to top, rgba(255,180,30,0.18), transparent)",
            transform: `translateX(-50%) rotate(${angle}deg)`, transformOrigin: "bottom center",
            animation: `settings-light-ray ${6 + i * 1.5}s ease-in-out infinite ${i * 0.8}s` }} />
      ))}
    </>
  );
}

function LotusWhiteBackground() {
  return (
    <>
      <div className="absolute inset-0" style={{ background: "var(--settings-bg)" }} />
      <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.03,
        backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.15) 3px, rgba(0,0,0,0.15) 4px), repeating-linear-gradient(90deg, transparent, transparent 50px, rgba(0,0,0,0.04) 50px, rgba(0,0,0,0.04) 51px)" }} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: "var(--settings-glow-center)" }} />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 h-[600px] w-[700px] rounded-full blur-[140px] pointer-events-none"
        style={{ background: "rgba(212,180,89,0.09)", animation: "settings-float-slow 12s ease-in-out infinite" }} />

      {/* Center lotus hero */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ top: "5%" }}>
        <div className="relative" style={{ animation: "lotus-float-up 8s ease-in-out infinite" }}>
          <div className="absolute left-1/2 bottom-[-10px] -translate-x-1/2 w-[160px] h-[30px] rounded-full border border-[#b3974b]/25"
            style={{ animation: "lotus-ripple 4s ease-in-out infinite" }} />
          <div className="absolute left-1/2 bottom-[-14px] -translate-x-1/2 w-[220px] h-[40px] rounded-full border border-[#b3974b]/15"
            style={{ animation: "lotus-ripple2 4s ease-in-out infinite 0.8s" }} />
          <div className="absolute left-1/2 bottom-[-18px] -translate-x-1/2 w-[300px] h-[52px] rounded-full border border-[#b3974b]/08"
            style={{ animation: "lotus-ripple 5s ease-in-out infinite 1.6s" }} />
          <svg width="280" height="260" viewBox="0 0 280 260" fill="none">
            <defs>
              <radialGradient id="wl-petal-grad" cx="50%" cy="70%" r="60%">
                <stop offset="0%" stopColor="#fff9f0" stopOpacity="0.95"/><stop offset="60%" stopColor="#fdf0e8" stopOpacity="0.85"/>
                <stop offset="100%" stopColor="#f5e8d5" stopOpacity="0.7"/>
              </radialGradient>
              <radialGradient id="wl-stamen" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fff3c0"/><stop offset="100%" stopColor="#e0b86a"/>
              </radialGradient>
            </defs>
            <g style={{ transformOrigin: "140px 200px", animation: "lotus-sway 7s ease-in-out infinite" }}>
              <path d="M140 195 C136 155 122 118 126 88 C130 68 150 68 154 88 C158 118 144 155 140 195Z" fill="url(#wl-petal-grad)" stroke="#b3974b" strokeWidth="0.8" opacity="0.9"/>
              <path d="M140 195 C112 178 88 155 84 126 C80 106 98 96 112 110 C124 128 134 168 140 195Z" fill="url(#wl-petal-grad)" stroke="#b3974b" strokeWidth="0.7" opacity="0.8"/>
              <path d="M140 195 C168 178 192 155 196 126 C200 106 182 96 168 110 C156 128 146 168 140 195Z" fill="url(#wl-petal-grad)" stroke="#b3974b" strokeWidth="0.7" opacity="0.8"/>
              <path d="M140 195 C96 180 68 162 64 135 C60 115 78 106 94 118 C108 134 130 172 140 195Z" fill="url(#wl-petal-grad)" stroke="#b3974b" strokeWidth="0.6" opacity="0.65"/>
              <path d="M140 195 C184 180 212 162 216 135 C220 115 202 106 186 118 C172 134 150 172 140 195Z" fill="url(#wl-petal-grad)" stroke="#b3974b" strokeWidth="0.6" opacity="0.65"/>
            </g>
            <g style={{ transformOrigin: "140px 200px", animation: "lotus-sway-reverse 5.5s ease-in-out infinite 1s" }}>
              <path d="M140 195 C132 168 124 142 126 118 C130 106 150 106 154 118 C156 142 148 168 140 195Z" fill="#fff8f2" stroke="#c4a170" strokeWidth="0.9" opacity="0.95"/>
              <path d="M140 195 C120 182 106 164 106 144 C106 130 120 122 130 132 C136 146 140 176 140 195Z" fill="#fff8f2" stroke="#c4a170" strokeWidth="0.8" opacity="0.85"/>
              <path d="M140 195 C160 182 174 164 174 144 C174 130 160 122 150 132 C144 146 140 176 140 195Z" fill="#fff8f2" stroke="#c4a170" strokeWidth="0.8" opacity="0.85"/>
            </g>
            <circle cx="140" cy="192" r="14" fill="url(#wl-stamen)" opacity="0.9" style={{ animation: "lotus-ripple 3s ease-in-out infinite" }}/>
            <circle cx="140" cy="192" r="8" fill="#fff3c0" opacity="0.95"/>
            <circle cx="140" cy="192" r="3.5" fill="#e0b86a"/>
            <path d="M140 206 C138 220 136 235 134 250" stroke="#b3974b" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
            <ellipse cx="140" cy="215" rx="55" ry="10" fill="#d4e8c0" fillOpacity="0.3" stroke="#8a9e6a" strokeWidth="0.8" opacity="0.6"/>
          </svg>
        </div>
      </div>

      {/* Side lotuses */}
      <div className="absolute bottom-[15%] left-[8%] pointer-events-none" style={{ animation: "lotus-float-up2 9s ease-in-out infinite 2s" }}>
        <svg width="100" height="90" viewBox="0 0 100 90" fill="none">
          <path d="M50 70 C48 54 42 38 44 24 C46 16 54 16 56 24 C58 38 52 54 50 70Z" fill="#fdf5ec" stroke="#b3974b" strokeWidth="0.7" opacity="0.7"/>
          <path d="M50 70 C36 62 26 50 26 38 C26 28 36 24 44 32 C48 44 50 62 50 70Z" fill="#fdf5ec" stroke="#b3974b" strokeWidth="0.6" opacity="0.6"/>
          <path d="M50 70 C64 62 74 50 74 38 C74 28 64 24 56 32 C52 44 50 62 50 70Z" fill="#fdf5ec" stroke="#b3974b" strokeWidth="0.6" opacity="0.6"/>
          <circle cx="50" cy="68" r="5" fill="#e8c87a" opacity="0.7"/>
          <ellipse cx="50" cy="76" rx="20" ry="4" fill="#d4e8b0" fillOpacity="0.4" stroke="#8a9e6a" strokeWidth="0.5"/>
        </svg>
      </div>
      <div className="absolute bottom-[20%] right-[10%] pointer-events-none" style={{ animation: "lotus-float-up 11s ease-in-out infinite 4s" }}>
        <svg width="70" height="80" viewBox="0 0 70 80" fill="none">
          <path d="M35 60 C33 44 28 28 30 16 C32 8 38 8 40 16 C42 28 37 44 35 60Z" fill="#fff0e8" stroke="#b3974b" strokeWidth="0.7" opacity="0.75"/>
          <path d="M35 60 C24 54 18 42 20 32 C22 24 30 22 34 30 C36 42 36 56 35 60Z" fill="#fff0e8" stroke="#b3974b" strokeWidth="0.6" opacity="0.6"/>
          <path d="M35 60 C46 54 52 42 50 32 C48 24 40 22 36 30 C34 42 34 56 35 60Z" fill="#fff0e8" stroke="#b3974b" strokeWidth="0.6" opacity="0.6"/>
          <circle cx="35" cy="58" r="4" fill="#e0b86a" opacity="0.65"/>
        </svg>
      </div>

      {/* Gold ink frame */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1000 700" fill="none">
        <line x1="60" y1="28" x2="940" y2="28" stroke="#b3974b" strokeWidth="1.2" opacity="0.2"/>
        <line x1="60" y1="33" x2="940" y2="33" stroke="#b3974b" strokeWidth="0.4" strokeDasharray="12 6" opacity="0.14"/>
        <line x1="60" y1="672" x2="940" y2="672" stroke="#b3974b" strokeWidth="1.2" opacity="0.2"/>
        <path d="M500 22 L507 30 L500 38 L493 30Z" fill="#b3974b" fillOpacity="0.3"/>
        <g opacity="0.25">
          <path d="M60 65 Q100 65 100 105" stroke="#b3974b" strokeWidth="1.2" fill="none"/>
          <path d="M60 65 Q60 105 100 105" stroke="#b3974b" strokeWidth="0.5" fill="none"/>
          <circle cx="60" cy="65" r="3" fill="#b3974b"/>
          <path d="M940 65 Q900 65 900 105" stroke="#b3974b" strokeWidth="1.2" fill="none"/>
          <circle cx="940" cy="65" r="3" fill="#b3974b"/>
          <path d="M60 635 Q100 635 100 595" stroke="#b3974b" strokeWidth="1.2" fill="none"/>
          <circle cx="60" cy="635" r="3" fill="#b3974b"/>
          <path d="M940 635 Q900 635 900 595" stroke="#b3974b" strokeWidth="1.2" fill="none"/>
          <circle cx="940" cy="635" r="3" fill="#b3974b"/>
        </g>
        <path d="M0 580 Q250 565 500 580 T1000 575" stroke="#b3974b" strokeWidth="0.6" opacity="0.12" fill="none"/>
        <path d="M0 595 Q250 580 500 595 T1000 590" stroke="#b3974b" strokeWidth="0.4" opacity="0.08" fill="none"/>
      </svg>
      <div className="absolute inset-0" style={{ background: "var(--settings-vignette)" }} />
    </>
  );
}

function MintBackground() {
  return (
    <>
      <div className="absolute inset-0"
        style={{ background: "var(--settings-bg)", animation: "settings-bg-breathe 10s ease-in-out infinite" }} />
      <div className="absolute -top-32 -left-32 h-[520px] w-[520px] rounded-full blur-[100px] pointer-events-none"
        style={{ background: "rgba(59,92,74,0.28)", animation: "mint-watercolor-drift 13s ease-in-out infinite" }} />
      <div className="absolute top-[20%] right-[-10%] h-[400px] w-[380px] rounded-full blur-[80px] pointer-events-none"
        style={{ background: "rgba(100,160,120,0.2)", animation: "mint-watercolor-drift 16s ease-in-out infinite 3s" }} />
      <div className="absolute bottom-[-8%] left-[30%] h-[380px] w-[480px] rounded-full blur-[110px] pointer-events-none"
        style={{ background: "rgba(196,161,90,0.18)", animation: "settings-drift 18s ease-in-out infinite 2s" }} />
      <div className="absolute top-[-5%] right-[30%] h-[300px] w-[350px] rounded-full blur-[90px] pointer-events-none"
        style={{ background: "rgba(140,190,160,0.22)", animation: "settings-float-slow 14s ease-in-out infinite 5s" }} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: "var(--settings-glow-center)" }} />

      {/* Bottom-left fern */}
      <div className="absolute bottom-0 left-0 pointer-events-none"
        style={{ transformOrigin: "0% 100%", animation: "leaf-sway-left 8s ease-in-out infinite" }}>
        <svg width="320" height="420" viewBox="0 0 320 420" fill="none">
          <path d="M40 420 C70 340 130 280 160 200" stroke="#3b5c4a" strokeWidth="3" strokeLinecap="round" opacity="0.55"/>
          <path d="M75 380 C50 320 30 270 20 220 C0 230 -10 280 20 330Z" fill="#3b5c4a" fillOpacity="0.18" stroke="#3b5c4a" strokeWidth="1" opacity="0.7"/>
          <path d="M100 320 C70 265 50 215 40 165 C20 175 10 225 40 275Z" fill="#3b5c4a" fillOpacity="0.15" stroke="#3b5c4a" strokeWidth="1" opacity="0.65"/>
          <path d="M125 265 C95 215 80 168 78 120 C58 130 48 180 78 228Z" fill="#3b5c4a" fillOpacity="0.13" stroke="#3b5c4a" strokeWidth="0.8" opacity="0.6"/>
          <path d="M95 360 C130 305 160 255 175 205 C155 202 130 240 105 290Z" fill="#4a7060" fillOpacity="0.2" stroke="#3b5c4a" strokeWidth="1" opacity="0.65"/>
          <path d="M118 300 C150 248 175 200 188 152 C168 150 145 188 120 238Z" fill="#4a7060" fillOpacity="0.16" stroke="#3b5c4a" strokeWidth="0.9" opacity="0.6"/>
          <path d="M140 238 C168 190 188 145 196 100 C178 99 157 136 136 184Z" fill="#4a7060" fillOpacity="0.13" stroke="#3b5c4a" strokeWidth="0.8" opacity="0.55"/>
          <path d="M155 205 C175 170 185 135 182 100 C170 110 158 145 150 180Z" fill="#3b5c4a" fillOpacity="0.2" stroke="#3b5c4a" strokeWidth="0.8"/>
        </svg>
      </div>

      {/* Top-right fern */}
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

      {/* Small accent leaf top-left */}
      <div className="absolute top-[5%] left-[5%] pointer-events-none"
        style={{ transformOrigin: "50% 100%", animation: "lotus-sway 11s ease-in-out infinite 3s" }}>
        <svg width="120" height="100" viewBox="0 0 120 100" fill="none">
          <path d="M20 100 C45 70 80 50 95 25 C75 18 50 38 30 65Z" fill="#3b5c4a" fillOpacity="0.2" stroke="#3b5c4a" strokeWidth="1.2"/>
          <path d="M20 100 C50 78 80 58 95 28" stroke="#3b5c4a" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
        </svg>
      </div>

      {/* Central lotus */}
      <div className="absolute inset-0 flex items-end justify-center pointer-events-none" style={{ paddingBottom: "5%" }}>
        <div className="relative" style={{ animation: "lotus-float-up 10s ease-in-out infinite 1s" }}>
          <div className="absolute left-1/2 -translate-x-1/2" style={{ bottom: "-8px", width: "200px" }}>
            <svg width="200" height="60" viewBox="0 0 200 60" fill="none">
              <ellipse cx="100" cy="30" rx="80" ry="18" fill="#3b5c4a" fillOpacity="0.25" stroke="#3b5c4a" strokeWidth="1.2"/>
              <path d="M100 12 L100 30" stroke="#3b5c4a" strokeWidth="1" opacity="0.5"/>
              <ellipse cx="100" cy="34" rx="100" ry="14" fill="none" stroke="#3b5c4a" strokeWidth="0.7" opacity="0.3"
                style={{ animation: "lotus-ripple 4s ease-in-out infinite" }}/>
              <ellipse cx="100" cy="38" rx="130" ry="18" fill="none" stroke="#3b5c4a" strokeWidth="0.4" opacity="0.2"
                style={{ animation: "lotus-ripple2 4s ease-in-out infinite 1s" }}/>
            </svg>
          </div>
          <svg width="220" height="200" viewBox="0 0 220 200" fill="none">
            <defs>
              <radialGradient id="ml-petal" cx="50%" cy="65%" r="55%">
                <stop offset="0%" stopColor="#e8f4ee" stopOpacity="0.95"/><stop offset="100%" stopColor="#c8ddd3" stopOpacity="0.8"/>
              </radialGradient>
              <radialGradient id="ml-gold" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fff3c0"/><stop offset="100%" stopColor="#c4a15a"/>
              </radialGradient>
            </defs>
            <g style={{ transformOrigin: "110px 160px", animation: "lotus-sway 8s ease-in-out infinite" }}>
              <path d="M110 155 C107 128 98 102 101 78 C104 62 116 62 119 78 C122 102 113 128 110 155Z" fill="url(#ml-petal)" stroke="#3b5c4a" strokeWidth="1" opacity="0.9"/>
              <path d="M110 155 C88 140 72 120 71 98 C70 82 84 74 96 86 C104 100 108 136 110 155Z" fill="url(#ml-petal)" stroke="#3b5c4a" strokeWidth="0.9" opacity="0.8"/>
              <path d="M110 155 C132 140 148 120 149 98 C150 82 136 74 124 86 C116 100 112 136 110 155Z" fill="url(#ml-petal)" stroke="#3b5c4a" strokeWidth="0.9" opacity="0.8"/>
              <path d="M110 155 C68 142 48 124 47 102 C46 84 62 76 78 90 C92 108 104 140 110 155Z" fill="url(#ml-petal)" stroke="#3b5c4a" strokeWidth="0.8" opacity="0.65"/>
              <path d="M110 155 C152 142 172 124 173 102 C174 84 158 76 142 90 C128 108 116 140 110 155Z" fill="url(#ml-petal)" stroke="#3b5c4a" strokeWidth="0.8" opacity="0.65"/>
            </g>
            <g style={{ transformOrigin: "110px 160px", animation: "lotus-sway-reverse 6s ease-in-out infinite 1.5s" }}>
              <path d="M110 155 C104 136 98 116 100 98 C103 88 117 88 120 98 C122 116 116 136 110 155Z" fill="#d8eee2" stroke="#4a7060" strokeWidth="0.9" opacity="0.95"/>
              <path d="M110 155 C94 146 84 130 84 114 C84 102 95 96 104 106 C108 118 110 144 110 155Z" fill="#d8eee2" stroke="#4a7060" strokeWidth="0.8" opacity="0.85"/>
              <path d="M110 155 C126 146 136 130 136 114 C136 102 125 96 116 106 C112 118 110 144 110 155Z" fill="#d8eee2" stroke="#4a7060" strokeWidth="0.8" opacity="0.85"/>
            </g>
            <circle cx="110" cy="152" r="12" fill="url(#ml-gold)" opacity="0.9" style={{ animation: "lotus-ripple 3.5s ease-in-out infinite" }}/>
            <circle cx="110" cy="152" r="6" fill="#fff8c0" opacity="0.95"/>
            <circle cx="110" cy="152" r="3" fill="#c4a15a"/>
            <path d="M110 163 C108 175 106 188 104 200" stroke="#3b5c4a" strokeWidth="2.5" strokeLinecap="round" opacity="0.45"/>
          </svg>
        </div>
      </div>

      {/* Floating particles */}
      {[
        { x:"15%", y:"25%", size:10, dur:14, delay:0 }, { x:"80%", y:"40%", size:8, dur:12, delay:2 },
        { x:"60%", y:"15%", size:6, dur:16, delay:4 },   { x:"25%", y:"70%", size:9, dur:11, delay:1.5 },
        { x:"90%", y:"65%", size:7, dur:15, delay:3 },
      ].map((p, i) => (
        <div key={i} className="absolute pointer-events-none"
          style={{ left: p.x, top: p.y, animation: `settings-petal-fall ${p.dur}s ease-in-out infinite ${p.delay}s` }}>
          <svg width={p.size} height={p.size} viewBox="0 0 20 20" fill="none">
            <path d="M10 2 C6 2 2 6 2 10 C2 16 10 20 10 20 C10 20 18 16 18 10 C18 6 14 2 10 2Z" fill="#3b5c4a" fillOpacity="0.45"/>
          </svg>
        </div>
      ))}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1000 700" fill="none">
        <path d="M0 250 Q200 225 450 255 Q650 280 1000 245" stroke="#3b5c4a" strokeWidth="1.5" opacity="0.06" fill="none"/>
        <path d="M0 420 Q250 398 500 422 Q750 446 1000 415" stroke="#3b5c4a" strokeWidth="1" opacity="0.05" fill="none"/>
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
      <div className="absolute inset-0" style={{ background: "var(--settings-bg)" }} />
      <div className="absolute top-[-15%] left-[15%] h-[700px] w-[700px] rounded-full blur-[140px] pointer-events-none"
        style={{ background: "rgba(20,40,110,0.6)", animation: "nebula-shift 18s ease-in-out infinite" }} />
      <div className="absolute top-[-10%] right-[10%] h-[500px] w-[600px] rounded-full blur-[120px] pointer-events-none"
        style={{ background: "rgba(10,20,70,0.5)", animation: "nebula-shift 24s ease-in-out infinite 4s" }} />
      <div className="absolute bottom-[-10%] left-[-5%] h-[500px] w-[550px] rounded-full blur-[110px] pointer-events-none"
        style={{ background: "rgba(15,30,90,0.45)", animation: "settings-float-medium 20s ease-in-out infinite 2s" }} />
      <div className="absolute top-[35%] right-[8%] h-[300px] w-[350px] rounded-full blur-[100px] pointer-events-none"
        style={{ background: "rgba(224,184,106,0.1)", animation: "settings-drift 22s ease-in-out infinite 6s" }} />
      <div className="absolute bottom-[20%] left-[10%] h-[250px] w-[280px] rounded-full blur-[90px] pointer-events-none"
        style={{ background: "rgba(200,160,80,0.08)", animation: "settings-float-slow 16s ease-in-out infinite 3s" }} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: "var(--settings-glow-center)" }} />
      {stars.map((star, i) => (
        <div key={i} className="absolute rounded-full bg-white pointer-events-none"
          style={{ left: star.x, top: star.y, width: star.s, height: star.s,
            boxShadow: `0 0 ${star.b}px rgba(255,255,230,0.95)`,
            animation: `settings-twinkle ${2 + (i % 7) * 1.1}s ease-in-out infinite ${(i * 0.32) % 5}s` }} />
      ))}

      {/* Central gold lotus hero */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative" style={{ animation: "lotus-float-up 12s ease-in-out infinite 1s" }}>
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
            <g style={{ transformOrigin: "150px 220px", animation: "lotus-sway 9s ease-in-out infinite" }} filter="url(#dk-glow-filter)">
              <path d="M150 215 C146 178 134 142 138 108 C142 88 158 88 162 108 C166 142 154 178 150 215Z" fill="url(#dk-gold-petal)" opacity="0.9"/>
              <path d="M150 215 C120 196 100 170 99 144 C98 124 114 114 128 128 C138 148 146 188 150 215Z" fill="url(#dk-gold-petal)" opacity="0.78"/>
              <path d="M150 215 C180 196 200 170 201 144 C202 124 186 114 172 128 C162 148 154 188 150 215Z" fill="url(#dk-gold-petal)" opacity="0.78"/>
              <path d="M150 215 C100 200 74 178 72 152 C70 130 88 120 106 134 C120 154 138 192 150 215Z" fill="url(#dk-gold-petal)" opacity="0.6"/>
              <path d="M150 215 C200 200 226 178 228 152 C230 130 212 120 194 134 C180 154 162 192 150 215Z" fill="url(#dk-gold-petal)" opacity="0.6"/>
            </g>
            <g style={{ transformOrigin: "150px 220px", animation: "lotus-sway-reverse 7s ease-in-out infinite 1.5s" }} filter="url(#dk-glow-filter)">
              <path d="M150 215 C144 192 136 168 138 148 C141 134 159 134 162 148 C164 168 156 192 150 215Z" fill="url(#dk-mid-petal)" opacity="0.95"/>
              <path d="M150 215 C130 204 118 186 118 168 C118 154 130 146 140 158 C144 174 148 202 150 215Z" fill="url(#dk-mid-petal)" opacity="0.88"/>
              <path d="M150 215 C170 204 182 186 182 168 C182 154 170 146 160 158 C156 174 152 202 150 215Z" fill="url(#dk-mid-petal)" opacity="0.88"/>
            </g>
            <g style={{ transformOrigin: "150px 220px", animation: "lotus-sway 5s ease-in-out infinite 2s" }}>
              <path d="M150 215 C146 200 142 184 143 170 C145 160 155 160 157 170 C158 184 154 200 150 215Z" fill="#fff8e0" opacity="0.98" stroke="#e0c060" strokeWidth="0.5"/>
              <path d="M150 215 C140 208 134 196 134 184 C134 174 142 168 148 176 C150 188 150 208 150 215Z" fill="#fff8e0" opacity="0.9"/>
              <path d="M150 215 C160 208 166 196 166 184 C166 174 158 168 152 176 C150 188 150 208 150 215Z" fill="#fff8e0" opacity="0.9"/>
            </g>
            <circle cx="150" cy="212" r="16" fill="url(#dk-stamen)" opacity="0.95" filter="url(#dk-glow-filter)"/>
            <circle cx="150" cy="212" r="9" fill="#ffffff" opacity="0.98"/>
            <circle cx="150" cy="212" r="4.5" fill="#e0b86a"/>
            <circle cx="150" cy="212" r="2" fill="#fff8c0"/>
            <ellipse cx="150" cy="230" rx="55" ry="10" stroke="rgba(224,184,106,0.3)" strokeWidth="1" fill="none" style={{ animation: "lotus-ripple 4s ease-in-out infinite" }}/>
            <ellipse cx="150" cy="234" rx="80" ry="14" stroke="rgba(224,184,106,0.18)" strokeWidth="0.7" fill="none" style={{ animation: "lotus-ripple2 4.5s ease-in-out infinite 1s" }}/>
            <ellipse cx="150" cy="240" rx="110" ry="18" stroke="rgba(224,184,106,0.1)" strokeWidth="0.5" fill="none" style={{ animation: "lotus-ripple 5.5s ease-in-out infinite 2s" }}/>
          </svg>
        </div>
      </div>

      {/* Side buds */}
      <div className="absolute left-[6%] bottom-[22%] pointer-events-none" style={{ animation: "lotus-float-up2 14s ease-in-out infinite 3s" }}>
        <svg width="80" height="90" viewBox="0 0 80 90" fill="none" style={{ animation: "dark-lotus-glow 7s ease-in-out infinite 2s" }}>
          <defs><radialGradient id="dk-bud1" cx="50%" cy="70%" r="60%"><stop offset="0%" stopColor="#fff3a0"/><stop offset="100%" stopColor="#b8840a"/></radialGradient></defs>
          <path d="M40 75 C38 60 32 44 34 30 C36 22 44 22 46 30 C48 44 42 60 40 75Z" fill="url(#dk-bud1)" opacity="0.8"/>
          <path d="M40 75 C28 66 22 54 23 42 C24 34 32 30 38 38 C40 52 40 68 40 75Z" fill="url(#dk-bud1)" opacity="0.65"/>
          <path d="M40 75 C52 66 58 54 57 42 C56 34 48 30 42 38 C40 52 40 68 40 75Z" fill="url(#dk-bud1)" opacity="0.65"/>
          <circle cx="40" cy="73" r="5" fill="#e0b86a" opacity="0.9"/>
          <ellipse cx="40" cy="80" rx="25" ry="5" stroke="rgba(224,184,106,0.3)" strokeWidth="0.8" fill="none"/>
        </svg>
      </div>
      <div className="absolute right-[8%] top-[35%] pointer-events-none" style={{ animation: "lotus-sway 13s ease-in-out infinite 5s" }}>
        <svg width="65" height="75" viewBox="0 0 65 75" fill="none" style={{ animation: "dark-lotus-glow 9s ease-in-out infinite 4s" }}>
          <defs><radialGradient id="dk-bud2" cx="50%" cy="65%" r="55%"><stop offset="0%" stopColor="#fff0a0"/><stop offset="100%" stopColor="#c09020"/></radialGradient></defs>
          <path d="M32 65 C30 52 26 38 28 26 C30 18 36 18 38 26 C40 38 34 52 32 65Z" fill="url(#dk-bud2)" opacity="0.75"/>
          <path d="M32 65 C22 58 17 46 18 36 C19 28 26 24 30 32 C32 44 32 60 32 65Z" fill="url(#dk-bud2)" opacity="0.6"/>
          <path d="M32 65 C42 58 47 46 46 36 C45 28 38 24 34 32 C32 44 32 60 32 65Z" fill="url(#dk-bud2)" opacity="0.6"/>
          <circle cx="32" cy="63" r="4" fill="#e0b86a" opacity="0.85"/>
        </svg>
      </div>

      {/* Gold dust */}
      {goldDust.map((p, i) => (
        <div key={i} className="absolute rounded-full pointer-events-none"
          style={{ left: p.x, top: p.y, width: p.s, height: p.s,
            background: "rgba(224,184,106,0.9)",
            boxShadow: `0 0 ${p.s * 5}px rgba(224,184,106,0.8)`,
            animation: `gold-dust-float ${8 + (i % 5) * 1.4}s ease-out infinite ${(i * 0.55) % 6}s` }} />
      ))}
      {[-40, -20, 0, 20, 40, -60, 60].map((angle, i) => (
        <div key={i} className="absolute top-0 left-1/2 pointer-events-none"
          style={{ width: i % 3 === 0 ? 2 : 1, height: i % 3 === 0 ? "60%" : "45%",
            background: `linear-gradient(to bottom, rgba(224,184,106,${i % 3 === 0 ? "0.18" : "0.1"}), transparent)`,
            transform: `translateX(-50%) rotate(${angle}deg)`, transformOrigin: "top center",
            animation: `settings-light-ray ${8 + i * 1.2}s ease-in-out infinite ${i * 0.7}s` }} />
      ))}
      <div className="absolute inset-0" style={{ background: "var(--settings-vignette)" }} />
    </>
  );
}

// ════════════════════════════════════════════════════════════
//  GLOBAL BACKGROUND — fixed full-viewport layer
// ════════════════════════════════════════════════════════════

function ThemeScene({ theme }: { theme: ThemeMode }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {theme === "pink"        && <PinkBackground />}
      {theme === "gold"        && <GoldBackground />}
      {theme === "lotus-white" && <LotusWhiteBackground />}
      {theme === "lotus-mint"  && <MintBackground />}
      {theme === "lotus-dark"  && <DarkNavyBackground />}
    </div>
  );
}

export function ThemeGlobalBackground() {
  const { theme } = useTheme();
  const [sceneKey, setSceneKey] = useState<ThemeMode>(theme);
  const [visible, setVisible]   = useState(true);

  useEffect(() => {
    setVisible(false);
    const t = setTimeout(() => { setSceneKey(theme); setVisible(true); }, 350);
    return () => clearTimeout(t);
  }, [theme]);

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        isolation: "isolate",
      }}
    >
      <div
        key={sceneKey}
        style={{
          position: "absolute", inset: 0,
          opacity: visible ? 1 : 0,
          transition: "opacity 0.5s ease-in-out",
        }}
      >
        <ThemeScene theme={sceneKey} />
      </div>
    </div>
  );
}
