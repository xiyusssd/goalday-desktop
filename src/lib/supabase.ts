import type { SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;
let cachedUrl = "";
let cachedKey = "";
let pending: Promise<SupabaseClient | null> | null = null;

/**
 * Whether sync credentials are present. Pure and synchronous, so the UI can
 * decide what to show without pulling in the Supabase SDK.
 */
export function isConfigured(url: string, anonKey: string): boolean {
  return Boolean(url && anonKey);
}

/**
 * Resolves a memoized Supabase client, or null when not configured.
 *
 * The SDK is imported dynamically so its ~200KB stays out of the startup
 * chunk: an install that never turns on sync never downloads or parses it.
 */
export function loadSupabase(
  url: string,
  anonKey: string,
): Promise<SupabaseClient | null> {
  if (!isConfigured(url, anonKey)) return Promise.resolve(null);
  if (client && url === cachedUrl && anonKey === cachedKey) {
    return Promise.resolve(client);
  }
  if (pending && url === cachedUrl && anonKey === cachedKey) return pending;

  cachedUrl = url;
  cachedKey = anonKey;
  pending = import("@supabase/supabase-js")
    .then(({ createClient }) => {
      client = createClient(url, anonKey, {
        auth: { persistSession: true, autoRefreshToken: true },
      });
      return client;
    })
    .catch(() => null)
    .finally(() => {
      pending = null;
    });
  return pending;
}