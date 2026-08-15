// pages/api/admin/monitor-scan-now.js
// Manual "Scan Now" trigger for the admin UI — lets an editor/admin
// immediately check one or a few specific tools instead of waiting for
// the daily cron cursor to reach them. Same engine, same rules.
import { requireAuth } from '../../../lib/supabaseAdmin';
import { runMonitoringBatch } from '../../../lib/monitoring/runCheck';

const MAX_MANUAL_BATCH = 5;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = await requireAuth(req);
  if (auth.error) {
    return res.status(403).json({ error: auth.error });
  }

  const slugs = Array.isArray(req.body?.slugs) ? req.body.slugs.slice(0, MAX_MANUAL_BATCH) : [];
  if (slugs.length === 0) {
    return res.status(400).json({ error: 'Provide { slugs: ["tool-slug", ...] } — max 5 per manual scan.' });
  }

  try {
    const { runId, results } = await runMonitoringBatch(slugs);
    return res.status(200).json({ ok: true, runId, results });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Unknown error' });
  }
}
