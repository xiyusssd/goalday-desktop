import { saveSettings, flushData } from "../lib/storage";
import { today, addDays } from "../lib/date";
import { initialSettings } from "./initial";
import { persist } from "./persist";
import type { Slice, AppSlice } from "./types";

export const createAppSlice: Slice<AppSlice> = (set, get) => ({
  settings: initialSettings,
  currentWeekStart: today(),
  currentDay: today(),
  user: null,
  syncStatus: "offline",

  setLanguage: (lang) => {
    const next = { ...get().settings, language: lang };
    set({ settings: next });
    saveSettings(next);
  },

  setSettings: (patch) => {
    const next = { ...get().settings, ...patch };
    set({ settings: next });
    saveSettings(next);
  },

  setCurrentWeekStart: (d) => {
    set({ currentWeekStart: d });
    get().materializeRecurring(addDays(d, 6));
  },
  setCurrentDay: (d) => {
    set({ currentDay: d });
    get().materializeRecurring(d);
  },
  setUser: (u) => set({ user: u }),
  setSyncStatus: (s) => set({ syncStatus: s }),

  replaceAll: (data) => {
    set({
      tasks: data.tasks,
      journals: data.journals,
      goals: data.goals,
      transactions: data.transactions,
      workouts: data.workouts,
      notes: data.notes,
    });
    persist(get());
    flushData(); // sync-merge / import: write through immediately.
  },

  getData: () => {
    const s = get();
    return {
      tasks: s.tasks,
      journals: s.journals,
      goals: s.goals,
      transactions: s.transactions,
      workouts: s.workouts,
      notes: s.notes,
    };
  },
});
