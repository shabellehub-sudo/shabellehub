// pages/api/admin/cms/navigation.js
// GET  — public read
// POST — authenticated write (editor+)
import { getNavigation, updateNavigation } from '../../../../lib/cms/navigation';
import { requireAuth } from '../../../../lib/supabaseAdmin';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const r = await getNavigation();
    if (r.error) return res.status(500).json({ error: r.error });
    return res.status(200).json({ data: r.data });
  }

  if (req.method === 'POST') {
    const auth = await requireAuth(req);
    if (auth.error) return res.status(401).json({ error: auth.error });
    const r = await updateNavigation(req.body, auth.uid);
    if (r.error) return res.status(500).json({ error: r.error });
    return res.status(200).json({ data: r.data });
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end();
}
