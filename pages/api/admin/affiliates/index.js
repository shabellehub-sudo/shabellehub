// pages/api/admin/affiliates/index.js
// GET  — list all affiliate links (admin/editor auth required)
// POST — create a new affiliate link

import { requireAuth } from '../../../../lib/supabaseAdmin';

export default async function handler(req, res) {
  const auth = await requireAuth(req);
  if (auth.error) {
    return res.status(auth.error.includes('configured') ? 503 : 401).json({ error: auth.error });
  }

  const db = auth.db;

  // ── GET ──────────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    try {
      const { status, toolSlug } = req.query;
      let q = db.from('affiliate_links').select('id, doc').order('updated_at', { ascending: false }).limit(500);
      if (status)   q = q.eq('status', status);
      if (toolSlug) q = q.eq('tool_slug', toolSlug);

      const { data: rows, error } = await q;
      if (error) throw new Error(error.message);
      const data = (rows || []).map(row => ({ id: row.id, ...row.doc }));
      return res.status(200).json({ data });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // ── POST ─────────────────────────────────────────────────────────────────
  if (req.method === 'POST') {
    try {
      const now  = new Date();
      const body = req.body || {};
      // Validate required fields
      if (!body.programName) return res.status(400).json({ error: 'programName is required.' });
      if (!body.affiliateUrl) return res.status(400).json({ error: 'affiliateUrl is required.' });

      const doc = {
        toolId:         body.toolId         || null,
        toolSlug:       body.toolSlug       || null,
        programName:    body.programName,
        affiliateUrl:   body.affiliateUrl,
        trackingCode:   body.trackingCode   || null,
        commissionType: body.commissionType || 'percent',
        commissionValue:body.commissionValue != null ? Number(body.commissionValue) : null,
        cookieDays:     body.cookieDays     != null ? Number(body.cookieDays)     : null,
        status:         body.status         || 'draft',
        disclosureText: body.disclosureText || null,
        notes:          body.notes          || null,
        created_by:     auth.uid,
        updated_by:     auth.uid,
        created_at:     now,
        updated_at:     now,
      };

      const { data: row, error } = await db.from('affiliate_links').insert({ doc }).select('id, doc').single();
      if (error) throw new Error(error.message);
      return res.status(201).json({ data: { id: row.id, ...row.doc } });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: 'Method not allowed' });
}
