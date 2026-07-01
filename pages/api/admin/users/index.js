// pages/api/admin/users/index.js
// GET — list all admin users from Firestore

import { requireAdmin } from '../../../../lib/supabaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = await requireAdmin(req);
  if (auth.error) {
    return res.status(auth.error.includes('configured') ? 503 : 401).json({ error: auth.error });
  }

  try {
    const snap = await auth.db.collection('users').orderBy('created_at', 'asc').get();
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return res.status(200).json({ data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
