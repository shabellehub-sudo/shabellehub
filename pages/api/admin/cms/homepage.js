// pages/api/admin/cms/homepage.js
// GET  — public read (used by SSR/ISR pages)
// POST — authenticated write (editor+)
import { getHomepage, updateHomepage } from '../../../../lib/cms/homepage';
import { requireAuth } from '../../../../lib/supabaseAdmin';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const r = await getHomepage();
    if (r.error) return res.status(500).json({ error: r.error });
    return res.status(200).json({ data: r.data });
  }

  if (req.method === 'POST') {
    const auth = await requireAuth(req);
    if (auth.error) return res.status(401).json({ error: auth.error });
    const r = await updateHomepage(req.body, auth.uid);
    if (r.error) return res.status(500).json({ error: r.error });
    return res.status(200).json({ data: r.data });
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end();
}
