import Head from 'next/head';
import Link from 'next/link';
import { tools as staticTools } from '../../data';
import { listTools, getToolBySlug } from '../../lib/cms/tools';

// Normalizes a Supabase `tools` row: merges the jsonb `doc` column
// (desc, price, rating, features, affiliateLink, etc.) with the
// top-level columns (id, slug, status, name, category).
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
    console.warn('[getStaticPaths] Supabase fetch failed, using fallback:', err);
  }

  return {
    paths,
    fallback: 'blocking',
  };
}

export async function getStaticProps({ params }) {
  let tool = null;

  try {
    const toolRes = await getToolBySlug(params.slug);
    if (!toolRes?.error && toolRes?.data) tool = normalizeTool(toolRes.data);
  } catch (_) {
    /* fall through to static lookup */
  }

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
  } catch (_) {
    /* keep fallback */
  }

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
    name,
    desc,
    longDesc,
    price,
    rating,
    features = [],
    pros = [],
    cons = [],
    useCases = [],
    website,
    affiliateLink,
    seoTitle,
    seoDescription,
    canonical_url,
    category,
  } = tool;

  // Prioritize affiliate link over direct website URL for monetization
  const ctaUrl = affiliateLink || website;

  const pageTitle = seoTitle || `${name} Review & Pricing | ShabelleHub`;
  const pageDescription = seoDescription || desc;
  const canonical = canonical_url || `https://shabellehub.com/tools/${tool.slug}`;

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name,
    description: desc,
    applicationCategory: category,
  };

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </Head>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <nav className="text-sm text-gray-400 mb-4">
          <Link href="/tools" className="hover:underline">AI Directory</Link> / {category || 'Tool'} / {name}
        </nav>

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold">{name}</h1>
            {category && (
              <span className="inline-block mt-1 text-xs px-2 py-1 rounded bg-gray-800 text-cyan-400">
                {category}
              </span>
            )}
          </div>
          {rating > 0 && (
            <div className="text-yellow-400 text-lg">
              {'★'.repeat(Math.round(rating))}
              {'☆'.repeat(5 - Math.round(rating))}
              <span className="text-gray-400 text-sm ml-1">({rating})</span>
            </div>
          )}
        </div>

        <p className="mt-4 text-gray-300 text-lg leading-relaxed">{longDesc || desc}</p>

        {price && <p className="mt-3 text-cyan-400 font-semibold text-lg">{price}</p>}

        {ctaUrl && (
          <div className="mt-6 p-4 rounded-xl bg-gray-900 border border-gray-800">
            <a
              href={ctaUrl}
              target="_blank"
              rel="noopener noreferrer sponsored nofollow"
              className="inline-block bg-cyan-400 text-black font-bold px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
            >
              Try {name} Free →
            </a>
            <p className="text-xs text-gray-500 mt-2">
              We may earn a commission if you sign up through this link, at no extra cost to you.
            </p>
          </div>
        )}

        {features.length > 0 && (
          <section className="mt-8">
            <h2 className="text-xl font-bold mb-3">Key Features</h2>
            <ul className="list-disc list-inside text-gray-300 space-y-1">
              {features.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </section>
        )}

        {(pros.length > 0 || cons.length > 0) && (
          <section className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            {pros.length > 0 && (
              <div className="p-4 rounded-lg bg-green-950/20 border border-green-900/50">
                <h3 className="font-bold text-green-400 mb-2">Pros</h3>
                <ul className="list-disc list-inside text-gray-300 space-y-1 text-sm">
                  {pros.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
            )}
            {cons.length > 0 && (
              <div className="p-4 rounded-lg bg-red-950/20 border border-red-900/50">
                <h3 className="font-bold text-red-400 mb-2">Cons</h3>
                <ul className="list-disc list-inside text-gray-300 space-y-1 text-sm">
                  {cons.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {useCases.length > 0 && (
          <section className="mt-8">
            <h2 className="text-xl font-bold mb-3">Use Cases</h2>
            <ul className="list-disc list-inside text-gray-300 space-y-1">
              {useCases.map((u, i) => (
                <li key={i}>{u}</li>
              ))}
            </ul>
          </section>
        )}

        {related.length > 0 && (
          <section className="mt-10 border-t border-gray-800 pt-6">
            <h2 className="text-xl font-bold mb-4">Related Tools</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {related.map((t) => (
                <Link
                  key={t.slug}
                  href={`/tools/${t.slug}`}
                  className="block p-4 rounded-lg bg-gray-900 border border-gray-800 hover:border-gray-700 transition-colors"
                >
                  <p className="font-bold text-cyan-400">{t.name}</p>
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">{t.desc}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
