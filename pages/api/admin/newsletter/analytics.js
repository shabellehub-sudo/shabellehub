// pages/api/admin/newsletter/analytics.js — Phase 7B
// GET — returns newsletter analytics summary

import { requireAuth } from '../../../../lib/supabaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = await requireAuth(req);
  if (auth.error) return res.status(401).json({ error: auth.error });

  const db = auth.db;

  try {
    const [subSnap, sentSnap, recentSnap, draftSnap, scheduledSnap] = await Promise.all([
      db.collection('subscribers').where('status', '==', 'active').get(),
      db.collection('newsletter_campaigns').where('status', '==', 'sent').get(),
      db.collection('newsletter_campaigns').where('status', '==', 'sent').orderBy('sentAt', 'desc').limit(5).get(),
      db.collection('newsletter_campaigns').where('status', '==', 'draft').get(),
      db.collection('newsletter_campaigns').where('status', '==', 'scheduled').get(),
    ]);

    const sentCampaigns = sentSnap.docs.map(d => {
      const raw = d.data();
      return {
        id: d.id, ...raw,
        sentAt: raw.sentAt?.toDate?.()?.toISOString() ?? raw.sentAt ?? null,
      };
    });

    const totalSent   = sentCampaigns.reduce((s, c) => s + (c.recipientCount || 0), 0);
    const totalOpens  = sentCampaigns.reduce((s, c) => s + (c.opens  || 0), 0);
    const totalClicks = sentCampaigns.reduce((s, c) => s + (c.clicks || 0), 0);

    const recentCampaigns = recentSnap.docs.map(d => {
      const raw = d.data();
      return {
        id:            d.id,
        subject:       raw.subject || '',
        recipientCount: raw.recipientCount || 0,
        opens:          raw.opens  || 0,
        clicks:         raw.clicks || 0,
        sentAt:         raw.sentAt?.toDate?.()?.toISOString() ?? raw.sentAt ?? null,
        openRate:       raw.recipientCount > 0 ? ((raw.opens  / raw.recipientCount) * 100).toFixed(1) : '0.0',
        clickRate:      raw.recipientCount > 0 ? ((raw.clicks / raw.recipientCount) * 100).toFixed(1) : '0.0',
      };
    });

    return res.status(200).json({
      data: {
        activeSubscribers: subSnap.size,
        campaignsSent:     sentSnap.size,
        draftCampaigns:    draftSnap.size,
        scheduledCampaigns: scheduledSnap.size,
        totalSent,
        openRate:   totalSent > 0 ? ((totalOpens  / totalSent) * 100).toFixed(1) : '0.0',
        clickRate:  totalSent > 0 ? ((totalClicks / totalSent) * 100).toFixed(1) : '0.0',
        recentCampaigns,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
