import { Download, FileUp, ShieldCheck } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  createBackup,
  downloadBackup,
  parseBackupFile,
} from "../services/backupService";
import type { BackupImportMode, BackupImportResult, StageLogBackup } from "../types/backup";
import type { EventRecord } from "../types/event";
import type { UserProfile } from "../types/profile";
import type { TicketApplication } from "../types/ticket";

interface BackupPanelProps {
  mode: "local" | "cloud";
  userEmail?: string;
  events: EventRecord[];
  ticketApplications: TicketApplication[];
  profile?: UserProfile | null;
  settings: {
    language?: string;
    theme?: string;
  };
  onImportBackup: (backup: StageLogBackup, importMode: BackupImportMode) => Promise<BackupImportResult>;
}

const getErrorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));

export function BackupPanel({
  mode,
  userEmail,
  events,
  ticketApplications,
  profile,
  settings,
  onImportBackup,
}: BackupPanelProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [backupPreview, setBackupPreview] = useState<StageLogBackup | null>(null);
  const [importMode, setImportMode] = useState<BackupImportMode>("merge");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleExport = () => {
    setMessage("");
    setError("");
    setIsExporting(true);

    try {
      const backup = createBackup({
        mode,
        userEmail,
        events,
        ticketApplications,
        profile,
        settings,
        notes: t("backup.imageNote"),
      });

      downloadBackup(backup);
      setMessage(t("backup.exported"));
    } catch (caughtError) {
      setError(`${t("backup.exportFailed")}: ${getErrorMessage(caughtError)}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleSelectFile = async (file?: File) => {
    setBackupPreview(null);
    setMessage("");
    setError("");

    if (!file) {
      return;
    }

    try {
      setBackupPreview(await parseBackupFile(file));
    } catch (caughtError) {
      setError(`${t("backup.invalidFile")}: ${getErrorMessage(caughtError)}`);
    }
  };

  const handleConfirmImport = async () => {
    if (!backupPreview) {
      return;
    }

    const confirmed = window.confirm(t("backup.confirmImportWarning"));

    if (!confirmed) {
      return;
    }

    setMessage("");
    setError("");
    setIsImporting(true);

    try {
      const result = await onImportBackup(backupPreview, mode === "cloud" ? "merge" : importMode);
      setMessage(
        `${t("backup.imported")} ${t("backup.importedCounts", {
          events: result.importedEvents,
          tickets: result.importedTickets,
        })} ${t("backup.skippedDuplicates", { count: result.skippedDuplicates })}`,
      );
      setBackupPreview(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (caughtError) {
      setError(`${t("backup.importFailed")}: ${getErrorMessage(caughtError)}`);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <details className="backup-panel">
      <summary>
        <span>
          <ShieldCheck size={16} aria-hidden="true" />
          {t("backup.title")}
        </span>
        <small>{t(mode === "cloud" ? "auth.cloudMode" : "auth.localMode")}</small>
      </summary>

      <div className="backup-panel__body">
        <p>{t("backup.privateHint")}</p>
        <p>{t("backup.imageNote")}</p>

        <dl className="backup-summary">
          <div>
            <dt>{t("backup.eventsCount")}</dt>
            <dd>{events.length}</dd>
          </div>
          <div>
            <dt>{t("backup.ticketsCount")}</dt>
            <dd>{ticketApplications.length}</dd>
          </div>
          <div>
            <dt>{t("backup.mode")}</dt>
            <dd>{t(mode === "cloud" ? "auth.cloudMode" : "auth.localMode")}</dd>
          </div>
        </dl>

        <div className="backup-panel__actions">
          <button className="ghost-button" type="button" disabled={isExporting} onClick={handleExport}>
            <Download size={16} aria-hidden="true" />
            {isExporting ? t("common.saving") : t("backup.export")}
          </button>
        </div>

        <div className="backup-import">
          <label>
            {t("backup.selectFile")}
            <input
              ref={fileInputRef}
              accept=".json,application/json"
              type="file"
              onChange={(event) => void handleSelectFile(event.target.files?.[0])}
            />
          </label>

          {mode === "local" ? (
            <label>
              {t("backup.importMode")}
              <select
                value={importMode}
                onChange={(event) => setImportMode(event.target.value as BackupImportMode)}
              >
                <option value="merge">{t("backup.merge")}</option>
                <option value="replace-local">{t("backup.replaceLocal")}</option>
              </select>
            </label>
          ) : (
            <p>{t("backup.cloudMergeOnly")}</p>
          )}

          {backupPreview ? (
            <section className="backup-preview" aria-label={t("backup.preview")}>
              <strong>{t("backup.preview")}</strong>
              <span>
                {t("backup.eventsCount")}: {backupPreview.data.events.length}
              </span>
              <span>
                {t("backup.ticketsCount")}: {backupPreview.data.ticketApplications?.length ?? 0}
              </span>
              <span>
                {t("backup.exportedAt")}: {new Date(backupPreview.exportedAt).toLocaleString()}
              </span>
              <span>
                {t("backup.mode")}: {t(backupPreview.mode === "cloud" ? "auth.cloudMode" : "auth.localMode")}
              </span>
              <button className="primary-button" type="button" disabled={isImporting} onClick={handleConfirmImport}>
                <FileUp size={16} aria-hidden="true" />
                {isImporting ? t("auth.importing") : t("backup.confirmImport")}
              </button>
            </section>
          ) : null}
        </div>

        {message ? <p className="auth-panel__message">{message}</p> : null}
        {error ? <p className="auth-panel__error">{error}</p> : null}
      </div>
    </details>
  );
}
