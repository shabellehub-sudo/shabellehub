// components/newsletter/SignupForm.js — Phase 7A
// Reusable newsletter signup form. Works in homepage, footer, and blog CTAs.
// Props:
//   source     — 'homepage' | 'footer' | 'blog' (default: 'homepage')
//   variant    — 'default' | 'inline' | 'compact'
//   heading    — override heading text
//   subheading — override subheading text

import { useState } from 'react';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function NewsletterSignupForm({
  source     = 'homepage',
  variant    = 'default',
  heading    = 'Get the latest AI tool reviews',
  subheading = 'New tools, comparisons, and expert insights — delivered weekly.',
}) {
  const [email,   setEmail]   = useState('');
  const [status,  setStatus]  = useState('idle'); // idle | loading | success | error
  const [message, setMessage] = useState('');

  const isCompact = variant === 'compact';
  const isInline  = variant === 'inline';

  async function handleSubmit(e) {
    e.preventDefault();
    if (status === 'loading' || status === 'success') return;

    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setStatus('error');
      setMessage('Please enter a valid email address.');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: trimmed, source }),
      });
      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setMessage('You\'re subscribed! 🎉 Welcome to the Shabelle Hub newsletter.');
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.error || 'Subscription failed. Please try again.');
      }
    } catch {
      setStatus('error');
      setMessage('Network error. Please try again.');
    }
  }

  // ── Compact (footer row) ──────────────────────────────────────────────────
  if (isCompact) {
    return (
      <div>
        {status === 'success' ? (
          <p style={{ color: '#00d084', fontSize: 13, lineHeight: 1.5 }}>{message}</p>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); if (status === 'error') setStatus('idle'); }}
              placeholder="Your email"
              required
              aria-label="Email address"
              style={{
                flex: '1 1 180px', minWidth: 0,
                background: '#080d1a', border: '1px solid #2a3d5c',
                borderRadius: 8, padding: '8px 12px',
                color: '#e8f0ff', fontSize: 13,
              }}
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              style={{
                background: '#14FFF4', color: '#080d1a',
                border: 'none', borderRadius: 8,
                padding: '8px 16px', fontWeight: 700,
                fontSize: 13, cursor: status === 'loading' ? 'wait' : 'pointer',
                whiteSpace: 'nowrap', flexShrink: 0,
              }}
            >
              {status === 'loading' ? 'Subscribing…' : 'Subscribe'}
            </button>
          </form>
        )}
        {status === 'error' && (
          <p style={{ color: '#ff8080', fontSize: 12, marginTop: 6 }}>{message}</p>
        )}
      </div>
    );
  }

  // ── Inline (blog CTA) ─────────────────────────────────────────────────────
  if (isInline) {
    return (
      <div style={{
        background: 'rgba(20,255,244,0.04)',
        border: '1px solid rgba(20,255,244,0.15)',
        borderRadius: 14, padding: '24px 28px',
        marginTop: 40, marginBottom: 40,
      }}>
        <p style={{
          fontFamily: 'Space Grotesk, sans-serif',
          fontSize: 17, fontWeight: 800, color: '#e8f0ff',
          marginBottom: 6,
        }}>
          📬 {heading}
        </p>
        <p style={{ color: '#6b82a8', fontSize: 13, marginBottom: 16 }}>{subheading}</p>

        {status === 'success' ? (
          <p style={{ color: '#00d084', fontWeight: 600, fontSize: 14 }}>{message}</p>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); if (status === 'error') setStatus('idle'); }}
              placeholder="your@email.com"
              required
              aria-label="Email address"
              style={{
                flex: '1 1 220px', minWidth: 0,
                background: '#080d1a', border: `1px solid ${status === 'error' ? 'rgba(255,80,80,0.5)' : '#2a3d5c'}`,
                borderRadius: 8, padding: '10px 14px',
                color: '#e8f0ff', fontSize: 14,
              }}
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              style={{
                background: '#14FFF4', color: '#080d1a',
                border: 'none', borderRadius: 8,
                padding: '10px 22px', fontWeight: 800,
                fontSize: 14, cursor: status === 'loading' ? 'wait' : 'pointer',
                flexShrink: 0,
              }}
            >
              {status === 'loading' ? 'Subscribing…' : 'Subscribe free →'}
            </button>
          </form>
        )}
        {status === 'error' && (
          <p style={{ color: '#ff8080', fontSize: 12, marginTop: 8 }}>{message}</p>
        )}
      </div>
    );
  }

  // ── Default (homepage section) ────────────────────────────────────────────
  return (
    <div style={{ textAlign: 'center' }}>
      <h2 style={{
        fontFamily: 'Space Grotesk, sans-serif',
        fontSize: 'clamp(20px, 3.5vw, 26px)', fontWeight: 800,
        color: '#e8f0ff', marginBottom: 10,
      }}>
        {heading}
      </h2>
      <p style={{ color: '#6b82a8', fontSize: 14, marginBottom: 28, maxWidth: 460, margin: '0 auto 28px' }}>
        {subheading}
      </p>

      {status === 'success' ? (
        <div style={{
          background: 'rgba(0,208,132,0.1)', border: '1px solid rgba(0,208,132,0.3)',
          borderRadius: 12, padding: '14px 24px', display: 'inline-block',
          color: '#00d084', fontWeight: 600, fontSize: 14,
        }}>
          {message}
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex', gap: 10, justifyContent: 'center',
            flexWrap: 'wrap', maxWidth: 500, margin: '0 auto',
          }}
        >
          <input
            type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); if (status === 'error') setStatus('idle'); }}
            placeholder="Enter your email address"
            required
            aria-label="Email address"
            style={{
              flex: '1 1 260px', minWidth: 0,
              background: '#0f1829',
              border: `1px solid ${status === 'error' ? 'rgba(255,80,80,0.5)' : '#2a3d5c'}`,
              borderRadius: 10, padding: '13px 16px',
              color: '#e8f0ff', fontSize: 15,
            }}
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            style={{
              background: '#14FFF4', color: '#080d1a',
              border: 'none', borderRadius: 10,
              padding: '13px 28px', fontWeight: 800,
              fontSize: 15, cursor: status === 'loading' ? 'wait' : 'pointer',
              flexShrink: 0, transition: 'opacity 0.15s',
              opacity: status === 'loading' ? 0.7 : 1,
            }}
          >
            {status === 'loading' ? 'Subscribing…' : 'Subscribe free'}
          </button>
        </form>
      )}

      {status === 'error' && (
        <p style={{ color: '#ff8080', fontSize: 13, marginTop: 10 }}>{message}</p>
      )}

      <p style={{ color: '#3d5470', fontSize: 12, marginTop: 14 }}>
        No spam. Unsubscribe anytime.
      </p>
    </div>
  );
}
