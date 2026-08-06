// pages/api/admin/users/index.js
// GET — list all admin users from profiles

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
    const { data, error } = await auth.db.from('profiles').select('*').order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    return res.status(200).json({ data: data || [] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
