// lib/monitoring/suppression.js
// Learns from admin Confirm/Dismiss decisions to auto-suppress recurring
// false positives — no new database table needed, this reads the existing
// tool_changes history (status: 'dismissed').
//
// Rule: if the last N changes MATCHING this exact tool_slug + change_category
// + evidence_url pattern were ALL dismissed, treat the next matching diff as
// noise instead of creating another pending_review entry. This targets
// sources that repeatedly produce the same false-positive pattern (e.g. an
// ad banner rotating text on a tool's page).

const DISMISS_THRESHOLD = 3;
// Bounds the raw per-tool fetch before category/url filtering. tool_slug is
// a real flat column (confirmed via schema inspection), so this query is
// already scoped to one tool's history -- this cap is just a generous
// safety ceiling, not a semantic "recent window" (that was the bug: the
// old LOOKBACK=5 capped the RAW multi-category fetch, so 3 real matching
// dismissals could be pushed out of the window by unrelated newer changes
// in a different category, permanently preventing suppression for a
// pattern the admin had already dismissed 3+ times).
const MAX_HISTORY_SCAN = 100;

export async function shouldSuppress(db, slug, category, evidenceUrl) {
  const { data: history, error } = await db
    .from('tool_changes')
    .select('id, doc')
    .eq('tool_slug', slug) // flat column, safe
    .order('detected_at', { ascending: false })
    .limit(MAX_HISTORY_SCAN);

  // Fail-open: a DB error here must not be treated as "no suppression
  // data" turning into a crash -- shouldSuppress() is called inline inside
  // runCheck.js's per-tool processing, and an uncaught throw here would
  // otherwise count as a tool_exception for this tool's entire run instead
  // of just skipping the suppression check and continuing normally.
  if (error || !history) return false;

  // change_category and evidence_url are NOT flat columns (confirmed via
  // schema inspection) -- they only exist inside doc, so filtering happens
  // here in JS rather than as a query-level JSON-path filter (that syntax
  // was never verified against the live Supabase query builder).
  const matching = history.filter(
    (r) => r.doc.change_category === category && r.doc.evidence_url === evidenceUrl
  );

  if (matching.length < DISMISS_THRESHOLD) return false;

  // matching is already sorted by detected_at desc (inherited from the
  // query), so this is the most recent DISMISS_THRESHOLD occurrences of
  // this exact pattern -- not just "whatever happened to survive an
  // unrelated recency window."
  const mostRecentMatching = matching.slice(0, DISMISS_THRESHOLD);
  return mostRecentMatching.every((r) => r.doc.status === 'dismissed');
}
