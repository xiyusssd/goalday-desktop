import { create } from "zustand";
import type { StoreState } from "./types";
import { createTaskSlice } from "./taskSlice";
import { createJournalSlice } from "./journalSlice";
import { createGoalSlice } from "./goalSlice";
import { createFinanceSlice } from "./financeSlice";
import { createFitnessSlice } from "./fitnessSlice";
import { createNoteSlice } from "./noteSlice";
import { createAppSlice } from "./appSlice";

export const useStore = create<StoreState>((...a) => ({
  ...createTaskSlice(...a),
  ...createJournalSlice(...a),
  ...createGoalSlice(...a),
  ...createFinanceSlice(...a),
  ...createFitnessSlice(...a),
  ...createNoteSlice(...a),
  ...createAppSlice(...a),
}));
