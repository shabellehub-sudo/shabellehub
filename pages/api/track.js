// pages/api/track.js
// Public endpoint: POST /api/track
// Records a lightweight { tool_id, event_type } row for trending
// calculations. Rate-limited per IP, same pattern as
// pages/api/newsletter/subscribe.js.

import { getSupabaseAdmin } from '../../lib/supabaseAdmin';
import { tools } from '../../data';

const rateLimitMap = new Map();
const WINDOW_MS    = 60_000;
const MAX_REQUESTS = 60; // generous — this fires on normal clicks, not a form submit

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

// Validate against the real tool list rather than trusting the client —
// otherwise anyone could POST arbitrary tool_id strings and pollute the
// trending aggregation.
const VALID_TOOL_IDS = new Set(tools.map((t) => t.id));

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
    return res.status(429).json({ error: 'Too many requests.' });
  }

  const { toolId, eventType } = req.body || {};

  if (!VALID_TOOL_IDS.has(toolId)) {
    return res.status(400).json({ error: 'Unknown tool_id.' });
  }
  if (!['view', 'click'].includes(eventType)) {
    return res.status(400).json({ error: 'event_type must be "view" or "click".' });
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    // Supabase not configured in this environment — fail soft. Tracking
    // is a nice-to-have; it should never break the page for the visitor.
    return res.status(200).json({ ok: true, tracked: false });
  }

  const { error } = await admin
    .from('tool_events')
    .insert({ tool_id: toolId, event_type: eventType });

  if (error) {
    // Log server-side for debugging, but still return 200 — a failed
    // tracking write is not something the visitor should see as an error.
    console.error('[api/track] insert failed:', error.message);
    return res.status(200).json({ ok: true, tracked: false });
  }

  return res.status(200).json({ ok: true, tracked: true });
}
