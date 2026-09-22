// pages/api/admin/revalidate-change.js
//
// Minimal on-demand revalidation hook for Confirm/Dismiss, which (unlike
// Ship) run entirely client-side via lib/cms/monitoring.js and therefore
// have no server-side hook of their own. Ship already revalidates its own
// pages in pages/api/admin/ship-change.js; this route exists only for the
// two actions that don't. Same auth level as ship-change: requireAuth
// (editor or admin), never requireAdmin.
//
// No DB mutation here -- Next.js revalidation only.
import { requireAuth } from '../../../lib/supabaseAdmin';

const SLUG_RE = /^[a-z0-9-]+$/;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = await requireAuth(req);
  if (auth.error) {
    return res.status(403).json({ error: auth.error });
  }

  const { slug } = req.body || {};
  if (typeof slug !== 'string' || !SLUG_RE.test(slug)) {
    return res.status(400).json({ error: 'slug must match ^[a-z0-9-]+$' });
  }

  const revalidated = [];
  const warnings = [];
  for (const path of ['/changes', `/tools/${slug}`]) {
    try {
      await res.revalidate(path);
      revalidated.push(path);
    } catch (err) {
      warnings.push(`${path}: ${err.message}`);
    }
  }

  return res.status(200).json({ ok: true, revalidated, warnings });
}
