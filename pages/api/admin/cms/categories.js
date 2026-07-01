// pages/api/admin/cms/categories.js
// GET  — list all categories
// POST — create a new category

import { requireAuth } from '../../../../lib/supabaseAdmin';

export default async function handler(req, res) {
  const auth = await requireAuth(req);
  if (auth.error) {
    return res.status(auth.error.includes('configured') ? 503 : 401).json({ error: auth.error });
  }

  const col = auth.db.collection('categories');

  if (req.method === 'GET') {
    try {
      const snap = await col.orderBy('name', 'asc').get();
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
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
      const existing = await col.where('name', '==', body.name).limit(1).get();
      if (!existing.empty) {
        return res.status(200).json({ data: { id: existing.docs[0].id, ...existing.docs[0].data() }, skipped: true });
      }

      const ref = await col.add({
        name:        body.name,
        icon:        body.icon        || null,
        description: body.description || null,
        created_at:  now,
        updated_at:  now,
        created_by:  auth.uid,
      });
      const snap = await ref.get();
      return res.status(201).json({ data: { id: snap.id, ...snap.data() } });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: 'Method not allowed' });
}
