// ─── SERVER-ONLY: Post queries via Firebase Admin SDK ─────────────────────────
// Used exclusively in getStaticProps / getStaticPaths.
// directly — all Admin SDK initialisation lives in lib/supabaseAdmin.js (the
// only file the env-leakage script allows those vars in).

import { getAdminDb } from '../supabaseAdmin';

function ts(v) {
  if (!v) return null;
  if (v && typeof v.toDate === 'function') return v.toDate().toISOString();
  return v;
}

function toPost(snap) {
  const d = snap.data();
  return sanitize({
    id: snap.id,
    ...d,
    created_at:       ts(d.created_at),
    updated_at:       ts(d.updated_at),
    published_at:     ts(d.published_at),
    scheduled_for:    ts(d.scheduled_for),
    last_reviewed_at: ts(d.last_reviewed_at),
  });
}

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
    let q = db.collection('posts')
      .where('status', '==', 'published')
      .orderBy('published_at', 'desc')
      .limit(lim);

    if (categoryId) q = q.where('category_id', '==', categoryId);
    if (tagSlug)    q = q.where('tags', 'array-contains', tagSlug);

    const snap = await q.get();
    return { data: snap.docs.map(toPost), error: null };
  } catch (err) {
    console.error('[postsAdmin] adminListPublishedPosts error:', err.message);
    return { data: [], error: err.message };
  }
}

export async function adminGetPostBySlug(slug) {
  const db = getAdminDb();
  if (!db) return { data: null, error: 'Admin SDK not configured.' };
  try {
    const snap = await db.collection('posts')
      .where('slug', '==', slug)
      .limit(1)
      .get();
    return { data: snap.empty ? null : toPost(snap.docs[0]), error: null };
  } catch (err) {
    console.error('[postsAdmin] adminGetPostBySlug error:', err.message);
    return { data: null, error: err.message };
  }
}

// Recursively converts any Firestore Timestamp objects (or other non-plain
// objects with a toDate()/toMillis() method) found anywhere in a value into
// JSON-serializable strings, so getStaticProps never chokes on them.
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

export async function adminListCategories() {
  const db = getAdminDb();
  if (!db) return { data: [], error: 'Admin SDK not configured.' };
  try {
    const snap = await db.collection('categories').orderBy('name', 'asc').get();
    return { data: snap.docs.map(s => sanitize({ id: s.id, ...s.data() })), error: null };
  } catch (err) {
    return { data: [], error: err.message };
  }
}

export async function adminListTags() {
  const db = getAdminDb();
  if (!db) return { data: [], error: 'Admin SDK not configured.' };
  try {
    const snap = await db.collection('tags').orderBy('name', 'asc').get();
    return { data: snap.docs.map(s => sanitize({ id: s.id, ...s.data() })), error: null };
  } catch (err) {
    return { data: [], error: err.message };
  }
}

export async function adminGetAuthorById(id) {
  const db = getAdminDb();
  if (!db || !id) return { data: null, error: null };
  try {
    const snap = await db.collection('authors').doc(id).get();
    return { data: snap.exists ? { id: snap.id, ...snap.data() } : null, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

export async function adminGetCategoryById(id) {
  const db = getAdminDb();
  if (!db || !id) return { data: null, error: null };
  try {
    const snap = await db.collection('categories').doc(id).get();
    return { data: snap.exists ? { id: snap.id, ...snap.data() } : null, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}
