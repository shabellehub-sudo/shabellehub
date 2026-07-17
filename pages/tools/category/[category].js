import { NextSeo } from 'next-seo';
import Link from 'next/link';
import { tools, categories, siteConfig } from '../../../data';
import { listTools, getToolCounts } from '../../../lib/cms/tools';
import { ToolCard, PageTitle } from '../../../components/ui';
import { EditorialResponsibilityNotice } from '../../../components/eeat';
import { ContentUpdateNotice } from '../../../components/compliance';
import { categoryToSlug } from '../../../lib/categories';

const REAL_CATEGORIES = categories.filter(c => c.name !== 'All');

export async function getStaticPaths() {
  return {
    paths: REAL_CATEGORIES.map(c => ({ params: { category: categoryToSlug(c.name) } })),
    fallback: false,
  };
}

// Supabase-backed category tools + site-wide tool count — falls back to the
// static bundle if the DB fetch failed or returned nothing, same fail-soft
// pattern used in pages/tools/index.js. Sorting happens client-side (in this
// case at build time) because `rating` lives inside the jsonb `doc` column,
// not as a generated column the query helper can ORDER BY directly.
export async function getStaticProps({ params }) {
  const category = REAL_CATEGORIES.find(c => categoryToSlug(c.name) === params.category);
  if (!category) return { notFound: true };

  let categoryTools;
  try {
    const res = await listTools({ status: 'published', category: category.name, lim: 200 });
    categoryTools = (!res.error && res.data.length > 0)
      ? [...res.data].sort((a, b) => (b.rating || 0) - (a.rating || 0))
      : tools.filter(t => t.category === category.name).sort((a, b) => b.rating - a.rating);
  } catch {
    categoryTools = tools.filter(t => t.category === category.name).sort((a, b) => b.rating - a.rating);
  }

  let toolsCount;
  try {
    const countsRes = await getToolCounts();
    toolsCount = (!countsRes.error && countsRes.data.published) ? countsRes.data.published : tools.length;
  } catch {
    toolsCount = tools.length;
  }

  return { props: { category, categoryTools, toolsCount }, revalidate: 300 };
}

export default function CategoryPage({ category, categoryTools, toolsCount, favorites = [], toggleFavorite }) {
  const title = `Best ${category.name} AI Tools (${new Date().getFullYear()}) — Reviewed & Ranked`;
  const description = `${category.description} We've reviewed ${categoryTools.length} ${category.name.toLowerCase()} AI tool${categoryTools.length === 1 ? '' : 's'} hands-on — see ratings, pricing, and honest pros & cons.`;
  const canonical = `${siteConfig.url}/tools/category/${categoryToSlug(category.name)}`;

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteConfig.url },
      { '@type': 'ListItem', position: 2, name: 'AI Tools', item: `${siteConfig.url}/tools` },
      { '@type': 'ListItem', position: 3, name: category.name, item: canonical },
    ],
  };

  return (
    <>
      <NextSeo
        title={title}
        description={description}
        canonical={canonical}
        openGraph={{
          title,
          description,
          url: canonical,
          type: 'website',
          siteName: 'Shabelle Hub',
          images: [{ url: 'https://shabellehub.com/og-image.png', width: 1200, height: 630, alt: title }],
        }}
        twitter={{ handle: '@shabellehub', site: '@shabellehub', cardType: 'summary_large_image' }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div style={{ padding: '32px 20px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>

        {/* Breadcrumb nav */}
        <nav aria-label="Breadcrumb" style={{ marginBottom: 16 }}>
          <ol style={{ display: 'flex', gap: 6, flexWrap: 'wrap', listStyle: 'none', fontSize: 13, color: '#6b82a8' }}>
            <li><Link href="/" style={{ color: '#6b82a8' }}>Home</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link href="/tools" style={{ color: '#6b82a8' }}>AI Tools</Link></li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" style={{ color: '#e8f0ff' }}>{category.name}</li>
          </ol>
        </nav>

        <PageTitle sub={`${categoryTools.length} tool${categoryTools.length !== 1 ? 's' : ''} reviewed in this category`}>
          {category.icon} Best {category.name} AI Tools
        </PageTitle>

        <p style={{ color: '#6b82a8', fontSize: 15, lineHeight: 1.75, marginBottom: 28, maxWidth: 760 }}>
          {category.description}
        </p>

        <EditorialResponsibilityNotice />
        <ContentUpdateNotice lastUpdated="2026-06-12" frequency="monthly" />

        {categoryTools.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 16, marginBottom: 32 }}>
            {categoryTools.map(tool => (
              <ToolCard
                key={tool.id}
                tool={tool}
                isFavorite={favorites.includes(tool.id)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b82a8' }}>
            <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No tools in this category yet</p>
            <p style={{ fontSize: 14 }}>Check back soon — we&rsquo;re adding new reviews regularly.</p>
          </div>
        )}

        <div style={{ background: '#0f1829', border: '1px solid #1a2d4a', borderRadius: 14, padding: 24, textAlign: 'center' }}>
          <p style={{ color: '#6b82a8', fontSize: 14, marginBottom: 12 }}>
            Looking for something else? We cover {toolsCount} AI tools across every major category.
          </p>
          <Link
            href="/tools"
            style={{ display: 'inline-block', background: '#14FFF4', color: '#080d1a', fontWeight: 700, fontSize: 13, padding: '10px 24px', borderRadius: 10, textDecoration: 'none' }}
          >
            Browse All AI Tools
          </Link>
        </div>
      </div>
    </>
  );
}
