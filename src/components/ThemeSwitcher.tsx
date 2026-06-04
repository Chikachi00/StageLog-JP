import type { AppTheme } from "../types/theme";

interface ThemeSwitcherProps {
  theme: AppTheme;
  onThemeChange: (theme: AppTheme) => void;
}

const themes: Array<{ id: AppTheme; label: string }> = [
  { id: "sakura", label: "Sakura" },
  { id: "ocean", label: "Ocean" },
  { id: "night", label: "Night" },
  { id: "classic", label: "Classic" },
];

export function ThemeSwitcher({ theme, onThemeChange }: ThemeSwitcherProps) {
  return (
    <div className="theme-switcher" aria-label="Theme switcher">
      {themes.map((item) => (
        <button
          className={theme === item.id ? "is-active" : undefined}
          key={item.id}
          type="button"
          onClick={() => onThemeChange(item.id)}
        >
          <span className={`theme-dot theme-dot--${item.id}`} aria-hidden="true" />
          {item.label}
        </button>
      ))}
    </div>
  );
}
