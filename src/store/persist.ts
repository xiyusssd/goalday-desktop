import { saveDataDebounced } from "../lib/storage";
import type { StoreState } from "./types";

/** Persist the persistable arrays from the store (debounced; see storage.ts). */
export function persist(state: StoreState) {
  saveDataDebounced({
    tasks: state.tasks,
    journals: state.journals,
    goals: state.goals,
    transactions: state.transactions,
    workouts: state.workouts,
    notes: state.notes,
  });
}
