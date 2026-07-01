// lib/firestoreShim.js — a small Firestore-Admin-SDK-like wrapper over a
// Supabase service-role client. Supports exactly the subset of the Admin SDK
// surface used across pages/api/**: collection().doc().get/update/delete/set,
// collection().add(), collection().where().orderBy().limit().get(), batch().
//
// Storage model: every "collection" is a Postgres table with `id` (text) and
// a `doc` jsonb column holding the full record, plus a few generated columns
// mirrored out of `doc` for filtering (see supabase/migrations). The `users`
// collection from the old Firestore schema maps onto public.profiles, which
// has real (non-jsonb) columns instead of a `doc` column.

const PROFILE_TABLES = new Set(['users']);
const TABLE_ALIASES = { users: 'profiles' };

// Maps Firestore-era camelCase field names to the actual generated/real
// column name used for filtering/sorting in Postgres, per table.
const FIELD_MAP = {
  affiliate_links: { toolSlug: 'tool_slug' },
  newsletter_campaigns: { sentAt: 'sent_at', scheduledAt: 'scheduled_at' },
};

function resolveTable(name) {
  return TABLE_ALIASES[name] || name;
}

function resolveField(name, field) {
  return (FIELD_MAP[name] && FIELD_MAP[name][field]) || field;
}

function nowIso() {
  return new Date().toISOString();
}

// Recursively turn any Date instances into ISO strings (mirrors Firestore's
// automatic Timestamp handling so callers can pass `new Date()` directly).
function serialize(value) {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(serialize);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = serialize(v);
    return out;
  }
  return value;
}

function rowToSnap(table, row) {
  if (!row) return { exists: false, id: null, data: () => undefined };
  const isProfile = PROFILE_TABLES.has(table) || table === 'profiles';
  const data = isProfile ? { ...row, id: undefined } : { ...(row.doc || {}) };
  delete data.id;
  return { exists: true, id: row.id, data: () => data, ref: makeDocRef.bind(null) };
}

function makeDocRef(client, collectionName, id) {
  const table = resolveTable(collectionName);
  const isProfile = PROFILE_TABLES.has(collectionName) || table === 'profiles';

  return {
    id,
    async get() {
      const { data: row, error } = await client.from(table).select('*').eq('id', id).maybeSingle();
      if (error) throw new Error(error.message);
      return rowToSnap(table, row);
    },
    async set(obj, opts = {}) {
      const clean = serialize(obj);
      if (isProfile) {
        const payload = { id, ...clean };
        const { error } = opts.merge
          ? await client.from(table).upsert(payload, { onConflict: 'id' })
          : await client.from(table).upsert(payload, { onConflict: 'id' });
        if (error) throw new Error(error.message);
        return;
      }
      const { error } = await client.from(table).upsert({ id, doc: clean }, { onConflict: 'id' });
      if (error) throw new Error(error.message);
    },
    async update(obj) {
      const clean = serialize(obj);
      if (isProfile) {
        const { error } = await client.from(table).update(clean).eq('id', id);
        if (error) throw new Error(error.message);
        return;
      }
      // Shallow-merge into the jsonb doc column.
      const { data: existing, error: getErr } = await client.from(table).select('doc').eq('id', id).maybeSingle();
      if (getErr) throw new Error(getErr.message);
      const merged = { ...(existing?.doc || {}), ...clean };
      const { error } = await client.from(table).update({ doc: merged }).eq('id', id);
      if (error) throw new Error(error.message);
    },
    async delete() {
      const { error } = await client.from(table).delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
  };
}

function makeQuery(client, collectionName, state = { filters: [], order: null, lim: null }) {
  const table = resolveTable(collectionName);
  const isProfile = PROFILE_TABLES.has(collectionName) || table === 'profiles';

  const api = {
    where(field, op, value) {
      const col = isProfile ? field : resolveField(collectionName, field);
      return makeQuery(client, collectionName, {
        ...state,
        filters: [...state.filters, { col, op, value }],
      });
    },
    orderBy(field, dir = 'asc') {
      const col = isProfile ? field : resolveField(collectionName, field);
      return makeQuery(client, collectionName, { ...state, order: { col, dir } });
    },
    limit(n) {
      return makeQuery(client, collectionName, { ...state, lim: n });
    },
    async get() {
      let q = client.from(table).select('*');
      for (const f of state.filters) {
        if (f.op === '==') q = q.eq(f.col, f.value);
        else if (f.op === '!=') q = q.neq(f.col, f.value);
        else if (f.op === 'array-contains') q = q.contains(f.col, [f.value]);
        else if (f.op === '>') q = q.gt(f.col, f.value);
        else if (f.op === '>=') q = q.gte(f.col, f.value);
        else if (f.op === '<') q = q.lt(f.col, f.value);
        else if (f.op === '<=') q = q.lte(f.col, f.value);
      }
      if (state.order) q = q.order(state.order.col, { ascending: state.order.dir !== 'desc' });
      if (state.lim) q = q.limit(state.lim);
      const { data: rows, error } = await q;
      if (error) throw new Error(error.message);
      const docs = (rows || []).map(row => ({
        ...rowToSnap(table, row),
        ref: makeDocRef(client, collectionName, row.id),
      }));
      return { empty: docs.length === 0, docs, size: docs.length };
    },
  };
  return api;
}

function makeCollection(client, name) {
  const table = resolveTable(name);
  return {
    doc(id) {
      return makeDocRef(client, name, id);
    },
    async add(obj) {
      const clean = serialize(obj);
      const isProfile = PROFILE_TABLES.has(name) || table === 'profiles';
      const payload = isProfile ? clean : { doc: clean };
      const { data: row, error } = await client.from(table).insert(payload).select('*').single();
      if (error) throw new Error(error.message);
      return makeDocRef(client, name, row.id);
    },
    where(field, op, value) {
      return makeQuery(client, name).where(field, op, value);
    },
    orderBy(field, dir) {
      return makeQuery(client, name).orderBy(field, dir);
    },
    limit(n) {
      return makeQuery(client, name).limit(n);
    },
    async get() {
      return makeQuery(client, name).get();
    },
  };
}

export function makeFirestoreShim(client) {
  return {
    collection(name) {
      return makeCollection(client, name);
    },
    batch() {
      const ops = [];
      return {
        update(ref, obj) {
          ops.push(() => ref.update(obj));
        },
        delete(ref) {
          ops.push(() => ref.delete());
        },
        set(ref, obj, opts) {
          ops.push(() => ref.set(obj, opts));
        },
        async commit() {
          for (const op of ops) await op();
        },
      };
    },
  };
}

export { nowIso };
