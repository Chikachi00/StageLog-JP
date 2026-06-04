import type { EventRecord } from "./event";
import type { UserProfile } from "./profile";
import type { TicketApplication } from "./ticket";

export interface StageLogBackup {
  appName: "StageLog JP";
  version: number;
  exportedAt: string;
  mode: "local" | "cloud";
  userEmail?: string;
  data: {
    events: EventRecord[];
    ticketApplications?: TicketApplication[];
    profile?: UserProfile | null;
    settings?: {
      language?: string;
      theme?: string;
    };
  };
  notes?: string;
}

export type BackupImportMode = "merge" | "replace-local";

export interface BackupImportResult {
  importedEvents: number;
  importedTickets: number;
  skippedDuplicates: number;
}
