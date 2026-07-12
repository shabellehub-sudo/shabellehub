import { NextSeo } from 'next-seo';
import Link from 'next/link';
import { TransparencyNotice } from '../components/compliance';
import { toolsCount as staticToolsCount, categoriesCount as staticCategoriesCount } from '../data';
import { listTools } from '../lib/cms/tools';

export async function getStaticProps() {
  try {
    const toolsRes = await listTools({ status: 'published', lim: 200 });
    if (toolsRes.error) throw new Error(toolsRes.error);
    const tools = toolsRes.data;
    return {
      props: {
        toolsCount: tools.length,
        categoriesCount: new Set(tools.map(t => t.category).filter(Boolean)).size,
      },
      revalidate: 3600,
    };
  } catch {
    return {
      props: { toolsCount: null, categoriesCount: null },
      revalidate: 60,
    };
  }
}

export default function AboutPage({ toolsCount: fetchedCount, categoriesCount: fetchedCategories }) {
  const toolsCount = fetchedCount ?? staticToolsCount;
  const categoriesCount = fetchedCategories ?? staticCategoriesCount;

  const VALUES = [
    { icon: '🛡️', title: 'Editorial Independence',  desc: 'No tool pays to be featured. Our ratings reflect hands-on testing only — see how below.' },
    { icon: '📊', title: 'Honest Comparisons',        desc: 'Side-by-side pricing, features, and genuine pros & cons for every tool we cover.' },
    { icon: '📂', title: 'Curated, Not Comprehensive', desc: `We'd rather review ${toolsCount} tools properly than list hundreds we haven't tested.` },
  ];

  return (
    <>
      {/* FIX #8/#18: no brand suffix — titleTemplate handles it */}
      <NextSeo
        title="About — Independent AI Tool Reviews & Discovery"
        description="Shabelle Hub is an independent AI discovery platform. We help users find, compare, and choose the best AI tools through honest reviews and expert analysis. No sponsored content."
        canonical="https://shabellehub.com/about"
        openGraph={{
          title: 'About Shabelle Hub — Independent AI Tool Reviews',
          description: 'Shabelle Hub is an independent AI discovery platform. Honest reviews, no sponsored content.',
          url: 'https://shabellehub.com/about',
          type: 'website',
          siteName: 'Shabelle Hub',
          images: [{ url: 'https://shabellehub.com/og-image.png', width: 1200, height: 630, alt: 'About Shabelle Hub' }],
        }}
        twitter={{ handle: '@shabellehub', site: '@shabellehub', cardType: 'summary_large_image' }}
      />

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '36px 20px' }}>
        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 30, fontWeight: 800, marginBottom: 20 }}>
          About Shabelle Hub
        </h1>
        <p style={{ color: '#6b82a8', fontSize: 15, lineHeight: 1.75, marginBottom: 16 }}>
          Shabelle Hub is an independent AI tool review and comparison site built to cut through the
          noise of the fast-moving AI landscape. Every tool listed is tested hands-on and evaluated
          on technical merit, real-world utility, and honest pricing.
        </p>
        <p style={{ color: '#6b82a8', fontSize: 15, lineHeight: 1.75, marginBottom: 16 }}>
          Our goal is simple: help individuals and teams find the right AI tool for their needs
          without wading through sponsored content or inflated rankings.
        </p>
        <p style={{ color: '#6b82a8', fontSize: 15, lineHeight: 1.75, marginBottom: 28 }}>
          Some links on this site are affiliate links. When you click and sign up, we may earn a small
          commission at no cost to you. This is how we keep the site running while staying editorially
          independent. See our{' '}
          <Link href="/affiliate-disclosure" style={{ color: '#14FFF4' }}>Affiliate Disclosure</Link>.
        </p>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginBottom: 28 }}>
          {[
            { num: String(toolsCount),      label: 'Tools Reviewed' },
            { num: String(categoriesCount), label: 'Categories Covered' },
            { num: '100%',                  label: 'Independent' },
            { num: '0',                     label: 'Paid Placements' },
          ].map(s => (
            <div key={s.label} style={{ background: '#0f1829', border: '1px solid #1a2d4a', borderRadius: 12, padding: 20, textAlign: 'center' }}>
              <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 26, fontWeight: 800, color: '#14FFF4' }}>{s.num}</div>
              <div style={{ color: '#6b82a8', fontSize: 13, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* How We Review */}
        <div style={{ background: '#0f1829', border: '1px solid #1a2d4a', borderRadius: 14, padding: 24, marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 18, fontWeight: 700, marginBottom: 12, color: '#e8f0ff' }}>
            How We Review AI Tools
          </h2>
          <p style={{ color: '#6b82a8', fontSize: 14, lineHeight: 1.75 }}>
            Every tool on Shabelle Hub is signed up for and used hands-on across realistic tasks —
            writing, coding, research, or creative work depending on the category. We test the free
            tier where one exists, then the paid tier, and document specific strengths and limitations
            we encounter along the way. Ratings reflect this testing, not vendor marketing claims. We
            do not accept payment for inclusion or for positive coverage, and we say plainly when a
            tool isn&rsquo;t worth your time or money.
          </p>
        </div>

        {/* Values */}
        <div style={{ background: '#0f1829', border: '1px solid #1a2d4a', borderRadius: 14, padding: 24, marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 18, fontWeight: 700, marginBottom: 16, color: '#e8f0ff' }}>
            What We Stand For
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {VALUES.map(v => (
              <div key={v.title} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span aria-hidden="true" style={{ fontSize: 20, flexShrink: 0 }}>{v.icon}</span>
                <div>
                  <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, color: '#e8f0ff', fontSize: 14, marginBottom: 2 }}>{v.title}</div>
                  <div style={{ color: '#6b82a8', fontSize: 13, lineHeight: 1.55 }}>{v.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Meet the Team */}
        <div style={{ background: '#0f1829', border: '1px solid #1a2d4a', borderRadius: 14, padding: 24, marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 18, fontWeight: 700, marginBottom: 12, color: '#e8f0ff' }}>
            Who&rsquo;s Behind Shabelle Hub
          </h2>
          <p style={{ color: '#6b82a8', fontSize: 14, lineHeight: 1.75, marginBottom: 14 }}>
            Every review and article on this site has a named author with disclosed experience and expertise,
            and is independently fact-checked by a named editor before and after publication. We publish that
            ownership openly because it&rsquo;s core to how we maintain editorial independence.
          </p>
          <Link href="/team" style={{
            display: 'inline-block', background: '#14FFF4', color: '#080d1a',
            fontWeight: 700, fontSize: 13, padding: '10px 24px', borderRadius: 10, textDecoration: 'none',
          }}>
            Meet the Team →
          </Link>
        </div>

        <div style={{ marginBottom: 24 }}>
          <TransparencyNotice />
        </div>

        <p style={{ color: '#6b82a8', fontSize: 15, lineHeight: 1.75 }}>
          Want a tool reviewed?{' '}
          <Link href="/contact" style={{ color: '#14FFF4' }}>Contact us</Link>.
        </p>
      </div>
    </>
  );
}
