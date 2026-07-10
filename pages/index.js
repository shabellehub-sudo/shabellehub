import Link from 'next/link';
import dynamic from 'next/dynamic';
import { NextSeo } from 'next-seo';
import { tools, blogPosts, toolsCount, categoriesCount, avgRating } from '../data';
import { getOrganizationStructuredData, getWebsiteStructuredData } from '../lib/seo';
import { Section } from '../components/ui';
import AnimatedCounter from '../components/shared/AnimatedCounter/AnimatedCounter';
import BlogCardSkeleton from '../components/shared/BlogCardSkeleton/BlogCardSkeleton';
import { TransparencyNotice } from '../components/compliance';
import AdSlot from '../components/AdSlot';
import NewsletterSignupForm from '../components/newsletter/SignupForm';
import { getHomepageBlogProps } from '../lib/cms/homepageBlog';
import { getTrendingThisWeek, getFastestGrowing } from '../lib/trending';
import Hero from '../components/home/Hero/Hero';
import TrendingSection from '../components/home/TrendingSection/TrendingSection';
import SectionHeader from '../components/shared/SectionHeader/SectionHeader';
import FeaturedTools from '../components/home/FeaturedTools/FeaturedTools';

// Phase 5: EditorsChoice / Testimonials / FAQ are below the fold on every
// viewport, so they're loaded as separate client chunks instead of being
// bundled into the initial homepage JS. `ssr: true` (the default) is kept
// explicit here on purpose — FAQ emits FAQPage JSON-LD that must still be
// present in the server-rendered HTML for search engines, so we only want
// to trim the client bundle, not skip server rendering.
const EditorsChoice = dynamic(() => import('../components/home/EditorsChoice/EditorsChoice'), {
  ssr: true,
  loading: () => <div style={{ minHeight: 420 }} aria-hidden="true" />,
});
const Testimonials = dynamic(() => import('../components/home/Testimonials/Testimonials'), {
  ssr: true,
  loading: () => <div style={{ minHeight: 360 }} aria-hidden="true" />,
});
const FAQ = dynamic(() => import('../components/home/FAQ/FAQ'), {
  ssr: true,
  loading: () => <div style={{ minHeight: 400 }} aria-hidden="true" />,
});

export async function getStaticProps() {
  try {
    const [blogProps, trendingThisWeek, fastestGrowing] = await Promise.all([
      getHomepageBlogProps(),
      getTrendingThisWeek({ limit: 6 }),
      getFastestGrowing({ limit: 6 }),
    ]);
    return {
      props: { ...blogProps, trendingThisWeek, fastestGrowing },
      // Shorter revalidate than the blog content (60s): trending is
      // meant to feel current. 5 minutes balances that against not
      // hammering the DB with aggregation queries on every request.
      revalidate: 300,
    };
  } catch {
    return {
      props: { featuredPosts: [], recentPosts: [], trendingThisWeek: [], fastestGrowing: [] },
      revalidate: 30,
    };
  }
}

export default function HomePage({ favorites = [], toggleFavorite, featuredPosts = [], recentPosts = [], trendingThisWeek = [], fastestGrowing = [] }) {
  // Merge Firestore posts with static fallback — Firestore takes priority
  const livePosts = [...featuredPosts, ...recentPosts];
  const displayPosts = livePosts.length > 0 ? livePosts : blogPosts;
  // Always false today: posts arrive via getStaticProps (server-rendered),
  // so there's no client fetch moment to show a skeleton during. Kept as
  // a named constant (not just deleting the branch) so BlogCardSkeleton
  // is a one-line flip away from working once /blog gains client-side
  // pagination or filtering that re-fetches instead of filtering
  // already-loaded data.
  const blogLoading = false;

  const featuredTools = tools.filter(t => t.featured);
  const trendingTools = tools.filter(t => t.hot).sort((a, b) => b.rating - a.rating);

  return (
    <>
      {/* FIX #8/#18: title does NOT include '| Shabelle Hub' — titleTemplate appends it */}
      <NextSeo
        title="Discover the Best AI Tools in One Place"
        description="Compare, review, and explore the world's top AI tools for writing, coding, productivity, design, video, automation, and more. Independent reviews. No sponsored content."
        canonical="https://shabellehub.com"
        openGraph={{
          title: 'Shabelle Hub — Discover the Best AI Tools in One Place',
          description: "Compare, review, and explore the world's top AI tools. Independent reviews, honest rankings, and expert insights.",
          url: 'https://shabellehub.com',
          type: 'website',
          siteName: 'Shabelle Hub',
          images: [{ url: 'https://shabellehub.com/og-image.png', width: 1200, height: 630, alt: 'Shabelle Hub — AI Tools Discovery Platform' }],
        }}
        twitter={{ handle: '@shabellehub', site: '@shabellehub', cardType: 'summary_large_image' }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(getOrganizationStructuredData()) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(getWebsiteStructuredData()) }}
      />

      {/* ── HERO (Phase 2: aurora mesh, animated search, floating cards) ── */}
      <Hero tools={tools} />

      {/* ── STATS BAR ── */}
      <div id="stats" style={{ background: '#0c1522', borderTop: '1px solid #1a2d4a', borderBottom: '1px solid #1a2d4a', padding: '18px 20px', scrollMarginTop: 20 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'center', gap: 40, flexWrap: 'wrap' }}>
          {[
            { value: toolsCount,      decimals: 0, suffix: '',  label: 'Tools Reviewed' },
            { value: categoriesCount, decimals: 0, suffix: '',  label: 'Categories' },
            { value: 100,             decimals: 0, suffix: '%', label: 'Independent' },
            { value: avgRating,       decimals: 1, suffix: '★', label: 'Avg Rating' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 22, fontWeight: 800, color: '#14FFF4' }}>
                <AnimatedCounter value={s.value} decimals={s.decimals} suffix={s.suffix} />
              </div>
              <div style={{ fontSize: 11, color: '#6b82a8', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── TRUST BAR ── */}
      <div style={{ background: '#080d1a', padding: '14px 20px', borderBottom: '1px solid #1a2d4a' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'center', gap: 32, flexWrap: 'wrap', alignItems: 'center' }}>
          {[
            { icon: '🛡️', text: 'No Sponsored Content' },
            { icon: '🔍', text: 'Hands-On Tested'      },
            { icon: '📊', text: 'Honest Comparisons'   },
            { icon: '🔄', text: 'Updated Weekly'        },
          ].map(item => (
            <span key={item.text} style={{ fontSize: 12, color: '#6b82a8', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span aria-hidden="true">{item.icon}</span> {item.text}
            </span>
          ))}
        </div>
      </div>

      {/* ── FEATURED TOOLS (Phase 3: redesigned cards) ── */}
      <FeaturedTools
        tools={featuredTools}
        title="Featured AI Tools"
        icon="⚡"
        favorites={favorites}
        onToggleFavorite={toggleFavorite}
      />

      {/* ── TRENDING (real click data, falls back to editor picks) ── */}
      <TrendingSection
        trendingThisWeek={trendingThisWeek}
        fastestGrowing={fastestGrowing}
        fallbackTools={trendingTools}
        favorites={favorites}
        onToggleFavorite={toggleFavorite}
      />

      {/* ── EDITOR'S CHOICE (Phase 4) ── */}
      <EditorsChoice tools={tools} />

      {/* ── TESTIMONIALS (Phase 4) ── */}
      <Testimonials />

      {/* ── FAQ (Phase 4: schema markup) ── */}
      <FAQ limit={5} />

      {/* ── LATEST BLOG ── */}
      <Section surface>
        <SectionHeader icon="📝" title="Latest AI Reviews" ctaLabel="All posts" ctaHref="/blog" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {blogLoading
            ? Array.from({ length: 3 }).map((_, i) => <BlogCardSkeleton key={i} />)
            : displayPosts.slice(0, 3).map(post => (
            <Link key={post.id || post.slug} href={`/blog/${post.slug}`} style={{ textDecoration: 'none' }}>
              <article style={{
                background: '#0f1829', border: '1px solid #1a2d4a', borderRadius: 14,
                padding: 22, height: '100%', display: 'flex', flexDirection: 'column', gap: 10,
              }}>
                <div style={{ display: 'flex', gap: 8, color: '#14FFF4', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
                  <span>{post.category || post.category_name}</span>
                  {(post.date || post.published_at) && (
                    <>
                      <span style={{ opacity: 0.5 }} aria-hidden="true">·</span>
                      <time dateTime={post.date || post.published_at} style={{ opacity: 0.7 }}>
                        {post.date || (post.published_at ? new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '')}
                      </time>
                    </>
                  )}
                  {(post.readTime || post.read_time) && (
                    <>
                      <span style={{ opacity: 0.5 }} aria-hidden="true">·</span>
                      <span style={{ opacity: 0.7 }}>{post.readTime || post.read_time} read</span>
                    </>
                  )}
                </div>
                <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 16, fontWeight: 700, color: '#e8f0ff', lineHeight: 1.35, flex: 1 }}>
                  {post.title}
                </h3>
                <p style={{ color: '#6b82a8', fontSize: 13, lineHeight: 1.6 }}>{post.excerpt}</p>
              </article>
            </Link>
          ))}
        </div>
      </Section>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px' }}>
        <TransparencyNotice />
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px' }}>
        <AdSlot slot="5555555555" label="Homepage ad" />
      </div>

      {/* ── NEWSLETTER ── */}
      <section style={{ padding: '52px 20px', borderTop: '1px solid #1a2d4a' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <NewsletterSignupForm
            source="homepage"
            variant="default"
            heading="Stay ahead of the AI curve"
            subheading="New tool reviews, comparisons, and expert picks — delivered weekly. No spam, ever."
          />
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section style={{ padding: '52px 20px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 'clamp(20px, 4vw, 28px)', fontWeight: 800, marginBottom: 14 }}>
          Ready to find your perfect AI tool?
        </h2>
        <p style={{ color: '#6b82a8', fontSize: 14, marginBottom: 28 }}>
          Browse {toolsCount} tools across {categoriesCount} categories — all independently reviewed by Shabelle Hub.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/tools" style={{
            display: 'inline-block', background: '#14FFF4', color: '#080d1a',
            borderRadius: 12, padding: '14px 32px', fontWeight: 800, fontSize: 15, textDecoration: 'none',
          }}>
            Browse the Full Directory →
          </Link>
          <Link href="/blog" style={{
            display: 'inline-block', background: 'none', color: '#e8f0ff',
            border: '1px solid #1a2d4a', borderRadius: 12, padding: '14px 28px',
            fontWeight: 700, fontSize: 15, textDecoration: 'none',
          }}>
            Read AI Reviews
          </Link>
        </div>
      </section>
    </>
  );
}
