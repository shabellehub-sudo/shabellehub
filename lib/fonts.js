import { Space_Grotesk, Inter } from 'next/font/google';

/**
 * Self-hosted fonts via next/font/google.
 *
 * Previously fonts loaded through a <link rel="stylesheet"> to
 * fonts.googleapis.com in _document.js — an external, render-blocking
 * request (flagged by PageSpeed as "Render-blocking requests", ~150ms,
 * plus a multi-hop "Network dependency tree": preconnect → stylesheet →
 * font file). next/font downloads the font files at BUILD time and
 * serves them from our own domain with automatic font-display:swap and
 * no external request at all — it removes that dependency chain
 * entirely rather than just speeding it up.
 */
export const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: 'variable', // static weights only go up to 700; our CSS uses 800 in places, so use the variable axis which covers the full range
  variable: '--font-space-grotesk',
  display: 'swap',
});

export const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});
