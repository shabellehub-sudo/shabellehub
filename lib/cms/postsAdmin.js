// ─── SERVER-ONLY: Post queries via Supabase (service role) ────────────────
// Used exclusively in getStaticProps / getStaticPaths.
// All admin client initialisation lives in lib/supabaseAdmin.js (the
// only file the env-leakage script allows those vars in).

import { getAdminDb } from '../supabaseAdmin';

// Recursively converts any non-plain values into JSON-serializable data,
// so getStaticProps never chokes on them.
function sanitize(value) {
  if (value === null || value === undefined) return value;
  if (typeof value?.toDate === 'function') return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(sanitize);
  if (typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = sanitize(v);
    return out;
  }
  return value;
}

// Merges the jsonb `doc` blob with the flat indexed columns (columns win
// on conflict, since they're the authoritative/queryable source).
function toDoc(row) {
  if (!row) return null;
  const { doc, ...rest } = row;
  return sanitize({ ...(doc || {}), ...rest });
}
const toPost = toDoc;

function isAdminAvailable() {
  const db = getAdminDb();
  return db !== null;
}

export async function adminListPublishedPosts({ limit: lim = 60, categoryId, tagSlug } = {}) {
  const db = getAdminDb();
  if (!db) {
    console.warn('[postsAdmin] Admin SDK not configured — returning empty posts list.');
    return { data: [], error: 'Admin SDK not configured.' };
  }
  try {
    let q = db.from('posts')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(lim);

    if (categoryId) q = q.eq('category_id', categoryId);
    if (tagSlug)    q = q.contains('tags', [tagSlug]);

    const { data, error } = await q;
    if (error) throw error;
    return { data: (data || []).map(toPost), error: null };
  } catch (err) {
    console.error('[postsAdmin] adminListPublishedPosts error:', err.message);
    return { data: [], error: err.message };
  }
}

export async function adminGetPostBySlug(slug) {
  const db = getAdminDb();
  if (!db) return { data: null, error: 'Admin SDK not configured.' };
  try {
    const { data, error } = await db.from('posts')
      .select('*')
      .eq('slug', slug)
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return { data: data ? toPost(data) : null, error: null };
  } catch (err) {
    console.error('[postsAdmin] adminGetPostBySlug error:', err.message);
    return { data: null, error: err.message };
  }
}

export async function adminListCategories() {
  const db = getAdminDb();
  if (!db) return { data: [], error: 'Admin SDK not configured.' };
  try {
    const { data, error } = await db.from('categories').select('*').order('name', { ascending: true });
    if (error) throw error;
    return { data: (data || []).map(toDoc), error: null };
  } catch (err) {
    return { data: [], error: err.message };
  }
}

export async function adminListTags() {
  const db = getAdminDb();
  if (!db) return { data: [], error: 'Admin SDK not configured.' };
  try {
    const { data, error } = await db.from('tags').select('*').order('name', { ascending: true });
    if (error) throw error;
    return { data: (data || []).map(toDoc), error: null };
  } catch (err) {
    return { data: [], error: err.message };
  }
}

export async function adminGetAuthorById(id) {
  const db = getAdminDb();
  if (!db || !id) return { data: null, error: null };
  try {
    const { data, error } = await db.from('authors').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return { data: data ? toDoc(data) : null, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

export async function adminGetCategoryById(id) {
  const db = getAdminDb();
  if (!db || !id) return { data: null, error: null };
  try {
    const { data, error } = await db.from('categories').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return { data: data ? toDoc(data) : null, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}
