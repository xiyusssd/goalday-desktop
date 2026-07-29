import { nanoid } from "nanoid";
import type { JournalEntry } from "../types";
import { initialData } from "./initial";
import { persist } from "./persist";
import type { Slice, JournalSlice } from "./types";

export const createJournalSlice: Slice<JournalSlice> = (set, get) => ({
  journals: initialData.journals,

  upsertJournal: (date, patch) => {
    const now = Date.now();
    const existing = get().journals.find((j) => j.date === date && !j.deleted);
    if (existing) {
      set((s) => ({
        journals: s.journals.map((j) =>
          j.id === existing.id ? { ...j, ...patch, updatedAt: now } : j,
        ),
      }));
    } else {
      const entry: JournalEntry = {
        id: nanoid(),
        date,
        content: "",
        mood: null,
        createdAt: now,
        updatedAt: now,
        deleted: false,
        ...patch,
      };
      set((s) => ({ journals: [...s.journals, entry] }));
    }
    persist(get());
  },
});
