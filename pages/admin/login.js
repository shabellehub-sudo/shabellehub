// pages/admin/login.js
// Handles: sign-in, redirect after auth, loop prevention, unconfigured state.
// Session cookie (__session) is written by useAuth's onAuthStateChanged
// listener after successful sign-in — NOT written here directly, which
// avoids a race between the cookie write and the redirect.

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../lib/cms/useAuth';
import { isSupabaseConfigured } from '../../lib/supabase';

export default function AdminLoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const configured = isSupabaseConfigured();
  const redirectedRef = useRef(false);

  // Redirect already-authenticated users — only once, no loop
  useEffect(() => {
    if (redirectedRef.current) return;
    if (auth.status === 'authenticated') {
      redirectedRef.current = true;
      const dest = router.query.from || '/admin';
      // Ensure we never redirect back to /admin/login
      const safe = String(dest).startsWith('/admin/login') ? '/admin' : dest;
      router.replace(safe);
    }
  }, [auth.status, router]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    const { error } = await auth.signInWithPassword(email, password);
    // If error, submitting resets so user can retry.
    // If success, onAuthStateChanged fires → writes cookie → useEffect above redirects.
    if (error) setSubmitting(false);
    // intentionally leave submitting=true on success to prevent double-submit
    // while the redirect is in flight
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#080d1a',
      color: '#e8f0ff',
      fontFamily: 'Inter, sans-serif',
      padding: 20,
    }}>
      <div style={{
        width: '100%',
        maxWidth: 380,
        background: '#0f1829',
        border: '1px solid #1a2d4a',
        borderRadius: 16,
        padding: 36,
      }}>
        {/* Logo */}
        <div style={{ marginBottom: 28 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 42,
            height: 42,
            background: 'rgba(20,255,244,0.1)',
            border: '1px solid rgba(20,255,244,0.3)',
            borderRadius: 10,
            marginBottom: 16,
            fontSize: 20,
          }}>🛠️</div>
          <h1 style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: 20,
            fontWeight: 800,
            color: '#e8f0ff',
            marginBottom: 4,
          }}>
            Shabelle Hub CMS
          </h1>
          <p style={{ color: '#6b82a8', fontSize: 13 }}>
            Sign in to manage content
          </p>
        </div>

        {!configured ? (
          <div style={{
            background: 'rgba(255,193,71,0.08)',
            border: '1px solid rgba(255,193,71,0.3)',
            borderRadius: 10,
            padding: 16,
            fontSize: 13,
            color: '#ffc147',
            lineHeight: 1.7,
          }}>
            <strong style={{ display: 'block', marginBottom: 8 }}>Supabase not configured</strong>
            Add these environment variables to Vercel, then redeploy:
            <ul style={{ marginTop: 10, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 3, fontFamily: 'monospace', fontSize: 12 }}>
              <li>NEXT_PUBLIC_SUPABASE_URL</li>
              <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
              <li>SUPABASE_SERVICE_ROLE_KEY</li>
            </ul>
          </div>
        ) : auth.status === 'loading' ? (
          <p style={{ color: '#6b82a8', fontSize: 13, textAlign: 'center' }}>
            Checking session…
          </p>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            {auth.error && (
              <div style={{
                background: 'rgba(255,80,80,0.1)',
                border: '1px solid rgba(255,80,80,0.3)',
                borderRadius: 8,
                padding: '10px 14px',
                color: '#ff8080',
                fontSize: 13,
                marginBottom: 18,
                lineHeight: 1.5,
              }}>
                {auth.error}
              </div>
            )}

            <label style={{ display: 'block', marginBottom: 16 }}>
              <span style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#9fb3d4', marginBottom: 6 }}>
                Email
              </span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  background: '#080d1a',
                  border: '1px solid #2a3d5c',
                  borderRadius: 8,
                  padding: '10px 12px',
                  color: '#e8f0ff',
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </label>

            <label style={{ display: 'block', marginBottom: 24 }}>
              <span style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#9fb3d4', marginBottom: 6 }}>
                Password
              </span>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  background: '#080d1a',
                  border: '1px solid #2a3d5c',
                  borderRadius: 8,
                  padding: '10px 12px',
                  color: '#e8f0ff',
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </label>

            <button
              type="submit"
              disabled={submitting}
              style={{
                width: '100%',
                background: submitting ? 'rgba(20,255,244,0.5)' : '#14FFF4',
                color: '#080d1a',
                border: 'none',
                borderRadius: 8,
                padding: '12px 16px',
                fontWeight: 800,
                fontSize: 14,
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontFamily: 'Space Grotesk, sans-serif',
                transition: 'background 0.15s',
              }}
            >
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        )}

        {auth.status === 'no-role' && (
          <div style={{
            marginTop: 16,
            background: 'rgba(255,80,80,0.08)',
            border: '1px solid rgba(255,80,80,0.2)',
            borderRadius: 8,
            padding: 14,
            fontSize: 12.5,
            color: '#ff8080',
            lineHeight: 1.6,
          }}>
            Account exists but has no role assigned. Ask an admin to set your role in the profiles table.
          </div>
        )}
      </div>
    </div>
  );
}
