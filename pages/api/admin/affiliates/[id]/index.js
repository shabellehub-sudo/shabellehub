// pages/api/admin/affiliates/[id]/index.js
// GET    — fetch single affiliate link
// PATCH  — update affiliate link (editor+)
// DELETE — delete affiliate link (admin only)

import { requireAuth, requireAdmin } from '../../../../../lib/supabaseAdmin';

export default async function handler(req, res) {
  const { id } = req.query;

  // ── DELETE (admin-only) ───────────────────────────────────────────────────
  if (req.method === 'DELETE') {
    const auth = await requireAdmin(req);
    if (auth.error) return res.status(401).json({ error: auth.error });
    try {
      const { error } = await auth.db.from('affiliate_links').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return res.status(200).json({ data: { deleted: true } });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // ── GET / PATCH (editor+) ─────────────────────────────────────────────────
  const auth = await requireAuth(req);
  if (auth.error) return res.status(auth.error.includes('configured') ? 503 : 401).json({ error: auth.error });
  const db = auth.db;

  if (req.method === 'GET') {
    try {
      const { data: row, error } = await db.from('affiliate_links').select('id, doc').eq('id', id).maybeSingle();
      if (error) throw new Error(error.message);
      if (!row) return res.status(404).json({ error: 'Affiliate link not found.' });
      return res.status(200).json({ data: { id: row.id, ...row.doc } });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'PATCH') {
    try {
      const now  = new Date();
      const body = req.body || {};
      // Protect immutable fields
      delete body.id;
      delete body.created_at;
      delete body.created_by;

      // Coerce numeric fields if present
      if (body.commissionValue != null) body.commissionValue = Number(body.commissionValue);
      if (body.cookieDays      != null) body.cookieDays      = Number(body.cookieDays);

      const { data: existing, error: getErr } = await db.from('affiliate_links').select('doc').eq('id', id).maybeSingle();
      if (getErr) throw new Error(getErr.message);
      if (!existing) return res.status(404).json({ error: 'Affiliate link not found.' });

      const merged = { ...existing.doc, ...body, updated_by: auth.uid, updated_at: now };
      const { error: updErr } = await db.from('affiliate_links').update({ doc: merged }).eq('id', id);
      if (updErr) throw new Error(updErr.message);

      const { data: row, error: finalErr } = await db.from('affiliate_links').select('id, doc').eq('id', id).maybeSingle();
      if (finalErr) throw new Error(finalErr.message);
      return res.status(200).json({ data: { id: row.id, ...row.doc } });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  res.setHeader('Allow', ['GET', 'PATCH', 'DELETE']);
  return res.status(405).json({ error: 'Method not allowed' });
}
