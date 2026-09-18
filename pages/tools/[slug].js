import Head from 'next/head';
import Link from 'next/link';
import { tools as staticTools } from '../../data';
import { listTools, getToolBySlug } from '../../lib/cms/tools';

function normalizeTool(row) {
  if (!row) return null;
  const doc = row.doc || {};
  return { ...doc, ...row };
}

export async function getStaticPaths() {
  let paths = (staticTools || []).map((t) => ({ params: { slug: t.slug } }));

  try {
    const res = await listTools({ status: 'published', lim: 1000 });
    if (!res?.error && Array.isArray(res?.data) && res.data.length > 0) {
      paths = res.data.map((t) => ({ params: { slug: t.slug } }));
    }
  } catch (err) {
    console.warn('[getStaticPaths] Supabase fetch failed:', err);
  }

  return { paths, fallback: 'blocking' };
}

export async function getStaticProps({ params }) {
  let tool = null;

  try {
    const toolRes = await getToolBySlug(params.slug);
    if (!toolRes?.error && toolRes?.data) tool = normalizeTool(toolRes.data);
  } catch (_) {}

  if (!tool) {
    const staticMatch = (staticTools || []).find((t) => t?.slug === params.slug) || null;
    tool = staticMatch ? normalizeTool({ ...staticMatch, doc: staticMatch }) : null;
  }

  if (!tool) return { notFound: true };

  let allTools = Array.isArray(staticTools)
    ? staticTools.map((t) => normalizeTool({ ...t, doc: t }))
    : [];

  try {
    const toolsRes = await listTools({ status: 'published', lim: 200 });
    if (!toolsRes?.error && Array.isArray(toolsRes?.data) && toolsRes.data.length > 0) {
      allTools = toolsRes.data.map(normalizeTool);
    }
  } catch (_) {}

  let related = [];
  if (Array.isArray(tool.alternatives) && tool.alternatives.length > 0) {
    related = tool.alternatives
      .map((slug) => allTools.find((t) => t?.slug === slug))
      .filter(Boolean)
      .slice(0, 3);
  }
  if (related.length === 0) {
    related = allTools
      .filter((t) => t && t.category === tool.category && t.slug !== tool.slug)
      .slice(0, 3);
  }

  return {
    props: { tool, related },
    revalidate: 3600,
  };
}

export default function ToolPage({ tool, related = [] }) {
  if (!tool) return null;

  const {
    name = 'Tool Name',
    desc = '',
    longDesc = '',
    price = 'Free / $20mo',
    rating = 4.9,
    features = [],
    pros = [],
    cons = [],
    useCases = [],
    website,
    affiliateLink,
    seoTitle,
    seoDescription,
    canonical_url,
    category = 'Productivity',
    lastUpdated = 'June 12, 2026',
    author = 'Mohamed Abdi Guled',
  } = tool;

  // Garantiinta Link-ga si uusan batanku mar kale u baabi'in
  const ctaUrl = affiliateLink || website || 'https://profitio.ai';
  const pageTitle = seoTitle || `${name} Review & Pricing | ShabelleHub`;
  const pageDescription = seoDescription || desc;
  const canonical = canonical_url || `https://shabellehub.com/tools/${tool.slug}`;

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={canonical} />
        <script src="https://cdn.tailwindcss.com"></script>
      </Head>

      <div style={{ backgroundColor: '#0b0f17', color: '#e2e8f0', minHeight: '100vh', padding: '2rem 1rem' }}>
        <div style={{ maxWidth: '56rem', margin: '0 auto' }} className="space-y-6">
          
          {/* Nav */}
          <nav style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
            <Link href="/" className="hover:underline">Home</Link> / <Link href="/tools" className="hover:underline">Directory</Link> / <span style={{ color: '#f8fafc' }}>{name}</span>
          </nav>

          {/* Sync Header */}
          <div style={{ backgroundColor: '#111827', borderColor: 'rgba(6,182,212,0.2)', borderWidth: '1px', borderRadius: '0.75rem', padding: '1rem', fontSize: '0.75rem', color: '#94a3b8' }}>
            <strong style={{ color: '#22d3ee' }}>Data last synced:</strong> This page was last updated on {lastUpdated}. Rankings, pricing, and feature details are checked on a monthly basis.
          </div>

          {/* Hero Box */}
          <div style={{ backgroundColor: '#111827', borderColor: '#1f2937', borderWidth: '1px', borderRadius: '1rem', padding: '1.5rem' }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div style={{ width: '3.5rem', height: '3.5rem', backgroundColor: 'rgba(6,182,212,0.1)', borderColor: 'rgba(6,182,212,0.3)', borderWidth: '1px', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22d3ee', fontWeight: 'bold', fontSize: '1.5rem' }}>
                  {name ? name[0] : 'T'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ffffff' }}>{name}</h1>
                    <span style={{ backgroundColor: 'rgba(6,182,212,0.1)', color: '#22d3ee', fontSize: '0.75rem', padding: '0.125rem 0.625rem', borderRadius: '9999px', borderWidth: '1px', borderColor: 'rgba(6,182,212,0.2)' }}>
                      Editor's Choice
                    </span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>{category}</p>
                </div>
              </div>

              <a
                href={ctaUrl}
                target="_blank"
                rel="noopener noreferrer sponsored nofollow"
                style={{ backgroundColor: '#22d3ee', color: '#020617', fontWeight: 'bold', padding: '0.75rem 1.5rem', borderRadius: '0.75rem', textAlign: 'center', fontSize: '0.875rem' }}
                className="hover:opacity-90 transition-opacity"
              >
                Try {name} Free →
              </a>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #1f2937', fontSize: '0.75rem', color: '#94a3b8' }}>
              <span style={{ color: '#facc15' }}>{'★'.repeat(Math.round(rating))} <strong style={{ color: '#fff' }}>{rating}</strong></span>
              <span>•</span>
              <span style={{ color: '#22d3ee', fontWeight: '600' }}>{price}</span>
              <span>•</span>
              <span>Last updated {lastUpdated}</span>
            </div>
          </div>

          {/* Author */}
          <div style={{ backgroundColor: '#111827', borderColor: '#1f2937', borderWidth: '1px', borderRadius: '1rem', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '1rem' }}>
              🛡️ Who wrote and verified this review
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: '#0b0f17', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid #1f2937', maxWidth: '24rem' }}>
              <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '9999px', backgroundColor: 'rgba(16,185,129,0.2)', color: '#34d399', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem' }}>
                MG
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#ffffff' }}>{author}</p>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Founder, Writer & Reviewer</p>
              </div>
            </div>
          </div>

          {/* Overview */}
          <div style={{ backgroundColor: '#111827', borderColor: '#1f2937', borderWidth: '1px', borderRadius: '1rem', padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#ffffff', marginBottom: '0.75rem' }}>Overview</h2>
            <p style={{ fontSize: '0.875rem', color: '#cbd5e1', lineHeight: '1.6' }}>{longDesc || desc}</p>
          </div>

          {/* Pros & Cons */}
          {(pros.length > 0 || cons.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div style={{ backgroundColor: '#111827', borderColor: '#1f2937', borderWidth: '1px', borderRadius: '1rem', padding: '1.5rem' }}>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#34d399', marginBottom: '0.75rem' }}>✅ Pros</h3>
                <ul style={{ fontSize: '0.875rem', color: '#cbd5e1' }} className="space-y-2">
                  {pros.map((p, i) => (
                    <li key={i}>• {p}</li>
                  ))}
                </ul>
              </div>
              <div style={{ backgroundColor: '#111827', borderColor: '#1f2937', borderWidth: '1px', borderRadius: '1rem', padding: '1.5rem' }}>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#f87171', marginBottom: '0.75rem' }}>❌ Cons</h3>
                <ul style={{ fontSize: '0.875rem', color: '#cbd5e1' }} className="space-y-2">
                  {cons.map((c, i) => (
                    <li key={i}>• {c}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Bottom CTA */}
          <div style={{ backgroundColor: '#111827', borderColor: '#1f2937', borderWidth: '1px', borderRadius: '1rem', padding: '2rem', textAlign: 'center' }} className="space-y-4">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#ffffff' }}>Ready to try {name}?</h3>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Start for free — no credit card required.</p>
            <div>
              <a
                href={ctaUrl}
                target="_blank"
                rel="noopener noreferrer sponsored nofollow"
                style={{ backgroundColor: '#22d3ee', color: '#020617', fontWeight: 'bold', padding: '0.875rem 2rem', borderRadius: '0.75rem', display: 'inline-block', fontSize: '0.875rem' }}
              >
                Try {name} Free →
              </a>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
