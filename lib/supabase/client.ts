import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? publishableKey;

let supabaseInstance: SupabaseClient<Database> | null = null;

/**
 * Get Supabase client. Singleton; returns null if env is not set so callers can
 * surface a clear configuration error without printing secret values.
 * Auth: PKCE + refresh token phù hợp SPA; tránh gọi createClient lặp lại (tốn bộ nhớ / duplicate listeners).
 */
export function getSupabase(): SupabaseClient<Database> | null {
  if (supabaseInstance !== null) return supabaseInstance;
  if (!url || !anonKey) return null;
  supabaseInstance = createClient<Database>(url, anonKey, {
    auth: {
      flowType: 'pkce',
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    global: {
      headers: { 'x-client-info': '5f-template-erp' },
    },
  });
  return supabaseInstance;
}

/**
 * Use getSupabase() in repositories; returns null when Supabase env is not set.
 */
