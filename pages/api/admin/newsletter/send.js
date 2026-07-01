// pages/api/admin/newsletter/send.js — ShabelleHub v1.0
// POST — send | schedule | cancel a campaign
//
// Email delivery uses the Resend API via native fetch (no extra npm package).
// Set RESEND_API_KEY + RESEND_FROM_EMAIL in your environment to enable sending.
// Without these vars the campaign is still marked "sent" with recipientCount
// recorded — useful for testing the CMS flow before wiring a provider.

import { requireAuth } from '../../../../lib/supabaseAdmin';
import { buildEmailHtml, buildEmailText } from '../../../../lib/email/template';
import { getSiteSettings } from '../../../../lib/cms/siteSettings';

// ── Resend delivery via native fetch ─────────────────────────────────────────
async function sendViaResend({ to, fromName, fromEmail, subject, html, text }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { error: 'RESEND_API_KEY not configured.' };

  const from = fromEmail
    ? `${fromName || 'ShabelleHub'} <${fromEmail}>`
    : `${fromName || 'ShabelleHub'} <${process.env.RESEND_FROM_EMAIL || 'newsletter@shabellehub.com'}>`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, subject, html, text }),
  });

  if (!res.ok) {
    const body = await res.text();
    return { error: `Resend API error ${res.status}: ${body}` };
  }
  return { error: null };
}

// ── Batch send (max 50 per batch, 100ms delay between batches) ───────────────
async function batchSend({ subscribers, fromName, fromEmail, subject, settings, newsletter }) {
  const BATCH = 50;
  const siteUrl = settings?.siteUrl || 'https://shabellehub.com';
  let failed = 0;

  for (let i = 0; i < subscribers.length; i += BATCH) {
    const chunk = subscribers.slice(i, i + BATCH);
    await Promise.all(chunk.map(async (sub) => {
      const unsubscribeUrl = `${siteUrl}/api/newsletter/unsubscribe?email=${encodeURIComponent(sub.email)}`;
      const html = buildEmailHtml({
        subject:        newsletter.subject,
        previewText:    newsletter.previewText || '',
        content_blocks: newsletter.content_blocks || [],
        settings,
        unsubscribeUrl,
      });
      const text = buildEmailText({
        subject:        newsletter.subject,
        content_blocks: newsletter.content_blocks || [],
        settings,
        unsubscribeUrl,
      });
      const { error } = await sendViaResend({ to: sub.email, fromName, fromEmail, subject, html, text });
      if (error) {
        console.error(`[Newsletter] Failed for ${sub.email}:`, error);
        failed++;
      }
    }));
    // Small delay between batches to respect rate limits
    if (i + BATCH < subscribers.length) {
      await new Promise(r => setTimeout(r, 100));
    }
  }
  return { failed };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = await requireAuth(req);
  if (auth.error) return res.status(401).json({ error: auth.error });
  if (!['editor', 'admin'].includes(auth.role)) {
    return res.status(403).json({ error: 'Editor role required.' });
  }

  const db = auth.db;
  const { campaignId, action = 'send', scheduledAt } = req.body || {};
  if (!campaignId) return res.status(400).json({ error: 'campaignId is required.' });

  const campaignRef  = db.collection('newsletter_campaigns').doc(campaignId);
  const campaignSnap = await campaignRef.get();
  if (!campaignSnap.exists) return res.status(404).json({ error: 'Campaign not found.' });
  const campaign = campaignSnap.data();

  if (campaign.status === 'sent')      return res.status(400).json({ error: 'Campaign already sent.' });
  if (campaign.status === 'cancelled') return res.status(400).json({ error: 'Campaign is cancelled.' });

  const newsletterSnap = await db.collection('newsletters').doc(campaign.newsletterId).get();
  if (!newsletterSnap.exists) return res.status(404).json({ error: 'Newsletter content not found.' });
  const newsletter = newsletterSnap.data();

  // ── Schedule ──────────────────────────────────────────────────────────────
  if (action === 'schedule') {
    if (!scheduledAt) return res.status(400).json({ error: 'scheduledAt is required.' });
    await campaignRef.update({
      status: 'scheduled', scheduledAt: new Date(scheduledAt),
      updated_by: auth.uid, updated_at: new Date(),
    });
    return res.status(200).json({ data: { campaignId, status: 'scheduled', scheduledAt } });
  }

  // ── Cancel ────────────────────────────────────────────────────────────────
  if (action === 'cancel') {
    await campaignRef.update({
      status: 'cancelled', updated_by: auth.uid, updated_at: new Date(),
    });
    return res.status(200).json({ data: { campaignId, status: 'cancelled' } });
  }

  // ── Send ──────────────────────────────────────────────────────────────────
  if (action === 'send') {
    try {
      const subSnap = await db.collection('subscribers').where('status', '==', 'active').get();
      const subscribers    = subSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const recipientCount = subscribers.length;

      if (recipientCount === 0) {
        return res.status(400).json({ error: 'No active subscribers to send to.' });
      }

      // Load site settings for branding
      let settings = {};
      try {
        const { data } = await getSiteSettings();
        if (data) settings = data;
      } catch {}

      const fromName  = settings.siteName  || 'ShabelleHub';
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'newsletter@shabellehub.com';
      const subject   = campaign.subject || newsletter.subject;

      // Attempt email delivery if Resend is configured
      let deliveryNote = 'Email provider not configured — campaign recorded only.';
      let failed = 0;

      if (process.env.RESEND_API_KEY) {
        const result = await batchSend({ subscribers, fromName, fromEmail, subject, settings, newsletter });
        failed = result.failed;
        deliveryNote = failed > 0
          ? `Sent to ${recipientCount - failed}/${recipientCount} subscribers (${failed} failed).`
          : `Sent to ${recipientCount} subscribers.`;
      }

      // Build preview HTML for UI
      const siteUrl = settings?.siteUrl || 'https://shabellehub.com';
      const previewHtml = buildEmailHtml({
        subject:        newsletter.subject,
        previewText:    newsletter.previewText || '',
        content_blocks: newsletter.content_blocks || [],
        settings,
        unsubscribeUrl: `${siteUrl}/api/newsletter/unsubscribe`,
      });

      await campaignRef.update({
        status: 'sent', sentAt: new Date(), recipientCount,
        opens: 0, clicks: 0, updated_by: auth.uid, updated_at: new Date(),
      });

      await db.collection('newsletters').doc(campaign.newsletterId).update({
        status: 'sent', updated_at: new Date(),
      });

      return res.status(200).json({
        data: { campaignId, status: 'sent', recipientCount, sentAt: new Date().toISOString(), deliveryNote, previewHtml },
      });
    } catch (err) {
      console.error('[Newsletter] Send error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(400).json({ error: `Unknown action: ${action}` });
}
