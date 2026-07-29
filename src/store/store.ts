import { create } from "zustand";
import type { StoreState } from "./types.ts";
import { createTaskSlice } from "./taskSlice.ts";
import { createJournalSlice } from "./journalSlice.ts";
import { createGoalSlice } from "./goalSlice.ts";
import { createFinanceSlice } from "./financeSlice.ts";
import { createFitnessSlice } from "./fitnessSlice.ts";
import { createNoteSlice } from "./noteSlice.ts";
import { createAppSlice } from "./appSlice.ts";

export const useStore = create<StoreState>((...a) => ({
  ...createTaskSlice(...a),
  ...createJournalSlice(...a),
  ...createGoalSlice(...a),
  ...createFinanceSlice(...a),
  ...createFitnessSlice(...a),
  ...createNoteSlice(...a),
  ...createAppSlice(...a),
}));
