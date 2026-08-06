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
    const [subRes, sentRes, recentRes, draftRes, scheduledRes] = await Promise.all([
      db.from('subscribers').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      db.from('newsletter_campaigns').select('id, doc').eq('status', 'sent'),
      db.from('newsletter_campaigns').select('id, doc').eq('status', 'sent').order('sent_at', { ascending: false }).limit(5),
      db.from('newsletter_campaigns').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
      db.from('newsletter_campaigns').select('id', { count: 'exact', head: true }).eq('status', 'scheduled'),
    ]);

    if (subRes.error) throw new Error(subRes.error.message);
    if (sentRes.error) throw new Error(sentRes.error.message);
    if (recentRes.error) throw new Error(recentRes.error.message);
    if (draftRes.error) throw new Error(draftRes.error.message);
    if (scheduledRes.error) throw new Error(scheduledRes.error.message);

    const sentCampaigns = (sentRes.data || []).map(row => ({ id: row.id, ...row.doc }));

    const totalSent   = sentCampaigns.reduce((s, c) => s + (c.recipientCount || 0), 0);
    const totalOpens  = sentCampaigns.reduce((s, c) => s + (c.opens  || 0), 0);
    const totalClicks = sentCampaigns.reduce((s, c) => s + (c.clicks || 0), 0);

    const recentCampaigns = (recentRes.data || []).map(row => {
      const raw = row.doc || {};
      return {
        id:            row.id,
        subject:       raw.subject || '',
        recipientCount: raw.recipientCount || 0,
        opens:          raw.opens  || 0,
        clicks:         raw.clicks || 0,
        sentAt:         raw.sentAt ?? null,
        openRate:       raw.recipientCount > 0 ? ((raw.opens  / raw.recipientCount) * 100).toFixed(1) : '0.0',
        clickRate:      raw.recipientCount > 0 ? ((raw.clicks / raw.recipientCount) * 100).toFixed(1) : '0.0',
      };
    });

    return res.status(200).json({
      data: {
        activeSubscribers: subRes.count || 0,
        campaignsSent:     sentCampaigns.length,
        draftCampaigns:    draftRes.count || 0,
        scheduledCampaigns: scheduledRes.count || 0,
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
