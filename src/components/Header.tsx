import { BarChart3, CalendarDays, MapPinned, Plus, ReceiptText, Ticket } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { AppTheme } from "../types/theme";
import { AuthPanel } from "./AuthPanel";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeSwitcher } from "./ThemeSwitcher";

export type AppView = "events" | "timeline" | "venues" | "statistics" | "tickets" | "add";

interface HeaderProps {
  activeView: AppView;
  totalEvents: number;
  theme: AppTheme;
  onNavigate: (view: AppView) => void;
  onThemeChange: (theme: AppTheme) => void;
}

const navItems: Array<{ view: AppView; labelKey: string; icon: LucideIcon }> = [
  { view: "events", labelKey: "nav.events", icon: Ticket },
  { view: "timeline", labelKey: "nav.timeline", icon: CalendarDays },
  { view: "venues", labelKey: "nav.venues", icon: MapPinned },
  { view: "statistics", labelKey: "nav.statistics", icon: BarChart3 },
  { view: "tickets", labelKey: "nav.tickets", icon: ReceiptText },
  { view: "add", labelKey: "nav.add", icon: Plus },
];

export function Header({
  activeView,
  totalEvents,
  theme,
  onNavigate,
  onThemeChange,
}: HeaderProps) {
  const { t } = useTranslation();

  return (
    <header className="site-header">
      <div className="site-header__brand">
        <span className="brand-mark">SL</span>
        <div>
          <h1>StageLog JP</h1>
          <p>{t("app.subtitle", { count: totalEvents })}</p>
        </div>
      </div>
      <nav className="site-nav" aria-label="Primary navigation">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <button
              className={activeView === item.view ? "is-active" : undefined}
              key={item.view}
              type="button"
              onClick={() => onNavigate(item.view)}
            >
              <Icon size={17} aria-hidden="true" />
              {t(item.labelKey)}
            </button>
          );
        })}
      </nav>
      <div className="header-controls">
        <AuthPanel />
        <ThemeSwitcher theme={theme} onThemeChange={onThemeChange} />
        <LanguageSwitcher />
      </div>
    </header>
  );
}
