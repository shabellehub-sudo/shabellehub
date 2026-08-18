// lib/monitoring/runCheck.js
import { randomUUID } from 'crypto';
import { getSupabaseAdmin } from '../supabaseAdmin';
import { getMonitoringUrls } from './sources';
import { fetchSnapshot } from './fetchSnapshot';
import { diffSnapshots } from './diffSnapshots';
import { shouldSuppress } from './suppression';

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

    // Suppression check — if the admin has repeatedly dismissed this exact
    // tool + category + source pattern, treat it as a known false positive
    // instead of creating yet another pending_review entry.
    const suppressed = await shouldSuppress(db, slug, diff.category, sourceUrl);
    if (suppressed) {
      await logAudit(db, runId, slug, sourceUrl, 'suppressed', `${diff.category} change auto-suppressed (matches a pattern dismissed 3+ times)`);
      results.push({ slug, outcome: 'suppressed', category: diff.category });
      await sleep(DELAY_BETWEEN_TOOLS_MS);
      continue;
    }

    const { data: links } = await db
      .from('tool_article_links')
      .select('article_slug')
      .eq('tool_slug', slug);
    const affectedArticles = [...new Set((links || []).map((l) => l.article_slug).filter(Boolean))];

    // Non-official sources (Wikipedia, third-party) can lag behind the
    // real release, so cap displayed confidence at 'medium' to reflect that
    // uncertainty even if the classifier itself was confident.
    const isOfficialSource = sourceType === 'official' || sourceType === 'support';
    const displayConfidence = isOfficialSource ? diff.confidence : (diff.confidence === 'high' ? 'medium' : diff.confidence);

    await db.from('tool_changes').insert({
      doc: {
        tool_slug: slug,
        previous_snapshot_id: previous.id,
        current_snapshot_id: inserted.id,
        change_category: diff.category,
        diff_excerpt: diff.excerpt,
        ai_summary: diff.summary || null,
        classified_by: diff.classifiedBy || 'keyword',
        confidence: displayConfidence,
        source_type: sourceType,
        evidence_url: sourceUrl,
        affected_article_slugs: affectedArticles,
        status: 'pending_review',
        detected_at: new Date().toISOString(),
      },
    });

    await logAudit(db, runId, slug, sourceUrl, 'diff_detected', diff.summary || `${diff.category} (${diff.confidence} confidence)`);
    results.push({ slug, outcome: 'diff_detected', category: diff.category });

    await sleep(DELAY_BETWEEN_TOOLS_MS);
  }

  return { runId, results };
}
