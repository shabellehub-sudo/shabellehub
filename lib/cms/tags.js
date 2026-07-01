// ─── CMS DATA ACCESS — TAGS (SUPABASE) ───────────────────────────────────────
import { list, getOneByField, create, update, remove } from './_base';
const TABLE = 'tags';

export async function listTags() {
  return list(TABLE, { orderField: 'name', orderDir: 'asc', lim: 1000 });
}
export async function getTagBySlug(slug) {
  return getOneByField(TABLE, 'slug', slug);
}
export async function createTag(payload) {
  const { data: existing } = await getTagBySlug(payload.slug);
  if (existing) return { data: null, error: `Tag slug "${payload.slug}" already exists.` };
  return create(TABLE, payload, {});
}
export async function updateTag(id, payload) {
  return update(TABLE, id, payload, {});
}
export async function deleteTag(id) {
  return remove(TABLE, id);
}
