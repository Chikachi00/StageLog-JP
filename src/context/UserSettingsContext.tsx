import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { LANGUAGE_STORAGE_KEY } from "../i18n";
import { getProfile, updateProfile, upsertProfile } from "../services/profileService";
import type { AppLanguage, UserProfile } from "../types/profile";
import type { AppTheme } from "../types/theme";
import { isAppTheme, THEME_STORAGE_KEY } from "../types/theme";
import { useAuth } from "./AuthContext";

interface UserSettingsContextValue {
  profile: UserProfile | null;
  profileLoading: boolean;
  profileError: string;
  theme: AppTheme;
  language: AppLanguage;
  updateThemeSetting: (theme: AppTheme) => Promise<void>;
  updateLanguageSetting: (language: AppLanguage) => Promise<void>;
  saveProfile: (updates: Pick<UserProfile, "displayName" | "username" | "homeRegion">) => Promise<void>;
  reloadProfile: () => Promise<void>;
}

const UserSettingsContext = createContext<UserSettingsContextValue | undefined>(undefined);

const getLocalTheme = (): AppTheme => {
  if (typeof window === "undefined") {
    return "sakura";
  }

  const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  return isAppTheme(savedTheme) ? savedTheme : "sakura";
};

const getLocalLanguage = (): AppLanguage => {
  if (typeof window === "undefined") {
    return "en";
  }

  const savedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return savedLanguage === "zh" ? "zh" : "en";
};

const setLocalTheme = (theme: AppTheme) => {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }
};

const setLocalLanguage = (language: AppLanguage) => {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }
};

export function UserSettingsProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();
  const { user, loading: authLoading, isSupabaseConfigured } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [theme, setTheme] = useState<AppTheme>(() => getLocalTheme());
  const [language, setLanguage] = useState<AppLanguage>(() => getLocalLanguage());

  const applyLanguage = useCallback(
    (nextLanguage: AppLanguage) => {
      setLanguage(nextLanguage);
      setLocalLanguage(nextLanguage);
      void i18n.changeLanguage(nextLanguage);
    },
    [i18n],
  );

  const applyTheme = useCallback((nextTheme: AppTheme) => {
    setTheme(nextTheme);
    setLocalTheme(nextTheme);
  }, []);

  const reloadProfile = useCallback(async () => {
    if (authLoading) {
      return;
    }

    if (!user || !isSupabaseConfigured) {
      setProfile(null);
      setProfileLoading(false);
      setProfileError("");
      applyTheme(getLocalTheme());
      applyLanguage(getLocalLanguage());
      return;
    }

    setProfileLoading(true);
    setProfileError("");

    try {
      const existingProfile = await getProfile(user.id);
      const nextProfile =
        existingProfile ??
        (await upsertProfile({
          id: user.id,
          email: user.email ?? undefined,
          language: getLocalLanguage(),
          theme: getLocalTheme(),
        }));

      setProfile(nextProfile);
      applyTheme(nextProfile.theme);
      applyLanguage(nextProfile.language);
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "Failed to load profile.");
    } finally {
      setProfileLoading(false);
    }
  }, [applyLanguage, applyTheme, authLoading, isSupabaseConfigured, user]);

  useEffect(() => {
    void reloadProfile();
  }, [reloadProfile]);

  const updateThemeSetting = useCallback(
    async (nextTheme: AppTheme) => {
      applyTheme(nextTheme);

      if (user && isSupabaseConfigured) {
        try {
          const updatedProfile = await updateProfile(user.id, { theme: nextTheme });
          setProfile(updatedProfile);
          setProfileError("");
        } catch (error) {
          setProfileError(error instanceof Error ? error.message : "Failed to save profile.");
        }
      }
    },
    [applyTheme, isSupabaseConfigured, user],
  );

  const updateLanguageSetting = useCallback(
    async (nextLanguage: AppLanguage) => {
      applyLanguage(nextLanguage);

      if (user && isSupabaseConfigured) {
        try {
          const updatedProfile = await updateProfile(user.id, { language: nextLanguage });
          setProfile(updatedProfile);
          setProfileError("");
        } catch (error) {
          setProfileError(error instanceof Error ? error.message : "Failed to save profile.");
        }
      }
    },
    [applyLanguage, isSupabaseConfigured, user],
  );

  const saveProfile = useCallback(
    async (updates: Pick<UserProfile, "displayName" | "username" | "homeRegion">) => {
      if (!user || !isSupabaseConfigured) {
        return;
      }

      const updatedProfile = await updateProfile(user.id, {
        ...updates,
        email: user.email ?? profile?.email,
      });
      setProfile(updatedProfile);
      setProfileError("");
    },
    [isSupabaseConfigured, profile?.email, user],
  );

  const value = useMemo<UserSettingsContextValue>(
    () => ({
      profile,
      profileLoading,
      profileError,
      theme,
      language,
      updateThemeSetting,
      updateLanguageSetting,
      saveProfile,
      reloadProfile,
    }),
    [
      language,
      profile,
      profileError,
      profileLoading,
      reloadProfile,
      saveProfile,
      theme,
      updateLanguageSetting,
      updateThemeSetting,
    ],
  );

  return <UserSettingsContext.Provider value={value}>{children}</UserSettingsContext.Provider>;
}

export function useUserSettings() {
  const value = useContext(UserSettingsContext);

  if (!value) {
    throw new Error("useUserSettings must be used inside UserSettingsProvider.");
  }

  return value;
}
