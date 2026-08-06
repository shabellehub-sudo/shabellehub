// pages/api/admin/newsletter/newsletters/index.js — Phase 7B
// GET  — list newsletters
// POST — create newsletter

import { requireAuth } from '../../../../../lib/supabaseAdmin';

function serialize(id, raw) {
  return {
    id, ...raw,
    content_blocks: raw.content_blocks || [],
    created_at: raw.created_at ?? null,
    updated_at: raw.updated_at ?? null,
  };
}

export default async function handler(req, res) {
  const auth = await requireAuth(req);
  if (auth.error) return res.status(401).json({ error: auth.error });
  const db = auth.db;

  if (req.method === 'GET') {
    try {
      const { status } = req.query;
      let q = db.from('newsletters').select('id, doc').order('updated_at', { ascending: false }).limit(200);
      if (status && status !== 'all') q = q.eq('status', status);

      const { data: rows, error } = await q;
      if (error) throw new Error(error.message);
      return res.status(200).json({ data: (rows || []).map(row => serialize(row.id, row.doc)) });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const body = req.body || {};
      if (!body.subject) return res.status(400).json({ error: 'subject is required.' });
      const now = new Date();
      const doc = {
        subject:        body.subject,
        previewText:    body.previewText    || '',
        content_blocks: body.content_blocks || [],
        status:         'draft',
        created_by:     auth.uid,
        updated_by:     auth.uid,
        created_at:     now,
        updated_at:     now,
      };

      const { data: row, error } = await db.from('newsletters').insert({ doc }).select('id, doc').single();
      if (error) throw new Error(error.message);
      return res.status(201).json({ data: serialize(row.id, row.doc) });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}
