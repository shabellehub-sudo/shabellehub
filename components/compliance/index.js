import Link from 'next/link';
import { formatDate } from '../../lib/eeat';

// ─── AFFILIATE DISCLOSURE ────────────────────────────────────────────────────
// Inline disclosure shown near affiliate buttons/links. `compact` renders a
// single small line (for use directly under a CTA button); the full version
// is a short standalone block for page-level placement.
export function AffiliateDisclosure({ compact = false }) {
  if (compact) {
    return (
      <p style={{ color: '#6b82a8', fontSize: 11, marginTop: 10, opacity: 0.75, lineHeight: 1.5 }}>
        ℹ️ This is an affiliate link. If you sign up through it, Shabelle Hub may earn a commission at no
        extra cost to you. This never affects our ratings — see our{' '}
        <Link href="/affiliate-disclosure" style={{ color: '#14FFF4' }}>Affiliate Disclosure</Link>.
      </p>
    );
  }
  return (
    <div style={{
      background: '#0f1829', border: '1px solid #1a2d4a', borderRadius: 14,
      padding: '16px 20px', display: 'flex', gap: 12, alignItems: 'flex-start',
    }}>
      <span aria-hidden="true" style={{ fontSize: 18 }}>🔗</span>
      <p style={{ color: '#6b82a8', fontSize: 13, lineHeight: 1.65 }}>
        <strong style={{ color: '#e8f0ff' }}>Affiliate relationship:</strong> Some links on this page are
        affiliate links. If you sign up or make a purchase through one, Shabelle Hub may receive a
        commission at no extra cost to you. Commission potential is never a factor in how we score or rank
        a tool — see our{' '}
        <Link href="/affiliate-disclosure" style={{ color: '#14FFF4' }}>Affiliate Disclosure</Link>{' '}
        for the full policy.
      </p>
    </div>
  );
}

// ─── ADVERTISING NOTICE ──────────────────────────────────────────────────────
// Explains that the page may show third-party ads and that ads are separate
// from, and do not influence, editorial content.
export function AdvertisingNotice({ compact = false }) {
  if (compact) {
    return (
      <p style={{ color: '#6b82a8', fontSize: 11, opacity: 0.7, lineHeight: 1.5 }}>
        This page may display ads served by Google AdSense and other third-party networks. Ads are
        labeled and never written or endorsed by our editorial team. See our{' '}
        <Link href="/advertising-disclosure" style={{ color: '#14FFF4' }}>Advertising Disclosure</Link>.
      </p>
    );
  }
  return (
    <div style={{
      background: '#0f1829', border: '1px solid #1a2d4a', borderRadius: 14,
      padding: '16px 20px', display: 'flex', gap: 12, alignItems: 'flex-start',
    }}>
      <span aria-hidden="true" style={{ fontSize: 18 }}>📢</span>
      <p style={{ color: '#6b82a8', fontSize: 13, lineHeight: 1.65 }}>
        <strong style={{ color: '#e8f0ff' }}>Advertising:</strong> This site may show ads served by Google
        AdSense and other third-party advertising networks. Advertisements are visually separated from and
        clearly distinguishable from our editorial content, and advertisers have no influence over our
        reviews, ratings, or rankings. Read our{' '}
        <Link href="/advertising-disclosure" style={{ color: '#14FFF4' }}>Advertising Disclosure</Link>{' '}
        for details, including how ad personalization works and how to opt out.
      </p>
    </div>
  );
}

// ─── CONTENT UPDATE NOTICE ───────────────────────────────────────────────────
// Communicates content freshness / maintenance cadence. Used on category and
// listing pages where a full TrustBlock byline doesn't apply to a single
// author/reviewer.
export function ContentUpdateNotice({ lastUpdated, frequency = 'monthly' }) {
  return (
    <div style={{
      background: '#0f1829', border: '1px solid #1a2d4a', borderRadius: 14,
      padding: '14px 20px', display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 16,
    }}>
      <span aria-hidden="true" style={{ fontSize: 18 }}>🔄</span>
      <p style={{ color: '#6b82a8', fontSize: 13, lineHeight: 1.65 }}>
        <strong style={{ color: '#e8f0ff' }}>Content freshness:</strong>{' '}
        {lastUpdated ? (
          <>This page was last updated on <time dateTime={lastUpdated}>{formatDate(lastUpdated)}</time>. </>
        ) : null}
        Rankings, pricing, and feature details are checked on a {frequency} basis and corrected as soon as
        we identify a change. See our{' '}
        <Link href="/content-policy" style={{ color: '#14FFF4' }}>Content Policy</Link>{' '}
        for our update process, or{' '}
        <Link href="/contact" style={{ color: '#14FFF4' }}>report outdated information</Link>.
      </p>
    </div>
  );
}

// ─── TRANSPARENCY NOTICE ─────────────────────────────────────────────────────
// Short, reusable pointer to the /site-transparency hub — ownership, funding,
// editorial process, and contact info in one place.
export function TransparencyNotice({ variant = 'default' }) {
  if (variant === 'minimal') {
    return (
      <p style={{ color: '#6b82a8', fontSize: 12, lineHeight: 1.6 }}>
        For information on who runs this site, how it&rsquo;s funded, and how content is produced, see our{' '}
        <Link href="/site-transparency" style={{ color: '#14FFF4' }}>Site Transparency</Link> page.
      </p>
    );
  }
  return (
    <div style={{
      background: '#0f1829', border: '1px solid #1a2d4a', borderRadius: 14,
      padding: '16px 20px', display: 'flex', gap: 12, alignItems: 'flex-start',
    }}>
      <span aria-hidden="true" style={{ fontSize: 18 }}>🔍</span>
      <p style={{ color: '#6b82a8', fontSize: 13, lineHeight: 1.65 }}>
        <strong style={{ color: '#e8f0ff' }}>Site transparency:</strong> Shabelle Hub publishes who owns and
        runs this site, how we&rsquo;re funded, who writes and reviews our content, and how to reach us — all
        in one place. Visit{' '}
        <Link href="/site-transparency" style={{ color: '#14FFF4' }}>Site Transparency</Link>{' '}
        for the full picture.
      </p>
    </div>
  );
}

// ─── COMPLIANCE BANNER ───────────────────────────────────────────────────────
// Compact, sitewide combined notice (affiliate + advertising + transparency)
// for the footer and homepage. Always visible — no dismiss/local-storage,
// per AdSense guidance that disclosures must not be hideable.
export function ComplianceBanner() {
  return (
    <div style={{
      background: 'rgba(20,255,244,0.04)', border: '1px solid rgba(20,255,244,0.15)',
      borderRadius: 14, padding: '14px 20px', display: 'flex', gap: 12, alignItems: 'flex-start',
    }}>
      <span aria-hidden="true" style={{ fontSize: 18 }}>✅</span>
      <p style={{ color: '#6b82a8', fontSize: 12, lineHeight: 1.65 }}>
        Shabelle Hub is reader-supported. We may earn an affiliate commission when you sign up for a tool
        through our links, and this site may display ads served by Google AdSense and other networks.
        Neither affects our editorial ratings.{' '}
        <Link href="/affiliate-disclosure" style={{ color: '#14FFF4' }}>Affiliate Disclosure</Link>{' '}
        ·{' '}
        <Link href="/advertising-disclosure" style={{ color: '#14FFF4' }}>Advertising Disclosure</Link>{' '}
        ·{' '}
        <Link href="/site-transparency" style={{ color: '#14FFF4' }}>Site Transparency</Link>
      </p>
    </div>
  );
}
