import { ReactNode, useCallback, useEffect, useMemo, useRef } from "react";
import { useStore } from "../store";
import { getSupabase } from "./supabase";
import { syncAll } from "./sync";
import { SyncContext, SyncApi } from "./useSync";

/** Runs auth + auto-sync effects once and provides the sync API to the tree. */
export function SyncProvider({ children }: { children: ReactNode }) {
  const supabaseUrl = useStore((s) => s.settings.supabaseUrl);
  const supabaseAnonKey = useStore((s) => s.settings.supabaseAnonKey);
  const setUser = useStore((s) => s.setUser);
  const setSyncStatus = useStore((s) => s.setSyncStatus);
  const replaceAll = useStore((s) => s.replaceAll);
  const user = useStore((s) => s.user);

  const supabase = getSupabase(supabaseUrl, supabaseAnonKey);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSync = useCallback(async () => {
    if (!supabase) return;
    const uid = useStore.getState().user?.id;
    if (!uid) return;
    setSyncStatus("syncing");
    try {
      const merged = await syncAll(supabase, uid, useStore.getState().getData());
      replaceAll(merged);
      setSyncStatus("synced");
    } catch (e) {
      console.error("sync failed", e);
      setSyncStatus("error");
    }
  }, [supabase, replaceAll, setSyncStatus]);

  useEffect(() => {
    if (!supabase) {
      setUser(null);
      setSyncStatus("offline");
      return;
    }
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      const s = data.session;
      if (s?.user) {
        setUser({ id: s.user.id, email: s.user.email ?? "" });
        void runSync();
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email ?? "" });
        void runSync();
      } else {
        setUser(null);
        setSyncStatus("offline");
      }
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase, setUser, setSyncStatus, runSync]);

  useEffect(() => {
    if (!supabase || !user) return;
    const unsub = useStore.subscribe((state, prev) => {
      if (
        state.tasks !== prev.tasks ||
        state.journals !== prev.journals ||
        state.goals !== prev.goals
      ) {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => void runSync(), 1500);
      }
    });
    return () => unsub();
  }, [supabase, user, runSync]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!supabase) throw new Error("Supabase not configured");
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },
    [supabase],
  );

  const signUp = useCallback(
    async (email: string, password: string) => {
      if (!supabase) throw new Error("Supabase not configured");
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
    },
    [supabase],
  );

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setSyncStatus("offline");
  }, [supabase, setUser, setSyncStatus]);

  const api: SyncApi = useMemo(
    () => ({ configured: Boolean(supabase), signIn, signUp, signOut, runSync }),
    [supabase, signIn, signUp, signOut, runSync],
  );

  return <SyncContext.Provider value={api}>{children}</SyncContext.Provider>;
}
