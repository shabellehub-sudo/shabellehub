// pages/api/admin/tools/[id]/index.js
// GET, PATCH, DELETE a single tool

import { requireAuth, requireAdmin } from '../../../../../lib/supabaseAdmin';

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'DELETE') {
    const auth = await requireAdmin(req);
    if (auth.error) return res.status(401).json({ error: auth.error });
    try {
      await auth.db.collection('tools').doc(id).delete();
      return res.status(200).json({ data: { deleted: true } });
    } catch (err) { return res.status(500).json({ error: err.message }); }
  }

  const auth = await requireAuth(req);
  if (auth.error) return res.status(401).json({ error: auth.error });
  const col = auth.db.collection('tools');

  if (req.method === 'GET') {
    try {
      const snap = await col.doc(id).get();
      if (!snap.exists) return res.status(404).json({ error: 'Not found' });
      return res.status(200).json({ data: { id: snap.id, ...snap.data() } });
    } catch (err) { return res.status(500).json({ error: err.message }); }
  }

  if (req.method === 'PATCH') {
    try {
      const now  = new Date();
      const body = req.body || {};
      delete body.id; delete body.created_at; delete body.created_by;
      await col.doc(id).update({ ...body, updated_by: auth.uid, updated_at: now });
      const snap = await col.doc(id).get();
      return res.status(200).json({ data: { id: snap.id, ...snap.data() } });
    } catch (err) { return res.status(500).json({ error: err.message }); }
  }

  res.setHeader('Allow', ['GET', 'PATCH', 'DELETE']);
  return res.status(405).json({ error: 'Method not allowed' });
}
