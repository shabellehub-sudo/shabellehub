// ─── CMS AUTH HOOK (SUPABASE) ─────────────────────────────────────────────────
// Session persistence: Supabase Auth uses localStorage by default — sessions
// survive page refresh AND browser restart automatically.
// The __session cookie is written on login purely so Edge middleware can
// detect a session without the Supabase SDK (not available in Edge runtime).
//
// Loop prevention: useRequireAuth() only redirects when status is fully
// settled ('signed-out' | 'no-role') and never redirects while 'loading'.
// It also skips redirect if already on /admin/login to prevent loops.

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import { getSupabaseClient, isSupabaseConfigured } from '../supabase';

async function fetchUserProfile(client, uid) {
  try {
    const { data } = await client.from('profiles').select('*').eq('id', uid).maybeSingle();
    return data || null;
  } catch {
    return null;
  }
}

function writeSessionCookie() {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `__session=1; path=/; expires=${expires}; SameSite=Strict`;
}

function clearSessionCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = '__session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict';
}

export function useAuth() {
  const [state, setState] = useState({
    status: isSupabaseConfigured() ? 'loading' : 'unconfigured',
    user: null,
    role: null,
    error: null,
  });

  const resolvedRef = useRef(false);

  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) {
      setState({ status: 'unconfigured', user: null, role: null, error: null });
      return;
    }

    let mounted = true;

    async function resolveSession(session) {
      if (!mounted) return;
      const user = session?.user || null;

      if (!user) {
        resolvedRef.current = true;
        clearSessionCookie();
        setState({ status: 'signed-out', user: null, role: null, error: null });
        return;
      }

      const profile = await fetchUserProfile(client, user.id);
      if (!mounted) return;
      resolvedRef.current = true;

      if (!profile || !profile.role) {
        setState({ status: 'no-role', user, role: null, error: null });
        return;
      }

      writeSessionCookie();
      setState({ status: 'authenticated', user, role: profile.role, error: null });
    }

    client.auth.getSession().then(({ data }) => resolveSession(data?.session));

    const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
      resolveSession(session);
    });

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  const signInWithPassword = useCallback(async (email, password) => {
    const client = getSupabaseClient();
    if (!client) return { error: 'Supabase is not configured.' };

    setState(s => ({ ...s, error: null }));
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) {
      const message = mapAuthError(error.message);
      setState(s => ({ ...s, error: message }));
      return { error: message };
    }
    return { error: null };
  }, []);

  const signUpWithPassword = useCallback(async (email, password) => {
    const client = getSupabaseClient();
    if (!client) return { error: 'Supabase is not configured.' };

    setState(s => ({ ...s, error: null }));
    const { error } = await client.auth.signUp({ email, password });
    if (error) {
      const message = mapAuthError(error.message);
      setState(s => ({ ...s, error: message }));
      return { error: message };
    }
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    const client = getSupabaseClient();
    if (!client) return;
    clearSessionCookie();
    await client.auth.signOut();
  }, []);

  return {
    ...state,
    signInWithPassword,
    signUpWithPassword,
    signOut,
    isAdmin: state.role === 'admin',
    isEditor: state.role === 'editor' || state.role === 'admin',
  };
}

// ── Route guard ───────────────────────────────────────────────────────────────
export function useRequireAuth(requiredRole = 'editor') {
  const auth = useAuth();
  const router = useRouter();
  const redirectingRef = useRef(false);

  useEffect(() => {
    if (auth.status === 'loading' || auth.status === 'unconfigured') return;
    if (router.pathname === '/admin/login') return;
    if (redirectingRef.current) return;

    if (auth.status === 'signed-out' || auth.status === 'no-role') {
      redirectingRef.current = true;
      router.replace('/admin/login');
      return;
    }

    if (auth.status === 'authenticated') {
      redirectingRef.current = false;
      if (requiredRole === 'admin' && auth.role !== 'admin') {
        router.replace('/admin');
      }
    }
  }, [auth.status, auth.role, requiredRole, router]);

  return auth;
}

function mapAuthError(message) {
  const m = (message || '').toLowerCase();
  if (m.includes('invalid login credentials')) return 'Invalid email or password.';
  if (m.includes('email not confirmed')) return 'Please confirm your email before signing in (check your inbox).';
  if (m.includes('user already registered')) return 'An account with that email already exists.';
  if (m.includes('rate limit')) return 'Too many attempts. Try again later.';
  if (m.includes('network')) return 'Network error. Check your connection.';
  return message || 'Sign-in failed. Please try again.';
}
