// pages/compare/[pair].js
//
// Dedicated tool-vs-tool comparison page at /compare/[slug1]-vs-[slug2].
// Pair source is restricted to curated tool.alternatives relationships
// only (never same-category cross-product -- see lib/comparisons.js for
// the audited reasoning). Canonical ordering (slug1 < slug2) means each
// pair has exactly one URL regardless of which tool "found" the other.
// Content is limited to fields already stored per tool -- no fabricated
// claims, no AI-generated comparisons.

import { NextSeo } from 'next-seo';
import Link from 'next/link';
import { tools as staticTools } from '../../data';
import { listTools } from '../../lib/cms/tools';
import {
  getAllComparisonPairs,
  resolveComparisonPair,
  isComparisonPairEligible,
  parsePairParam,
  comparisonUrl,
} from '../../lib/comparisons';
import { StarRating } from '../../components/ui';

const BASE_URL = 'https://shabellehub.com';

export async function getStaticPaths() {
  const pairs = getAllComparisonPairs(staticTools).filter(isComparisonPairEligible);
  return {
    paths: pairs.map((p) => ({ params: { pair: `${p.slug1}-vs-${p.slug2}` } })),
    fallback: 'blocking',
  };
}

export async function getStaticProps({ params }) {
  let allTools = staticTools;
  try {
    const toolsRes = await listTools({ status: 'published', lim: 200 });
    if (!toolsRes.error && toolsRes.data?.length > 0) allTools = toolsRes.data;
  } catch (_) { /* keep staticTools fallback */ }

  const parsed = parsePairParam(params.pair, allTools);
  if (!parsed) return { notFound: true };
  const [slugA, slugB] = parsed;

  const pair = resolveComparisonPair(slugA, slugB, allTools);
  if (!pair || !isComparisonPairEligible(pair)) return { notFound: true };

  const canonicalParam = `${pair.slug1}-vs-${pair.slug2}`;
  if (params.pair !== canonicalParam) {
    return { redirect: { destination: `/compare/${canonicalParam}`, permanent: true } };
  }

  return { props: { tool1: pair.tool1, tool2: pair.tool2 }, revalidate: 3600 };
}

export default function ComparisonPage({ tool1, tool2 }) {
  const canonical = `${BASE_URL}${comparisonUrl(tool1.slug, tool2.slug)}`;
  const title = `${tool1.name} vs ${tool2.name}: Which Is Better?`;
  const description = `Compare ${tool1.name} and ${tool2.name} side by side — pricing, ratings, category, pros and cons.`;

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: 'Directory', item: `${BASE_URL}/tools` },
      { '@type': 'ListItem', position: 3, name: `${tool1.name} vs ${tool2.name}`, item: canonical },
    ],
  };

  const rows = [
    { label: 'Category', v1: tool1.category, v2: tool2.category },
    { label: 'Price', v1: tool1.price, v2: tool2.price },
  ];

  return (
    <>
      <NextSeo
        title={title}
        description={description}
        canonical={canonical}
        openGraph={{ title, description, url: canonical, type: 'website' }}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px' }}>
        <nav aria-label="Breadcrumb" style={{ fontSize: 13, color: '#8ba3ca', marginBottom: 24 }}>
          <ol style={{ listStyle: 'none', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            <li><Link href="/" style={{ color: '#8ba3ca' }}>Home</Link></li>
            <li aria-hidden="true" style={{ margin: '0 4px' }}>›</li>
            <li><Link href="/tools" style={{ color: '#8ba3ca' }}>Directory</Link></li>
            <li aria-hidden="true" style={{ margin: '0 4px' }}>›</li>
            <li><span style={{ color: '#e8f0ff' }} aria-current="page"><span className="notranslate">{tool1.name}</span> vs <span className="notranslate">{tool2.name}</span></span></li>
          </ol>
        </nav>

        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 'clamp(22px, 5vw, 30px)', fontWeight: 800, color: '#e8f0ff', marginBottom: 24 }}>
          <span className="notranslate">{tool1.name}</span> vs <span className="notranslate">{tool2.name}</span>
        </h1>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 24 }}>
          {[tool1, tool2].map((t) => (
            <div key={t.slug} style={{ background: '#0f1829', border: '1px solid #1a2d4a', borderRadius: 14, padding: 20 }}>
              <Link href={`/tools/${t.slug}`} style={{ textDecoration: 'none' }}>
                <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 18, color: '#e8f0ff', marginBottom: 8 }}>
                  <span className="notranslate">{t.name}</span>
                </div>
              </Link>
              <StarRating rating={t.rating} size={14} />
              <div style={{ color: '#8ba3ca', fontSize: 13, marginTop: 8 }}>{t.category}</div>
              <div style={{ marginTop: 6 }}>
                <span style={{ background: 'rgba(20,255,244,0.1)', color: '#14FFF4', border: '1px solid rgba(20,255,244,0.2)', borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 700 }}>
                  {t.price}
                </span>
              </div>
              {t.longDesc && <p style={{ color: '#8ba3ca', fontSize: 13, marginTop: 12, lineHeight: 1.6 }}>{t.longDesc}</p>}
            </div>
          ))}
        </div>

        <div style={{ background: '#0f1829', border: '1px solid #1a2d4a', borderRadius: 14, padding: 20, marginBottom: 24, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '8px 12px', color: '#8ba3ca', borderBottom: '1px solid #1a2d4a' }}></th>
                <th style={{ textAlign: 'left', padding: '8px 12px', color: '#e8f0ff', borderBottom: '1px solid #1a2d4a' }}><span className="notranslate">{tool1.name}</span></th>
                <th style={{ textAlign: 'left', padding: '8px 12px', color: '#e8f0ff', borderBottom: '1px solid #1a2d4a' }}><span className="notranslate">{tool2.name}</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label}>
                  <td style={{ padding: '8px 12px', color: '#8ba3ca', borderBottom: '1px solid #1a2d4a' }}>{r.label}</td>
                  <td style={{ padding: '8px 12px', color: '#e8f0ff', borderBottom: '1px solid #1a2d4a' }}>{r.v1}</td>
                  <td style={{ padding: '8px 12px', color: '#e8f0ff', borderBottom: '1px solid #1a2d4a' }}>{r.v2}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 24 }}>
          {[tool1, tool2].map((t) => (
            <div key={t.slug} style={{ background: '#0f1829', border: '1px solid #1a2d4a', borderRadius: 14, padding: 20 }}>
              <div style={{ fontWeight: 700, color: '#e8f0ff', marginBottom: 10 }}><span className="notranslate">{t.name}</span></div>
              {Array.isArray(t.pros) && t.pros.length > 0 && (
                <>
                  <div style={{ color: '#00d084', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Pros</div>
                  <ul style={{ listStyle: 'none', marginBottom: 12 }}>
                    {t.pros.map((p, i) => <li key={i} style={{ color: '#8ba3ca', fontSize: 13, marginBottom: 4 }}>+ {p}</li>)}
                  </ul>
                </>
              )}
              {Array.isArray(t.cons) && t.cons.length > 0 && (
                <>
                  <div style={{ color: '#ff4d6d', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Cons</div>
                  <ul style={{ listStyle: 'none' }}>
                    {t.cons.map((c, i) => <li key={i} style={{ color: '#8ba3ca', fontSize: 13, marginBottom: 4 }}>– {c}</li>)}
                  </ul>
                </>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <Link href={`/tools/${tool1.slug}`} style={{ color: '#14FFF4', fontSize: 14, textDecoration: 'none' }}>View {tool1.name} →</Link>
          <Link href={`/tools/${tool2.slug}`} style={{ color: '#14FFF4', fontSize: 14, textDecoration: 'none' }}>View {tool2.name} →</Link>
        </div>
      </div>
    </>
  );
}
