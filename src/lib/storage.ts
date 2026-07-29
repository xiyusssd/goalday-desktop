import { type AppData, EMPTY_DATA } from "../types.ts";

// v2 added transactions/workouts/notes. Old v1 blobs are still read (the key is
// unchanged); the new arrays simply backfill to [] for existing installs.
const KEY = "goalday.data.v1";

/** Load the full dataset from localStorage. Returns empty data on first run or parse error. */
export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(EMPTY_DATA);
    const parsed = JSON.parse(raw) as Partial<AppData>;
    return {
      // Backfill fields added in later versions so old data stays valid.
      tasks: (parsed.tasks ?? []).map((t) => ({
        ...t,
        scheduledPeriod: t.scheduledPeriod ?? null,
        recurrence: t.recurrence ?? null,
        dueDate: t.dueDate ?? null,
        seriesId: t.seriesId ?? null,
      })),
      journals: parsed.journals ?? [],
      goals: parsed.goals ?? [],
      transactions: parsed.transactions ?? [],
      workouts: parsed.workouts ?? [],
      notes: parsed.notes ?? [],
    };
  } catch {
    return structuredClone(EMPTY_DATA);
  }
}

/** Persist the full dataset to localStorage immediately (synchronous). */
export function saveData(data: AppData): void {
  localStorage.setItem(KEY, JSON.stringify(data));
}

// Coalesce rapid writes (e.g. every keystroke in the note/journal editors) into
// one localStorage write. In-memory state updates instantly; only the disk
// serialization is deferred. flushData() forces a pending write out (used on
// page hide so nothing is lost when the window closes).
let pendingData: AppData | null = null;
let flushTimer: ReturnType<typeof setTimeout> | null = null;
const FLUSH_DELAY_MS = 400;

/** Persist the dataset, coalescing bursts of writes within FLUSH_DELAY_MS. */
export function saveDataDebounced(data: AppData): void {
  pendingData = data;
  if (flushTimer !== null) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flushData();
  }, FLUSH_DELAY_MS);
}

/** Write any pending debounced data to localStorage right now. */
export function flushData(): void {
  if (flushTimer !== null) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  if (pendingData !== null) {
    const data = pendingData;
    pendingData = null;
    saveData(data);
  }
}

const SETTINGS_KEY = "goalday.settings.v1";

export type ThemePref = "light" | "dark" | "system";

export type Palette = "stitch" | "sunset" | "forest" | "grape" | "rose" | "indigo";

export const PALETTES: Palette[] = ["stitch", "sunset", "forest", "grape", "rose", "indigo"];

export interface Settings {
  language: "zh" | "en";
  theme: ThemePref;
  palette: Palette;
  supabaseUrl: string;
  supabaseAnonKey: string;
}

export const DEFAULT_SETTINGS: Settings = {
  language: "zh",
  theme: "system",
  palette: "stitch",
  supabaseUrl: "",
  supabaseAnonKey: "",
};

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
