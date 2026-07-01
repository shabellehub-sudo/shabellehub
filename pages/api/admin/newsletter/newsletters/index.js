// pages/api/admin/newsletter/newsletters/index.js — Phase 7B
// GET  — list newsletters
// POST — create newsletter

import { requireAuth } from '../../../../../lib/supabaseAdmin';

function serialize(id, raw) {
  return {
    id, ...raw,
    content_blocks: raw.content_blocks || [],
    created_at: raw.created_at?.toDate?.()?.toISOString() ?? raw.created_at ?? null,
    updated_at: raw.updated_at?.toDate?.()?.toISOString() ?? raw.updated_at ?? null,
  };
}

export default async function handler(req, res) {
  const auth = await requireAuth(req);
  if (auth.error) return res.status(401).json({ error: auth.error });
  const db = auth.db;

  if (req.method === 'GET') {
    try {
      const { status } = req.query;
      let q = db.collection('newsletters').orderBy('updated_at', 'desc').limit(200);
      if (status && status !== 'all') {
        q = db.collection('newsletters').where('status', '==', status).orderBy('updated_at', 'desc').limit(200);
      }
      const snap = await q.get();
      return res.status(200).json({ data: snap.docs.map(d => serialize(d.id, d.data())) });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const body = req.body || {};
      if (!body.subject) return res.status(400).json({ error: 'subject is required.' });
      const now = new Date();
      const ref = await db.collection('newsletters').add({
        subject:        body.subject,
        previewText:    body.previewText    || '',
        content_blocks: body.content_blocks || [],
        status:         'draft',
        created_by:     auth.uid,
        updated_by:     auth.uid,
        created_at:     now,
        updated_at:     now,
      });
      const snap = await ref.get();
      return res.status(201).json({ data: serialize(snap.id, snap.data()) });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}
