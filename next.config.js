/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'shabellehub.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },

  experimental: {
    optimizeCss: true,
  },

  async headers() {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://pagead2.googlesyndication.com https://adservice.google.com https://www.googleadservices.com https://apis.google.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https:",
      "frame-src 'self' https://accounts.google.com https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://www.youtube-nocookie.com https://www.youtube.com",
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
          { key: 'Referrer-Policy',         value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control',  value: 'on' },
          { key: 'Permissions-Policy',      value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Content-Security-Policy', value: csp },
        ],
      },
    ];
  },

  async redirects() {
    return [
      {
        source: '/blog/claude-vs-chatgpt-complete-comparison',
        destination: '/blog/claude-vs-chatgpt-2026',
        permanent: true,
      },
      {
        source: '/blog/how-to-write-better-ai-prompts',
        destination: '/blog/ai-prompt-engineering-guide',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
