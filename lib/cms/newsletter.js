// ─── CMS DATA ACCESS — NEWSLETTER SUBSCRIBERS (SUPABASE) ─────────────────────
import { isSupabaseConfigured } from '../supabase';
import { list, getOneByField, create, update, remove, count, NOT_CONFIGURED } from './_base';
const TABLE = 'subscribers';

export async function listSubscribers({ status, source, sortField = 'created_at', sortDir = 'desc', lim = 500 } = {}) {
  return list(TABLE, { filters: { status, source }, orderField: sortField, orderDir: sortDir, lim });
}

export async function getSubscriberByEmail(email) {
  return getOneByField(TABLE, 'email', email.toLowerCase());
}

export async function countSubscribers(status = null) {
  if (!isSupabaseConfigured()) return { data: 0, error: NOT_CONFIGURED.error };
  const r = await count(TABLE, status ? { status } : {});
  return r;
}

export async function createSubscriber({ email, source = 'homepage', tags = [], confirmed = true }) {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const safeEmail = email.trim().toLowerCase();
  const existing = await getSubscriberByEmail(safeEmail);
  if (existing.data) return { data: null, error: 'already_subscribed' };
  const res = await create(TABLE, { email: safeEmail, status: 'active', source, tags, confirmed }, {});
  if (res.error) return { data: null, error: res.error };
  return { data: { id: res.data.id }, error: null };
}

export async function updateSubscriberStatus(id, status) {
  const res = await update(TABLE, id, { status }, {});
  if (res.error) return { data: null, error: res.error };
  return { data: { id }, error: null };
}

export async function unsubscribeByEmail(email) {
  const existing = await getSubscriberByEmail(email.trim().toLowerCase());
  if (!existing.data) return { data: null, error: 'not_found' };
  const res = await update(TABLE, existing.data.id, { status: 'unsubscribed' }, {});
  if (res.error) return { data: null, error: res.error };
  return { data: { id: existing.data.id }, error: null };
}

export async function deleteSubscriber(id) {
  const res = await remove(TABLE, id);
  if (res.error) return { data: null, error: res.error };
  return { data: { id }, error: null };
}
