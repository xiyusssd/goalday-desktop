import { nanoid } from "nanoid";
import type { Note } from "../types.ts";
import { initialData } from "./initial.ts";
import { persist } from "./persist.ts";
import type { Slice, NoteSlice } from "./types.ts";

export const createNoteSlice: Slice<NoteSlice> = (set, get) => ({
  notes: initialData.notes,

  addNote: (input) => {
    const now = Date.now();
    const note: Note = {
      id: nanoid(),
      title: input?.title ?? "",
      body: input?.body ?? "",
      color: input?.color ?? "#fde68a",
      pinned: false,
      createdAt: now,
      updatedAt: now,
      deleted: false,
    };
    set((s) => ({ notes: [...s.notes, note] }));
    persist(get());
    return note.id;
  },
  updateNote: (id, patch) => {
    set((s) => ({
      notes: s.notes.map((x) => (x.id === id ? { ...x, ...patch, updatedAt: Date.now() } : x)),
    }));
    persist(get());
  },
  toggleNotePin: (id) => {
    set((s) => ({
      notes: s.notes.map((x) =>
        x.id === id ? { ...x, pinned: !x.pinned, updatedAt: Date.now() } : x,
      ),
    }));
    persist(get());
  },
  deleteNote: (id) => {
    set((s) => ({
      notes: s.notes.map((x) =>
        x.id === id ? { ...x, deleted: true, updatedAt: Date.now() } : x,
      ),
    }));
    persist(get());
  },
});
