// pages/api/contact.js — Contact form submission endpoint
//
// Same rate-limiting pattern as pages/api/subscribe.js: an in-memory map keyed
// by IP, pruned on every request so it stays bounded between cold starts.

const rateLimitMap = new Map();
const WINDOW_MS    = 60_000; // 1 minute
const MAX_REQUESTS = 5;

function isRateLimited(ip) {
  const now    = Date.now();
  const record = rateLimitMap.get(ip);

  for (const [key, val] of rateLimitMap) {
    if (now - val.start > WINDOW_MS * 10) rateLimitMap.delete(key);
  }

  if (!record || now - record.start > WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, start: now });
    return false;
  }
  if (record.count >= MAX_REQUESTS) return true;
  rateLimitMap.set(ip, { count: record.count + 1, start: record.start });
  return false;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_FIELD_LENGTH = 200;
const MAX_MESSAGE_LENGTH = 5000;

function escapeForLog(str) {
  return String(str).replace(/[\r\n]/g, ' ').slice(0, 500);
}

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

  const { name, email, reason, message } = req.body || {};

  if (!name || typeof name !== 'string' || !name.trim() || name.length > MAX_FIELD_LENGTH) {
    return res.status(400).json({ error: 'Please enter a valid name.' });
  }
  if (!email || typeof email !== 'string' || !EMAIL_RE.test(email.trim()) || email.length > MAX_FIELD_LENGTH) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }
  if (!message || typeof message !== 'string' || !message.trim() || message.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({ error: 'Please enter a message.' });
  }
  if (reason && (typeof reason !== 'string' || reason.length > MAX_FIELD_LENGTH)) {
    return res.status(400).json({ error: 'Invalid reason.' });
  }

  const safeEmail = email.trim().toLowerCase();

  try {
    // ── Resend (recommended) ────────────────────────────────────────────────
    // Uncomment and set RESEND_API_KEY + CONTACT_TO_EMAIL in environment vars.
    //
    // const resendRes = await fetch('https://api.resend.com/emails', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    //   },
    //   body: JSON.stringify({
    //     from: 'Shabelle Hub <contact@shabellehub.com>',
    //     to: process.env.CONTACT_TO_EMAIL,
    //     reply_to: safeEmail,
    //     subject: `[Contact] ${reason || 'General'} — ${name.trim()}`,
    //     text: `From: ${name.trim()} <${safeEmail}>\nReason: ${reason || 'N/A'}\n\n${message.trim()}`,
    //   }),
    // });
    // if (!resendRes.ok) throw new Error('Resend error');

    // Until an email provider is configured above, log the submission so it's
    // at least visible in server logs / Vercel function logs.
    console.log(
      `[Shabelle Hub] Contact form submission from ${escapeForLog(safeEmail)} ` +
      `(reason: ${escapeForLog(reason || 'N/A')}): ${escapeForLog(message.trim())}`
    );

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[Shabelle Hub] Contact error:', err);
    return res.status(500).json({ error: 'Could not send your message. Please try again or email us directly.' });
  }
}
