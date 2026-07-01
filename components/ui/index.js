import { useState, useId } from 'react';
import Link from 'next/link';
// FIXED: was '../lib/affiliate' (wrong — resolves to components/lib/affiliate which doesn't exist)
// Correct relative path from components/ui/ up two levels to lib/
import { openAffiliateLink } from '../../lib/affiliate';

// ─── STAR RATING ─────────────────────────────────────────────────────────────
// FIXED: duplicate SVG id="halfGrad" — when multiple StarRatings render on one page
// they all shared id="halfGrad", causing the gradient to be undefined for all but
// the first. useId() generates a unique ID per component instance.
export function StarRating({ rating, size = 14 }) {
  const uid = useId().replace(/:/g, '');   // colons are invalid in SVG IDs
  const gradId = `halfGrad-${uid}`;
  const full = Math.floor(rating);
  const half = rating % 1 !== 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <linearGradient id={gradId} x1="0" x2="1" y1="0" y2="0">
            <stop offset="50%" stopColor="#14FFF4" />
            <stop offset="50%" stopColor="#1a2d4a" />
          </linearGradient>
        </defs>
      </svg>
      {[1, 2, 3, 4, 5].map(i => {
        const fill =
          i <= full
            ? '#14FFF4'
            : i === full + 1 && half
            ? `url(#${gradId})`
            : '#1a2d4a';
        return (
          <svg key={i} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
            <polygon
              points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9"
              fill={fill}
            />
          </svg>
        );
      })}
      <span
        style={{ color: '#14FFF4', fontSize: size - 1, fontWeight: 700, marginLeft: 4 }}
        aria-label={`${rating} out of 5 stars`}
      >
        {rating}
      </span>
    </div>
  );
}

// ─── BADGE ────────────────────────────────────────────────────────────────────
export function Badge({ text, variant = 'default' }) {
  const styles = {
    default: { background: 'rgba(20,255,244,0.1)',  color: '#14FFF4', border: '1px solid rgba(20,255,244,0.3)' },
    hot:     { background: 'rgba(255,77,109,0.12)', color: '#ff4d6d', border: '1px solid rgba(255,77,109,0.3)' },
    gold:    { background: 'rgba(255,215,0,0.12)',  color: '#ffd700', border: '1px solid rgba(255,215,0,0.3)' },
    free:    { background: 'rgba(0,208,132,0.1)',   color: '#00d084', border: '1px solid rgba(0,208,132,0.3)' },
  };
  return (
    <span style={{ fontSize: 10, fontWeight: 800, borderRadius: 4, padding: '2px 7px', ...(styles[variant] || styles.default) }}>
      {text}
    </span>
  );
}

// ─── TOOL CARD ────────────────────────────────────────────────────────────────
// FIXED: card was a plain <div> with cursor:pointer but had no navigation.
// Clicking the card body now navigates to /tools/[slug] via a Link wrapper.
// The save bookmark button and "Try Free" button use stopPropagation so they
// don't trigger the Link navigation.
export function ToolCard({ tool, isFavorite, onToggleFavorite }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ position: 'relative' }}
    >
      {/* Scanline accent on hover */}
      {hovered && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2, zIndex: 1,
          background: 'linear-gradient(90deg, transparent, #14FFF4, transparent)',
          animation: 'scanline 1.5s infinite',
          borderRadius: '14px 14px 0 0',
          pointerEvents: 'none',
        }} />
      )}

      <Link
        href={`/tools/${tool.slug}`}
        style={{ display: 'block', textDecoration: 'none' }}
        aria-label={`View ${tool.name} review`}
      >
        <div style={{
          background: '#0f1829',
          border: `1px solid ${hovered ? '#14FFF4' : '#1a2d4a'}`,
          borderRadius: 14,
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          overflow: 'hidden',
          transition: 'border-color 0.2s, transform 0.2s',
          transform: hovered ? 'translateY(-2px)' : 'none',
        }}>
          {/* Top row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                background: 'rgba(20,255,244,0.1)', border: '1px solid rgba(20,255,244,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: 800, color: '#14FFF4', fontFamily: 'Space Grotesk, sans-serif',
              }}>
                {tool.name[0]}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 15, fontWeight: 700, color: '#e8f0ff' }}>
                    {tool.name}
                  </span>
                  {tool.hot && <Badge text="HOT" variant="hot" />}
                  {tool.badge && <Badge text={tool.badge} />}
                </div>
                <div style={{ color: '#6b82a8', fontSize: 11, marginTop: 1 }}>{tool.category}</div>
              </div>
            </div>

            {/* Bookmark — stops propagation so it doesn't follow the Link */}
            <button
              onClick={e => { e.preventDefault(); e.stopPropagation(); onToggleFavorite?.(tool.id); }}
              style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: isFavorite ? '#ff4d6d' : '#6b82a8', flexShrink: 0 }}
              aria-label={isFavorite ? `Unsave ${tool.name}` : `Save ${tool.name}`}
            >
              <svg width="17" height="17" viewBox="0 0 24 24"
                fill={isFavorite ? '#ff4d6d' : 'none'}
                stroke={isFavorite ? '#ff4d6d' : '#6b82a8'}
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              >
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
            </button>
          </div>

          <StarRating rating={tool.rating} />

          <p style={{ color: '#6b82a8', fontSize: 13, lineHeight: 1.6, flex: 1 }}>
            {tool.desc}
          </p>

          {/* Tags */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {tool.tags.map(t => (
              <span key={t} style={{
                fontSize: 11, color: '#6b82a8',
                background: 'rgba(26,45,74,0.5)', border: '1px solid #1a2d4a',
                borderRadius: 5, padding: '2px 8px',
              }}>{t}</span>
            ))}
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(26,45,74,0.6)', paddingTop: 12 }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: '#e8f0ff' }}>{tool.price}</span>
            {/* Affiliate CTA — stops propagation so it opens external URL, not the detail page */}
            <button
              onClick={e => { e.preventDefault(); e.stopPropagation(); openAffiliateLink(tool); }}
              aria-label={tool.priceTier === 'paid' ? `Visit ${tool.name}` : `Try ${tool.name} free`}
              style={{
                background: '#14FFF4', color: '#080d1a', border: 'none',
                borderRadius: 9, padding: '7px 16px', fontSize: 12, fontWeight: 800,
                cursor: 'pointer', transition: 'opacity 0.2s',
              }}
            >
              {tool.priceTier === 'paid' ? 'Visit →' : 'Try Free →'}
            </button>
          </div>
        </div>
      </Link>
    </div>
  );
}

// ─── NEWSLETTER FORM ──────────────────────────────────────────────────────────
export function NewsletterForm() {
  const [email, setEmail]       = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async () => {
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes('@') || !trimmed.includes('.')) {
      setError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div style={{
        background: 'rgba(20,255,244,0.06)', border: '1px solid rgba(20,255,244,0.2)',
        borderRadius: 12, padding: '18px 24px', color: '#14FFF4', fontWeight: 600,
        fontSize: 14, textAlign: 'center',
      }}>
        🎉 You&apos;re subscribed! Check your inbox for a confirmation email.
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !loading && handleSubmit()}
          placeholder="Enter your email address..."
          aria-label="Email address for newsletter"
          style={{
            flex: 1, minWidth: 200,
            background: '#0f1829', border: '1px solid #1a2d4a',
            borderRadius: 10, padding: '12px 16px',
            color: '#e8f0ff', fontSize: 14, outline: 'none',
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            background: '#14FFF4', color: '#080d1a', border: 'none',
            borderRadius: 10, padding: '12px 22px',
            fontWeight: 800, fontSize: 14,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            transition: 'opacity 0.2s',
          }}
        >
          {loading ? 'Subscribing…' : 'Subscribe Free'}
        </button>
      </div>
      {error && (
        <p role="alert" style={{ color: '#ff4d6d', fontSize: 12, marginTop: 8, textAlign: 'center' }}>
          {error}
        </p>
      )}
    </div>
  );
}

// ─── SECTION WRAPPER ─────────────────────────────────────────────────────────
export function Section({ children, surface = false, style = {} }) {
  return (
    <section style={{
      padding: '40px 20px',
      background: surface ? '#0c1522' : 'transparent',
      borderTop: surface ? '1px solid #1a2d4a' : undefined,
      ...style,
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {children}
      </div>
    </section>
  );
}

// ─── PAGE TITLE ───────────────────────────────────────────────────────────────
export function PageTitle({ children, sub }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h1 style={{
        fontFamily: 'Space Grotesk, sans-serif',
        fontSize: 'clamp(24px,5vw,36px)',
        fontWeight: 800,
        color: '#e8f0ff',
      }}>
        {children}
      </h1>
      {sub && (
        <p style={{ color: '#6b82a8', fontSize: 15, marginTop: 8 }}>{sub}</p>
      )}
    </div>
  );
}
