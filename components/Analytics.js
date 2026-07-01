import Script from 'next/script';

// ─── GOOGLE ANALYTICS 4 ──────────────────────────────────────────────────────
// Loads only when NEXT_PUBLIC_GA_MEASUREMENT_ID is set to a real ID (not the
// placeholder). Safe to include unconditionally in _app.js — renders nothing
// during local development unless a real measurement ID is configured.
const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const isConfigured = GA_ID && GA_ID !== 'G-XXXXXXXXXX';

export default function Analytics() {
  if (!isConfigured) return null;

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', { anonymize_ip: true });
        `}
      </Script>
    </>
  );
}

// ── Helper for sending custom events from anywhere in the app ──────────────
export function trackEvent(action, params = {}) {
  if (typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', action, params);
}
