// lib/supabase.js — Supabase client singleton (browser + server, anon key)
// Browser/universal Supabase client. Safe to import from client or server (non-Edge).
// Only uses NEXT_PUBLIC_ env vars — never the service role key.

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function isSupabaseConfigured() {
  return Boolean(
    SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    SUPABASE_URL.length > 10 &&
    !SUPABASE_URL.includes('YOUR') &&
    !SUPABASE_ANON_KEY.includes('YOUR')
  );
}

let _client = null;

export function getSupabaseClient() {
  if (!isSupabaseConfigured()) return null;
  if (_client) return _client;
  _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });
  return _client;
}
