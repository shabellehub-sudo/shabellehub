// ─── CMS DATA ACCESS — AFFILIATE LINKS (SUPABASE) ────────────────────────────
import { isSupabaseConfigured } from '../supabase';
import { list, getById, getOneByField, create, update, remove, count, NOT_CONFIGURED } from './_base';
const TABLE = 'affiliate_links';

const OPTIONAL = ['trackingCode', 'cookieDays', 'commissionValue', 'disclosureText', 'notes', 'toolId', 'toolSlug'];
function sanitize(payload) {
  const out = {};
  for (const [k, v] of Object.entries(payload)) {
    if (v === undefined) continue;
    out[k] = OPTIONAL.includes(k) && v === '' ? null : v;
  }
  return out;
}

export async function listAffiliates({ status, toolSlug, sortField = 'updated_at', sortDir = 'desc', lim = 200 } = {}) {
  return list(TABLE, { filters: { status, toolSlug }, orderField: sortField, orderDir: sortDir, lim });
}
export async function getAffiliateById(id) {
  return getById(TABLE, id);
}
export async function getAffiliateByToolSlug(slug) {
  return getOneByField(TABLE, 'toolSlug', slug);
}
export async function createAffiliate(payload, userId) {
  return create(TABLE, sanitize(payload), { userId });
}
export async function updateAffiliate(id, payload, userId) {
  return update(TABLE, id, sanitize(payload), { userId });
}
export async function deleteAffiliate(id) {
  return remove(TABLE, id);
}
export async function activateAffiliate(id, userId) {
  return updateAffiliate(id, { status: 'active' }, userId);
}
export async function pauseAffiliate(id, userId) {
  return updateAffiliate(id, { status: 'paused' }, userId);
}
export async function getAffiliateCounts() {
  if (!isSupabaseConfigured()) return { data: { total: 0, active: 0, paused: 0, draft: 0 }, error: NOT_CONFIGURED.error };
  try {
    const [total, active, paused, draft] = await Promise.all([
      count(TABLE, {}), count(TABLE, { status: 'active' }), count(TABLE, { status: 'paused' }), count(TABLE, { status: 'draft' }),
    ]);
    return { data: { total: total.data, active: active.data, paused: paused.data, draft: draft.data }, error: null };
  } catch (err) {
    return { data: { total: 0, active: 0, paused: 0, draft: 0 }, error: err.message };
  }
}
