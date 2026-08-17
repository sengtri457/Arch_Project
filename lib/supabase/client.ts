import { createBrowserClient } from '@supabase/ssr'

/**
 * Creates a client-side Supabase client.
 * Safe to call from client components ('use client').
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
