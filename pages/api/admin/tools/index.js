// pages/api/admin/tools/index.js
// GET — list all tools (admin use, returns all statuses)
// POST — create a tool

import { requireAuth } from '../../../../lib/supabaseAdmin';

export default async function handler(req, res) {
  const auth = await requireAuth(req);
  if (auth.error) {
    return res.status(auth.error.includes('configured') ? 503 : 401).json({ error: auth.error });
  }

  const db = auth.db;

  if (req.method === 'GET') {
    try {
      const { data: rows, error } = await db.from('tools').select('id, doc').order('updated_at', { ascending: false }).limit(200);
      if (error) throw new Error(error.message);
      const tools = (rows || []).map(row => ({ id: row.id, ...row.doc }));
      return res.status(200).json({ data: tools });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const now  = new Date();
      const body = req.body || {};
      const doc  = { ...body, created_by: auth.uid, updated_by: auth.uid, created_at: now, updated_at: now };
      const { data: row, error } = await db.from('tools').insert({ doc }).select('id, doc').single();
      if (error) throw new Error(error.message);
      return res.status(201).json({ data: { id: row.id, ...row.doc } });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: 'Method not allowed' });
}
