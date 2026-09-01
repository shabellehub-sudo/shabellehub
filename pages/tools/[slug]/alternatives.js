// pages/tools/[slug]/alternatives.js
//
// Dedicated "X Alternatives" landing page. Only generated for tools with
// enough real alternatives (>= MIN_ALTERNATIVES_TO_SHOW, see
// lib/alternatives.js) -- per C1 scope, no thin/near-duplicate pages are
// shipped, and no content is fabricated (no AI-generated comparisons or
// unverified pricing claims; only fields already stored per tool).

import { NextSeo } from 'next-seo';
import Link from 'next/link';
import { tools as staticTools } from '../../../data';
import { listTools, getToolBySlug } from '../../../lib/cms/tools';
import { resolveAlternatives, isAlternativesPageEligible } from '../../../lib/alternatives';
import { resolveComparisonPair, isComparisonPairEligible, comparisonUrl } from '../../../lib/comparisons';
import { StarRating } from '../../../components/ui';

const BASE_URL = 'https://shabellehub.com';

export async function getStaticPaths() {
  const eligibleSlugs = staticTools
    .filter((t) => isAlternativesPageEligible(t, staticTools))
    .map((t) => t.slug);
  return {
    paths: eligibleSlugs.map((slug) => ({ params: { slug } })),
    fallback: 'blocking',
  };
}

export async function getStaticProps({ params }) {
  let tool = null;
  try {
    const toolRes = await getToolBySlug(params.slug);
    if (!toolRes.error && toolRes.data) tool = toolRes.data;
  } catch (_) { /* fall through to static lookup */ }
  if (!tool) tool = staticTools.find((t) => t.slug === params.slug) || null;
  if (!tool) return { notFound: true };

  let allTools = staticTools;
  try {
    const toolsRes = await listTools({ status: 'published', lim: 200 });
    if (!toolsRes.error && toolsRes.data?.length > 0) allTools = toolsRes.data;
  } catch (_) { /* keep staticTools fallback */ }

  const { items: alternatives, source } = resolveAlternatives(tool, allTools);

  if (alternatives.length < 3) {
    return { notFound: true };
  }

  // C2 internal linking: attach a compare link to each alternative when a
  // curated comparison pair exists for it (source-restricted to
  // tool.alternatives relationships, same as lib/comparisons.js -- never
  // fabricates a comparison just because two tools happen to co-occur here).
  const alternativesWithCompare = alternatives.map((t) => {
    const pair = resolveComparisonPair(tool.slug, t.slug, allTools);
    const eligible = pair && isComparisonPairEligible(pair);
    return { ...t, compareUrl: eligible ? comparisonUrl(tool.slug, t.slug) : null };
  });

  return { props: { tool, alternatives: alternativesWithCompare, source }, revalidate: 3600 };
}

export default function AlternativesPage({ tool, alternatives, source }) {
  const title = `${tool.name} Alternatives — ${alternatives.length} Similar Tools`;
  const description = `Looking for alternatives to ${tool.name}? Compare ${alternatives.length} similar ${tool.category} tools by rating, pricing, and category.`;
  const canonical = `${BASE_URL}/tools/${tool.slug}/alternatives`;

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: 'Directory', item: `${BASE_URL}/tools` },
      { '@type': 'ListItem', position: 3, name: tool.name, item: `${BASE_URL}/tools/${tool.slug}` },
      { '@type': 'ListItem', position: 4, name: 'Alternatives', item: canonical },
    ],
  };

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: alternatives.map((t, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${BASE_URL}/tools/${t.slug}`,
      name: t.name,
    })),
  };

  return (
    <>
      <NextSeo
        title={title}
        description={description}
        canonical={canonical}
        openGraph={{ title, description, url: canonical, type: 'website' }}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 20px' }}>
        <nav aria-label="Breadcrumb" style={{ fontSize: 13, color: '#8ba3ca', marginBottom: 24 }}>
          <ol style={{ listStyle: 'none', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            <li><Link href="/" style={{ color: '#8ba3ca' }}>Home</Link></li>
            <li aria-hidden="true" style={{ margin: '0 4px' }}>›</li>
            <li><Link href="/tools" style={{ color: '#8ba3ca' }}>Directory</Link></li>
            <li aria-hidden="true" style={{ margin: '0 4px' }}>›</li>
            <li><Link href={`/tools/${tool.slug}`} style={{ color: '#8ba3ca' }}><span className="notranslate">{tool.name}</span></Link></li>
            <li aria-hidden="true" style={{ margin: '0 4px' }}>›</li>
            <li><span style={{ color: '#e8f0ff' }} aria-current="page">Alternatives</span></li>
          </ol>
        </nav>

        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 'clamp(22px, 5vw, 30px)', fontWeight: 800, color: '#e8f0ff', marginBottom: 8 }}>
          <span className="notranslate">{tool.name}</span> Alternatives
        </h1>
        <p style={{ color: '#8ba3ca', fontSize: 14, marginBottom: 28 }}>
          {alternatives.length} {source === 'explicit' ? 'tools similar to' : `other tools in ${tool.category}, similar to`} <span className="notranslate">{tool.name}</span>.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {alternatives.map((t) => (
            <div key={t.id} style={{ background: '#0f1829', border: '1px solid #1a2d4a', borderRadius: 14, padding: 20 }}>
              <Link href={`/tools/${t.slug}`} style={{ textDecoration: 'none' }}>
                <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 16, color: '#e8f0ff', marginBottom: 6 }}>
                  <span className="notranslate">{t.name}</span>
                </div>
              </Link>
              {t.desc && (
                <p style={{ color: '#8ba3ca', fontSize: 13, marginBottom: 10, lineHeight: 1.5 }}>{t.desc}</p>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <StarRating rating={t.rating} size={13} />
                <span style={{ color: '#8ba3ca', fontSize: 12 }}>{t.category}</span>
                <span style={{
                  background: 'rgba(20,255,244,0.1)', color: '#14FFF4',
                  border: '1px solid rgba(20,255,244,0.2)', borderRadius: 6,
                  padding: '2px 8px', fontSize: 11, fontWeight: 700,
                }}>
                  {t.price}
                </span>
              </div>
              {t.compareUrl && (
                <div style={{ marginTop: 10 }}>
                  <Link href={t.compareUrl} style={{ color: '#14FFF4', fontSize: 12, textDecoration: 'none' }}>
                    Compare <span className="notranslate">{tool.name}</span> vs <span className="notranslate">{t.name}</span> →
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 32 }}>
          <Link href={`/tools/${tool.slug}`} style={{ color: '#14FFF4', fontSize: 14, textDecoration: 'none' }}>
            ← Back to {tool.name}
          </Link>
        </div>
      </div>
    </>
  );
}
