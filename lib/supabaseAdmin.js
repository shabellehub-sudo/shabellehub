// ─── SUPABASE ADMIN — SERVER-ONLY ────────────────────────────────────────────
// Import ONLY from pages/api/** or getStaticProps/getServerSideProps.
// SUPABASE_SERVICE_ROLE_KEY is never prefixed with NEXT_PUBLIC_ and is
// therefore never exposed to the browser.

import { createClient } from '@supabase/supabase-js';
import { makeFirestoreShim } from './firestoreShim';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function isAdminConfigured() {
  return Boolean(
    SUPABASE_URL &&
    SERVICE_ROLE_KEY &&
    SUPABASE_URL.length > 10 &&
    !SUPABASE_URL.includes('YOUR') &&
    !SERVICE_ROLE_KEY.includes('YOUR')
  );
}

let _admin = null;

// Service-role client — bypasses Row Level Security. Server-only.
export function getSupabaseAdmin() {
  if (!isAdminConfigured()) return null;
  if (_admin) return _admin;
  _admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _admin;
}

// Firestore-Admin-SDK-compatible shim over the service-role client, so
// existing `db.collection(x).where(...).get()` style code keeps working
// unchanged. See lib/firestoreShim.js for the supported surface.
export function getAdminDb() {
  const client = getSupabaseAdmin();
  if (!client) return null;
  return makeFirestoreShim(client);
}

// Verifies a Supabase access token (Bearer) + confirms role = 'admin' in
// public.profiles. Returns { uid, role, db } on success or { error }.
export async function requireAdmin(req) {
  const result = await requireAuth(req);
  if (result.error) return result;
  if (result.role !== 'admin') return { error: 'Admin role required.' };
  return result;
}

// Verifies any authenticated user (editor or admin).
export async function requireAuth(req) {
  if (!isAdminConfigured()) {
    return { error: 'Supabase is not configured on the server.' };
  }
  const authHeader = req.headers.authorization || '';
  const accessToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!accessToken) return { error: 'Missing Authorization bearer token.' };

  const admin = getSupabaseAdmin();
  const { data: userData, error: userErr } = await admin.auth.getUser(accessToken);
  if (userErr || !userData?.user) {
    return { error: 'Invalid or expired session token.' };
  }

  const uid = userData.user.id;
  const { data: profile } = await admin.from('profiles').select('role').eq('id', uid).maybeSingle();
  const role = profile?.role || null;
  if (!role) return { error: 'No role assigned. Ask an admin to grant you access.' };

  return { uid, role, db: makeFirestoreShim(admin), supabase: admin };
}
