import { BarChart3, CalendarDays, MapPinned, Plus, ReceiptText, Ticket } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { AppTheme } from "../types/theme";
import { ThemeSwitcher } from "./ThemeSwitcher";

export type AppView = "events" | "timeline" | "venues" | "statistics" | "tickets" | "add";

interface HeaderProps {
  activeView: AppView;
  totalEvents: number;
  theme: AppTheme;
  onNavigate: (view: AppView) => void;
  onThemeChange: (theme: AppTheme) => void;
}

const navItems: Array<{ view: AppView; label: string; icon: LucideIcon }> = [
  { view: "events", label: "Events", icon: Ticket },
  { view: "timeline", label: "Timeline", icon: CalendarDays },
  { view: "venues", label: "Venues", icon: MapPinned },
  { view: "statistics", label: "Statistics", icon: BarChart3 },
  { view: "tickets", label: "Tickets", icon: ReceiptText },
  { view: "add", label: "Add Event", icon: Plus },
];

export function Header({
  activeView,
  totalEvents,
  theme,
  onNavigate,
  onThemeChange,
}: HeaderProps) {
  return (
    <header className="site-header">
      <div className="site-header__brand">
        <span className="brand-mark">SL</span>
        <div>
          <h1>StageLog JP</h1>
          <p>{totalEvents} saved live records</p>
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
              {item.label}
            </button>
          );
        })}
      </nav>
      <ThemeSwitcher theme={theme} onThemeChange={onThemeChange} />
    </header>
  );
}
