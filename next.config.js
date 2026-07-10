/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'shabellehub.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },

  // Perf (Phase 6): inlines critical, above-the-fold CSS directly into the
  // HTML response and defers/loads the rest asynchronously, instead of
  // shipping N render-blocking <link rel="stylesheet"> tags per page.
  // PageSpeed flagged "Render-blocking requests" at ~300ms across 4 CSS
  // chunks — this addresses that directly at build time via Critters.
  // No component code, styles, or markup changes; purely how the existing
  // CSS is delivered.
  experimental: {
    optimizeCss: true,
  },

  async headers() {
    const csp = [
      "default-src 'self'",
      // Supabase Auth widgets aren't used; AdSense scripts
      "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://pagead2.googlesyndication.com https://adservice.google.com https://www.googleadservices.com https://apis.google.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https:",
      // AdSense frames
      "frame-src 'self' https://accounts.google.com https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://www.youtube-nocookie.com https://www.youtube.com",
      // Supabase (Auth, Postgres via PostgREST, Storage) API + realtime + Analytics
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.google-analytics.com https://api.mailchimp.com https://api.convertkit.com https://pagead2.googlesyndication.com https://api.resend.com",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "base-uri 'self'",
      "object-src 'none'",
    ].join('; ');

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options',  value: 'nosniff' },
          { key: 'X-Frame-Options',         value: 'DENY' },
          { key: 'Referrer-Policy',          value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control',   value: 'on' },
          { key: 'Permissions-Policy',       value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Content-Security-Policy',  value: csp },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/blog/claude-vs-chatgpt-complete-comparison",
        destination: "/blog/claude-vs-chatgpt-2026",
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
