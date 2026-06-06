export type AppTab = "home" | "journal" | "album" | "love" | "settings";

export type ThemeMode = "pink" | "gold" | "lotus-white" | "lotus-mint" | "lotus-dark";

export type AuthMode = "login" | "register";

export type MockUser = {
  email: string;
  profile: UserProfile;
  myCode: string | null;
  connectedCode: string | null;
  loveStartDate: string | null;
};

export type AuthFormState = {
  email: string;
  password: string;
};

export type Gender = "female" | "male" | "other" | "prefer-not-to-say";

export type UserProfile = {
  avatarUrl: string;
  displayName: string;
  birthDate: string;
  gender: Gender;
};

export type UpcomingItem = {
  id: string;
  title: string;
  detail: string;
  meta: string;
  tone: "pink" | "gold" | "mint";
};
