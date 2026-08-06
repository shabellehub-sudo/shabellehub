// pages/api/admin/cms/categories.js
// GET  — list all categories
// POST — create a new category

import { requireAuth } from '../../../../lib/supabaseAdmin';

export default async function handler(req, res) {
  const auth = await requireAuth(req);
  if (auth.error) {
    return res.status(auth.error.includes('configured') ? 503 : 401).json({ error: auth.error });
  }

  const db = auth.db;

  if (req.method === 'GET') {
    try {
      const { data: rows, error } = await db.from('categories').select('id, doc').order('name', { ascending: true });
      if (error) throw new Error(error.message);
      const data = (rows || []).map(row => ({ id: row.id, ...row.doc }));
      return res.status(200).json({ data });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const now  = new Date();
      const body = req.body || {};
      if (!body.name) return res.status(400).json({ error: 'name is required.' });

      // Check duplicate
      const { data: existingRows, error: existErr } = await db
        .from('categories').select('id, doc').eq('name', body.name).limit(1);
      if (existErr) throw new Error(existErr.message);
      if (existingRows && existingRows.length > 0) {
        const row = existingRows[0];
        return res.status(200).json({ data: { id: row.id, ...row.doc }, skipped: true });
      }

      const doc = {
        name:        body.name,
        icon:        body.icon        || null,
        description: body.description || null,
        created_at:  now,
        updated_at:  now,
        created_by:  auth.uid,
      };

      const { data: row, error } = await db.from('categories').insert({ doc }).select('id, doc').single();
      if (error) throw new Error(error.message);
      return res.status(201).json({ data: { id: row.id, ...row.doc } });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: 'Method not allowed' });
}
