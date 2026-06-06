import { BarChart3, CalendarDays, MapPinned, Menu, Plus, ReceiptText, Ticket } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { BackupImportMode, BackupImportResult, StageLogBackup } from "../types/backup";
import type { EventRecord } from "../types/event";
import type { UserProfile } from "../types/profile";
import type { AppTheme } from "../types/theme";
import type { TicketApplication } from "../types/ticket";
import { AuthPanel } from "./AuthPanel";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { MobileMenuDrawer } from "./MobileMenuDrawer";
import { ThemeSwitcher } from "./ThemeSwitcher";

export type AppView = "events" | "timeline" | "venues" | "statistics" | "analytics" | "tickets" | "add";

interface HeaderProps {
  activeView: AppView;
  totalEvents: number;
  theme: AppTheme;
  isCloudMode?: boolean;
  localEventCount?: number;
  localTicketCount?: number;
  events: EventRecord[];
  ticketApplications: TicketApplication[];
  profile?: UserProfile | null;
  language?: string;
  userEmail?: string;
  isImportingLocalEvents?: boolean;
  isImportingLocalTickets?: boolean;
  onNavigate: (view: AppView) => void;
  onThemeChange: (theme: AppTheme) => void;
  onImportLocalEvents?: () => void | Promise<void>;
  onImportLocalTickets?: () => void | Promise<void>;
  onImportBackup: (backup: StageLogBackup, importMode: BackupImportMode) => Promise<BackupImportResult>;
}

const navItems: Array<{ view: AppView; labelKey: string; icon: LucideIcon }> = [
  { view: "events", labelKey: "nav.events", icon: Ticket },
  { view: "timeline", labelKey: "nav.timeline", icon: CalendarDays },
  { view: "venues", labelKey: "nav.venues", icon: MapPinned },
  { view: "statistics", labelKey: "nav.statistics", icon: BarChart3 },
  { view: "analytics", labelKey: "nav.analytics", icon: BarChart3 },
  { view: "tickets", labelKey: "nav.tickets", icon: ReceiptText },
  { view: "add", labelKey: "nav.add", icon: Plus },
];

export function Header({
  activeView,
  totalEvents,
  theme,
  isCloudMode,
  localEventCount,
  localTicketCount,
  events,
  ticketApplications,
  profile,
  language,
  userEmail,
  isImportingLocalEvents,
  isImportingLocalTickets,
  onNavigate,
  onThemeChange,
  onImportLocalEvents,
  onImportLocalTickets,
  onImportBackup,
}: HeaderProps) {
  const { t } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const activeItem = navItems.find((item) => item.view === activeView);

  return (
    <header className="site-header">
      <div className="site-header__brand">
        <span className="brand-mark">SL</span>
        <div>
          <h1>StageLog JP</h1>
          <p>{t("app.subtitle", { count: totalEvents })}</p>
        </div>
      </div>
      <div className="mobile-header-current">
        <span>{t(activeItem?.labelKey ?? "nav.events")}</span>
      </div>
      <button
        className="mobile-menu-button"
        type="button"
        aria-expanded={isMobileMenuOpen}
        aria-label={t("mobile.menu")}
        onClick={() => setIsMobileMenuOpen(true)}
      >
        <Menu size={19} aria-hidden="true" />
        <span>{t("mobile.more")}</span>
      </button>
      <nav className="site-nav desktop-header-content" aria-label="Primary navigation">
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
      <div className="header-controls desktop-header-content">
        <AuthPanel
          isCloudMode={isCloudMode}
          localEventCount={localEventCount}
          localTicketCount={localTicketCount}
          isImportingLocalEvents={isImportingLocalEvents}
          isImportingLocalTickets={isImportingLocalTickets}
          onImportLocalEvents={onImportLocalEvents}
          onImportLocalTickets={onImportLocalTickets}
        />
        <ThemeSwitcher theme={theme} onThemeChange={onThemeChange} />
        <LanguageSwitcher />
      </div>
      <MobileMenuDrawer
        events={events}
        isCloudMode={isCloudMode}
        isImportingLocalEvents={isImportingLocalEvents}
        isImportingLocalTickets={isImportingLocalTickets}
        isOpen={isMobileMenuOpen}
        localEventCount={localEventCount}
        localTicketCount={localTicketCount}
        mode={isCloudMode ? "cloud" : "local"}
        profile={profile}
        settings={{ language, theme }}
        theme={theme}
        ticketApplications={ticketApplications}
        totalEvents={totalEvents}
        userEmail={userEmail}
        onClose={() => setIsMobileMenuOpen(false)}
        onImportBackup={onImportBackup}
        onImportLocalEvents={onImportLocalEvents}
        onImportLocalTickets={onImportLocalTickets}
        onNavigate={onNavigate}
        onThemeChange={onThemeChange}
      />
    </header>
  );
}
