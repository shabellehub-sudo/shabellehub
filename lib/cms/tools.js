// ─── CMS DATA ACCESS — TOOLS (SUPABASE) ──────────────────────────────────────
import { isSupabaseConfigured, getSupabaseClient } from '../supabase';
import { list, getById, getOneByField, create, count, bulkUpdate, bulkRemove, NOT_CONFIGURED } from './_base';

const TABLE = 'tools';

// Writes/deletes go through the backend API (service_role, bypasses RLS)
// instead of the browser anon client, so an expired/stale session in the
// browser can't silently fall back to the anon role and get blocked by RLS.
async function apiFetch(path, options = {}) {
  const client = getSupabaseClient();
  const { data: sessionData } = client
    ? await client.auth.getSession()
    : { data: { session: null } };
  const session = sessionData?.session;

  if (!session?.access_token) {
    return { data: null, error: 'Not signed in. Please log in again.' };
  }

  try {
    const res = await fetch(path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
        ...(options.headers || {}),
      },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { data: null, error: json.error || `Request failed (${res.status})` };
    }
    return { data: json.data, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

export async function listTools({
  status, category, featured, hot, search, sortField = 'updated_at', sortDir = 'desc', lim = 100,
} = {}) {
  const res = await list(TABLE, {
    filters: { status, category, featured: featured === true ? true : undefined, hot: hot === true ? true : undefined },
    orderField: sortField, orderDir: sortDir, lim,
  });
  if (res.error) return res;
  let tools = res.data;
  if (search) {
    const s = search.toLowerCase();
    tools = tools.filter(t =>
      t.name?.toLowerCase().includes(s) ||
      t.slug?.toLowerCase().includes(s) ||
      t.category?.toLowerCase().includes(s) ||
      (t.tags || []).some(tag => tag.toLowerCase().includes(s))
    );
  }
  return { data: tools, error: null, count: tools.length };
}

export async function getToolById(id) {
  return getById(TABLE, id);
}

export async function getToolBySlug(slug) {
  return getOneByField(TABLE, 'slug', slug);
}

const OPTIONAL = ['badge', 'logo_url', 'og_image_url', 'affiliate_url', 'canonical_url'];
function sanitize(payload) {
  const out = {};
  for (const [k, v] of Object.entries(payload)) {
    if (v === undefined) continue;
    out[k] = OPTIONAL.includes(k) && v === '' ? null : v;
  }
  return out;
}

export async function createTool(payload, userId) {
  return create(TABLE, sanitize(payload), { userId });
}

// updateTool/deleteTool now go through /api/admin/tools/[id] (service_role),
// same pattern the working DELETE handler already used.
export async function updateTool(id, payload) {
  return apiFetch(`/api/admin/tools/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(sanitize(payload)),
  });
}

export async function deleteTool(id) {
  return apiFetch(`/api/admin/tools/${id}`, { method: 'DELETE' });
}

export async function publishTool(id, userId) {
  return updateTool(id, { status: 'published', published_at: new Date().toISOString() }, userId);
}
export async function unpublishTool(id, userId) {
  return updateTool(id, { status: 'unpublished' }, userId);
}
export async function saveDraftTool(id, payload, userId) {
  return updateTool(id, { ...payload, status: 'draft' }, userId);
}

export async function bulkUpdateTools(ids, fields, userId) {
  return bulkUpdate(TABLE, ids, fields, { userId });
}

export async function bulkDeleteTools(ids) {
  return bulkRemove(TABLE, ids);
}

export async function getToolCounts() {
  if (!isSupabaseConfigured()) {
    return { data: { total: 0, published: 0, draft: 0, featured: 0 }, error: NOT_CONFIGURED.error };
  }
  try {
    const [total, published, draft, featured] = await Promise.all([
      count(TABLE, {}), count(TABLE, { status: 'published' }), count(TABLE, { status: 'draft' }), count(TABLE, { featured: true }),
    ]);
    return { data: { total: total.data, published: published.data, draft: draft.data, featured: featured.data }, error: null };
  } catch (err) {
    return { data: { total: 0, published: 0, draft: 0, featured: 0 }, error: err.message };
  }
}

export async function isSlugTaken(slug, excludeId = null) {
  if (!isSupabaseConfigured()) return false;
  try {
    const { data } = await getOneByField(TABLE, 'slug', slug);
    if (!data) return false;
    if (excludeId && data.id === excludeId) return false;
    return true;
  } catch { return false; }
}
