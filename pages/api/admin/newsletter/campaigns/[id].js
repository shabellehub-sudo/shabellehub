// pages/api/admin/newsletter/campaigns/[id].js — Phase 7B
// GET    — get campaign
// PUT    — update campaign (subject, scheduledAt, status)
// DELETE — delete campaign (admin only)

import { requireAuth } from '../../../../../lib/supabaseAdmin';

function serialize(id, raw) {
  return {
    id, ...raw,
    scheduledAt: raw.scheduledAt ?? null,
    sentAt:      raw.sentAt ?? null,
    created_at:  raw.created_at ?? null,
    updated_at:  raw.updated_at ?? null,
  };
}

export default async function handler(req, res) {
  const auth = await requireAuth(req);
  if (auth.error) return res.status(401).json({ error: auth.error });

  const { id } = req.query;
  const db = auth.db;

  if (req.method === 'GET') {
    try {
      const { data: row, error } = await db.from('newsletter_campaigns').select('id, doc').eq('id', id).maybeSingle();
      if (error) throw new Error(error.message);
      if (!row) return res.status(404).json({ error: 'Campaign not found.' });
      return res.status(200).json({ data: serialize(row.id, row.doc) });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'PUT') {
    try {
      const body    = req.body || {};
      const allowed = ['subject', 'newsletterId', 'status', 'scheduledAt', 'recipientCount', 'opens', 'clicks'];
      const payload = {};
      for (const key of allowed) {
        if (key in body) payload[key] = body[key];
      }
      if (payload.scheduledAt && typeof payload.scheduledAt === 'string') {
        payload.scheduledAt = new Date(payload.scheduledAt);
      }
      payload.updated_by = auth.uid;
      payload.updated_at = new Date();

      const { data: existing, error: getErr } = await db.from('newsletter_campaigns').select('doc').eq('id', id).maybeSingle();
      if (getErr) throw new Error(getErr.message);
      if (!existing) return res.status(404).json({ error: 'Campaign not found.' });

      const merged = { ...existing.doc, ...payload };
      const { error: updErr } = await db.from('newsletter_campaigns').update({ doc: merged }).eq('id', id);
      if (updErr) throw new Error(updErr.message);

      const { data: row, error: finalErr } = await db.from('newsletter_campaigns').select('id, doc').eq('id', id).maybeSingle();
      if (finalErr) throw new Error(finalErr.message);
      return res.status(200).json({ data: serialize(row.id, row.doc) });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'DELETE') {
    if (auth.role !== 'admin') return res.status(403).json({ error: 'Admin role required.' });
    try {
      const { error } = await db.from('newsletter_campaigns').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return res.status(200).json({ data: { id } });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  res.setHeader('Allow', 'GET, PUT, DELETE');
  return res.status(405).json({ error: 'Method not allowed' });
}
