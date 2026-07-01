// pages/api/admin/tools/index.js
// GET — list all tools (admin use, returns all statuses)
// POST — create a tool

import { requireAuth } from '../../../../lib/supabaseAdmin';

export default async function handler(req, res) {
  const auth = await requireAuth(req);
  if (auth.error) {
    return res.status(auth.error.includes('configured') ? 503 : 401).json({ error: auth.error });
  }

  const db  = auth.db;
  const col = db.collection('tools');

  if (req.method === 'GET') {
    try {
      const snap  = await col.orderBy('updated_at', 'desc').limit(200).get();
      const tools = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      return res.status(200).json({ data: tools });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const now  = new Date();
      const body = req.body || {};
      const ref  = await col.add({ ...body, created_by: auth.uid, updated_by: auth.uid, created_at: now, updated_at: now });
      const snap = await ref.get();
      return res.status(201).json({ data: { id: snap.id, ...snap.data() } });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: 'Method not allowed' });
}
