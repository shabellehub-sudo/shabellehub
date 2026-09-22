// lib/changes/anchors.js
// PURE module: zero imports, no env/browser/Supabase/Next APIs.
// One shared anchor function for /changes and the RSS feed.
//
// NOTE: Anchors are deterministic for a given dataset; a late-confirmed
// same-day change can shift suffixes.

// Returns a normalized UTC ISO string (YYYY-MM-DDTHH:mm:ss.sssZ).
// Throws on missing/unparseable values (never invents a date).
export function normalizeDetectedAt(value) {
  const ok = (typeof value === 'string' && value.trim() !== '') || value instanceof Date;
  if (!ok) throw new Error(`Invalid detected_at: ${String(value)}`);
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw new Error(`Invalid detected_at: ${String(value)}`);
  const iso = d.toISOString();
  // JS silently rolls impossible dates over (2026-09-31 -> Oct 1). Reject that,
  // independent of any timezone offset in the string.
  if (typeof value === 'string') {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
    if (m) {
      const mo = Number(m[2]);
      const da = Number(m[3]);
      const dim = new Date(Date.UTC(Number(m[1]), mo, 0)).getUTCDate();
      if (mo < 1 || mo > 12 || da < 1 || da > dim) {
        throw new Error(`Invalid detected_at (impossible date): ${value}`);
      }
    }
  }
  return iso;
}

function cmp(a, b) {
  return a < b ? -1 : a > b ? 1 : 0; // never localeCompare
}

// records: [{ id, tool_slug, detected_at }]
// Returns a NEW array (input untouched) in ASSIGNMENT order
// (detected_at ASC, then id ASC), each item = { ...record, detected_at: <UTC ISO>, anchor }.
// Callers must build any display ordering from this result separately.
export function assignAnchors(records) {
  if (!Array.isArray(records)) throw new Error('assignAnchors expects an array');
  const prepared = records.map((r) => {
    if (!r || typeof r.tool_slug !== 'string' || r.tool_slug === '' || /\s/.test(r.tool_slug)) {
      throw new Error('Invalid tool_slug for anchor');
    }
    if (r.id === null || r.id === undefined || String(r.id) === '') {
      throw new Error('Missing id (needed as deterministic tie-breaker)');
    }
    return { ...r, detected_at: normalizeDetectedAt(r.detected_at) };
  });
  prepared.sort((a, b) => cmp(a.detected_at, b.detected_at) || cmp(String(a.id), String(b.id)));

  const counts = new Map();
  const used = new Set();
  return prepared.map((r) => {
    const base = `${r.tool_slug}-${r.detected_at.slice(0, 10)}`; // UTC date
    let n = (counts.get(base) || 0) + 1;
    let anchor = n === 1 ? base : `${base}-${n}`;
    while (used.has(anchor)) { n += 1; anchor = `${base}-${n}`; }
    counts.set(base, n);
    used.add(anchor);
    return { ...r, anchor };
  });
}
