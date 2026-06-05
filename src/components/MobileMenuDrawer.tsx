import { Cloud, Palette, Settings, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { BackupImportMode, BackupImportResult, StageLogBackup } from "../types/backup";
import type { EventRecord } from "../types/event";
import type { UserProfile } from "../types/profile";
import type { AppTheme } from "../types/theme";
import type { TicketApplication } from "../types/ticket";
import { AuthPanel } from "./AuthPanel";
import { BackupPanel } from "./BackupPanel";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeSwitcher } from "./ThemeSwitcher";

interface MobileMenuDrawerProps {
  isOpen: boolean;
  totalEvents: number;
  theme: AppTheme;
  mode: "local" | "cloud";
  userEmail?: string;
  events: EventRecord[];
  ticketApplications: TicketApplication[];
  profile?: UserProfile | null;
  settings: {
    language?: string;
    theme?: string;
  };
  isCloudMode?: boolean;
  localEventCount?: number;
  localTicketCount?: number;
  isImportingLocalEvents?: boolean;
  isImportingLocalTickets?: boolean;
  onClose: () => void;
  onThemeChange: (theme: AppTheme) => void;
  onImportLocalEvents?: () => void | Promise<void>;
  onImportLocalTickets?: () => void | Promise<void>;
  onImportBackup: (backup: StageLogBackup, importMode: BackupImportMode) => Promise<BackupImportResult>;
}

export function MobileMenuDrawer({
  isOpen,
  totalEvents,
  theme,
  mode,
  userEmail,
  events,
  ticketApplications,
  profile,
  settings,
  isCloudMode,
  localEventCount,
  localTicketCount,
  isImportingLocalEvents,
  isImportingLocalTickets,
  onClose,
  onThemeChange,
  onImportLocalEvents,
  onImportLocalTickets,
  onImportBackup,
}: MobileMenuDrawerProps) {
  const { t } = useTranslation();
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="mobile-drawer" role="presentation">
      <button className="mobile-drawer__backdrop" type="button" aria-label={t("mobile.closeMenu")} onClick={onClose} />
      <aside className="mobile-drawer__panel" ref={panelRef} role="dialog" aria-modal="true" aria-label={t("mobile.menu")}>
        <div className="mobile-drawer__header">
          <div>
            <span>{t("mobile.settings")}</span>
            <strong>StageLog JP</strong>
            <small>{t("app.subtitle", { count: totalEvents })}</small>
          </div>
          <button className="icon-button" type="button" aria-label={t("mobile.closeMenu")} onClick={onClose}>
            <X size={17} aria-hidden="true" />
          </button>
        </div>

        <section className="mobile-drawer__section">
          <h2>
            <Cloud size={16} aria-hidden="true" />
            {t("mobile.account")}
          </h2>
          <p>{mode === "cloud" ? t("auth.cloudModeDescription") : t("auth.localModeDescription")}</p>
          <AuthPanel
            isCloudMode={isCloudMode}
            localEventCount={localEventCount}
            localTicketCount={localTicketCount}
            isImportingLocalEvents={isImportingLocalEvents}
            isImportingLocalTickets={isImportingLocalTickets}
            onImportLocalEvents={onImportLocalEvents}
            onImportLocalTickets={onImportLocalTickets}
          />
        </section>

        <section className="mobile-drawer__section">
          <h2>
            <Palette size={16} aria-hidden="true" />
            {t("mobile.appearance")}
          </h2>
          <ThemeSwitcher theme={theme} onThemeChange={onThemeChange} />
        </section>

        <section className="mobile-drawer__section">
          <h2>
            <Settings size={16} aria-hidden="true" />
            {t("mobile.language")}
          </h2>
          <LanguageSwitcher />
        </section>

        <BackupPanel
          events={events}
          mode={mode}
          profile={profile}
          settings={settings}
          ticketApplications={ticketApplications}
          userEmail={userEmail}
          onImportBackup={onImportBackup}
        />
      </aside>
    </div>
  );
}
