// pages/api/admin/users/[id]/role.js
// PATCH — update a user's role in profiles

import { requireAdmin } from '../../../../../lib/supabaseAdmin';

const VALID_ROLES = ['admin', 'editor'];

export default async function handler(req, res) {
  if (req.method !== 'PATCH') {
    res.setHeader('Allow', ['PATCH']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = await requireAdmin(req);
  if (auth.error) {
    return res.status(auth.error.includes('configured') ? 503 : 401).json({ error: auth.error });
  }

  const { id } = req.query;
  const { role } = req.body || {};

  if (!VALID_ROLES.includes(role)) {
    return res.status(400).json({ error: `role must be one of: ${VALID_ROLES.join(', ')}` });
  }

  // Prevent an admin from removing their own admin role
  if (id === auth.uid && role !== 'admin') {
    return res.status(400).json({ error: 'You cannot remove your own admin role.' });
  }

  try {
    const { data: existing, error: getErr } = await auth.db.from('profiles').select('id').eq('id', id).maybeSingle();
    if (getErr) throw new Error(getErr.message);
    if (!existing) return res.status(404).json({ error: 'User not found.' });

    const { error: updErr } = await auth.db.from('profiles').update({ role, updated_at: new Date() }).eq('id', id);
    if (updErr) throw new Error(updErr.message);

    const { data: updated, error: finalErr } = await auth.db.from('profiles').select('*').eq('id', id).maybeSingle();
    if (finalErr) throw new Error(finalErr.message);
    return res.status(200).json({ data: updated });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
