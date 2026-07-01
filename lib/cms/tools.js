// ─── CMS DATA ACCESS — TOOLS (SUPABASE) ──────────────────────────────────────
import { isSupabaseConfigured, getSupabaseClient } from '../supabase';
import { list, getById, getOneByField, create, update, remove, count, bulkUpdate, bulkRemove, NOT_CONFIGURED } from './_base';

const TABLE = 'tools';

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

export async function updateTool(id, payload, userId) {
  return update(TABLE, id, sanitize(payload), { userId });
}

export async function deleteTool(id) {
  return remove(TABLE, id);
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
