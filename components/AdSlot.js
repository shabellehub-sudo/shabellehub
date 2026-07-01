import { useEffect, useRef } from 'react';
import { ADSENSE_CLIENT_ID, isAdSenseConfigured } from './AdSenseScript';

// ─── AD SLOT ──────────────────────────────────────────────────────────────────
// Reusable, policy-safe ad placement component.
//
// Before AdSense approval (no NEXT_PUBLIC_ADSENSE_CLIENT_ID configured):
//   Renders nothing in production. In development, renders a labelled
//   placeholder box so layout/spacing can be reviewed before going live.
//
// After approval (env var set):
//   Renders a real <ins class="adsbygoogle"> unit and pushes it to the
//   adsbygoogle queue once mounted.
//
// Usage: <AdSlot slot="1234567890" format="auto" label="In-article ad" />
//
// Placement guidance (do not place ads):
//   - Above the fold on first viewport paint
//   - Inside or directly adjacent to navigation
//   - In a way that could be mistaken for editorial content or a button
//   - On thin-content pages (legal/policy pages, author/reviewer profiles)
export default function AdSlot({ slot, format = 'auto', label = 'Advertisement', style = {}, responsive = true }) {
  const insRef = useRef(null);

  useEffect(() => {
    if (!isAdSenseConfigured) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      // Swallow push errors silently — AdSense throws if called before
      // script load completes or in rare double-mount situations (React
      // StrictMode); this must never surface as a visible error to users.
    }
  }, []);

  if (!isAdSenseConfigured) {
    if (process.env.NODE_ENV !== 'production') {
      return (
        <div
          aria-hidden="true"
          style={{
            background: 'repeating-linear-gradient(45deg, #0f1829, #0f1829 10px, #14213a 10px, #14213a 20px)',
            border: '1px dashed #2a3d5c',
            borderRadius: 8,
            padding: '24px 16px',
            textAlign: 'center',
            color: '#6b82a8',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 0.5,
            textTransform: 'uppercase',
            margin: '20px 0',
            ...style,
          }}
        >
          Ad Slot — {label} ({slot})
        </div>
      );
    }
    return null;
  }

  return (
    <div style={{ margin: '20px 0', textAlign: 'center', ...style }}>
      <span style={{ display: 'block', fontSize: 10, color: '#6b82a8', marginBottom: 4, letterSpacing: 0.5, textTransform: 'uppercase' }}>
        Advertisement
      </span>
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_CLIENT_ID}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
    </div>
  );
}
