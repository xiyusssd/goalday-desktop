import { createContext, useContext } from "react";

export interface SyncApi {
  configured: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  runSync: () => Promise<void>;
}

export const SyncContext = createContext<SyncApi | null>(null);

/** Consume the single app-wide sync API provided by SyncProvider. */
export function useSync(): SyncApi {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error("useSync must be used within SyncProvider");
  return ctx;
}
