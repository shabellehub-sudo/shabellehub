// ─── CMS DATA ACCESS — CATEGORIES (SUPABASE) ─────────────────────────────────
import { list, getById, create, update, remove } from './_base';
const TABLE = 'categories';

export async function listCategories() {
  return list(TABLE, { orderField: 'name', orderDir: 'asc', lim: 1000 });
}
export async function getCategoryById(id) {
  return getById(TABLE, id);
}
export async function createCategory(payload) {
  return create(TABLE, payload, {});
}
export async function updateCategory(id, payload) {
  return update(TABLE, id, payload, {});
}
export async function deleteCategory(id) {
  return remove(TABLE, id);
}
