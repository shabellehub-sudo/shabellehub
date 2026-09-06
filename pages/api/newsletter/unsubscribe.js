// pages/api/newsletter/unsubscribe.js — Phase 7A
// Public endpoint: GET or POST /api/newsletter/unsubscribe
//
// Fix: P1 Security Sprint -- Phase 1, item 4 (GET/POST mismatch). The
// unsubscribe link sent in newsletter emails is a plain <a href> (GET),
// but this endpoint only accepted POST, so clicking it always returned
// 405 and no one could ever actually unsubscribe. GET is now accepted
// and redirects to a simple confirmation page; POST is preserved
// returning JSON, in case anything calls this programmatically.

import { getAdminDb } from '../../../lib/supabaseAdmin';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function respond(req, res, { httpStatus, json, redirectStatus }) {
  if (req.method === 'GET') {
    return res.redirect(302, `/unsubscribed?status=${redirectStatus}`);
  }
  return res.status(httpStatus).json(json);
}

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const email = req.method === 'GET' ? req.query?.email : req.body?.email;

  if (!email || typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
    return respond(req, res, {
      httpStatus: 400,
      json: { error: 'Invalid email address.' },
      redirectStatus: 'invalid',
    });
  }

  const safeEmail = email.trim().toLowerCase();
  const db = getAdminDb();
  if (!db) {
    return respond(req, res, {
      httpStatus: 200,
      json: { success: true },
      redirectStatus: 'success',
    });
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
      return respond(req, res, {
        httpStatus: 200,
        json: { success: true },
        redirectStatus: 'success',
      });
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

    return respond(req, res, {
      httpStatus: 200,
      json: { success: true },
      redirectStatus: 'success',
    });
  } catch (err) {
    console.error('[Newsletter] Unsubscribe error:', err);
    return respond(req, res, {
      httpStatus: 500,
      json: { error: 'Unsubscribe failed. Please try again.' },
      redirectStatus: 'error',
    });
  }
}
