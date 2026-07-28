import { createClient, SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;
let cachedUrl = "";
let cachedKey = "";

/** Returns a memoized Supabase client, or null when not configured. */
export function getSupabase(url: string, anonKey: string): SupabaseClient | null {
  if (!url || !anonKey) return null;
  if (client && url === cachedUrl && anonKey === cachedKey) return client;
  try {
    client = createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
    cachedUrl = url;
    cachedKey = anonKey;
    return client;
  } catch {
    return null;
  }
}

export function isConfigured(url: string, anonKey: string): boolean {
  return Boolean(url && anonKey);
}
