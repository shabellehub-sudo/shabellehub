import Link from 'next/link';
import { NextSeo } from 'next-seo';

export default function ServerErrorPage() {
  return (
    <>
      {/* FIX #8/#18: strip brand suffix */}
      <NextSeo
        title="Server Error"
        description="Something went wrong. Please try again."
        noindex
      />
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '80px 20px', textAlign: 'center' }}>
        <p aria-hidden="true" style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 80, fontWeight: 800, color: '#ff4d6d', lineHeight: 1 }}>
          500
        </p>
        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 26, fontWeight: 800, color: '#e8f0ff', margin: '16px 0 12px' }}>
          Server Error
        </h1>
        <p style={{ color: '#6b82a8', fontSize: 15, marginBottom: 32, lineHeight: 1.6 }}>
          Something went wrong on our end. Please refresh the page or come back shortly.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/" style={{
            background: '#14FFF4', color: '#080d1a', borderRadius: 12,
            padding: '12px 24px', fontWeight: 800, fontSize: 14, textDecoration: 'none',
          }}>
            Go Home
          </Link>
          <Link href="/tools" style={{
            background: 'none', color: '#e8f0ff', border: '1px solid #1a2d4a',
            borderRadius: 12, padding: '12px 24px', fontWeight: 700, fontSize: 14, textDecoration: 'none',
          }}>
            Browse AI Tools
          </Link>
        </div>
      </div>
    </>
  );
}
