// pages/api/admin/users/[id]/role.js
// PATCH — update a user's role in Firestore

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
    const ref = auth.db.collection('users').doc(id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'User not found.' });

    await ref.update({ role, updated_at: new Date() });
    const updated = await ref.get();
    return res.status(200).json({ data: { id: updated.id, ...updated.data() } });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
