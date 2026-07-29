import { loadData, loadSettings } from "../lib/storage.ts";

// Read localStorage once at module load; slices seed their initial state from these.
export const initialData = loadData();
export const initialSettings = loadSettings();
