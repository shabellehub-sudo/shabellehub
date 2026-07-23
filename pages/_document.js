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
        {/*
          Google Fonts <link> removed (Phase 5 perf fix): this was an
          external, render-blocking stylesheet request (~150ms, flagged
          by PageSpeed as "Render-blocking requests" + a multi-hop
          "Network dependency tree"). Fonts are now self-hosted via
          next/font/google — see lib/fonts.js — with zero external
          requests and no render-blocking behavior.
        */}
        <link rel="icon"             href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
        <meta name="theme-color"     content="#080d1a" />
        <meta name="viewport"        content="width=device-width, initial-scale=1" />

        {/* Google Translate widget (Somali support) */}
        <script
          type="text/javascript"
          dangerouslySetInnerHTML={{
            __html: `
              function googleTranslateElementInit() {
                new google.translate.TranslateElement(
                  {
                    pageLanguage: 'en',
                    includedLanguages: 'so,en',
                    layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
                    autoDisplay: false,
                  },
                  'google_translate_element'
                );
              }
            `,
          }}
        />
        <script
          type="text/javascript"
          src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
          async
        />
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
