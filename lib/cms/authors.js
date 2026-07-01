// ─── CMS DATA ACCESS — AUTHORS (SUPABASE) ────────────────────────────────────
import { list, getById, getOneByField, create, update, remove } from './_base';
const TABLE = 'authors';

export async function listAuthors() {
  return list(TABLE, { orderField: 'name', orderDir: 'asc', lim: 1000 });
}
export async function getAuthorById(id) {
  return getById(TABLE, id);
}
export async function getAuthorBySlug(slug) {
  return getOneByField(TABLE, 'slug', slug);
}
export async function createAuthor(payload) {
  return create(TABLE, payload, {});
}
export async function updateAuthor(id, payload) {
  return update(TABLE, id, payload, {});
}
export async function deleteAuthor(id) {
  return remove(TABLE, id);
}
