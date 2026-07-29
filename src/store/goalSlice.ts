import { nanoid } from "nanoid";
import type { Goal } from "../types.ts";
import { initialData } from "./initial.ts";
import { persist } from "./persist.ts";
import type { Slice, GoalSlice } from "./types.ts";

export const createGoalSlice: Slice<GoalSlice> = (set, get) => ({
  goals: initialData.goals,

  addGoal: (title, color) => {
    const now = Date.now();
    const goal: Goal = {
      id: nanoid(),
      title: title.trim(),
      color,
      createdAt: now,
      updatedAt: now,
      deleted: false,
    };
    set((s) => ({ goals: [...s.goals, goal] }));
    persist(get());
  },

  deleteGoal: (id) => {
    set((s) => ({
      goals: s.goals.map((g) =>
        g.id === id ? { ...g, deleted: true, updatedAt: Date.now() } : g,
      ),
      tasks: s.tasks.map((x) => (x.goalId === id ? { ...x, goalId: null } : x)),
    }));
    persist(get());
  },
});
