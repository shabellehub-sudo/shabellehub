// ─── CLIENT HELPER — ADMIN USER MANAGEMENT ───────────────────────────────────
// Calls server-only /api/admin/users/** with a Supabase access token in headers.
import { getSupabaseClient } from '../supabase';

async function getAccessToken() {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data } = await client.auth.getSession();
  return data?.session?.access_token || null;
}

async function authedFetch(url, options = {}) {
  const token = await getAccessToken();
  if (!token) return { data: null, error: 'Not signed in.' };
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) return { data: null, error: body.error || `Request failed (${res.status})` };
  return { data: body.data, error: null };
}

export async function listCmsUsers() {
  return authedFetch('/api/admin/users');
}

export async function updateUserRole(userId, role) {
  return authedFetch(`/api/admin/users/${userId}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
}
