// pages/api/admin/newsletter/subscribers/index.js — Phase 7A
// GET  /api/admin/newsletter/subscribers          — list all
// POST /api/admin/newsletter/subscribers          — bulk delete
// DELETE /api/admin/newsletter/subscribers?id=xx  — delete one

import { requireAuth } from '../../../../../lib/supabaseAdmin';

export default async function handler(req, res) {
  const auth = await requireAuth(req);
  if (auth.error) return res.status(401).json({ error: auth.error });

  const db = auth.db;

  // ── GET: list subscribers ─────────────────────────────────────────────────
  if (req.method === 'GET') {
    try {
      const { status, source, limit: lim = '500' } = req.query;

      let q = db.collection('subscribers').orderBy('created_at', 'desc').limit(parseInt(lim, 10));
      if (status && status !== 'all') q = db.collection('subscribers').where('status', '==', status).orderBy('created_at', 'desc').limit(parseInt(lim, 10));
      if (source && source !== 'all') q = db.collection('subscribers').where('source', '==', source).orderBy('created_at', 'desc').limit(parseInt(lim, 10));
      // combined filters
      if (status && status !== 'all' && source && source !== 'all') {
        q = db.collection('subscribers')
          .where('status', '==', status)
          .where('source', '==', source)
          .orderBy('created_at', 'desc')
          .limit(parseInt(lim, 10));
      }

      const snap = await q.get();
      const subscribers = snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          created_at: data.created_at ?? null,
          updated_at: data.updated_at ?? null,
        };
      });

      return res.status(200).json({ data: subscribers, count: subscribers.length });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // ── DELETE: single (query param) ─────────────────────────────────────────
  if (req.method === 'DELETE') {
    // Only admins can delete
    if (auth.role !== 'admin') return res.status(403).json({ error: 'Admin role required.' });

    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Missing id query parameter.' });

    try {
      await db.collection('subscribers').doc(id).delete();
      return res.status(200).json({ data: { id } });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // ── POST: bulk delete ─────────────────────────────────────────────────────
  if (req.method === 'POST') {
    if (auth.role !== 'admin') return res.status(403).json({ error: 'Admin role required.' });

    const { action, ids } = req.body || {};
    if (action !== 'bulk_delete') return res.status(400).json({ error: 'Unknown action.' });
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: 'No ids provided.' });
    if (ids.length > 100) return res.status(400).json({ error: 'Max 100 ids per bulk delete.' });

    try {
      const batch = db.batch();
      ids.forEach(id => batch.delete(db.collection('subscribers').doc(id)));
      await batch.commit();
      return res.status(200).json({ data: { deleted: ids.length } });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  res.setHeader('Allow', 'GET, DELETE, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}
