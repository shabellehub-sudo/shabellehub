// ─── CMS DATA ACCESS — ANNOUNCEMENTS (SUPABASE) ──────────────────────────────
import { isSupabaseConfigured } from '../supabase';
import { list, getById, create, update, remove, NOT_CONFIGURED } from './_base';
const TABLE = 'announcements';

export async function listAnnouncements() {
  return list(TABLE, { orderField: 'created_at', orderDir: 'desc', lim: 200 });
}
export async function getAnnouncement(id) {
  const r = await getById(TABLE, id);
  if (r.error) return r;
  if (!r.data) return { data: null, error: 'Not found.' };
  return r;
}
export async function getActiveAnnouncement() {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const res = await list(TABLE, { filters: { active: true }, orderField: 'created_at', orderDir: 'desc', lim: 200 });
  if (res.error) return { data: null, error: res.error };
  const now = new Date();
  const active = res.data.find(a => {
    if (a.startsAt && new Date(a.startsAt) > now) return false;
    if (a.endsAt && new Date(a.endsAt) < now) return false;
    return true;
  });
  return { data: active ?? null, error: null };
}
export async function createAnnouncement(payload, userId) {
  return create(TABLE, {
    text: '', type: 'info', enabled: false, dismissible: true,
    ctaText: '', ctaUrl: '', startsAt: null, endsAt: null,
    ...payload, active: payload.enabled ?? false,
  }, { userId });
}
export async function updateAnnouncement(id, payload, userId) {
  const merged = { ...payload };
  if (payload.enabled !== undefined) merged.active = payload.enabled;
  return update(TABLE, id, merged, { userId });
}
export async function deleteAnnouncement(id) {
  const r = await remove(TABLE, id);
  if (r.error) return { data: null, error: r.error };
  return { data: { id }, error: null };
}
