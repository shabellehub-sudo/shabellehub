// pages/api/newsletter/unsubscribe.js — Phase 7A
// Public endpoint: POST /api/newsletter/unsubscribe

import { getAdminDb } from '../../../lib/supabaseAdmin';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body || {};

  if (!email || typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }

  const safeEmail = email.trim().toLowerCase();
  const db = getAdminDb();
  if (!db) {
    return res.status(200).json({ success: true });
  }

  try {
    const { data: existing, error: findErr } = await db
      .from('subscribers')
      .select('id, doc')
      .eq('email', safeEmail)
      .limit(1)
      .maybeSingle();

    if (findErr) throw findErr;

    if (!existing) {
      // Silent success — don't reveal whether email exists
      return res.status(200).json({ success: true });
    }

    const { error: updErr } = await db
      .from('subscribers')
      .update({
        doc: {
          ...existing.doc,
          status:     'unsubscribed',
          updated_at: new Date().toISOString(),
        },
      })
      .eq('id', existing.id);
    if (updErr) throw updErr;

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[Newsletter] Unsubscribe error:', err);
    return res.status(500).json({ error: 'Unsubscribe failed. Please try again.' });
  }
}
