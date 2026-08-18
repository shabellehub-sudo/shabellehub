// lib/monitoring/suppression.js
// Learns from admin Confirm/Dismiss decisions to auto-suppress recurring
// false positives — no new database table needed, this reads the existing
// tool_changes history (status: 'dismissed').
//
// Rule: if the last N changes for a given tool_slug + change_category +
// evidence_url were ALL dismissed, treat the next matching diff as noise
// instead of creating another pending_review entry. This targets sources
// that repeatedly produce the same false-positive pattern (e.g. an ad
// banner rotating text on a tool's page).

const DISMISS_THRESHOLD = 3;
const LOOKBACK = 5;

export async function shouldSuppress(db, slug, category, evidenceUrl) {
  const { data: recent } = await db
    .from('tool_changes')
    .select('id, doc')
    .eq('tool_slug', slug)
    .order('detected_at', { ascending: false })
    .limit(LOOKBACK);

  if (!recent || recent.length < DISMISS_THRESHOLD) return false;

  const matching = recent.filter(
    (r) => r.doc.change_category === category && r.doc.evidence_url === evidenceUrl
  );

  if (matching.length < DISMISS_THRESHOLD) return false;

  return matching.every((r) => r.doc.status === 'dismissed');
}
