// pages/api/admin/newsletter/campaigns/index.js — Phase 7B
// GET  — list campaigns
// POST — create campaign
import { requireAuth } from '../../../../../lib/supabaseAdmin';

export default async function handler(req, res) {
  const auth = await requireAuth(req);
  if (auth.error) return res.status(401).json({ error: auth.error });
  const db = auth.db;

  // ── GET ───────────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    try {
      const { status } = req.query;
      let q = db.collection('newsletter_campaigns').orderBy('created_at', 'desc').limit(200);
      if (status && status !== 'all') {
        q = db.collection('newsletter_campaigns').where('status', '==', status).orderBy('created_at', 'desc').limit(200);
      }
      const snap = await q.get();
      const data = snap.docs.map(d => {
        const raw = d.data();
        return {
          id: d.id, ...raw,
          scheduledAt: raw.scheduledAt?.toDate?.()?.toISOString() ?? raw.scheduledAt ?? null,
          sentAt:      raw.sentAt?.toDate?.()?.toISOString()      ?? raw.sentAt      ?? null,
          created_at:  raw.created_at?.toDate?.()?.toISOString()  ?? raw.created_at ?? null,
          updated_at:  raw.updated_at?.toDate?.()?.toISOString()  ?? raw.updated_at ?? null,
        };
      });
      return res.status(200).json({ data });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // ── POST ──────────────────────────────────────────────────────────────────
  if (req.method === 'POST') {
    try {
      const body = req.body || {};
      if (!body.newsletterId) return res.status(400).json({ error: 'newsletterId is required.' });
      if (!body.subject)      return res.status(400).json({ error: 'subject is required.' });

      const now = new Date();
      const ref = await db.collection('newsletter_campaigns').add({
        newsletterId:   body.newsletterId,
        subject:        body.subject,
        status:         'draft',
        scheduledAt:    null,
        sentAt:         null,
        recipientCount: 0,
        opens:          0,
        clicks:         0,
        created_by:     auth.uid,
        updated_by:     auth.uid,
        created_at:     now,
        updated_at:     now,
      });
      const snap = await ref.get();
      const raw  = snap.data();
      return res.status(201).json({
        data: {
          id: snap.id, ...raw,
          scheduledAt: raw.scheduledAt?.toDate?.()?.toISOString() ?? raw.scheduledAt ?? null,
          created_at:  raw.created_at?.toDate?.()?.toISOString()  ?? raw.created_at ?? null,
        },
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}
