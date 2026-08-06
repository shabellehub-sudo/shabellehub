require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing Supabase admin env vars: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local');
  }
  return createClient(url, key);
}

function getBearerToken(req) {
  const header = req.headers.authorization || req.headers.Authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7).trim() : null;
}

// Verifies the caller's Supabase access token and looks up their role in
// `profiles`. Returns { error, uid, role, db } — db is the native
// Supabase service-role client (no compatibility wrapper).
async function authenticate(req) {
  let client;
  try {
    client = getSupabaseAdmin();
  } catch (err) {
    return { error: 'Supabase admin client is not configured.', uid: null, role: null, db: null };
  }

  const token = getBearerToken(req);
  if (!token) {
    return { error: 'Missing or invalid Authorization header.', uid: null, role: null, db: null };
  }

  const { data: userData, error: userErr } = await client.auth.getUser(token);
  if (userErr || !userData?.user) {
    return { error: 'Invalid or expired session. Please sign in again.', uid: null, role: null, db: null };
  }

  const uid = userData.user.id;
  const { data: profile, error: profileErr } = await client
    .from('profiles')
    .select('role')
    .eq('id', uid)
    .maybeSingle();

  if (profileErr) {
    return { error: 'Failed to verify account role.', uid, role: null, db: null };
  }
  if (!profile || !profile.role) {
    return { error: 'Account has no role assigned.', uid, role: null, db: null };
  }

  return { error: null, uid, role: profile.role, db: client };
}

// For routes any signed-in staff member (editor or admin) may use.
async function requireAuth(req) {
  const auth = await authenticate(req);
  if (auth.error) return auth;
  if (!['admin', 'editor'].includes(auth.role)) {
    return { ...auth, error: 'Editor or admin role required.' };
  }
  return auth;
}

// For routes only an admin may use (e.g. changing user roles).
async function requireAdmin(req) {
  const auth = await authenticate(req);
  if (auth.error) return auth;
  if (auth.role !== 'admin') {
    return { ...auth, error: 'Admin role required.' };
  }
  return auth;
}

module.exports = { getSupabaseAdmin, getAdminDb: getSupabaseAdmin, requireAuth, requireAdmin };
