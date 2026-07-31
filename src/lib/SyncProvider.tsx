import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useStore } from "../store";
import { isConfigured, loadSupabase } from "./supabase";
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

  // Derived synchronously from settings, so the UI can render the sync section
  // immediately instead of waiting on the dynamically imported SDK.
  const configured = isConfigured(supabaseUrl, supabaseAnonKey);
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getClient = useCallback(
    () => loadSupabase(supabaseUrl, supabaseAnonKey),
    [supabaseUrl, supabaseAnonKey],
  );

  // Fetch the SDK only once credentials exist; an offline-only install never
  // pays for it.
  useEffect(() => {
    if (!configured) {
      setSupabase(null);
      setUser(null);
      setSyncStatus("offline");
      return;
    }
    let active = true;
    void getClient().then((client) => {
      if (!active) return;
      setSupabase(client);
      if (!client) setSyncStatus("error");
    });
    return () => {
      active = false;
    };
  }, [configured, getClient, setUser, setSyncStatus]);

  const runSync = useCallback(async () => {
    const client = await getClient();
    if (!client) return;
    const uid = useStore.getState().user?.id;
    if (!uid) return;
    setSyncStatus("syncing");
    try {
      const merged = await syncAll(client, uid, useStore.getState().getData());
      replaceAll(merged);
      setSyncStatus("synced");
    } catch (e) {
      console.error("sync failed", e);
      setSyncStatus("error");
    }
  }, [getClient, replaceAll, setSyncStatus]);

  useEffect(() => {
    if (!supabase) return;
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
      const client = await getClient();
      if (!client) throw new Error("Supabase not configured");
      const { error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },
    [getClient],
  );

  const signUp = useCallback(
    async (email: string, password: string) => {
      const client = await getClient();
      if (!client) throw new Error("Supabase not configured");
      const { error } = await client.auth.signUp({ email, password });
      if (error) throw error;
    },
    [getClient],
  );

  const signOut = useCallback(async () => {
    const client = await getClient();
    if (!client) return;
    await client.auth.signOut();
    setUser(null);
    setSyncStatus("offline");
  }, [getClient, setUser, setSyncStatus]);

  const api: SyncApi = useMemo(
    () => ({ configured, signIn, signUp, signOut, runSync }),
    [configured, signIn, signUp, signOut, runSync],
  );

  return <SyncContext.Provider value={api}>{children}</SyncContext.Provider>;
}