// pages/api/admin/affiliates/index.js
// GET  — list all affiliate links (admin/editor auth required)
// POST — create a new affiliate link

import { requireAuth } from '../../../../lib/supabaseAdmin';

export default async function handler(req, res) {
  const auth = await requireAuth(req);
  if (auth.error) {
    return res.status(auth.error.includes('configured') ? 503 : 401).json({ error: auth.error });
  }

  const col = auth.db.collection('affiliate_links');

  // ── GET ──────────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    try {
      let q = col.orderBy('updated_at', 'desc').limit(500);
      const { status, toolSlug } = req.query;
      // Firestore Admin SDK chained where clauses
      if (status)   q = col.where('status',   '==', status).orderBy('updated_at', 'desc');
      if (toolSlug) q = col.where('toolSlug', '==', toolSlug).orderBy('updated_at', 'desc');

      const snap = await q.get();
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
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

      const ref  = await col.add({
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
