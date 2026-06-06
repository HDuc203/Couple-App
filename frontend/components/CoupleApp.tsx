"use client";

import {
  Bell,
  BookOpen,
  Heart,
  Image as ImageIcon,
  LogOut,
  MessageCircle,
} from "lucide-react";
import { AuthScreen } from "@/components/AuthScreen";
import { BottomNavigation } from "@/components/BottomNavigation";
import { CoupleConnectOnboarding } from "@/components/CoupleConnectOnboarding";
import { HomePage } from "@/components/HomePage";
import { ProfileOnboarding } from "@/components/ProfileOnboarding";
import { SettingsPage } from "@/components/SettingsPage";
import { Sidebar } from "@/components/Sidebar";
import { navItems } from "@/components/navigationItems";
import { createInviteCode } from "@/lib/invite";
import type {
  AppTab,
  AuthFormState,
  AuthMode,
  MockUser,
  UpcomingItem,
  UserProfile,
} from "@/types/app";
import { useMemo, useState } from "react";

type OnboardingStep = "profile" | "connect" | "done";

const initialAuthForm: AuthFormState = {
  email: "",
  password: "",
};

const emptyProfile: UserProfile = {
  avatarUrl: "",
  displayName: "",
  birthDate: "",
  gender: "prefer-not-to-say",
};

const upcomingItems: UpcomingItem[] = [
  {
    id: "cycle",
    title: "Kỳ dâu sắp đến",
    detail: "Dự kiến 28 tháng 5",
    meta: "Còn 5 ngày",
    tone: "pink",
  },
  {
    id: "gift",
    title: "Quà sinh nhật nàng",
    detail: "3 món trong wishlist",
    meta: "Nhắc mua",
    tone: "gold",
  },
  {
    id: "bucket",
    title: "Bucket list",
    detail: "Đà Lạt - chưa đánh dấu",
    meta: "Kế hoạch",
    tone: "mint",
  },
];

export function CoupleApp() {
  const [authMode, setAuthMode] = useState<AuthMode>("register");
  const [authForm, setAuthForm] = useState<AuthFormState>(initialAuthForm);
  const [authError, setAuthError] = useState<string | null>(null);
  const [user, setUser] = useState<MockUser | null>(null);
  const [onboardingStep, setOnboardingStep] =
    useState<OnboardingStep>("profile");
  const [activeTab, setActiveTab] = useState<AppTab>("home");
  const [mood, setMood] = useState("Yêu");
  const [joinCode, setJoinCode] = useState("");
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const displayName = useMemo(
    () => user?.profile.displayName || "Bạn",
    [user?.profile.displayName],
  );

  function updateAuthField(field: keyof AuthFormState, value: string) {
    setAuthForm((current) => ({ ...current, [field]: value }));
  }

  function handleAuthSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const email = authForm.email.trim();
    const password = authForm.password.trim();

    if (!email || password.length < 6) {
      setAuthError("Nhập email và mật khẩu tối thiểu 6 ký tự.");
      return;
    }

    setUser({
      email,
      profile: {
        ...emptyProfile,
        displayName: email.split("@")[0] || "Bạn",
      },
      myCode: null,
      connectedCode: null,
      loveStartDate: null,
    });
    setAuthError(null);
    setOnboardingStep("profile");
    setActiveTab("home");
  }

  function handleProfileComplete(profile: UserProfile) {
    setUser((current) => (current ? { ...current, profile } : current));
    setOnboardingStep("connect");
  }

  function ensureMyCode() {
    let generatedCode = "";

    setUser((current) => {
      if (!current) {
        return current;
      }

      if (current.myCode) {
        generatedCode = current.myCode;
        return current;
      }

      generatedCode = createInviteCode();
      return { ...current, myCode: generatedCode };
    });

    return generatedCode;
  }

  function handleCreateCode() {
    ensureMyCode();
    setSettingsMessage("Đã tạo mã kết nối. Bạn có thể gửi mã này cho người ấy.");
  }

  function handleJoinCodeSubmit(event: React.FormEvent<HTMLFormElement>) {
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
    setOnboardingStep("done");
    setActiveTab("home");
  }

  function handleSkipConnect() {
    setSettingsMessage(null);
    setOnboardingStep("done");
    setActiveTab("home");
  }

  function handleLogout() {
    setUser(null);
    setAuthForm(initialAuthForm);
    setActiveTab("home");
    setMood("Yêu");
    setJoinCode("");
    setSettingsMessage(null);
    setCopied(false);
    setOnboardingStep("profile");
  }

  async function handleCopyCode() {
    if (!user?.myCode) {
      return;
    }

    await navigator.clipboard.writeText(user.myCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  function handleProfileUpdate(profile: UserProfile) {
    setUser((current) => (current ? { ...current, profile } : current));
  }

  function handleLoveStartDateChange(loveStartDate: string) {
    setUser((current) => (current ? { ...current, loveStartDate } : current));
  }

  function handleDisconnect() {
    setUser((current) =>
      current ? { ...current, connectedCode: null, loveStartDate: null } : current,
    );
    setJoinCode("");
    setSettingsMessage("Đã hủy kết nối mock.");
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

  if (onboardingStep === "profile") {
    return (
      <ProfileOnboarding
        initialProfile={user.profile}
        onComplete={handleProfileComplete}
      />
    );
  }

  if (onboardingStep === "connect") {
    return (
      <CoupleConnectOnboarding
        joinCode={joinCode}
        message={settingsMessage}
        myCode={user.myCode}
        onCreateCode={handleCreateCode}
        onJoinCodeChange={(value) => {
          setJoinCode(normalizeInviteCode(value));
          setSettingsMessage(null);
        }}
        onJoinSubmit={handleJoinCodeSubmit}
        onSkip={handleSkipConnect}
      />
    );
  }

  return (
    <main className="min-h-screen text-[var(--color-text)]">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-3 py-3 sm:px-4 lg:px-6">
        <div className="grid flex-1 gap-4 lg:min-h-[calc(100vh-2rem)] lg:grid-cols-[15rem_minmax(0,1fr)]">
          <Sidebar
            activeTab={activeTab}
            email={user.email}
            name={displayName}
            onLogout={handleLogout}
            onTabChange={setActiveTab}
          />

          <section className="min-w-0 overflow-hidden rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--app-shadow)]">
            <TopBar
              activeTab={activeTab}
              connected={Boolean(user.connectedCode)}
              name={displayName}
              onLogout={handleLogout}
            />

            {activeTab === "home" ? (
              <HomePage
                connected={Boolean(user.connectedCode)}
                daysTogether={247}
                mood={mood}
                name={displayName}
                onMoodChange={setMood}
                onOpenSettings={() => setActiveTab("settings")}
                upcomingItems={upcomingItems}
              />
            ) : null}

            {activeTab === "journal" ? (
              <PlaceholderPage
                connected={Boolean(user.connectedCode)}
                description="Khu vực viết nhật ký đôi, gắn mood và ảnh theo ngày."
                icon={BookOpen}
                title="Nhật ký chung"
              />
            ) : null}

            {activeTab === "album" ? (
              <PlaceholderPage
                connected={Boolean(user.connectedCode)}
                description="Album ký ức chung sẽ hiển thị ảnh theo tháng và địa điểm."
                icon={ImageIcon}
                title="Album chung"
              />
            ) : null}

            {activeTab === "love" ? (
              <PlaceholderPage
                connected
                description="Nơi gửi lời nhắn yêu thương, hẹn giờ gửi sau."
                icon={Heart}
                title="Tình yêu"
              />
            ) : null}

            {activeTab === "settings" ? (
              <SettingsPage
                copied={copied}
                joinCode={joinCode}
                message={settingsMessage}
                onConnect={handleJoinCodeSubmit}
                onCopy={handleCopyCode}
                onCreateCode={handleCreateCode}
                onDisconnect={handleDisconnect}
                onJoinCodeChange={(value) => {
                  setJoinCode(normalizeInviteCode(value));
                  setSettingsMessage(null);
                }}
                onLoveStartDateChange={handleLoveStartDateChange}
                onProfileUpdate={handleProfileUpdate}
                user={user}
              />
            ) : null}
          </section>
        </div>
      </div>

      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </main>
  );
}

function TopBar({
  activeTab,
  connected,
  name,
  onLogout,
}: {
  activeTab: AppTab;
  connected: boolean;
  name: string;
  onLogout: () => void;
}) {
  const title =
    activeTab === "home"
      ? "Home"
      : navItems.find((item) => item.id === activeTab)?.label ?? "Home";

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--color-border)] px-4 py-3 sm:px-5">
      <div>
        <p className="text-sm font-bold text-[var(--color-primary)]">Xin chào, {name}</p>
        <h1 className="text-2xl font-black text-[var(--color-text)]">{title}</h1>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          aria-label="Thông báo"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-primary)] transition hover:bg-[var(--color-soft)] active:scale-[0.98]"
          type="button"
        >
          <Bell className="h-4 w-4" />
        </button>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary)] text-sm font-black text-white">
          {name.trim().charAt(0).toUpperCase() || "U"}
        </div>
        <div
          className={[
            "rounded-full px-4 py-2 text-sm font-black",
            connected
              ? "bg-[var(--color-success-soft)] text-[var(--color-success)]"
              : "bg-[var(--color-primary-soft)] text-[var(--color-primary)]",
          ].join(" ")}
        >
          {connected ? "Đã kết nối" : "Chưa kết nối"}
        </div>
        <button
          className="hidden h-10 items-center gap-2 rounded-full border border-[var(--color-border)] px-4 text-sm font-black text-[var(--color-primary)] transition hover:bg-[var(--color-soft)] active:scale-[0.98] sm:flex"
          onClick={onLogout}
          type="button"
        >
          <LogOut className="h-4 w-4" />
          Đăng xuất
        </button>
      </div>
    </header>
  );
}

function PlaceholderPage({
  connected,
  description,
  icon: Icon,
  title,
}: {
  connected: boolean;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
}) {
  return (
    <div className="grid min-h-[34rem] place-items-center p-5 pb-24 lg:pb-5">
      <div className="max-w-md rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-soft)] p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-card)] text-[var(--color-primary)] shadow-sm">
          <Icon className="h-7 w-7" />
        </div>
        <h2 className="mt-5 text-3xl font-black text-[var(--color-text)]">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">{description}</p>
        <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-[var(--color-card)] px-4 py-2 text-sm font-black text-[var(--color-primary)]">
          <MessageCircle className="h-4 w-4" />
          {connected ? "Sẽ làm ở bước tiếp theo" : "Kết nối couple để mở tính năng này"}
        </div>
      </div>
    </div>
  );
}

function normalizeInviteCode(value: string) {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}
