// pages/changes/index.js
// Public "AI Tool Change Log". Follows the same page shape as pages/faq.js:
// NextSeo + getStaticProps, no Navbar/Footer of its own (pages/_app.js
// already wraps every non-admin route in Navbar/Component/Footer).
import { NextSeo } from 'next-seo';
import { getPublicChanges } from '../../lib/changes';
import { SITE_URL } from '../../lib/changes/site';

export async function getStaticProps() {
  // Query failures THROW here on purpose -- a failed fetch must never look
  // like "there are no changes". No empty-array fallback.
  const { display } = await getPublicChanges();
  return { props: { changes: display }, revalidate: 3600 };
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
}

export default function ChangesPage({ changes }) {
  const canonical = `${SITE_URL}/changes`;
  const title = 'AI Tool Change Log';
  const description = 'Track confirmed changes across AI tools, including pricing, plans, models, and other important updates.';

  return (
    <>
      <NextSeo
        title={title}
        description={description}
        canonical={canonical}
        openGraph={{
          title: `${title} — Shabelle Hub`,
          description,
          url: canonical,
          type: 'website',
          siteName: 'Shabelle Hub',
          images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: title }],
        }}
        twitter={{ handle: '@shabellehub', site: '@shabellehub', cardType: 'summary_large_image' }}
      />

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '36px 20px' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 28, fontWeight: 800, marginBottom: 8, color: 'var(--text)' }}>
          {title}
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 4 }}>
          {description}
        </p>
        <p style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 32 }}>
          Updated as changes are confirmed.
        </p>

        {changes.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>No confirmed changes yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {changes.map((c) => (
              <article
                key={c.anchor}
                id={c.anchor}
                style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 20, scrollMarginTop: 80 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  {c.tool_logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.tool_logo} alt="" width={24} height={24} style={{ borderRadius: 6, flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--muted)', flexShrink: 0 }}>
                      {c.tool_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span style={{ fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
                    {c.tool_name}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent-2)', background: 'rgba(108,92,255,0.12)', borderRadius: 999, padding: '2px 10px' }}>
                    {c.category}
                  </span>
                  <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted)' }}>
                    {formatDate(c.detected_at)}
                  </span>
                </div>
                <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
                  {c.summary}
                </p>
                {c.evidence_url ? (
                  <a href={c.evidence_url} rel="noopener noreferrer nofollow" target="_blank" style={{ display: 'inline-block', marginTop: 10, fontSize: 13, color: 'var(--accent-2)' }}>
                    Source →
                  </a>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
