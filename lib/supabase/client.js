'use client';
import { createBrowserClient } from '@supabase/ssr';
import { supabaseFetch } from '@/lib/netFetch';

let client;
export function supabaseBrowser() {
  if (!client) {
    client = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { global: { fetch: supabaseFetch } });
  }
  return client;
}
