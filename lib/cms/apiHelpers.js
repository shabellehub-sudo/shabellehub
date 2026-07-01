// lib/cms/apiHelpers.js — Shared fetch utilities for admin pages
// Prevents "Unexpected token '<'" JSON parse crash when API returns HTML error pages.

import { getSupabaseClient } from '../supabase';

/**
 * Get a fresh Supabase access token. Throws a readable error if no session.
 */
export async function getToken() {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase is not configured.');
  const { data } = await client.auth.getSession();
  const token = data?.session?.access_token;
  if (!token) throw new Error('Not authenticated. Please refresh the page.');
  return token;
}

/**
 * Safely parse an API response — handles HTML error pages gracefully.
 * Always returns { ok, data, error } — never throws.
 */
export async function parseResponse(res) {
  const text = await res.text();
  try {
    const json = JSON.parse(text);
    return {
      ok:    res.ok,
      data:  json.data  ?? null,
      error: json.error ?? (res.ok ? null : `Request failed (${res.status})`),
    };
  } catch {
    return {
      ok:    false,
      data:  null,
      error: `Server error ${res.status}: API route returned HTML instead of JSON. Check Vercel function logs.`,
    };
  }
}

/**
 * Convenience: authenticated fetch that always returns { ok, data, error }.
 * Usage: const { ok, data, error } = await authedFetch(user, '/api/admin/foo');
 * The `user` argument is accepted for backward compatibility but ignored —
 * the Supabase access token is pulled fresh from the current session.
 */
export async function authedFetch(user, url, options = {}) {
  try {
    const token = await getToken();
    const res = await fetch(url, {
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });
    return parseResponse(res);
  } catch (err) {
    return { ok: false, data: null, error: err.message };
  }
}
