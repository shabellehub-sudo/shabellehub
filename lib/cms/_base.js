// lib/cms/_base.js — generic CRUD helpers over the doc-jsonb tables created
// in supabase/migrations/0001_init_schema.sql. Every lib/cms/*.js module is a
// thin, table-specific wrapper around these so all the old Firestore-era
// function signatures ({ data, error } return shape) keep working unchanged.

import { getSupabaseClient, isSupabaseConfigured } from '../supabase';

export const NOT_CONFIGURED = { data: null, error: 'Supabase is not configured.' };

// Columns that are real generated columns (mirrored out of `doc`) for each
// table — used to decide whether a filter can use a fast indexed `.eq()` or
// must fall back to a jsonb containment check.
const GENERATED_COLUMNS = {
  posts: ['status', 'slug', 'title', 'category_id', 'author_id', 'featured', 'published_at', 'scheduled_for', 'last_reviewed_at', 'created_at', 'updated_at'],
  tools: ['status', 'slug', 'name', 'category', 'featured', 'hot', 'created_at', 'updated_at'],
  authors: ['slug', 'name'],
  categories: ['name', 'slug'],
  tags: ['name', 'slug'],
  media: ['created_at'],
  affiliate_links: ['status', 'tool_slug', 'updated_at', 'created_at'],
  announcements: ['active', 'created_at'],
  newsletters: ['status', 'updated_at', 'created_at'],
  newsletter_campaigns: ['status', 'sent_at', 'scheduled_at', 'updated_at', 'created_at'],
  subscribers: ['email', 'status', 'source', 'created_at', 'updated_at'],
};

// camelCase Firestore-era field -> actual generated column name, per table.
const FIELD_ALIASES = {
  affiliate_links: { toolSlug: 'tool_slug' },
  newsletter_campaigns: { sentAt: 'sent_at', scheduledAt: 'scheduled_at' },
};

function colFor(table, field) {
  const alias = FIELD_ALIASES[table]?.[field];
  const col = alias || field;
  return (GENERATED_COLUMNS[table] || []).includes(col) ? col : null;
}

export function toRecord(row) {
  if (!row) return null;
  return { id: row.id, ...(row.doc || {}) };
}

function client() {
  return getSupabaseClient();
}

function applyFilters(q, table, filters) {
  for (const [field, value] of Object.entries(filters)) {
    if (value === undefined || value === null) continue;
    const col = colFor(table, field);
    if (col) q = q.eq(col, value);
    else q = q.contains('doc', { [field]: value });
  }
  return q;
}

export async function list(table, { filters = {}, orderField, orderDir = 'desc', lim = 50, arrayContains } = {}) {
  if (!isSupabaseConfigured()) return { data: [], error: NOT_CONFIGURED.error, count: 0 };
  try {
    let q = client().from(table).select('*');
    q = applyFilters(q, table, filters);
    if (arrayContains) {
      const [field, value] = arrayContains;
      q = q.contains(field === 'tags' ? 'tags' : field, [value]);
    }
    const orderCol = orderField ? (colFor(table, orderField) || orderField) : null;
    if (orderCol) q = q.order(orderCol, { ascending: orderDir !== 'desc' });
    if (lim) q = q.limit(lim);
    const { data: rows, error } = await q;
    if (error) return { data: [], error: error.message, count: 0 };
    const records = (rows || []).map(toRecord);
    return { data: records, error: null, count: records.length };
  } catch (err) {
    return { data: [], error: err.message, count: 0 };
  }
}

export async function getById(table, id) {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  try {
    const { data: row, error } = await client().from(table).select('*').eq('id', id).maybeSingle();
    if (error) return { data: null, error: error.message };
    return { data: toRecord(row), error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

export async function getOneByField(table, field, value) {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  try {
    let q = client().from(table).select('*');
    const col = colFor(table, field);
    q = col ? q.eq(col, value) : q.contains('doc', { [field]: value });
    const { data: rows, error } = await q.limit(1);
    if (error) return { data: null, error: error.message };
    return { data: rows && rows.length ? toRecord(rows[0]) : null, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

export async function create(table, payload, { userId, extra = {} } = {}) {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  try {
    const now = new Date().toISOString();
    const doc = {
      ...extra,
      ...payload,
      created_by: userId || null,
      updated_by: userId || null,
      created_at: now,
      updated_at: now,
    };
    const { data: row, error } = await client().from(table).insert({ doc }).select('*').single();
    if (error) return { data: null, error: error.message };
    return { data: toRecord(row), error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

export async function update(table, id, payload, { userId } = {}) {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  try {
    const { data: existing, error: getErr } = await client().from(table).select('doc').eq('id', id).maybeSingle();
    if (getErr) return { data: null, error: getErr.message };
    const merged = {
      ...(existing?.doc || {}),
      ...payload,
      updated_by: userId || null,
      updated_at: new Date().toISOString(),
    };
    const { data: row, error } = await client().from(table).update({ doc: merged }).eq('id', id).select('*').single();
    if (error) return { data: null, error: error.message };
    return { data: toRecord(row), error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

export async function remove(table, id) {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  try {
    const { error } = await client().from(table).delete().eq('id', id);
    if (error) return { data: null, error: error.message };
    return { data: true, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

export async function count(table, filters = {}) {
  if (!isSupabaseConfigured()) return { data: 0, error: NOT_CONFIGURED.error };
  try {
    let q = client().from(table).select('id', { count: 'exact', head: true });
    q = applyFilters(q, table, filters);
    const { count: c, error } = await q;
    if (error) return { data: 0, error: error.message };
    return { data: c || 0, error: null };
  } catch (err) {
    return { data: 0, error: err.message };
  }
}

export async function bulkUpdate(table, ids, fields, { userId } = {}) {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  try {
    for (const id of ids) {
      const r = await update(table, id, fields, { userId });
      if (r.error) return { data: null, error: r.error };
    }
    return { data: true, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

// ── SITE CONFIG (singleton/key-value docs: navigation, homepage, footer,
//    settings, site_settings, and one row per custom "page") ───────────────
export async function getConfig(key, defaults = {}) {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  try {
    const { data: row, error } = await client().from('site_config').select('*').eq('key', key).maybeSingle();
    if (error) return { data: null, error: error.message };
    if (!row) return { data: { id: key, ...defaults }, error: null };
    return { data: { id: key, ...defaults, ...row.value }, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

export async function setConfig(key, payload, { userId } = {}) {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  try {
    const { data: existing } = await client().from('site_config').select('value').eq('key', key).maybeSingle();
    const merged = { ...(existing?.value || {}), ...payload };
    const { data: row, error } = await client()
      .from('site_config')
      .upsert({ key, value: merged, updated_by: userId || null }, { onConflict: 'key' })
      .select('*')
      .single();
    if (error) return { data: null, error: error.message };
    return { data: { id: row.key, ...row.value }, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

export async function bulkRemove(table, ids) {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  try {
    const { error } = await client().from(table).delete().in('id', ids);
    if (error) return { data: null, error: error.message };
    return { data: true, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}
