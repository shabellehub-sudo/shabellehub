// pages/api/cron/monitor-tools.js
// Triggered by Vercel Cron (see vercel.json). Processes a rotating batch
// of ~15 tools per day (cursor-based) so a full pass over ~100 tools
// completes roughly every 7 days, while each invocation stays well
// within serverless duration limits. Monitor & flag only — never edits
// tools or posts.
import { getSupabaseAdmin } from '../../../lib/supabaseAdmin';
import { runMonitoringBatch } from '../../../lib/monitoring/runCheck';

const BATCH_SIZE = 15;

export default async function handler(req, res) {
  const authHeader = req.headers.authorization || '';
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const db = getSupabaseAdmin();

    const { data: toolRows, error: toolsErr } = await db
      .from('tools')
      .select('slug')
      .eq('status', 'published')
      .order('slug', { ascending: true });

    if (toolsErr || !toolRows || toolRows.length === 0) {
      return res.status(500).json({ error: 'Could not load tool list', detail: toolsErr?.message });
    }

    const allSlugs = toolRows.map((t) => t.slug);

    const { data: cursorRow } = await db.from('monitoring_cursor').select('id, doc').limit(1).maybeSingle();
    const lastIndex = cursorRow?.doc?.last_index ?? 0;

    const startIndex = lastIndex % allSlugs.length;
    const batch = [];
    for (let i = 0; i < BATCH_SIZE && i < allSlugs.length; i++) {
      batch.push(allSlugs[(startIndex + i) % allSlugs.length]);
    }

    const { runId, results } = await runMonitoringBatch(batch);

    const nextIndex = (startIndex + batch.length) % allSlugs.length;
    if (cursorRow) {
      await db.from('monitoring_cursor').update({ doc: { last_index: nextIndex } }).eq('id', cursorRow.id);
    } else {
      await db.from('monitoring_cursor').insert({ doc: { last_index: nextIndex } });
    }

    return res.status(200).json({
      ok: true, runId, batchSize: batch.length, totalTools: allSlugs.length,
      nextStartIndex: nextIndex, results,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Unknown error' });
  }
}
