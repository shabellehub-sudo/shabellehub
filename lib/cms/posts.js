// ─── CMS DATA ACCESS — POSTS (SUPABASE) ──────────────────────────────────────
import { isSupabaseConfigured } from '../supabase';
import { list, getById, getOneByField, create, update, remove, count, NOT_CONFIGURED } from './_base';

const TABLE = 'posts';

export async function listPosts({
  status, categoryId, tagSlug, authorId, featured, search, limit: lim = 50,
} = {}) {
  const res = await list(TABLE, {
    filters: { status, category_id: categoryId, author_id: authorId, featured },
    orderField: 'updated_at', orderDir: 'desc', lim,
    arrayContains: tagSlug ? ['tags', tagSlug] : undefined,
  });
  if (res.error) return res;
  let posts = res.data;
  if (search) {
    const s = search.toLowerCase();
    posts = posts.filter(p => p.title?.toLowerCase().includes(s));
  }
  return { data: posts, error: null, count: posts.length };
}

export async function listPublishedPosts({ limit: lim = 50, categoryId, tagSlug } = {}) {
  return listPosts({ status: 'published', categoryId, tagSlug, limit: lim });
}

export async function listFeaturedPosts({ limit: lim = 3 } = {}) {
  return list(TABLE, { filters: { status: 'published', featured: true }, orderField: 'published_at', orderDir: 'desc', lim });
}

export async function listRecentPosts({ limit: lim = 6 } = {}) {
  return list(TABLE, { filters: { status: 'published' }, orderField: 'published_at', orderDir: 'desc', lim });
}

export async function getPostBySlug(slug) {
  return getOneByField(TABLE, 'slug', slug);
}

export async function getPostById(id) {
  return getById(TABLE, id);
}

export async function createPost(payload, userId) {
  return create(TABLE, payload, { userId, extra: { featured: false, tags: [] } });
}

export async function updatePost(id, payload, userId) {
  return update(TABLE, id, payload, { userId });
}

export async function deletePost(id) {
  return remove(TABLE, id);
}

export async function publishPost(id, userId) {
  return updatePost(id, { status: 'published', published_at: new Date().toISOString() }, userId);
}

export async function unpublishPost(id, userId) {
  return updatePost(id, { status: 'unpublished', published_at: null }, userId);
}

export async function schedulePost(id, scheduledFor, userId) {
  return updatePost(id, { status: 'scheduled', scheduled_for: scheduledFor }, userId);
}

export async function saveDraft(id, payload, userId) {
  return updatePost(id, { ...payload, status: 'draft' }, userId);
}

export async function toggleFeatured(id, currentValue, userId) {
  return updatePost(id, { featured: !currentValue }, userId);
}

export async function getPostCounts() {
  if (!isSupabaseConfigured()) {
    return { data: { total: 0, published: 0, draft: 0, scheduled: 0, featured: 0 }, error: NOT_CONFIGURED.error };
  }
  try {
    const [total, published, draft, scheduled, featured] = await Promise.all([
      count(TABLE, {}), count(TABLE, { status: 'published' }), count(TABLE, { status: 'draft' }),
      count(TABLE, { status: 'scheduled' }), count(TABLE, { featured: true }),
    ]);
    return {
      data: { total: total.data, published: published.data, draft: draft.data, scheduled: scheduled.data, featured: featured.data },
      error: null,
    };
  } catch (err) {
    return { data: { total: 0, published: 0, draft: 0, scheduled: 0, featured: 0 }, error: err.message };
  }
}

export async function updatePostSEO(id, seoPayload, userId) {
  const allowed = ['seo_title', 'seo_description', 'canonical_url', 'og_image_id', 'og_image_url'];
  const filtered = {};
  for (const k of allowed) if (seoPayload[k] !== undefined) filtered[k] = seoPayload[k];
  return updatePost(id, filtered, userId);
}

export async function listPostsSEOSummary({ limit: lim = 200 } = {}) {
  const res = await list(TABLE, { filters: { status: 'published' }, orderField: 'published_at', orderDir: 'desc', lim });
  if (res.error) return { data: [], error: res.error };
  return {
    data: res.data.map(d => ({
      id: d.id, title: d.title, slug: d.slug,
      seo_title: d.seo_title || '', seo_description: d.seo_description || '',
      canonical_url: d.canonical_url || '', og_image_url: d.og_image_url || '',
      published_at: d.published_at || null,
    })),
    error: null,
  };
}

export async function isSlugTaken(slug, excludeId = null) {
  if (!isSupabaseConfigured()) return false;
  try {
    const { data } = await getOneByField(TABLE, 'slug', slug);
    if (!data) return false;
    if (excludeId && data.id === excludeId) return false;
    return true;
  } catch {
    return false;
  }
}
