import { Html, Head, Main, NextScript } from 'next/document';

// _document.js — single source of truth for static <head> tags.
// IMPORTANT: _document is server-rendered only. React does NOT hydrate
// elements outside <Main> (body siblings like the skip link below).
// Therefore event handlers here are handled via pure CSS :focus-visible,
// NOT inline JS event handlers (which would silently fail post-hydration).
export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Preconnect — eliminates DNS + TLS latency for Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700;800&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="icon"             href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
        <meta name="theme-color"     content="#080d1a" />
        <meta name="viewport"        content="width=device-width, initial-scale=1" />
      </Head>
      <body>
        {/*
          Skip-to-content link — keyboard/screen-reader accessibility.
          FIX: removed onFocus/onBlur inline handlers. _document body content
          is not hydrated by React, so JS event handlers silently do nothing.
          The show/hide is now handled entirely via CSS in globals.css using
          the .skip-link and .skip-link:focus-visible selectors.
        */}
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
