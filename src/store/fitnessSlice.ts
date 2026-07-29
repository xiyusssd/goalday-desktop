import { nanoid } from "nanoid";
import type { Workout } from "../types.ts";
import { initialData } from "./initial.ts";
import { persist } from "./persist.ts";
import type { Slice, FitnessSlice } from "./types.ts";

export const createFitnessSlice: Slice<FitnessSlice> = (set, get) => ({
  workouts: initialData.workouts,

  addWorkout: (input) => {
    const now = Date.now();
    const workout: Workout = {
      id: nanoid(),
      ...input,
      durationMin: Math.max(0, input.durationMin) || 0,
      createdAt: now,
      updatedAt: now,
      deleted: false,
    };
    set((s) => ({ workouts: [...s.workouts, workout] }));
    persist(get());
  },
  updateWorkout: (id, patch) => {
    set((s) => ({
      workouts: s.workouts.map((x) =>
        x.id === id ? { ...x, ...patch, updatedAt: Date.now() } : x,
      ),
    }));
    persist(get());
  },
  deleteWorkout: (id) => {
    set((s) => ({
      workouts: s.workouts.map((x) =>
        x.id === id ? { ...x, deleted: true, updatedAt: Date.now() } : x,
      ),
    }));
    persist(get());
  },
});
