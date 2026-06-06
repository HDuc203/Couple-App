"use client";

import {
  Bell,
  BookOpen,
  Calendar,
  CheckCircle2,
  Copy,
  Droplet,
  Gift,
  Heart,
  Home,
  Image as ImageIcon,
  Link,
  Lock,
  LogIn,
  LogOut,
  Mail,
  MapPin,
  MessageCircle,
  Settings,
  Smile,
  User,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { createInviteCode } from "@/lib/invite";

type AuthMode = "login" | "register";
type AppTab = "home" | "journal" | "album" | "love" | "settings";
type ThemeMode = "pink" | "gold";

type AuthFormState = {
  name: string;
  email: string;
  password: string;
};

type MockUser = {
  name: string;
  email: string;
  myCode: string;
  connectedCode: string | null;
};

const initialAuthForm: AuthFormState = {
  name: "",
  email: "",
  password: "",
};

const navItems: Array<{
  id: AppTab;
  label: string;
  icon: LucideIcon;
}> = [
  { id: "home", label: "Home", icon: Home },
  { id: "journal", label: "Nhật ký", icon: BookOpen },
  { id: "album", label: "Album", icon: ImageIcon },
  { id: "love", label: "Tình yêu", icon: Heart },
  { id: "settings", label: "Cài đặt", icon: Settings },
];

const upcomingItems = [
  {
    icon: Droplet,
    tone: "rose",
    title: "Kỳ dâu sắp đến",
    detail: "Dự kiến 28 tháng 5",
    meta: "Còn 5 ngày",
  },
  {
    icon: Gift,
    tone: "amber",
    title: "Quà sinh nhật nàng",
    detail: "3 món trong wishlist",
    meta: "Nhắc mua",
  },
  {
    icon: MapPin,
    tone: "mint",
    title: "Bucket list",
    detail: "Đà Lạt - chưa đánh dấu",
    meta: "Kế hoạch",
  },
] as const;

const moodItems = ["Vui", "Yêu", "Mệt", "Nhớ"];

export function PartOneInviteFlow() {
  const [authMode, setAuthMode] = useState<AuthMode>("register");
  const [authForm, setAuthForm] = useState<AuthFormState>(initialAuthForm);
  const [authError, setAuthError] = useState<string | null>(null);
  const [user, setUser] = useState<MockUser | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>("home");
  const [themeMode, setThemeMode] = useState<ThemeMode>("pink");
  const [joinCode, setJoinCode] = useState("");
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const daysTogether = 247;
  const loverName = useMemo(() => user?.name || "Minh", [user]);

  function updateAuthField(field: keyof AuthFormState, value: string) {
    setAuthForm((current) => ({ ...current, [field]: value }));
  }

  function handleAuthSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = authForm.name.trim();
    const email = authForm.email.trim();
    const password = authForm.password.trim();

    if (!email || password.length < 6) {
      setAuthError("Nhập email và mật khẩu tối thiểu 6 ký tự.");
      return;
    }

    if (authMode === "register" && !name) {
      setAuthError("Nhập tên hiển thị để tạo tài khoản.");
      return;
    }

    setUser({
      name: name || email.split("@")[0] || "Ban",
      email,
      myCode: createInviteCode(),
      connectedCode: null,
    });
    setAuthError(null);
    setActiveTab("home");
  }

  function handleLogout() {
    setUser(null);
    setAuthForm(initialAuthForm);
    setJoinCode("");
    setSettingsMessage(null);
    setCopied(false);
    setActiveTab("home");
  }

  async function handleCopyCode() {
    if (!user) {
      return;
    }

    await navigator.clipboard.writeText(user.myCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  function handleConnectCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      return;
    }

    const normalizedCode = normalizeInviteCode(joinCode);

    if (normalizedCode.length !== 8) {
      setSettingsMessage("Mã kết nối cần đúng 8 ký tự.");
      return;
    }

    if (normalizedCode === user.myCode) {
      setSettingsMessage("Đây là mã của bạn. Hãy nhập mã của người ấy.");
      return;
    }

    setUser({ ...user, connectedCode: normalizedCode });
    setJoinCode(normalizedCode);
    setSettingsMessage("Đã kết nối mock thành công.");
  }

  if (!user) {
    return (
      <AuthScreen
        authError={authError}
        authForm={authForm}
        authMode={authMode}
        onFieldChange={updateAuthField}
        onModeChange={(mode) => {
          setAuthMode(mode);
          setAuthError(null);
        }}
        onSubmit={handleAuthSubmit}
      />
    );
  }

  return (
    <main
      className={[
        "min-h-screen text-[#3c2a2f] transition-colors",
        themeMode === "pink" ? "bg-[#fff9f3]" : "bg-[#fff8e8]",
      ].join(" ")}
    >
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 lg:px-6">
        <div className="grid flex-1 gap-4 lg:min-h-[calc(100vh-2rem)] lg:grid-cols-[15rem_minmax(0,1fr)]">
          <Sidebar
            activeTab={activeTab}
            email={user.email}
            name={loverName}
            onLogout={handleLogout}
            onTabChange={setActiveTab}
            onThemeChange={setThemeMode}
            themeMode={themeMode}
          />

          <section className="min-w-0 overflow-hidden rounded-[2rem] border border-[#edd0d8] bg-[#fffdfb] shadow-2xl shadow-[#8f3153]/10">
            <TopBar
              activeTab={activeTab}
              connected={Boolean(user.connectedCode)}
              name={loverName}
              onThemeChange={setThemeMode}
              themeMode={themeMode}
            />

            <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_22rem]">
              <div className="min-w-0 border-b border-[#efd8de] xl:border-b-0 xl:border-r">
                {activeTab === "home" ? (
                  <HomeDashboard
                    daysTogether={daysTogether}
                    name={loverName}
                    onOpenSettings={() => setActiveTab("settings")}
                  />
                ) : null}

                {activeTab === "journal" ? <JournalView /> : null}
                {activeTab === "album" ? <AlbumView /> : null}
                {activeTab === "love" ? <LoveNotesView /> : null}
                {activeTab === "settings" ? (
                  <SettingsView
                    copied={copied}
                    joinCode={joinCode}
                    message={settingsMessage}
                    onConnect={handleConnectCode}
                    onCopy={handleCopyCode}
                    onJoinCodeChange={(value) => {
                      setJoinCode(normalizeInviteCode(value));
                      setSettingsMessage(null);
                    }}
                    user={user}
                  />
                ) : null}
              </div>

              <RightPanel
                connectedCode={user.connectedCode}
                myCode={user.myCode}
                onOpenSettings={() => setActiveTab("settings")}
              />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function AuthScreen({
  authError,
  authForm,
  authMode,
  onFieldChange,
  onModeChange,
  onSubmit,
}: {
  authError: string | null;
  authForm: AuthFormState;
  authMode: AuthMode;
  onFieldChange: (field: keyof AuthFormState, value: string) => void;
  onModeChange: (mode: AuthMode) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fff9f3] px-4 py-8 text-[#3c2a2f]">
      <section className="grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-[#edd0d8] bg-white shadow-2xl shadow-[#8f3153]/10 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative min-h-[34rem] overflow-hidden bg-[#fdf6ef] p-8">
          <LotusScene />
          <div className="relative z-10 flex h-full flex-col justify-between">
            <div>
              <p className="text-sm font-black uppercase text-[#a3496d]">
                Couple App
              </p>
              <h1 className="mt-5 max-w-xl text-5xl font-black leading-[1.02] text-[#3c2a2f]">
                Yêu nhau mỗi ngày, gọn trong một nơi.
              </h1>
              <p className="mt-5 max-w-lg text-base leading-7 text-[#8b6571]">
                Đăng ký hoặc đăng nhập trước. Mã kết nối với người ấy sẽ nằm
                trong phần Cài đặt của app.
              </p>
            </div>

            <div className="grid gap-3 rounded-3xl border border-[#f0d6de] bg-white/80 p-4 backdrop-blur">
              <MiniStat label="Ngày bên nhau" value="247" />
              <MiniStat label="Sắp tới" value="Kỳ dâu sắp đến" />
              <MiniStat label="Kết nối" value="Nhập mã trong Cài đặt" />
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-[#f9eef2] p-1">
            <ModeButton
              active={authMode === "register"}
              icon={UserPlus}
              label="Đăng ký"
              onClick={() => onModeChange("register")}
            />
            <ModeButton
              active={authMode === "login"}
              icon={LogIn}
              label="Đăng nhập"
              onClick={() => onModeChange("login")}
            />
          </div>

          <form className="mt-7 grid gap-4" onSubmit={onSubmit}>
            {authMode === "register" ? (
              <FormField
                icon={User}
                label="Tên hiển thị"
                onChange={(value) => onFieldChange("name", value)}
                placeholder="VD: Minh"
                value={authForm.name}
              />
            ) : null}

            <FormField
              icon={Mail}
              label="Email"
              onChange={(value) => onFieldChange("email", value)}
              placeholder="you@example.com"
              type="email"
              value={authForm.email}
            />

            <FormField
              icon={Lock}
              label="Mật khẩu"
              onChange={(value) => onFieldChange("password", value)}
              placeholder="Tối thiểu 6 ký tự"
              type="password"
              value={authForm.password}
            />

            {authError ? <ErrorMessage>{authError}</ErrorMessage> : null}

            <button
              className="mt-2 rounded-2xl bg-[#87415f] px-5 py-4 text-base font-black text-white shadow-lg shadow-[#87415f]/20 transition hover:bg-[#73324f]"
              type="submit"
            >
              {authMode === "register" ? "Tạo tài khoản" : "Vào app"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

function Sidebar({
  activeTab,
  email,
  name,
  onLogout,
  onTabChange,
  onThemeChange,
  themeMode,
}: {
  activeTab: AppTab;
  email: string;
  name: string;
  onLogout: () => void;
  onTabChange: (tab: AppTab) => void;
  onThemeChange: (theme: ThemeMode) => void;
  themeMode: ThemeMode;
}) {
  return (
    <aside className="flex flex-col gap-4 rounded-[2rem] border border-[#edd0d8] bg-white p-4 shadow-xl shadow-[#8f3153]/10 lg:sticky lg:top-4 lg:min-h-[calc(100vh-2rem)]">
      <div className="rounded-3xl bg-[#fff5f8] p-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#a3496d] shadow-sm">
          <Heart className="h-6 w-6" />
        </div>
        <p className="mt-4 text-lg font-black text-[#3c2a2f]">Couple App</p>
        <p className="mt-1 truncate text-sm text-[#8b6571]">{email}</p>
      </div>

      <nav className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-1">
        {navItems.map((item) => (
          <button
            className={[
              "flex h-12 items-center gap-3 rounded-2xl px-3 text-left text-sm font-black transition",
              activeTab === item.id
                ? "bg-[#87415f] text-white shadow-lg shadow-[#87415f]/20"
                : "text-[#8b6571] hover:bg-[#fff5f8] hover:text-[#3c2a2f]",
            ].join(" ")}
            key={item.id}
            onClick={() => onTabChange(item.id)}
            type="button"
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="rounded-3xl border border-[#edd0d8] bg-[#fffdfb] p-3">
        <p className="px-1 text-xs font-black uppercase tracking-[0.14em] text-[#bb7891]">
          Theme
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <ThemeButton
            active={themeMode === "pink"}
            label="Hồng"
            onClick={() => onThemeChange("pink")}
            tone="pink"
          />
          <ThemeButton
            active={themeMode === "gold"}
            label="Vàng"
            onClick={() => onThemeChange("gold")}
            tone="gold"
          />
        </div>
      </div>

      <div className="mt-auto rounded-3xl border border-[#edd0d8] bg-[#fffdfb] p-4">
        <p className="text-sm font-black text-[#3c2a2f]">{name}</p>
        <p className="mt-1 text-xs leading-5 text-[#8b6571]">
          Mock mode, dữ liệu đang nằm trên frontend.
        </p>
        <button
          className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-2xl border border-[#edd0d8] text-sm font-black text-[#87415f] transition hover:bg-[#fff5f8]"
          onClick={onLogout}
          type="button"
        >
          <LogOut className="h-4 w-4" />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}

function TopBar({
  activeTab,
  connected,
  name,
  onThemeChange,
  themeMode,
}: {
  activeTab: AppTab;
  connected: boolean;
  name: string;
  onThemeChange: (theme: ThemeMode) => void;
  themeMode: ThemeMode;
}) {
  const title =
    activeTab === "home"
      ? "Home"
      : (navItems.find((item) => item.id === activeTab)?.label ?? "Home");

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#efd8de] px-4 py-3 sm:px-5">
      <div>
        <p className="text-sm font-bold text-[#a3496d]">Xin chào, {name}</p>
        <h1 className="text-2xl font-black text-[#3c2a2f]">{title}</h1>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <div className="hidden items-center gap-1 rounded-full bg-[#fff5f8] p-1 sm:flex">
          <span className="pl-3 pr-1 text-xs font-black uppercase tracking-[0.12em] text-[#bb7891]">
            Theme
          </span>
          <ThemePill
            active={themeMode === "pink"}
            label="Hồng"
            onClick={() => onThemeChange("pink")}
          />
          <ThemePill
            active={themeMode === "gold"}
            label="Vàng"
            onClick={() => onThemeChange("gold")}
          />
        </div>
        <button
          aria-label="Thông báo"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-[#efd8de] bg-white text-[#87415f] transition hover:bg-[#fff5f8]"
          type="button"
        >
          <Bell className="h-4 w-4" />
        </button>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#87415f] text-sm font-black text-white">
          {name.trim().charAt(0).toUpperCase() || "U"}
        </div>
        <div
          className={[
            "rounded-full px-4 py-2 text-sm font-black",
            connected
              ? "bg-[#e7f8ed] text-[#217849]"
              : "bg-[#fff5f8] text-[#a3496d]",
          ].join(" ")}
        >
          {connected ? "Đã kết nối" : "Chưa kết nối"}
        </div>
      </div>
    </header>
  );
}

function HomeDashboard({
  daysTogether,
  name,
  onOpenSettings,
}: {
  daysTogether: number;
  name: string;
  onOpenSettings: () => void;
}) {
  return (
    <div className="grid gap-4 p-4 sm:p-5">
      <section className="relative overflow-hidden rounded-[2rem] border border-[#f0d6de] bg-[#fffbf8] px-4 py-5 sm:px-5">
        <LotusScene compact />
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-3 flex w-fit items-center justify-center -space-x-2">
            <AvatarBubble label={name} />
            <AvatarBubble label="Người ấy" muted />
          </div>
          <p className="text-sm font-black uppercase text-[#bb7891]">
            {name} và người ấy
          </p>
          <p className="mt-2 text-6xl font-black leading-none text-[#87415f] sm:text-7xl">
            {daysTogether}
          </p>
          <p className="mt-2 text-sm font-black uppercase text-[#9b7a83]">
            ngày bên nhau
          </p>
          <p className="mt-2 text-sm font-semibold italic text-[#c07a96]">
            "Mình cứ dịu dàng với nhau thêm một ngày nữa."
          </p>
          <p className="mt-1 text-sm font-semibold italic text-[#c07a96]">
            sinh nhật nàng còn 12 ngày
          </p>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-[1.5rem] border border-[#f0d6de] bg-white p-5">
          <SectionTitle title="Tâm trạng hôm nay" />
          <div className="mt-4 flex flex-wrap gap-2">
            {moodItems.map((mood, index) => (
              <button
                className={[
                  "rounded-2xl border px-4 py-2 text-sm font-bold transition",
                  index === 1
                    ? "border-[#d596aa] bg-[#f6dbe6] text-[#87415f]"
                    : "border-[#efd8de] bg-[#fff7fa] text-[#a3637c]",
                ].join(" ")}
                key={mood}
                type="button"
              >
                {mood}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-[#f0d6de] bg-white p-5">
          <SectionTitle title="Lời nhắn mới" />
          <div className="mt-4 rounded-2xl bg-[#fff5f8] p-4">
            <p className="text-sm font-semibold leading-6 text-[#6f4b58]">
              Hôm nay mình vẫn chọn nhau. Nhớ uống nước và nghỉ sớm nhé.
            </p>
          </div>
        </div>
      </section>

      <section>
        <SectionTitle title="Sắp tới" />
        <div className="mt-4 grid items-stretch gap-4 md:grid-cols-3">
          {upcomingItems.map((item) => (
            <UpcomingCard item={item} key={item.title} />
          ))}
        </div>
      </section>

      <button
        className="rounded-2xl border border-[#efd8de] bg-white px-5 py-4 text-sm font-black text-[#87415f] transition hover:bg-[#fff5f8]"
        onClick={onOpenSettings}
        type="button"
      >
        Nhập mã mời trong Cài đặt
      </button>
    </div>
  );
}

function SettingsView({
  copied,
  joinCode,
  message,
  onConnect,
  onCopy,
  onJoinCodeChange,
  user,
}: {
  copied: boolean;
  joinCode: string;
  message: string | null;
  onConnect: (event: React.FormEvent<HTMLFormElement>) => void;
  onCopy: () => void;
  onJoinCodeChange: (value: string) => void;
  user: MockUser;
}) {
  return (
    <div className="grid gap-5 p-5">
      <section className="rounded-[2rem] border border-[#f0d6de] bg-[#fff5f8] p-5">
        <SectionTitle title="Kết nối couple" />
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#8b6571]">
          Mỗi người có một mã riêng sau khi đăng nhập. Gửi mã của bạn cho người
          ấy, hoặc nhập mã người ấy vào ô bên dưới để kết nối.
        </p>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-[2rem] border border-[#f0d6de] bg-white p-5">
          <p className="text-sm font-black uppercase text-[#a3496d]">
            Mã của tôi
          </p>
          <code className="mt-4 block rounded-3xl border border-[#efd8de] bg-[#fffdfb] px-5 py-5 text-center text-4xl font-black tracking-[0.22em] text-[#87415f]">
            {user.myCode}
          </code>
          <button
            className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#87415f] text-sm font-black text-white transition hover:bg-[#73324f]"
            onClick={onCopy}
            type="button"
          >
            <Copy className="h-4 w-4" />
            {copied ? "Đã copy" : "Copy mã"}
          </button>
        </section>

        <section className="rounded-[2rem] border border-[#d4eadf] bg-white p-5">
          <p className="text-sm font-black uppercase text-[#217849]">
            Nhập mã người ấy
          </p>
          <form className="mt-4 grid gap-3" onSubmit={onConnect}>
            <input
              className="h-14 rounded-2xl border border-[#d4eadf] bg-[#fbfffd] px-4 text-center text-xl font-black uppercase tracking-[0.22em] text-[#217849] outline-none transition placeholder:text-[#9ab8a7] focus:border-[#50b77a] focus:ring-4 focus:ring-[#dff5e9]"
              maxLength={8}
              onChange={(event) => onJoinCodeChange(event.target.value)}
              placeholder="NHAPMA"
              value={joinCode}
            />
            <button
              className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#217849] text-sm font-black text-white transition hover:bg-[#17633b]"
              type="submit"
            >
              <Link className="h-4 w-4" />
              Kết nối
            </button>
          </form>

          {message ? (
            <p className="mt-4 rounded-2xl bg-[#eefaf3] px-4 py-3 text-sm font-bold text-[#217849]">
              {message}
            </p>
          ) : null}

          {user.connectedCode ? (
            <div className="mt-4 flex items-center gap-2 rounded-2xl border border-[#d4eadf] bg-[#fbfffd] px-4 py-3 text-sm font-bold text-[#217849]">
              <CheckCircle2 className="h-4 w-4" />
              Đang kết nối với mã {user.connectedCode}
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}

function RightPanel({
  connectedCode,
  myCode,
  onOpenSettings,
}: {
  connectedCode: string | null;
  myCode: string;
  onOpenSettings: () => void;
}) {
  return (
    <aside className="grid content-start gap-4 p-4 sm:p-5">
      <section className="rounded-[2rem] border border-[#f0d6de] bg-[#fff9fb] p-5">
        <p className="text-sm font-black uppercase text-[#a3496d]">Kết nối</p>
        <p className="mt-3 text-3xl font-black text-[#3c2a2f]">
          {connectedCode ? "Đã thành đôi" : "Chưa thành đôi"}
        </p>
        <p className="mt-2 text-sm leading-6 text-[#8b6571]">
          {connectedCode
            ? "Hai bạn đã có mã kết nối trong demo."
            : "Nhập mã mời của người ấy để đồng bộ không gian chung."}
        </p>
        <p className="mt-3 text-sm leading-6 text-[#8b6571]">
          Mã của tôi:{" "}
          <span className="font-black text-[#87415f]">{myCode}</span>
        </p>
        <button
          className="mt-4 h-11 w-full rounded-2xl bg-[#87415f] text-sm font-black text-white transition hover:bg-[#73324f]"
          onClick={onOpenSettings}
          type="button"
        >
          {connectedCode ? "Xem kết nối" : "Nhập mã mời"}
        </button>
      </section>

      <section className="rounded-[2rem] border border-[#f0d6de] bg-white p-5">
        <SectionTitle title="Hôm nay" />
        <div className="mt-4 grid gap-3">
          <SideRow icon={Smile} label="Mood" value="Yêu" />
          <SideRow icon={Calendar} label="Kỷ niệm" value="247 ngày" />
          <SideRow icon={MessageCircle} label="Tình yêu" value="1 lời nhắn" />
        </div>
      </section>
    </aside>
  );
}

function JournalView() {
  return (
    <PlaceholderView
      description="Khu vực viết nhật ký đôi, gắn mood và ảnh theo ngày."
      icon={BookOpen}
      title="Nhật ký"
    />
  );
}

function AlbumView() {
  return (
    <PlaceholderView
      description="Album ký ức sẽ hiển thị ảnh theo tháng và địa điểm."
      icon={ImageIcon}
      title="Album"
    />
  );
}

function LoveNotesView() {
  return (
    <PlaceholderView
      description="Nơi gửi lời nhắn yêu thương, hẹn giờ gửi sau."
      icon={Heart}
      title="Tình yêu"
    />
  );
}

function PlaceholderView({
  description,
  icon: Icon,
  title,
}: {
  description: string;
  icon: LucideIcon;
  title: string;
}) {
  return (
    <div className="grid min-h-[34rem] place-items-center p-5">
      <div className="max-w-md rounded-[2rem] border border-[#f0d6de] bg-[#fff9fb] p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#87415f] shadow-sm">
          <Icon className="h-7 w-7" />
        </div>
        <h2 className="mt-5 text-3xl font-black text-[#3c2a2f]">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-[#8b6571]">{description}</p>
      </div>
    </div>
  );
}

function ModeButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={[
        "flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-black transition",
        active ? "bg-white text-[#87415f] shadow-sm" : "text-[#8b6571]",
      ].join(" ")}
      onClick={onClick}
      type="button"
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function ThemeButton({
  active,
  label,
  onClick,
  tone,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  tone: ThemeMode;
}) {
  const swatchClass = tone === "pink" ? "bg-[#d96f93]" : "bg-[#d6a63f]";

  return (
    <button
      className={[
        "flex h-10 items-center justify-center gap-2 rounded-2xl border text-xs font-black transition",
        active
          ? "border-[#c97994] bg-[#fff5f8] text-[#87415f]"
          : "border-[#efd8de] bg-white text-[#8b6571] hover:bg-[#fff9fb]",
      ].join(" ")}
      onClick={onClick}
      type="button"
    >
      <span className={["h-3 w-3 rounded-full", swatchClass].join(" ")} />
      {label}
    </button>
  );
}

function ThemePill({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={[
        "rounded-full px-3 py-1.5 text-xs font-black transition",
        active ? "bg-white text-[#87415f] shadow-sm" : "text-[#8b6571]",
      ].join(" ")}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function AvatarBubble({
  label,
  muted = false,
}: {
  label: string;
  muted?: boolean;
}) {
  return (
    <div
      className={[
        "flex h-11 w-11 items-center justify-center rounded-full border-2 border-white text-sm font-black shadow-sm",
        muted ? "bg-[#f7e8ef] text-[#a66f83]" : "bg-[#87415f] text-white",
      ].join(" ")}
    >
      {label.trim().charAt(0).toUpperCase() || "U"}
    </div>
  );
}

function FormField({
  icon: Icon,
  label,
  onChange,
  placeholder,
  type = "text",
  value,
}: {
  icon: LucideIcon;
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: "email" | "password" | "text";
  value: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-black text-[#6f4b58]">{label}</span>
      <span className="flex h-14 items-center gap-3 rounded-2xl border border-[#efd8de] bg-[#fffdfb] px-4 transition focus-within:border-[#c97994] focus-within:ring-4 focus-within:ring-[#f6dbe6]">
        <Icon className="h-5 w-5 text-[#bb7891]" />
        <input
          className="h-full min-w-0 flex-1 bg-transparent text-base text-[#3c2a2f] outline-none placeholder:text-[#b89aa3]"
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          type={type}
          value={value}
        />
      </span>
    </label>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <h2 className="text-sm font-black uppercase tracking-[0.14em] text-[#bb7891]">
      {title}
    </h2>
  );
}

function UpcomingCard({ item }: { item: (typeof upcomingItems)[number] }) {
  const Icon = item.icon;
  const iconClass =
    item.tone === "rose"
      ? "bg-[#fff0f5] text-[#c45d82]"
      : item.tone === "amber"
        ? "bg-[#fff7dd] text-[#b17416]"
        : "bg-[#e9f8f0] text-[#2f9460]";

  return (
    <article className="h-full min-h-[8.75rem] rounded-[1.5rem] border border-[#f0d6de] bg-white p-4">
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
          <h3 className="font-black text-[#6f4b58]">{item.title}</h3>
          <p className="mt-1 text-sm font-semibold italic text-[#b48292]">
            {item.detail}
          </p>
          <span className="mt-auto inline-flex rounded-full border border-[#efd8de] bg-[#fff7fa] px-3 py-1 text-xs font-black text-[#a3496d]">
            {item.meta}
          </span>
        </div>
      </div>
    </article>
  );
}

function SideRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#fff9fb] px-4 py-3">
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4 text-[#a3496d]" />
        <span className="text-sm font-bold text-[#8b6571]">{label}</span>
      </div>
      <span className="text-sm font-black text-[#3c2a2f]">{value}</span>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm font-bold text-[#8b6571]">{label}</span>
      <span className="text-sm font-black text-[#3c2a2f]">{value}</span>
    </div>
  );
}

function ErrorMessage({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-2xl border border-[#f0c3d0] bg-[#fff0f5] px-4 py-3 text-sm font-bold text-[#a3496d]">
      {children}
    </p>
  );
}

function LotusScene({ compact = false }: { compact?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={[
        "pointer-events-none absolute inset-0 overflow-hidden",
        compact ? "opacity-80" : "opacity-100",
      ].join(" ")}
    >
      <div className="absolute left-[8%] top-[14%] h-24 w-24 rounded-full bg-[#cfe8d9]" />
      <div className="absolute right-[7%] top-[18%] h-20 w-24 rounded-full bg-[#cfe8d9]" />
      <div className="absolute left-[12%] top-[9%] h-20 w-px rotate-12 bg-[#97b49c]" />
      <div className="absolute right-[14%] top-[11%] h-20 w-px -rotate-12 bg-[#97b49c]" />
      <div className="absolute left-[10%] top-[7%] h-9 w-9 rounded-full bg-[#f4bfd0]" />
      <div className="absolute right-[12%] top-[8%] h-9 w-9 rounded-full bg-[#f4bfd0]" />
      <div className="absolute left-1/2 top-[19%] h-14 w-48 -translate-x-1/2 rounded-full bg-[#eef8f2]" />
      <div className="absolute left-[34%] top-[15%] h-7 w-4 -rotate-12 rounded-full bg-[#f6dbe6]" />
      <div className="absolute right-[35%] top-[16%] h-7 w-4 rotate-12 rounded-full bg-[#f6dbe6]" />
    </div>
  );
}

function normalizeInviteCode(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}
