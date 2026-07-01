// pages/api/newsletter/subscribe.js — Phase 7A
// Public endpoint: POST /api/newsletter/subscribe
// Stores subscriber in Firestore. Rate-limited.

import { getAdminDb } from '../../../lib/supabaseAdmin';

const rateLimitMap = new Map();
const WINDOW_MS    = 60_000;
const MAX_REQUESTS = 5;

function isRateLimited(ip) {
  const now = Date.now();
  for (const [key, val] of rateLimitMap) {
    if (now - val.start > WINDOW_MS * 10) rateLimitMap.delete(key);
  }
  const record = rateLimitMap.get(ip);
  if (!record || now - record.start > WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, start: now });
    return false;
  }
  if (record.count >= MAX_REQUESTS) return true;
  rateLimitMap.set(ip, { count: record.count + 1, start: record.start });
  return false;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = (
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'unknown'
  );
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  const { email, source = 'homepage' } = req.body || {};

  if (!email || typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  const safeEmail = email.trim().toLowerCase();
  const safeSource = ['homepage', 'footer', 'blog', 'popup', 'other'].includes(source)
    ? source
    : 'homepage';

  const db = getAdminDb();
  if (!db) {
    // Firebase not configured — still succeed silently in dev
    console.log(`[Newsletter] Subscriber (no-supabase): ${safeEmail}`);
    return res.status(200).json({ success: true });
  }

  try {
    // Check for duplicate
    const existing = await db.collection('subscribers')
      .where('email', '==', safeEmail)
      .limit(1)
      .get();

    if (!existing.empty) {
      const sub = existing.docs[0].data();
      if (sub.status === 'unsubscribed') {
        // Re-activate
        await existing.docs[0].ref.update({
          status:     'active',
          source:     safeSource,
          updated_at: new Date().toISOString(),
        });
        return res.status(200).json({ success: true });
      }
      // Already active — return success silently (no info leak)
      return res.status(200).json({ success: true });
    }

    await db.collection('subscribers').add({
      email:      safeEmail,
      status:     'active',
      source:     safeSource,
      tags:       [],
      confirmed:  true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[Newsletter] Subscribe error:', err);
    return res.status(500).json({ error: 'Subscription failed. Please try again.' });
  }
}
