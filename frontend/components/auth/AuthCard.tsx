"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { 
  Heart, 
  Lock, 
  Sparkles, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  RefreshCw, 
  Compass,
  ArrowRight,
  Mail,
  User
} from "lucide-react";
// Removed verifyOtpAction, resendOtpAction as OTP verification is handled via Supabase email links

type AuthCardProps = {
  mode: "login" | "register";
  action: (formData: FormData) => Promise<any>; // changed to return any
  error?: string;
  message?: string;
  redirectedFrom?: string;
};

export function AuthCard({
  mode,
  action,
  error,
  message,
  redirectedFrom,
}: AuthCardProps) {
  const isLogin = mode === "login";
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // States for client-side matching validation
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // States for client-side action handling & OTP
  const [isPending, setIsPending] = useState(false);
  const [clientError, setClientError] = useState("");
  const [clientMessage, setClientMessage] = useState("");
  
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpFullName, setSignUpFullName] = useState("");

  // Check passwords match for registration
  useEffect(() => {
    if (!isLogin && confirmPassword && password !== confirmPassword) {
      setPasswordError("Mật khẩu xác nhận không khớp.");
    } else {
      setPasswordError("");
    }
  }, [password, confirmPassword, isLogin]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setClientError("");
    setClientMessage("");
    setIsPending(true);

    const formData = new FormData(e.currentTarget);
    
    try {
      if (isLogin) {
        // loginAction redirects on success. We wrap this in await, Next.js redirect will trigger.
        await action(formData);
      } else {
        // registerAction returns ActionResult object
        const res = await action(formData);
        if (res && !res.success) {
          setClientError(res.error);
        } else if (res && res.needsVerification) {
          setIsVerifyingEmail(true);
          setSignUpEmail(res.email || "");
          setSignUpFullName(res.fullName || "");
          setClientMessage("Liên kết xác nhận đã được gửi về email của bạn.");
        } else {
          // If email verification is disabled in Supabase
          setClientMessage("Đăng ký thành công! Đang chuyển hướng...");
          window.location.href = "/onboarding/profile";
        }
      }
    } catch (err: any) {
      // Next.js redirect will throw a NEXT_REDIRECT error which can be ignored
      if (err.digest?.startsWith("NEXT_REDIRECT") || err.message === "NEXT_REDIRECT") {
        return;
      }
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

      {/* 2. Background image - Highly visible lotus illustration (increased visibility to 55%) */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-[15000ms] scale-100 hover:scale-[1.03]"
        style={{ 
          backgroundImage: "url('/images/lotus_hero_bg.png')",
          opacity: 0.55,
          zIndex: 2
        }}
      />

      {/* 3. Subtle gold glow behind hero panel flowers to add depth and visual glow */}
      <div 
        className="absolute pointer-events-none hidden lg:block"
        style={{
          left: "22%",
          top: "45%",
          width: "480px",
          height: "480px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(224, 184, 106, 0.2) 0%, rgba(224, 184, 106, 0.05) 50%, transparent 70%)",
          transform: "translate(-50%, -50%)",
          filter: "blur(40px)",
          zIndex: 3
        }}
      />

      {/* 4. Soft gold light/glow overlay to further smooth the image blend */}
      <div 
        className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_35%,rgba(196,161,90,0.1),transparent_60%)]"
        style={{ zIndex: 3 }}
      />
      
      {/* 5. Seamless romantic overlay across the whole screen — Transparent Ivory Gradient (Allows artwork to breathe) */}
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{
          background: "linear-gradient(to right, rgba(253, 250, 242, 0.45) 0%, rgba(247, 236, 211, 0.2) 50%, rgba(253, 250, 242, 0.45) 100%)",
          zIndex: 4
        }}
      />

      {/* 6. Gentle light rays sweeping down from top */}
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

      {/* 7. Soft atmospheric fog drifting above the water reflections */}
      <div 
        className="absolute inset-x-0 bottom-0 h-1/3 pointer-events-none"
        style={{
          background: "linear-gradient(to top, rgba(253, 250, 242, 0.65) 0%, rgba(253, 250, 242, 0.25) 50%, transparent 100%)",
          animation: "settings-bg-breathe 9s ease-in-out infinite",
          zIndex: 5
        }}
      />

      {/* 8. Floating gold particles / dust twinkling in the atmosphere */}
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

      {/* Fullscreen container holding both panels */}
      <div 
        className="auth-container w-full h-screen grid lg:grid-cols-[1.15fr_0.85fr] bg-transparent relative overflow-hidden"
        style={{ zIndex: 10 }}
      >
        
        {/* ════════════════════════════════════════════════════════════
            LEFT SIDE: HERO & STORYTELLING PANEL
            ════════════════════════════════════════════════════════════ */}
        <section className="auth-hero relative hidden lg:flex flex-col justify-between p-10 select-none bg-transparent h-full">

          {/* Top Logo & Slogan */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl overflow-hidden shadow-md border border-[#dfd2bb] bg-white flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/couple_app_logo.png" alt="Couple App Logo" className="h-8 w-8 object-contain" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#9b8256]">Couple App</p>
              <p className="text-[8px] font-bold text-[#bfa985] tracking-wide mt-0.5">Kết nối · Thấu hiểu · Đồng hành</p>
            </div>
          </div>

          {/* Core Slogan & Features */}
          <div className="relative z-10 my-auto py-4">
            <h1 
              className="text-3xl xl:text-4xl font-black text-[#5a4c35] leading-[1.25] tracking-tight"
              style={{ textShadow: "0 1px 3px rgba(255, 254, 250, 0.95)" }}
            >
              Nơi lưu giữ <br />
              mọi khoảnh khắc <br />
              bên nhau <span className="inline-block text-[#c4a15a] animate-pulse">❤️</span>
            </h1>
            <p 
              className="mt-3 max-w-md text-xs font-semibold text-[#6e5d45] leading-relaxed"
              style={{ textShadow: "0 1px 2px rgba(255, 254, 250, 0.95)" }}
            >
              Không gian riêng tư chỉ dành cho hai bạn. Đồng bộ cảm xúc, chia sẻ kỷ niệm và cùng nhau viết nên câu chuyện của chúng mình.
            </p>

            {/* Feature badges list */}
            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-4 group">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white border border-[#ebdcb9] text-[#c4a15a] shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:shadow-md">
                  <Lock className="size-4.5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-[#5a4c35]" style={{ textShadow: "0 1px 2px rgba(255, 254, 250, 0.95)" }}>Riêng tư tuyệt đối</h4>
                  <p className="text-[10px] font-bold text-[#7c6a50]" style={{ textShadow: "0 1px 2px rgba(255, 254, 250, 0.95)" }}>Dữ liệu được mã hóa và bảo mật tối đa.</p>
                </div>
              </div>

              <div className="flex items-center gap-4 group">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white border border-[#ebdcb9] text-rose-400 shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:shadow-md">
                  <Heart className="size-4.5 fill-rose-100" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-[#5a4c35]" style={{ textShadow: "0 1px 2px rgba(255, 254, 250, 0.95)" }}>Đồng bộ cảm xúc</h4>
                  <p className="text-[10px] font-bold text-[#7c6a50]" style={{ textShadow: "0 1px 2px rgba(255, 254, 250, 0.95)" }}>Cùng nhau kết nối, thấu hiểu mỗi ngày.</p>
                </div>
              </div>

              <div className="flex items-center gap-4 group">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white border border-[#ebdcb9] text-[#4c7863] shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:shadow-md">
                  <Sparkles className="size-4.5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-[#5a4c35]" style={{ textShadow: "0 1px 2px rgba(255, 254, 250, 0.95)" }}>Lưu giữ kỷ niệm</h4>
                  <p className="text-[10px] font-bold text-[#7c6a50]" style={{ textShadow: "0 1px 2px rgba(255, 254, 250, 0.95)" }}>Album, nhật ký và những dấu ấn đáng nhớ.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Line details */}
          <div className="relative z-10 border-t border-[#ebdcb9]/60 pt-3 flex justify-between items-center text-[10px] font-bold text-[#8c7e6b]">
            <span>Theme White Lotus Luxury 🪷</span>
            <span>© 2026 Couple App</span>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
            RIGHT SIDE: DUAL-CARD AUTHENTICATION SPACE
            ════════════════════════════════════════════════════════════ */}
        <section className="auth-forms-panel bg-transparent lg:bg-white/5 p-6 sm:p-8 lg:p-8 xl:p-10 flex flex-col justify-between items-center relative overflow-hidden h-full">
          
          {/* Subtle floral background detail */}
          <div className="absolute -bottom-24 -right-24 size-96 rounded-full bg-[#fbf6ec]/60 blur-3xl pointer-events-none" />

          {/* Top navigation tabs */}
          <div className="w-full max-w-md flex items-center justify-between border-b border-[#ebdcb9]/30 pb-2 mb-4">
            <div className="flex gap-6">
              <Link 
                href="/login" 
                className={`text-sm font-black transition-all duration-300 pb-2 relative ${isLogin ? "text-[#5a4c35]" : "text-[#a39480] hover:text-[#5a4c35]"}`}
              >
                Đăng nhập
                {isLogin && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#c4a15a] rounded-full animate-slide-right" />}
              </Link>
              <Link 
                href="/register" 
                className={`text-sm font-black transition-all duration-300 pb-2 relative ${!isLogin ? "text-[#5a4c35]" : "text-[#a39480] hover:text-[#5a4c35]"}`}
              >
                Đăng ký
                {!isLogin && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#c4a15a] rounded-full animate-slide-right" />}
              </Link>
            </div>
            
            <div className="text-[10px] font-bold text-[#c4a15a] flex items-center gap-1">
              <Sparkles className="size-3" />
              <span>Giao diện Cao cấp</span>
            </div>
          </div>

          {/* Unified layout of main form card and side preview card */}
          <div className="w-full flex items-center justify-center gap-6 py-2 relative">
            
            {/* ─── ACTIVE FORM CARD ─── */}
            <div 
              className="w-full max-w-md border border-[#ebdcb9]/65 rounded-3xl p-6 shadow-[0_20px_50px_rgba(165,150,120,0.12)] relative z-10 transition-all duration-500 hover:shadow-xl"
              style={{
                background: "linear-gradient(135deg, rgba(255, 254, 250, 0.95) 0%, rgba(253, 249, 240, 0.92) 100%)",
                border: "1.5px solid rgba(196, 161, 90, 0.4)",
                boxShadow: "0 40px 100px rgba(136, 106, 50, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.9)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)"
              }}
            >
              
              {/* Top Branding Logo */}
              <div className="flex flex-col items-center text-center mb-4">
                <div className="h-12 w-12 rounded-2xl overflow-hidden shadow-sm border border-[#ebdcb9] bg-white flex items-center justify-center mb-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/images/couple_app_logo.png" alt="Logo" className="h-8 w-8 object-contain" />
                </div>
                <h2 className="text-xs font-black tracking-[0.2em] text-[#5a4c35]">COUPLE APP</h2>
                <p className="text-[9px] font-semibold text-[#8c7e6b] mt-0.5">Không gian hạnh phúc của hai bạn ❤️</p>
              </div>

              {/* Status Alert Messages */}
              {(message || clientMessage) && (
                <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 text-xs font-semibold text-emerald-800 animate-fade-in">
                  {clientMessage || message}
                </div>
              )}

              {(error || clientError) && (
                <div className="mb-4 rounded-xl border border-rose-100 bg-rose-50/50 p-3 text-xs font-semibold text-rose-800 animate-fade-in">
                  {clientError || error}
                </div>
              )}

              {passwordError && (
                <div className="mb-4 rounded-xl border border-amber-100 bg-amber-50/50 p-3 text-xs font-semibold text-amber-800">
                  {passwordError}
                </div>
              )}

              {isVerifyingEmail ? (
                <div className="space-y-6 py-4 text-center">
                  <div className="relative mx-auto h-20 w-20 rounded-full bg-gradient-to-tr from-[#fbf5e6] to-[#f4e2bb] border border-[#dfd2bb] text-[#c4a15a] flex items-center justify-center shadow-lg">
                    {/* Glowing effect */}
                    <div className="absolute inset-0 rounded-full bg-[#e0b86a]/10 blur-md animate-pulse" />
                    <Mail className="size-10 relative z-10 animate-bounce" style={{ animationDuration: "3s" }} />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-black text-[#5a4c35] tracking-tight">Kích hoạt tài khoản</h3>
                    <p className="text-xs font-semibold text-[#7c6a50] leading-relaxed px-2">
                      Một liên kết xác nhận đã được gửi tới email của bạn:
                    </p>
                    <div className="font-black text-xs text-[#5a4c35] bg-[#ebdcb9]/30 border border-[#dfd2bb]/55 py-2 px-3 rounded-2xl inline-block max-w-full break-all select-all">
                      {signUpEmail}
                    </div>
                    <p className="text-[11px] font-semibold text-[#8c7e6b] leading-relaxed px-4 pt-1">
                      Vui lòng kiểm tra hộp thư (bao gồm cả thư rác/spam) và nhấp vào liên kết để kích hoạt tài khoản của bạn.
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[#ebdcb9]/30">
                    <button
                      type="button"
                      onClick={() => {
                        setIsVerifyingEmail(false);
                        setClientError("");
                        setClientMessage("");
                      }}
                      className="w-full py-2.5 px-4 rounded-2xl border border-[#ebdcb9] hover:bg-[#fcf9f2] text-xs font-black text-[#8c754d] transition active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      <ArrowRight className="size-4 rotate-180" />
                      <span>Quay lại trang Đăng ký</span>
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {isLogin ? (
                    <>
                      <input type="hidden" name="redirectedFrom" value={redirectedFrom || "/dashboard"} />

                      {/* Email Input */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-wider text-[#8c754d] block">
                          Email
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400 pointer-events-none" />
                          <input
                            name="email"
                            type="email"
                            required
                            placeholder="Nhập email của bạn"
                            className="w-full h-11 pl-10 pr-4 rounded-2xl border border-[#dfd2bb] bg-white text-sm font-semibold text-zinc-900 outline-none focus:border-[#c4a15a] focus:ring-4 focus:ring-[#c4a15a]/5 transition placeholder:text-zinc-400"
                            style={{ backgroundColor: "#ffffff", color: "#1a1a1a" }}
                          />
                        </div>
                      </div>

                      {/* Password Input */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-wider text-[#8c754d] block">
                          Mật khẩu
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400 pointer-events-none" />
                          <input
                            name="password"
                            type={showPassword ? "text" : "password"}
                            required
                            placeholder="Nhập mật khẩu"
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
                        <div className="text-right">
                          <Link href="/login?error=Tính năng đang được phát triển" className="text-[10px] font-bold text-[#c4a15a] hover:underline">
                            Quên mật khẩu?
                          </Link>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isPending}
                        className="w-full auth-submit-btn flex items-center justify-center gap-1.5"
                      >
                        {isPending ? (
                          <span>Đang đăng nhập...</span>
                        ) : (
                          <div className="flex items-center justify-center gap-1.5 w-full">
                            <span>Đăng nhập</span>
                            <ArrowRight className="size-4" />
                          </div>
                        )}
                      </button>
                    </>
                  ) : (
                    <>
                      {/* Full Name Input */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-wider text-[#8c754d] block">
                          Họ và tên
                        </label>
                        <div className="relative">
                          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400 pointer-events-none" />
                          <input
                            name="full_name"
                            type="text"
                            required
                            placeholder="Nguyễn Văn A"
                            className="w-full h-11 pl-10 pr-4 rounded-2xl border border-[#dfd2bb] bg-white text-sm font-semibold text-zinc-900 outline-none focus:border-[#c4a15a] focus:ring-4 focus:ring-[#c4a15a]/5 transition placeholder:text-zinc-400"
                            style={{ backgroundColor: "#ffffff", color: "#1a1a1a" }}
                          />
                        </div>
                      </div>

                      {/* Email Input */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-wider text-[#8c754d] block">
                          Email
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400 pointer-events-none" />
                          <input
                            name="email"
                            type="email"
                            required
                            placeholder="ten@example.com"
                            className="w-full h-11 pl-10 pr-4 rounded-2xl border border-[#dfd2bb] bg-white text-sm font-semibold text-zinc-900 outline-none focus:border-[#c4a15a] focus:ring-4 focus:ring-[#c4a15a]/5 transition placeholder:text-zinc-400"
                            style={{ backgroundColor: "#ffffff", color: "#1a1a1a" }}
                          />
                        </div>
                      </div>

                      {/* Password Input */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-wider text-[#8c754d] block">
                          Mật khẩu
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
                          Xác nhận mật khẩu
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
                            placeholder="Xác nhận lại mật khẩu"
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
                          <span>Đang tạo tài khoản...</span>
                        ) : (
                          <div className="flex items-center justify-center gap-1.5 w-full">
                            <span>Đăng ký</span>
                            <ArrowRight className="size-4" />
                          </div>
                        )}
                      </button>
                    </>
                  )}
                </form>
              )}

              {/* Social Login option (only for Login currently, just visual) */}
              {isLogin && !isVerifyingEmail && (
                <div className="mt-4 space-y-3">
                  <div className="relative flex items-center justify-center">
                    <span className="absolute inset-x-0 h-px bg-[#ebdcb9]/30" />
                    <span 
                      className="relative z-10 px-3 text-[9px] font-bold text-zinc-400 uppercase"
                      style={{ backgroundColor: "rgba(255, 254, 250, 0.96)" }}
                    >
                      hoặc
                    </span>
                  </div>

                  <Link 
                    href="/login?error=Đăng nhập mạng xã hội đang cấu hình"
                    className="w-full h-10 flex items-center justify-center gap-2 rounded-2xl border border-[#ebdcb9]/40 bg-white hover:bg-zinc-50 text-xs font-black text-zinc-600 transition active:scale-[0.99]"
                    style={{ backgroundColor: "#ffffff", color: "#52525b" }}
                  >
                    <svg className="size-3.5 shrink-0" viewBox="0 0 24 24">
                      <path fill="#EA4335" d="M12 5.04c1.78 0 3.38.61 4.64 1.8l3.46-3.46C18.01 1.42 15.22.5 12 .5 7.37.5 3.4 3.17 1.48 7.06l4.08 3.16C6.52 7.35 9 5.04 12 5.04z" />
                      <path fill="#4285F4" d="M23.5 12.25c0-.82-.07-1.61-.21-2.38H12v4.51h6.46c-.28 1.47-1.11 2.72-2.36 3.56l3.66 2.84c2.14-1.98 3.74-4.88 3.74-8.53z" />
                      <path fill="#FBBC05" d="M5.56 10.22c-.24-.71-.37-1.47-.37-2.26s.13-1.55.37-2.26L1.48 4.54C.54 6.43 0 8.53 0 10.75s.54 4.32 1.48 6.21l4.08-3.16z" fillOpacity="1" />
                      <path fill="#34A853" d="M12 23.5c3.24 0 5.97-1.07 7.96-2.92l-3.66-2.84c-1.01.67-2.3 1.08-4.3 1.08-3 0-5.48-2.31-6.44-5.18L1.48 16.82C3.4 20.72 7.37 23.5 12 23.5z" />
                    </svg>
                    <span>Tiếp tục với Google</span>
                  </Link>
                </div>
              )}

              {!isVerifyingEmail && (
                <div className="mt-4 text-center">
                  <Link
                    href={isLogin ? "/register" : "/login"}
                    className="text-[11px] font-bold text-zinc-400 hover:text-[#c4a15a] transition"
                  >
                    {isLogin ? (
                      <>Chưa có tài khoản? <span className="font-black text-[#c4a15a] underline underline-offset-4">Đăng ký ngay</span></>
                    ) : (
                      <>Đã có tài khoản? <span className="font-black text-[#c4a15a] underline underline-offset-4">Đăng nhập</span></>
                    )}
                  </Link>
                </div>
              )}

            </div>

            {/* ─── LAYERED / PREVIEW CARD (DESKTOP ONLY) ─── */}
            <div 
              className="hidden xl:block absolute left-[85%] w-80 border border-[#ebdcb9]/40 rounded-3xl p-5 shadow-md scale-90 -rotate-3 hover:rotate-0 hover:scale-[0.93] transition-all duration-500 origin-left select-none cursor-pointer z-0 opacity-60 hover:opacity-100"
              style={{ 
                background: "rgba(255, 254, 250, 0.6)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)"
              }}
            >
              <Link href={isLogin ? "/register" : "/login"} className="block h-full w-full pointer-events-auto">
                <div className="flex flex-col items-center mb-4 border-b border-[#ebdcb9]/30 pb-2">
                  <span className="text-lg">🪷</span>
                  <h4 className="text-xs font-black text-[#5a4c35] mt-1">
                    {isLogin ? "Đăng ký tài khoản" : "Về trang Đăng nhập"}
                  </h4>
                  <p className="text-[8px] font-bold text-zinc-400">{isLogin ? "Không gian lưu giữ tình yêu" : "Sử dụng tài khoản hiện có"}</p>
                </div>

                <div className="space-y-2 opacity-50">
                  {isLogin ? (
                    <>
                      <div className="h-7 rounded-xl bg-zinc-50 border border-zinc-100 px-3 flex items-center text-[9px] font-semibold text-zinc-400">Họ và tên</div>
                      <div className="h-7 rounded-xl bg-zinc-50 border border-zinc-100 px-3 flex items-center text-[9px] font-semibold text-zinc-400">Email</div>
                      <div className="h-7 rounded-xl bg-zinc-50 border border-zinc-100 px-3 flex items-center text-[9px] font-semibold text-zinc-400">Mật khẩu</div>
                      <div className="h-7 rounded-xl bg-zinc-50 border border-zinc-100 px-3 flex items-center text-[9px] font-semibold text-zinc-400">Xác nhận mật khẩu</div>
                      <div className="h-7 rounded-xl bg-[#c4a15a]/25 text-white text-[9px] font-bold flex items-center justify-center">Tạo tài khoản</div>
                    </>
                  ) : (
                    <>
                      <div className="h-7 rounded-xl bg-zinc-50 border border-zinc-100 px-3 flex items-center text-[9px] font-semibold text-zinc-400">Email</div>
                      <div className="h-7 rounded-xl bg-zinc-50 border border-zinc-100 px-3 flex items-center text-[9px] font-semibold text-zinc-400">Mật khẩu</div>
                      <div className="h-7 rounded-xl bg-[#c4a15a]/25 text-white text-[9px] font-bold flex items-center justify-center">Đăng nhập</div>
                    </>
                  )}
                </div>
              </Link>
            </div>

          </div>

          {/* Bottom Row Trust Badges */}
          <div className="w-full max-w-lg mt-4 pt-3 border-t border-[#ebdcb9]/25 grid grid-cols-3 gap-2 text-center select-none">
            <div className="flex flex-col items-center px-1">
              <div className="h-6 w-6 rounded-full bg-[#fcfaf2] border border-[#ebdcb9]/50 flex items-center justify-center text-[#8c754d] mb-1">
                <ShieldCheck className="size-3.5" />
              </div>
              <h5 className="text-[9px] font-black text-[#5a4c35]">Mã hóa End-to-end</h5>
              <p className="text-[7px] font-semibold text-[#8c7e6b] mt-0.5 leading-snug">Tin nhắn bảo mật tuyệt đối</p>
            </div>
            
            <div className="flex flex-col items-center px-1">
              <div className="h-6 w-6 rounded-full bg-[#fcfaf2] border border-[#ebdcb9]/50 flex items-center justify-center text-[#c4a15a] mb-1">
                <RefreshCw className="size-3 animate-spin" style={{ animationDuration: "12s" }} />
              </div>
              <h5 className="text-[9px] font-black text-[#5a4c35]">Đồng bộ Realtime</h5>
              <p className="text-[7px] font-semibold text-[#8c7e6b] mt-0.5 leading-snug">Cập nhật tức thời các thiết bị</p>
            </div>

            <div className="flex flex-col items-center px-1">
              <div className="h-6 w-6 rounded-full bg-[#fcfaf2] border border-[#ebdcb9]/50 flex items-center justify-center text-rose-400 mb-1">
                <Heart className="size-3 fill-rose-50" />
              </div>
              <h5 className="text-[9px] font-black text-[#5a4c35]">Dành cho tình yêu</h5>
              <p className="text-[7px] font-semibold text-[#8c7e6b] mt-0.5 leading-snug">Giao diện tinh tế và ấm áp</p>
            </div>
          </div>

        </section>

      </div>

    </main>
  );
}
