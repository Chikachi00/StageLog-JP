export type AppTheme = "sakura" | "ocean" | "night" | "classic";

export const THEME_STORAGE_KEY = "stagelog-theme";

export const isAppTheme = (value: string | null): value is AppTheme =>
  value === "sakura" || value === "ocean" || value === "night" || value === "classic";
