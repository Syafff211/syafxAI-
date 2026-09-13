"use client";

import { createBrowserClient } from "@supabase/ssr";
import { isSupabaseConfiguredClient } from "./shared";

/**
 * Browser Supabase client (uses public anon key + RLS). Returns null when
 * Supabase is not configured so the UI can degrade gracefully.
 */
export function createClient() {
  if (!isSupabaseConfiguredClient()) return null;
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
