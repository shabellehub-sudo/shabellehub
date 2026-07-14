import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';
import { tools as staticTools, categories } from '../../data';
import { listTools } from '../../lib/cms/tools';

export async function getStaticProps() {
  try {
    const toolsRes = await listTools({ status: 'published', lim: 200 });
    if (toolsRes.error) throw new Error(toolsRes.error);
    return {
      props: { tools: toolsRes.data },
      revalidate: 300,
    };
  } catch {
    return {
      props: { tools: [] },
      revalidate: 60,
    };
  }
}
import { ToolCard, PageTitle } from '../../components/ui';
import { EditorialResponsibilityNotice } from '../../components/eeat';
import { ContentUpdateNotice } from '../../components/compliance';
import { categoryToSlug } from '../../lib/categories';
import useDebounce from '../../hooks/useDebounce';
import Link from 'next/link';

// FIX #9: role=tab buttons now have proper aria-selected and the container
//         has role=tablist. The grid below acts as the implicit tabpanel
//         (wrapping it in a div with role=tabpanel + aria-labelledby would
//         require a panel-per-tab structure; using aria-label on the grid
//         is the correct simplified pattern for a filter control).

export default function ToolsPage({ favorites = [], toggleFavorite, tools: fetchedTools = [] }) {
  const router = useRouter();
  // Supabase-backed tools list — falls back to the static bundle if the DB
  // fetch failed or returned nothing, same fail-soft pattern used site-wide.
  const tools = fetchedTools.length > 0 ? fetchedTools : staticTools;
  const toolsCount = tools.length;
  const categoriesCount = new Set(tools.map(t => t.category).filter(Boolean)).size;

  const [search,    setSearch]   = useState('');
  const [activeCat, setActiveCat] = useState('All');
  const [sort,      setSort]      = useState('rating');
  const [mounted,   setMounted]   = useState(false);

  // Phase 5: the input itself stays bound to `search` so typing feels
  // instant, but the 60+ tool filter/sort below only runs against the
  // debounced value — same pattern already used in HeroSearch.
  const debouncedSearch = useDebounce(search, 200);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!router.isReady) return;
    if (router.query.q)                setSearch(decodeURIComponent(String(router.query.q)));
    if (router.query.category)         setActiveCat(decodeURIComponent(String(router.query.category)));
    if (router.query.saved === 'true') setActiveCat('❤️ Saved');
  }, [router.isReady, router.query]);

  const filtered = useMemo(() => {
    let list = tools.filter(t => {
      const q = debouncedSearch.toLowerCase();
      const matchSearch = !q ||
        t.name.toLowerCase().includes(q) ||
        t.desc.toLowerCase().includes(q) ||
        t.tags.some(tag => tag.toLowerCase().includes(q)) ||
        t.category.toLowerCase().includes(q);

      const matchCat =
        activeCat === 'All'      ? true :
        activeCat === '❤️ Saved' ? (mounted ? favorites.includes(t.id) : false) :
        t.category === activeCat;

      return matchSearch && matchCat;
    });

    if (sort === 'rating')  list = [...list].sort((a, b) => b.rating - a.rating);
    if (sort === 'name')    list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'price')   list = [
      ...list.filter(t => t.priceTier === 'freemium'),
      ...list.filter(t => t.priceTier === 'free'),
      ...list.filter(t => t.priceTier === 'paid'),
    ];

    return list;
  }, [debouncedSearch, activeCat, sort, favorites, mounted, tools]);

  // FIX #8/#18: no brand suffix — titleTemplate appends it
  const seoTitle =
    activeCat !== 'All' && activeCat !== '❤️ Saved'
      ? `Best ${activeCat} AI Tools 2026 — Ranked & Reviewed`
      : 'AI Tools Directory 2026 — Discover & Compare AI Tools';

  const allCats = ['All', ...categories.filter(c => c.name !== 'All').map(c => c.name), '❤️ Saved'];

  return (
    <>
      <NextSeo
        title={seoTitle}
        description={`Browse ${toolsCount} AI tools across ${categoriesCount} categories. Independent reviews, honest ratings, and real-world testing. Compare and choose the perfect AI tool.`}
        canonical="https://shabellehub.com/tools"
        openGraph={{
          title: seoTitle,
          description: `Browse ${toolsCount} AI tools across ${categoriesCount} categories. Independent reviews, honest ratings, and real-world testing.`,
          url: 'https://shabellehub.com/tools',
          type: 'website',
          siteName: 'Shabelle Hub',
          images: [{ url: 'https://shabellehub.com/og-image.png', width: 1200, height: 630, alt: 'Shabelle Hub AI Tools Directory' }],
        }}
        twitter={{ handle: '@shabellehub', site: '@shabellehub', cardType: 'summary_large_image' }}
      />

      <div style={{ padding: '32px 20px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>

        <PageTitle sub={`${filtered.length} tool${filtered.length !== 1 ? 's' : ''} found`}>
          AI Tools Directory
        </PageTitle>

        <EditorialResponsibilityNotice />
        <ContentUpdateNotice lastUpdated="2026-06-12" frequency="weekly" />

        {/* Search + Sort */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }} role="search">
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filter by name, category, or use case…"
            aria-label="Filter AI tools"
            style={{
              flex: 1, minWidth: 200, background: '#0f1829',
              border: '1px solid #1a2d4a', borderRadius: 12,
              padding: '12px 16px', color: '#e8f0ff', fontSize: 14, outline: 'none',
            }}
          />
          <label htmlFor="sort-select" className="sr-only">Sort tools by</label>
          <select
            id="sort-select"
            value={sort}
            onChange={e => setSort(e.target.value)}
            style={{
              background: '#0f1829', border: '1px solid #1a2d4a', borderRadius: 12,
              padding: '12px 14px', color: '#e8f0ff', fontSize: 13, outline: 'none', cursor: 'pointer',
            }}
          >
            <option value="rating">Top Rated</option>
            <option value="name">A–Z</option>
            <option value="price">Free First</option>
          </select>
        </div>

        {/* FIX #9: category filter — role=tablist on container, role=tab + aria-selected on each button */}
        <div
          role="tablist"
          aria-label="Filter by category"
          style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 10, marginBottom: 24, scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {allCats.map(c => {
            const label = c === '❤️ Saved' && mounted
              ? `❤️ Saved (${favorites.length})`
              : c;
            return (
              <button
                key={c}
                role="tab"
                aria-selected={activeCat === c}
                onClick={() => setActiveCat(c)}
                style={{
                  whiteSpace: 'nowrap', borderRadius: 8, padding: '7px 14px',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                  background: activeCat === c ? '#14FFF4' : '#0f1829',
                  color:      activeCat === c ? '#080d1a' : '#6b82a8',
                  border:     `1px solid ${activeCat === c ? '#14FFF4' : '#1a2d4a'}`,
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Crawlable links to static category pages — the tablist above is an
            instant client-side filter for UX, but search engines need real
            <a> links to discover and index each category's dedicated page. */}
        <nav aria-label="Browse tool categories" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {categories.filter(c => c.name !== 'All').map(c => (
              <Link
                key={c.name}
                href={`/tools/category/${categoryToSlug(c.name)}`}
                style={{
                  fontSize: 12, color: '#6b82a8', textDecoration: 'none',
                  border: '1px solid #1a2d4a', borderRadius: 8, padding: '5px 12px',
                }}
              >
                {c.icon} {c.name}
              </Link>
            ))}
          </div>
        </nav>

        {/* Results — implicit tabpanel region */}
        <div
          role="region"
          aria-label={`${activeCat} tools`}
          aria-live="polite"
          aria-atomic="false"
        >
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b82a8' }}>
              <p style={{ fontSize: 32, marginBottom: 12 }} aria-hidden="true">🔍</p>
              <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No tools found</p>
              <p style={{ fontSize: 14 }}>Try a different search term or category</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 16 }}>
              {filtered.map(tool => (
                <ToolCard
                  key={tool.id}
                  tool={tool}
                  isFavorite={mounted ? favorites.includes(tool.id) : false}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
