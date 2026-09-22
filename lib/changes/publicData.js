// lib/changes/publicData.js
// Turns raw tool_changes + tools rows into PUBLIC objects. No database access
// here (the caller supplies rows), so it can be tested with plain Node.
// The public shape never contains id, doc, reviewer/shipper ids, diffs,
// snapshots, old/new values, or article slugs.
import { assignAnchors } from './anchors.js';
import { rssPubTimestamp, sortRssItems } from './rssDates.js';

const PUBLIC_STATUSES = ['confirmed', 'shipped'];
const CATEGORY_LABELS = new Map([
  ['pricing', 'Pricing'],
  ['model_update', 'Model update'],
  ['plan_change', 'Plan change'],
]);
const SUMMARY_TEMPLATES = new Map([
  ['pricing', 'Pricing information changed'],
  ['model_update', 'Model update detected'],
  ['plan_change', 'Plan information changed'],
]);
const FALLBACK_SUMMARY = 'Change detected';

// Eligibility: status in (confirmed, shipped) AND priority !== 'low'
// AND source_type !== 'wikipedia'. Null values pass the two !== checks.
export function isEligible(row) {
  return (
    !!row &&
    PUBLIC_STATUSES.includes(row.status) &&
    row.priority !== 'low' &&
    row.source_type !== 'wikipedia'
  );
}

// https only; no credentials; no IP literals, localhost or internal-looking hosts.
export function safeEvidenceUrl(value) {
  if (typeof value !== 'string' || value.length === 0 || value.length > 2048) return null;
  let u;
  try { u = new URL(value.trim()); } catch { return null; }
  if (u.protocol !== 'https:' || u.username || u.password) return null;
  const host = u.hostname.toLowerCase();
  if (!host.includes('.') || host.includes(':') || /^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return null;
  if (host === 'localhost' || /\.(local|localhost|internal|lan|home)$/.test(host)) return null;
  return u.href;
}

function safeLogoUrl(value) {
  if (typeof value !== 'string') return null;
  const v = value.trim();
  return v.startsWith('https://') || (v.startsWith('/') && !v.startsWith('//')) ? v : null;
}

const cmpDesc = (a, b) => (a < b ? 1 : a > b ? -1 : 0);

// changeRows: [{ id, tool_slug, status, detected_at, priority, change_category,
//                evidence_url, source_type, ai_summary, reviewed_at }]
// toolRows:   PUBLISHED tools only: [{ slug, name, logo_url }]
// Returns { display, rss }:
//   display = newest first (detected_at DESC, id DESC), for /changes and tool pages
//   rss     = newest pubDate first (pubMs DESC, anchor ASC), includes pubMs
export function buildPublicChanges(changeRows, toolRows) {
  const tools = new Map();
  for (const t of toolRows || []) {
    if (t && typeof t.slug === 'string' && t.slug) tools.set(t.slug, t);
  }
  const resolved = (changeRows || []).filter(isEligible).filter((r) => tools.has(r.tool_slug));

  // Anchors are assigned from their OWN ascending pass; display order is built after.
  const assigned = assignAnchors(
    resolved.map((r) => ({ id: r.id, tool_slug: r.tool_slug, detected_at: r.detected_at, row: r }))
  );

  const items = assigned.map((a) => {
    const row = a.row;
    const tool = tools.get(a.tool_slug);
    const key = typeof row.change_category === 'string' ? row.change_category : '';
    const ai = typeof row.ai_summary === 'string' && row.ai_summary.trim() ? row.ai_summary.trim() : null;
    return {
      sortId: String(a.id), // tie-breaker only; never exposed
      pubMs: rssPubTimestamp(a.detected_at, row.reviewed_at),
      pub: {
        tool_slug: a.tool_slug,
        tool_name: String(tool.name || tool.slug),
        tool_logo: safeLogoUrl(tool.logo_url),
        detected_at: a.detected_at,
        category: CATEGORY_LABELS.get(key) || 'Update',
        evidence_url: safeEvidenceUrl(row.evidence_url),
        summary: ai || SUMMARY_TEMPLATES.get(key) || FALLBACK_SUMMARY,
        anchor: a.anchor,
      },
    };
  });

  const display = [...items]
    .sort((x, y) => cmpDesc(x.pub.detected_at, y.pub.detected_at) || cmpDesc(x.sortId, y.sortId))
    .map((i) => i.pub);
  const rss = sortRssItems(items.map((i) => ({ pubMs: i.pubMs, anchor: i.pub.anchor, pub: i.pub })))
    .map((i) => ({ ...i.pub, pubMs: i.pubMs }));
  return { display, rss };
}
