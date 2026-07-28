import { AppData } from "../types";
import { mergeById } from "./sync-core";

const BACKUP_VERSION = 1;

interface BackupFile {
  version: number;
  exportedAt: number;
  data: AppData;
}

/** Trigger a JSON download of the full dataset. */
export function exportData(data: AppData): void {
  const payload: BackupFile = { version: BACKUP_VERSION, exportedAt: Date.now(), data };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `goalday-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Parse a backup file and merge it into the current data (last-write-wins by
 * updatedAt). Throws if the file is not a recognizable backup.
 */
export function importData(current: AppData, text: string): AppData {
  const parsed = JSON.parse(text) as Partial<BackupFile> & Partial<AppData>;
  // Accept both wrapped ({version,data}) and bare AppData shapes.
  const incoming: Partial<AppData> = parsed.data ?? (parsed as Partial<AppData>);
  if (!Array.isArray(incoming.tasks) && !Array.isArray(incoming.journals) && !Array.isArray(incoming.goals)) {
    throw new Error("invalid backup file");
  }
  return {
    tasks: mergeById(current.tasks, incoming.tasks ?? []),
    journals: mergeById(current.journals, incoming.journals ?? []),
    goals: mergeById(current.goals, incoming.goals ?? []),
    transactions: mergeById(current.transactions, incoming.transactions ?? []),
    workouts: mergeById(current.workouts, incoming.workouts ?? []),
    notes: mergeById(current.notes, incoming.notes ?? []),
  };
}
