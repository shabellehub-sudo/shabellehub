import { useState, useEffect } from 'react';
import { NextSeo } from 'next-seo';
import Link from 'next/link';
import { tools as staticTools } from '../../data';
import { getToolSEO, getToolStructuredData } from '../../lib/seo';
import { getToolMeta } from '../../data/eeat-meta';
import { getAuthor, getReviewer } from '../../data/team';
import { openAffiliateLink, buildAffiliateUrl } from '../../lib/affiliate';
import { StarRating, Badge } from '../../components/ui';
import { TrustBlock } from '../../components/eeat';
import { AffiliateDisclosure, AdvertisingNotice } from '../../components/compliance';
import AdSlot from '../../components/AdSlot';
import { getAffiliateByToolSlug } from '../../lib/cms/affiliates';
import { listTools, getToolBySlug } from '../../lib/cms/tools';

export async function getStaticPaths() {
  return {
    paths: staticTools.map(t => ({ params: { slug: t.slug } })),
    fallback: 'blocking',
  };
}

export async function getStaticProps({ params }) {
  let tool = null;
  try {
    const toolRes = await getToolBySlug(params.slug);
    if (!toolRes.error && toolRes.data) tool = toolRes.data;
  } catch (_) { /* fall through to static lookup */ }

  if (!tool) {
    tool = staticTools.find(t => t.slug === params.slug) || null;
  }

  if (!tool) return { notFound: true };

  let allTools = staticTools;
  try {
    const toolsRes = await listTools({ status: 'published', lim: 200 });
    if (!toolsRes.error && toolsRes.data?.length > 0) allTools = toolsRes.data;
  } catch (_) { /* keep staticTools fallback */ }

  let related = [];
  if (tool.alternatives && tool.alternatives.length > 0) {
    related = tool.alternatives
      .map(slug => allTools.find(t => t.slug === slug))
      .filter(Boolean)
      .slice(0, 3);
  }
  if (related.length === 0) {
    related = allTools
      .filter(t => t.category === tool.category && t.id !== tool.id)
      .slice(0, 3);
  }

  let affiliateLink = null;
  try {
    const { data } = await getAffiliateByToolSlug(params.slug);
    affiliateLink = data ?? null;
  } catch (_) { /* non-fatal — falls back to static data */ }

  return { props: { tool, related, affiliateLink }, revalidate: 3600 };
}

export default function ToolPage({ tool, related, favorites = [], toggleFavorite, affiliateLink = null }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const isSaved = mounted && favorites.includes(tool.id);

  // Phase 5A: resolve CTA URL — Firestore record takes priority over static data
  const resolvedAffiliateUrl = affiliateLink?.affiliateUrl
    ? buildAffiliateUrl(affiliateLink.affiliateUrl, tool.slug)
    : tool.affiliateLink || tool.website;
  const customDisclosure = affiliateLink?.disclosureText || null;

  function handleAffiliateCTA() {
    if (typeof window === 'undefined') return;
    openAffiliateLink({ ...tool, affiliateLink: resolvedAffiliateUrl });
  }
  const seo     = getToolSEO(tool);
  const meta    = getToolMeta(tool.slug);
  const author  = getAuthor(meta.authorSlug);
  const reviewer = getReviewer(meta.reviewerSlug);
  const schema  = getToolStructuredData(tool, meta);

  // BreadcrumbList schema — boosts Rich Results in Google
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home',      item: 'https://shabellehub.com' },
      { '@type': 'ListItem', position: 2, name: 'Directory', item: 'https://shabellehub.com/tools' },
      { '@type': 'ListItem', position: 3, name: tool.name,   item: `https://shabellehub.com/tools/${tool.slug}` },
    ],
  };

  // CTA label — "Try Free" is only accurate for free/freemium tools
  const ctaLabel = tool.priceTier === 'paid'
    ? `Visit ${tool.name} →`
    : `Try ${tool.name} Free →`;
  const ctaAriaLabel = tool.priceTier === 'paid'
    ? `Visit ${tool.name} website`
    : `Try ${tool.name} for free`;

  return (
    <>
      <NextSeo {...seo} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 20px' }}>

        {/* Breadcrumb — semantic ol/li for screen readers + schema */}
        <nav aria-label="Breadcrumb" style={{ fontSize: 13, color: '#6b82a8', marginBottom: 24 }}>
          <ol style={{ listStyle: 'none', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            <li><Link href="/"      style={{ color: '#6b82a8' }}>Home</Link></li>
            <li aria-hidden="true"  style={{ margin: '0 4px' }}>›</li>
            <li><Link href="/tools" style={{ color: '#6b82a8' }}>Directory</Link></li>
            <li aria-hidden="true"  style={{ margin: '0 4px' }}>›</li>
            <li><span style={{ color: '#e8f0ff' }} aria-current="page">{tool.name}</span></li>
          </ol>
        </nav>

        {/* Hero card */}
        <div style={{ background: '#0f1829', border: '1px solid #1a2d4a', borderRadius: 16, padding: 28, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>

            {/* Identity */}
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <div aria-hidden="true" style={{
                width: 64, height: 64, borderRadius: 16, flexShrink: 0,
                background: 'rgba(20,255,244,0.1)', border: '1px solid rgba(20,255,244,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 26, fontWeight: 800, color: '#14FFF4', fontFamily: 'Space Grotesk, sans-serif',
              }}>
                {tool.name[0]}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                  <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 'clamp(22px, 5vw, 30px)', fontWeight: 800, color: '#e8f0ff' }}>
                    {tool.name}
                  </h1>
                  {tool.hot   && <Badge text="HOT"        variant="hot" />}
                  {tool.badge && <Badge text={tool.badge} />}
                </div>
                <div style={{ color: '#6b82a8', fontSize: 13 }}>{tool.category}</div>
              </div>
            </div>

            {/* CTAs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
              <button
                onClick={handleAffiliateCTA}
                aria-label={ctaAriaLabel}
                style={{
                  background: '#14FFF4', color: '#080d1a', border: 'none',
                  borderRadius: 12, padding: '12px 24px', fontWeight: 800, fontSize: 15, cursor: 'pointer',
                }}
              >
                {ctaLabel}
              </button>
              <button
                onClick={() => toggleFavorite && toggleFavorite(tool.id)}
                aria-label={isSaved ? `Unsave ${tool.name}` : `Save ${tool.name}`}
                aria-pressed={isSaved}
                style={{
                  background: 'none', border: '1px solid #1a2d4a', borderRadius: 10,
                  padding: '8px 16px', fontSize: 13, cursor: 'pointer',
                  color: isSaved ? '#ff4d6d' : '#6b82a8',
                }}
              >
                {isSaved ? '❤️ Saved' : '🤍 Save Tool'}
              </button>
            </div>
          </div>

          {/* Rating row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 20, flexWrap: 'wrap' }}>
            <StarRating rating={tool.rating} size={16} />
            <span style={{ color: '#6b82a8', fontSize: 13 }}>Shabelle Hub Rating</span>
            <span style={{
              background: 'rgba(20,255,244,0.1)', color: '#14FFF4',
              border: '1px solid rgba(20,255,244,0.2)', borderRadius: 6,
              padding: '3px 10px', fontSize: 12, fontWeight: 700,
            }}>
              {tool.price}
            </span>
            <span style={{ color: '#6b82a8', fontSize: 12 }}>
              Last updated <time dateTime={meta.lastUpdated}>{new Date(meta.lastUpdated).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}</time>
            </span>
          </div>
        </div>

        {/* Trust block — author, reviewer, last updated/reviewed, editorial links */}
        <TrustBlock author={author} reviewer={reviewer} lastUpdated={meta.lastUpdated} lastReviewed={meta.lastReviewed} type="tool" />

        <AdSlot slot="3333333333" label="Tool review ad (top)" />

        {/* Overview */}
        <div style={{ background: '#0f1829', border: '1px solid #1a2d4a', borderRadius: 16, padding: 24, marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 18, fontWeight: 700, marginBottom: 14 }}>Overview</h2>
          <p style={{ color: '#6b82a8', fontSize: 14, lineHeight: 1.75 }}>{tool.longDesc}</p>
        </div>

        {/* Pros & Cons */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16, marginBottom: 20 }}>
          <div style={{ background: '#0f1829', border: '1px solid rgba(0,208,132,0.2)', borderRadius: 16, padding: 22 }}>
            <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 16, fontWeight: 700, color: '#00d084', marginBottom: 14 }}>✅ Pros</h3>
            <ul style={{ listStyle: 'none' }}>
              {tool.pros.map((p, i) => (
                <li key={i} style={{ color: '#e8f0ff', fontSize: 14, display: 'flex', gap: 8, marginBottom: 8 }}>
                  <span aria-hidden="true" style={{ color: '#00d084', flexShrink: 0 }}>+</span>{p}
                </li>
              ))}
            </ul>
          </div>
          <div style={{ background: '#0f1829', border: '1px solid rgba(255,77,109,0.2)', borderRadius: 16, padding: 22 }}>
            <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 16, fontWeight: 700, color: '#ff4d6d', marginBottom: 14 }}>❌ Cons</h3>
            <ul style={{ listStyle: 'none' }}>
              {tool.cons.map((c, i) => (
                <li key={i} style={{ color: '#e8f0ff', fontSize: 14, display: 'flex', gap: 8, marginBottom: 8 }}>
                  <span aria-hidden="true" style={{ color: '#ff4d6d', flexShrink: 0 }}>–</span>{c}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Use Cases */}
        <div style={{ background: '#0f1829', border: '1px solid #1a2d4a', borderRadius: 16, padding: 22, marginBottom: 20 }}>
          <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Best Use Cases</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {tool.useCases.map((u, i) => (
              <span key={i} style={{
                background: 'rgba(20,255,244,0.08)', color: '#14FFF4',
                border: '1px solid rgba(20,255,244,0.2)', borderRadius: 8,
                padding: '6px 14px', fontSize: 13, fontWeight: 500,
              }}>
                {u}
              </span>
            ))}
          </div>
        </div>

        {/* Trust badge */}
        <div style={{
          background: '#0f1829', border: '1px solid #1a2d4a', borderRadius: 16,
          padding: 18, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span aria-hidden="true" style={{ fontSize: 22 }}>🛡️</span>
          <p style={{ color: '#6b82a8', fontSize: 13, lineHeight: 1.6 }}>
            <strong style={{ color: '#e8f0ff' }}>Independently reviewed by {author ? author.name : 'Shabelle Hub'}.</strong>{' '}
            Our ratings are based on hands-on testing and are never influenced by affiliate relationships.
            Meet the{' '}
            <Link href="/team" style={{ color: '#14FFF4' }}>Shabelle Hub team</Link>.
          </p>
        </div>

        {/* CTA box */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(20,255,244,0.05), rgba(20,255,244,0.02))',
          border: '1px solid rgba(20,255,244,0.2)', borderRadius: 16, padding: 28,
          textAlign: 'center', marginBottom: 28,
        }}>
          <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 20, fontWeight: 800, marginBottom: 10 }}>
            Ready to try {tool.name}?
          </h3>
          <p style={{ color: '#6b82a8', fontSize: 14, marginBottom: 22 }}>
            {tool.priceTier === 'freemium'
              ? 'Start for free — no credit card required.'
              : tool.priceTier === 'free'
              ? 'Completely free to use.'
              : `Plans start at ${tool.price}`}
          </p>
          <button
            onClick={handleAffiliateCTA}
            aria-label={ctaAriaLabel}
            style={{
              background: '#14FFF4', color: '#080d1a', border: 'none',
              borderRadius: 12, padding: '14px 32px', fontWeight: 800, fontSize: 15, cursor: 'pointer',
            }}
          >
            {ctaLabel}
          </button>
          {customDisclosure
            ? <p style={{ fontSize: 12, color: '#6b82a8', marginTop: 8, lineHeight: 1.6 }}>{customDisclosure}</p>
            : <AffiliateDisclosure compact />
          }
        </div>

        <AdSlot slot="4444444444" label="Tool review ad (bottom)" />

        {/* Related tools */}
        {related.length > 0 && (
          <section aria-label={`Alternatives to ${tool.name}`}>
            <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
              {tool.alternatives && tool.alternatives.length > 0
                ? `Popular Alternatives to ${tool.name}`
                : `Similar Tools in ${tool.category}`}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
              {related.map(t => (
                <Link key={t.id} href={`/tools/${t.slug}`} style={{ textDecoration: 'none' }}>
                  <div style={{ background: '#0f1829', border: '1px solid #1a2d4a', borderRadius: 12, padding: 16 }}>
                    <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, color: '#e8f0ff', marginBottom: 6 }}>{t.name}</div>
                    <StarRating rating={t.rating} size={12} />
                    <div style={{ color: '#6b82a8', fontSize: 12, marginTop: 6 }}>{t.price}</div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 24 }}>
          <AffiliateDisclosure />
          <AdvertisingNotice />
        </div>
      </div>
    </>
  );
}
