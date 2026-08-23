// lib/monitoring/runCheck.js
import { randomUUID } from 'crypto';
import { getSupabaseAdmin } from '../supabaseAdmin.js';
import { getMonitoringUrls } from './sources.js';
import { fetchSnapshot } from './fetchSnapshot.js';
import { diffSnapshots } from './diffSnapshots.js';
import { shouldSuppress } from './suppression.js';
import { classifySearchGrounded, checkSearchGroundingBudget } from './classifySearchGrounded.js';

const DELAY_BETWEEN_TOOLS_MS = 2500;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function logAudit(db, runId, slug, sourceUrl, action, detail) {
  await db.from('monitoring_audit_log').insert({
    doc: {
      run_id: runId, tool_slug: slug, source_url: sourceUrl, action,
      detail: detail || null, created_at: new Date().toISOString(),
    },
  });
}

// Fix A/B (Phase 2): createPendingChange() now returns a structured
// result instead of a bare undefined, so the caller in
// runMonitoringBatch() can tell apart three distinct outcomes --
// genuine success, an intentional duplicate skip, and a real DB
// failure -- rather than always assuming success. Exported so it can
// be unit-tested locally with a mocked `db`.
export async function createPendingChange(db, { slug, previousId, currentId, category, excerpt, oldValue, newValue, summary, classifiedBy, confidence, sourceType, sourceUrl }) {
  // Duplicate detection: skip if an identical pending change (same tool,
  // category, and excerpt) was already recorded in the last 24h. Prevents
  // spammy repeats when a flaky source flips between two states across
  // several scans.
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: recentDupes } = await db
    .from('tool_changes')
    .select('id, doc')
    .eq('tool_slug', slug)
    .gte('detected_at', since);
  const isDuplicate = (recentDupes || []).some(
    (r) => r.doc.change_category === category && r.doc.diff_excerpt === excerpt
  );
  if (isDuplicate) return { ok: false, skipped: true, reason: 'duplicate' };

  const { data: links } = await db
    .from('tool_article_links')
    .select('article_slug')
    .eq('tool_slug', slug);
  const affectedArticles = [...new Set((links || []).map((l) => l.article_slug).filter(Boolean))];

  const { error: insertErr } = await db.from('tool_changes').insert({
    doc: {
      tool_slug: slug,
      previous_snapshot_id: previousId,
      current_snapshot_id: currentId,
      change_category: category,
      diff_excerpt: excerpt,
      old_value: oldValue || null,
      new_value: newValue || null,
      ai_summary: summary || null,
      classified_by: classifiedBy,
      confidence,
      source_type: sourceType,
      evidence_url: sourceUrl,
      affected_article_slugs: affectedArticles,
      status: 'pending_review',
      detected_at: new Date().toISOString(),
    },
  });

  // Fix B: never silently swallow a failed insert -- without this check
  // the caller had no way to know tool_changes.insert() failed and would
  // log/report the scan as a successful diff_detected regardless.
  if (insertErr) return { ok: false, skipped: false, reason: 'db_error', error: insertErr.message };

  return { ok: true, skipped: false };
}

export async function runMonitoringBatch(toolSlugs) {
  const db = getSupabaseAdmin();
  const runId = randomUUID();
  const results = [];

  for (const rawSlug of toolSlugs) {
    const slug = rawSlug.trim().toLowerCase();
    const { data: toolRow } = await db.from('tools').select('id, doc').eq('slug', slug).maybeSingle();
    const tool = toolRow ? { slug, ...toolRow.doc } : null;

    if (!tool) {
      await logAudit(db, runId, slug, null, 'fetch_failed', 'Tool not found in database');
      results.push({ slug, outcome: 'tool_not_found' });
      continue;
    }

    const candidates = getMonitoringUrls(tool);
    if (candidates.length === 0) {
      await logAudit(db, runId, slug, null, 'fetch_failed', 'No monitoring URL configured');
      results.push({ slug, outcome: 'no_url' });
      continue;
    }

    let sourceUrl = candidates[0].url;
    let sourceType = candidates[0].type;
    let snap = await fetchSnapshot(slug, sourceUrl);
    for (let i = 1; i < candidates.length && snap.outcome !== 'fetched'; i++) {
      sourceUrl = candidates[i].url;
      sourceType = candidates[i].type;
      snap = await fetchSnapshot(slug, sourceUrl);
    }

    // Entire chain (official -> support -> wikipedia) failed to fetch.
    // Last resort: ask Gemini to search the web directly instead of
    // scraping a specific URL. This is evidence, not a source of truth —
    // confidence is always capped 'low' and it respects a daily budget cap.
    if (snap.outcome !== 'fetched') {
      const withinBudget = await checkSearchGroundingBudget(db);
      if (withinBudget) {
        const grounded = await classifySearchGrounded(tool.name || slug);
        if (grounded && grounded.signal) {
          await createPendingChange(db, {
            slug,
            previousId: null,
            currentId: null,
            category: grounded.category,
            excerpt: grounded.summary,
            summary: grounded.summary,
            classifiedBy: 'ai_search',
            confidence: grounded.confidence,
            sourceType: 'ai_search',
            sourceUrl: grounded.evidenceUrl,
          });
          await logAudit(db, runId, slug, sourceUrl, 'ai_search_grounded', grounded.summary);
          results.push({ slug, outcome: 'ai_search_grounded', category: grounded.category });
          await sleep(DELAY_BETWEEN_TOOLS_MS);
          continue;
        }
        await logAudit(db, runId, slug, sourceUrl, 'ai_search_grounded', 'No notable signal found via AI search');
      }
    }

    if (snap.outcome === 'robots_disallowed') {
      await logAudit(db, runId, slug, sourceUrl, 'robots_disallowed', 'Disallowed by robots.txt');
      results.push({ slug, outcome: 'robots_disallowed' });
      await sleep(DELAY_BETWEEN_TOOLS_MS);
      continue;
    }

    if (snap.outcome === 'fetch_failed' || snap.outcome === 'fetch_incomplete') {
      await db.from('tool_snapshots').insert({
        doc: {
          tool_slug: slug, source_url: sourceUrl, source_type: sourceType, fetched_at: new Date().toISOString(),
          http_status: snap.http_status, normalized_text: null, text_hash: null,
          fetch_error: snap.fetch_error,
        },
      });
      await logAudit(db, runId, slug, sourceUrl, snap.outcome, snap.fetch_error);
      results.push({ slug, outcome: snap.outcome, http_status: snap.http_status, fetch_error: snap.fetch_error });
      await sleep(DELAY_BETWEEN_TOOLS_MS);
      continue;
    }

    const { data: inserted, error: insertErr } = await db
      .from('tool_snapshots')
      .insert({
        doc: {
          tool_slug: slug, source_url: sourceUrl, source_type: sourceType, fetched_at: new Date().toISOString(),
          http_status: snap.http_status, normalized_text: snap.normalized_text,
          text_hash: snap.text_hash, fetch_error: null,
        },
      })
      .select('id')
      .single();

    if (insertErr || !inserted) {
      await logAudit(db, runId, slug, sourceUrl, 'fetch_failed', `Snapshot insert failed: ${insertErr?.message}`);
      results.push({ slug, outcome: 'snapshot_insert_failed' });
      await sleep(DELAY_BETWEEN_TOOLS_MS);
      continue;
    }

    const { data: prevRows } = await db
      .from('tool_snapshots')
      .select('id, doc')
      .eq('tool_slug', slug)
      .not('text_hash', 'is', null)
      .order('fetched_at', { ascending: false })
      .limit(2);

    const previous = (prevRows || []).find((r) => r.id !== inserted.id);

    if (!previous) {
      await logAudit(db, runId, slug, sourceUrl, 'fetched', 'First snapshot — baseline established, nothing to compare yet');
      results.push({ slug, outcome: 'baseline_established' });
      await sleep(DELAY_BETWEEN_TOOLS_MS);
      continue;
    }

    if (previous.doc.text_hash === snap.text_hash) {
      await logAudit(db, runId, slug, sourceUrl, 'no_change', null);
      results.push({ slug, outcome: 'no_change' });
      await sleep(DELAY_BETWEEN_TOOLS_MS);
      continue;
    }

    const diff = await diffSnapshots(previous.doc.normalized_text, snap.normalized_text);

    if (!diff.changed || !diff.signal) {
      await logAudit(db, runId, slug, sourceUrl, 'no_change', 'Text hash differs but no significant signal detected');
      results.push({ slug, outcome: 'no_significant_change' });
      await sleep(DELAY_BETWEEN_TOOLS_MS);
      continue;
    }

    const suppressed = await shouldSuppress(db, slug, diff.category, sourceUrl);
    if (suppressed) {
      await logAudit(db, runId, slug, sourceUrl, 'suppressed', `${diff.category} change auto-suppressed (matches a pattern dismissed 3+ times)`);
      results.push({ slug, outcome: 'suppressed', category: diff.category });
      await sleep(DELAY_BETWEEN_TOOLS_MS);
      continue;
    }

    const isOfficialSource = sourceType === 'official' || sourceType === 'support';
    const displayConfidence = isOfficialSource ? diff.confidence : (diff.confidence === 'high' ? 'medium' : diff.confidence);

    const pendingResult = await createPendingChange(db, {
      slug,
      previousId: previous.id,
      currentId: inserted.id,
      category: diff.category,
      excerpt: diff.excerpt,
      oldValue: diff.oldValue,
      newValue: diff.newValue,
      summary: diff.summary,
      classifiedBy: diff.classifiedBy || 'keyword',
      confidence: displayConfidence,
      sourceType,
      sourceUrl,
    });

    // Fix A: a duplicate skip is not a diff -- report it as its own
    // outcome instead of falsely logging diff_detected.
    if (pendingResult.skipped) {
      await logAudit(db, runId, slug, sourceUrl, 'duplicate_suppressed', `${diff.category} change matches an existing pending change within the last 24h`);
      results.push({ slug, outcome: 'duplicate_suppressed', category: diff.category });
      await sleep(DELAY_BETWEEN_TOOLS_MS);
      continue;
    }

    // Fix B: a failed tool_changes insert is not a successful diff
    // detection -- report it as its own failure outcome.
    if (!pendingResult.ok) {
      await logAudit(db, runId, slug, sourceUrl, 'db_insert_failed', pendingResult.error || 'tool_changes insert failed');
      results.push({ slug, outcome: 'db_insert_failed', category: diff.category, error: pendingResult.error });
      await sleep(DELAY_BETWEEN_TOOLS_MS);
      continue;
    }

    await logAudit(db, runId, slug, sourceUrl, 'diff_detected', diff.summary || `${diff.category} (${diff.confidence} confidence)`);
    results.push({ slug, outcome: 'diff_detected', category: diff.category });

    await sleep(DELAY_BETWEEN_TOOLS_MS);
  }

  return { runId, results };
}
