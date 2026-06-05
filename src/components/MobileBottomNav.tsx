import { BarChart3, CalendarDays, MapPinned, ReceiptText, Ticket } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { AppView } from "./Header";

const mobileNavItems: Array<{ view: AppView; labelKey: string; icon: LucideIcon }> = [
  { view: "events", labelKey: "nav.events", icon: Ticket },
  { view: "timeline", labelKey: "nav.timeline", icon: CalendarDays },
  { view: "venues", labelKey: "nav.venues", icon: MapPinned },
  { view: "statistics", labelKey: "nav.statistics", icon: BarChart3 },
  { view: "tickets", labelKey: "nav.tickets", icon: ReceiptText },
];

interface MobileBottomNavProps {
  activeView: AppView;
  onNavigate: (view: AppView) => void;
}

export function MobileBottomNav({ activeView, onNavigate }: MobileBottomNavProps) {
  const { t } = useTranslation();

  return (
    <nav className="mobile-bottom-nav" aria-label={t("mobile.bottomNavigation")}>
      {mobileNavItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeView === item.view;

        return (
          <button
            className={isActive ? "is-active" : undefined}
            key={item.view}
            type="button"
            aria-current={isActive ? "page" : undefined}
            onClick={() => onNavigate(item.view)}
          >
            <Icon size={18} aria-hidden="true" />
            <span>{t(item.labelKey)}</span>
          </button>
        );
      })}
    </nav>
  );
}
