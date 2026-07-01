import Script from 'next/script';

// ─── GOOGLE ADSENSE LOADER ───────────────────────────────────────────────────
// Loads the AdSense script site-wide only when NEXT_PUBLIC_ADSENSE_CLIENT_ID
// is configured with a real publisher ID (ca-pub-XXXXXXXXXXXXXXXX). Until
// AdSense approval, this renders nothing — no broken script tags, no console
// errors, no policy-risk placeholder ad code shipped to production.
const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
const isConfigured = ADSENSE_CLIENT_ID && ADSENSE_CLIENT_ID.startsWith('ca-pub-');

export default function AdSenseScript() {
  if (!isConfigured) return null;

  return (
    <Script
      async
      strategy="afterInteractive"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
      crossOrigin="anonymous"
    />
  );
}

export { ADSENSE_CLIENT_ID, isConfigured as isAdSenseConfigured };
