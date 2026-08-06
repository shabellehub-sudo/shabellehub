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

      let q = db.from('subscribers').select('id, doc').order('created_at', { ascending: false }).limit(parseInt(lim, 10));
      if (status && status !== 'all') q = q.eq('status', status);
      if (source && source !== 'all') q = q.eq('source', source);

      const { data: rows, error } = await q;
      if (error) throw new Error(error.message);
      const subscribers = (rows || []).map(row => ({
        id: row.id,
        ...row.doc,
        created_at: row.doc?.created_at ?? null,
        updated_at: row.doc?.updated_at ?? null,
      }));

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
      const { error } = await db.from('subscribers').delete().eq('id', id);
      if (error) throw new Error(error.message);
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
      const { error } = await db.from('subscribers').delete().in('id', ids);
      if (error) throw new Error(error.message);
      return res.status(200).json({ data: { deleted: ids.length } });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  res.setHeader('Allow', 'GET, DELETE, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}
