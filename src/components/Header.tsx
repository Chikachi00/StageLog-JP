import { BarChart3, Plus, Ticket } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type AppView = "events" | "statistics" | "add";

interface HeaderProps {
  activeView: AppView;
  totalEvents: number;
  onNavigate: (view: AppView) => void;
}

const navItems: Array<{ view: AppView; label: string; icon: LucideIcon }> = [
  { view: "events", label: "Events", icon: Ticket },
  { view: "statistics", label: "Statistics", icon: BarChart3 },
  { view: "add", label: "Add Event", icon: Plus },
];

export function Header({ activeView, totalEvents, onNavigate }: HeaderProps) {
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
    </header>
  );
}
