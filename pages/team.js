import { NextSeo } from 'next-seo';
import Link from 'next/link';
import { teamMembers } from '../data/team';
import { siteConfig, toolsCount as staticToolsCount } from '../data';
import { listTools } from '../lib/cms/tools';

export async function getStaticProps() {
  try {
    const toolsRes = await listTools({ status: 'published', lim: 200 });
    if (toolsRes.error) throw new Error(toolsRes.error);
    return {
      props: { toolsCount: toolsRes.data.length },
      revalidate: 3600,
    };
  } catch {
    return {
      props: { toolsCount: null },
      revalidate: 60,
    };
  }
}
import { getOrganizationStructuredData } from '../lib/seo';
import { PageTitle } from '../components/ui';
import { TeamMemberCard } from '../components/eeat';

export default function TeamPage({ toolsCount: fetchedCount }) {
  const toolsCount = fetchedCount ?? staticToolsCount;

  const orgSchema = getOrganizationStructuredData();

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteConfig.url },
      { '@type': 'ListItem', position: 2, name: 'Our Team', item: `${siteConfig.url}/team` },
    ],
  };

  return (
    <>
      <NextSeo
        title="Our Team — Who Writes & Reviews Shabelle Hub"
        description="Meet the writers, analysts, and editors behind Shabelle Hub's AI tool reviews — their backgrounds, areas of expertise, and editorial responsibilities."
        canonical={`${siteConfig.url}/team`}
        openGraph={{
          title: 'Our Team — Shabelle Hub',
          description: "Meet the writers, analysts, and editors behind Shabelle Hub's AI tool reviews.",
          url: `${siteConfig.url}/team`,
          type: 'website',
          siteName: 'Shabelle Hub',
          images: [{ url: 'https://shabellehub.com/og-image.png', width: 1200, height: 630, alt: 'Shabelle Hub Team' }],
        }}
        twitter={{ handle: '@shabellehub', site: '@shabellehub', cardType: 'summary_large_image' }}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 20px' }}>
        <nav aria-label="Breadcrumb" style={{ fontSize: 13, color: '#6b82a8', marginBottom: 16 }}>
          <ol style={{ listStyle: 'none', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            <li><Link href="/" style={{ color: '#6b82a8' }}>Home</Link></li>
            <li aria-hidden="true" style={{ margin: '0 4px' }}>›</li>
            <li><span style={{ color: '#e8f0ff' }} aria-current="page">Our Team</span></li>
          </ol>
        </nav>

        <PageTitle sub="Every review and article on Shabelle Hub is written by a named author and checked by a named editor — here's who they are.">
          Meet the Shabelle Hub Team
        </PageTitle>

        <div style={{
          background: '#0f1829', border: '1px solid #1a2d4a', borderRadius: 16,
          padding: 24, marginBottom: 28,
        }}>
          <p style={{ color: '#6b82a8', fontSize: 14, lineHeight: 1.75, marginBottom: 10 }}>
            Shabelle Hub is a small, independent team. We review {toolsCount} AI tools hands-on rather than
            hundreds at a surface level, and every page is owned by a specific person — not an anonymous
            &ldquo;editorial staff&rdquo; byline. That ownership means a real person stands behind every rating,
            and a separate editor verifies every factual claim before and after publication.
          </p>
          <p style={{ color: '#6b82a8', fontSize: 14, lineHeight: 1.75 }}>
            Learn more about how we work in our{' '}
            <Link href="/editorial-standards" style={{ color: '#14FFF4' }}>Editorial Standards</Link>{' '}
            and{' '}
            <Link href="/review-methodology" style={{ color: '#14FFF4' }}>Review Methodology</Link>, or
            see how the site makes money in our{' '}
            <Link href="/affiliate-disclosure" style={{ color: '#14FFF4' }}>Affiliate Disclosure</Link>.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18, marginBottom: 28 }}>
          {teamMembers.map(person => (
            <TeamMemberCard key={person.slug} person={person} />
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/authors" style={{
            color: '#14FFF4', fontSize: 13, fontWeight: 700,
            background: 'rgba(20,255,244,0.08)', border: '1px solid rgba(20,255,244,0.25)',
            borderRadius: 10, padding: '10px 18px', textDecoration: 'none',
          }}>
            Browse all authors →
          </Link>
          <Link href="/reviewers" style={{
            color: '#00d084', fontSize: 13, fontWeight: 700,
            background: 'rgba(0,208,132,0.08)', border: '1px solid rgba(0,208,132,0.25)',
            borderRadius: 10, padding: '10px 18px', textDecoration: 'none',
          }}>
            Browse all reviewers →
          </Link>
        </div>
      </div>
    </>
  );
}
