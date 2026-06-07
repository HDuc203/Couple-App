"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Heart
} from "lucide-react";
import { resetPasswordAction } from "@/app/actions/auth";

export default function ResetPasswordForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // States for matching validation
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // States for action handling
  const [isPending, setIsPending] = useState(false);
  const [clientError, setClientError] = useState("");
  const [clientMessage, setClientMessage] = useState("");

  // Validate passwords match
  useEffect(() => {
    if (confirmPassword && password !== confirmPassword) {
      setPasswordError("Mật khẩu xác nhận không khớp.");
    } else {
      setPasswordError("");
    }
  }, [password, confirmPassword]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setClientError("");
    setClientMessage("");
    setIsPending(true);

    const formData = new FormData(e.currentTarget);

    try {
      const res = await resetPasswordAction(formData);
      if (res && res.success) {
        setClientMessage("Đặt lại mật khẩu thành công! Đang chuyển hướng...");
        window.location.href = "/dashboard";
      } else if (res) {
        setClientError(res.error || "Có lỗi xảy ra. Vui lòng thử lại.");
      }
    } catch (err: any) {
      setClientError(err.message || "Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <main
      className="auth-root h-screen w-full relative flex items-center justify-center p-0 overflow-hidden"
      style={{
        fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif",
        color: "#5a4c35",
      }}
    >
      {/* 1. Base solid/gradient light luxury gold background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(to right, #fdfaf2 0%, #f7ecd3 50%, #fdfaf2 100%)",
          zIndex: 1
        }}
      />

      {/* 2. Background image - Highly visible lotus illustration */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-[15000ms] scale-100"
        style={{
          backgroundImage: "url('/images/lotus_hero_bg.png')",
          opacity: 0.55,
          zIndex: 2
        }}
      />

      {/* 3. Soft gold light/glow overlay */}
      <div
        className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_35%,rgba(196,161,90,0.1),transparent_60%)]"
        style={{ zIndex: 3 }}
      />

      {/* 4. Seamless romantic overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(to right, rgba(253, 250, 242, 0.45) 0%, rgba(247, 236, 211, 0.2) 50%, rgba(253, 250, 242, 0.45) 100%)",
          zIndex: 4
        }}
      />

      {/* 5. Gold light rays */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 5 }}>
        {[12, 28, -12, -28].map((angle, i) => (
          <div
            key={i}
            className="absolute top-0 left-1/2"
            style={{
              width: "2px",
              height: "65%",
              background: "linear-gradient(to bottom, rgba(224, 184, 106, 0.18), transparent)",
              transform: `translateX(-50%) rotate(${angle}deg)`,
              transformOrigin: "top center",
              animation: `settings-light-ray ${7 + i * 2.5}s ease-in-out infinite ${i * 1.8}s`,
            }}
          />
        ))}
      </div>

      {/* 6. Fog */}
      <div
        className="absolute inset-x-0 bottom-0 h-1/3 pointer-events-none"
        style={{
          background: "linear-gradient(to top, rgba(253, 250, 242, 0.65) 0%, rgba(253, 250, 242, 0.25) 50%, transparent 100%)",
          animation: "settings-bg-breathe 9s ease-in-out infinite",
          zIndex: 5
        }}
      />

      {/* 7. Gold particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 6 }}>
        {[
          { left: "8%", top: "28%", size: "4px", delay: "0s", dur: "15s" },
          { left: "22%", top: "65%", size: "6px", delay: "3s", dur: "18s" },
          { left: "38%", top: "18%", size: "3px", delay: "1.5s", dur: "13s" },
          { left: "55%", top: "72%", size: "5px", delay: "5s", dur: "16s" },
          { left: "75%", top: "32%", size: "4px", delay: "2.2s", dur: "14s" },
          { left: "88%", top: "50%", size: "6px", delay: "4.1s", dur: "19s" },
        ].map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-[#e0b86a] opacity-50"
            style={{
              left: p.left,
              top: p.top,
              width: p.size,
              height: p.size,
              boxShadow: "0 0 8px rgba(224, 184, 106, 0.75)",
              animation: `settings-twinkle 4.5s ease-in-out infinite ${p.delay}, settings-float-medium ${p.dur} ease-in-out infinite`,
            }}
          />
        ))}
      </div>

      {/* Card Container */}
      <div className="relative z-10 w-full max-w-md p-6" style={{ zIndex: 10 }}>

        <div
          className="w-full border border-[#ebdcb9]/65 rounded-3xl p-6 shadow-[0_20px_50px_rgba(165,150,120,0.12)] relative transition-all duration-500 hover:shadow-xl"
          style={{
            background: "linear-gradient(135deg, rgba(255, 254, 250, 0.95) 0%, rgba(253, 249, 240, 0.92) 100%)",
            border: "1.5px solid rgba(196, 161, 90, 0.4)",
            boxShadow: "0 40px 100px rgba(136, 106, 50, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)"
          }}
        >
          {/* Logo */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="h-12 w-12 rounded-2xl overflow-hidden shadow-sm border border-[#ebdcb9] bg-white flex items-center justify-center mb-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/couple_app_logo.png" alt="Logo" className="h-8 w-8 object-contain" />
            </div>
            <h2 className="text-xs font-black tracking-[0.2em] text-[#5a4c35]">COUPLE APP</h2>
            <p className="text-[9px] font-semibold text-[#8c7e6b] mt-0.5">Đặt lại mật khẩu cho tài khoản của bạn</p>
          </div>

          {/* Messages */}
          {clientMessage && (
            <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 text-xs font-semibold text-emerald-800">
              {clientMessage}
            </div>
          )}

          {clientError && (
            <div className="mb-4 rounded-xl border border-rose-100 bg-rose-50/50 p-3 text-xs font-semibold text-rose-800">
              {clientError}
            </div>
          )}

          {passwordError && (
            <div className="mb-4 rounded-xl border border-amber-100 bg-amber-50/50 p-3 text-xs font-semibold text-amber-800">
              {passwordError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-[#8c754d] block">
                Mật khẩu mới
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400 pointer-events-none" />
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  className="w-full h-11 pl-10 pr-10 rounded-2xl border border-[#dfd2bb] bg-white text-sm font-semibold text-zinc-900 outline-none focus:border-[#c4a15a] focus:ring-4 focus:ring-[#c4a15a]/5 transition placeholder:text-zinc-400"
                  style={{ backgroundColor: "#ffffff", color: "#1a1a1a" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-[#8c754d] block">
                Xác nhận mật khẩu mới
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400 pointer-events-none" />
                <input
                  name="confirm_password"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Xác nhận lại mật khẩu mới"
                  className="w-full h-11 pl-10 pr-10 rounded-2xl border border-[#dfd2bb] bg-white text-sm font-semibold text-zinc-900 outline-none focus:border-[#c4a15a] focus:ring-4 focus:ring-[#c4a15a]/5 transition placeholder:text-zinc-400"
                  style={{ backgroundColor: "#ffffff", color: "#1a1a1a" }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition"
                >
                  {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending || !!passwordError}
              className="w-full auth-submit-btn flex items-center justify-center gap-1.5"
            >
              {isPending ? (
                <span>Đang cập nhật...</span>
              ) : (
                <div className="flex items-center justify-center gap-1.5 w-full">
                  <span>Cập nhật mật khẩu</span>
                  <ArrowRight className="size-4" />
                </div>
              )}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link
              href="/login"
              className="text-[11px] font-bold text-zinc-400 hover:text-[#c4a15a] transition"
            >
              Quay lại trang <span className="font-black text-[#c4a15a] underline underline-offset-4">Đăng nhập</span>
            </Link>
          </div>

        </div>

      </div>

    </main>
  );
}
