import type { AppTheme } from "./theme";

export type AppLanguage = "en" | "zh";

export interface UserProfile {
  id: string;
  email?: string;
  displayName?: string;
  username?: string;
  homeRegion?: string;
  language: AppLanguage;
  theme: AppTheme;
  avatarUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}
