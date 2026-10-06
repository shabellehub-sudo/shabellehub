import { NextSeo } from 'next-seo';
import Link from 'next/link';
import { siteConfig, toolsCount as staticToolsCount } from '../data';
import { teamMembers } from '../data/team';
import { getOrganizationStructuredData } from '../lib/seo';
import { formatDate } from '../lib/eeat';
import { PageTitle } from '../components/ui';
import { TeamMemberCard } from '../components/eeat';
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

const POLICY_LINKS = [
  { href: '/editorial-standards',     label: 'Editorial Standards',     desc: 'How we decide what to publish and how we handle conflicts of interest.' },
  { href: '/review-methodology',      label: 'Review Methodology',      desc: 'The exact criteria and process behind every tool rating.' },
  { href: '/content-policy',          label: 'Content Policy',          desc: 'How content is researched, written, fact-checked, and corrected.' },
  { href: '/affiliate-disclosure',    label: 'Affiliate Disclosure',     desc: 'How affiliate links work and how they\u2019re kept separate from ratings.' },
  { href: '/advertising-disclosure',  label: 'Advertising Disclosure',   desc: 'How third-party ads work on this site and how to control personalization.' },
  { href: '/privacy',                 label: 'Privacy Policy',           desc: 'What data we collect and how it\u2019s used.' },
  { href: '/terms',                   label: 'Terms of Service',         desc: 'The terms that govern your use of this site.' },
  { href: '/team',                    label: 'Our Team',                 desc: 'Who writes, reviews, and is accountable for this content.' },
];

export default function SiteTransparencyPage({ toolsCount: fetchedCount }) {
  const toolsCount = fetchedCount ?? staticToolsCount;

  const FACTS = [
    { label: 'Site name', value: 'Shabelle Hub' },
    { label: 'Founded', value: formatDate('2024-01-15') },
    { label: 'Ownership', value: 'Independently owned and operated; founder-led editorial team (see Our Team).' },
    { label: 'Primary funding sources', value: 'Affiliate commissions from qualifying tool sign-ups; third-party display advertising is not currently active.' },
    { label: 'Editorial control', value: 'All ratings, rankings, and written content are produced by our editorial team and are not paid for or approved by the companies we review.' },
    { label: 'Tools currently reviewed', value: `${toolsCount} tools currently reviewed, with evaluation based on available evidence and hands-on testing where access is available.` },
    { label: 'Contact', value: 'Via the Contact page for editorial questions, corrections, and advertising inquiries.' },
  ];

  const canonical = `${siteConfig.url}/site-transparency`;
  const title = 'Site Transparency — Ownership, Funding & Editorial Process';
  const description = 'Who owns and runs Shabelle Hub, how the site is funded, who produces our content, and links to every policy that governs how we operate.';
  const orgSchema = getOrganizationStructuredData();

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteConfig.url },
      { '@type': 'ListItem', position: 2, name: 'Site Transparency', item: canonical },
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
          site_name: siteConfig.name,
        }}
        twitter={{
          handle: siteConfig.twitterHandle,
          site: siteConfig.twitterHandle,
          cardType: 'summary_large_image',
        }}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px' }}>
        <nav aria-label="Breadcrumb" style={{ fontSize: 13, color: '#8ba3ca', marginBottom: 16 }}>
          <ol style={{ listStyle: 'none', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            <li><Link href="/" style={{ color: '#8ba3ca' }}>Home</Link></li>
            <li aria-hidden="true" style={{ margin: '0 4px' }}>›</li>
            <li><span style={{ color: '#e8f0ff' }} aria-current="page">Site Transparency</span></li>
          </ol>
        </nav>

        <PageTitle sub="Last updated June 12, 2026 — who runs this site, how it's funded, and how every piece of content is produced.">
          Site Transparency
        </PageTitle>

        {/* Facts table */}
        <div style={{ background: '#0f1829', border: '1px solid #1a2d4a', borderRadius: 16, padding: 24, marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 17, fontWeight: 700, color: '#e8f0ff', marginBottom: 14 }}>
            At a Glance
          </h2>
          <dl>
            {FACTS.map((f, i) => (
              <div key={i} style={{
                display: 'flex', flexDirection: 'column', gap: 4,
                padding: '10px 0', borderTop: i === 0 ? 'none' : '1px solid rgba(26,45,74,0.6)',
              }}>
                <dt style={{ color: '#14FFF4', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {f.label}
                </dt>
                <dd style={{ color: '#8ba3ca', fontSize: 14, lineHeight: 1.65 }}>{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Monitoring & Verification */}
        <div style={{ background: '#0f1829', border: '1px solid #1a2d4a', borderRadius: 16, padding: 24, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 17, fontWeight: 700, color: '#e8f0ff', margin: 0 }}>
              Monitoring & Verification
            </h2>
            <span style={{ color: '#14FFF4', fontSize: 12, fontWeight: 800 }}>● Operational</span>
          </div>

          <h3 style={{ color: '#e8f0ff', fontSize: 15, margin: '0 0 8px' }}>
            Automated monitoring. Human-reviewed changes.
          </h3>

          <p style={{ color: '#8ba3ca', fontSize: 14, lineHeight: 1.7, margin: '0 0 18px' }}>
            ShabelleHub runs automated monitoring twice daily to detect meaningful changes across listed AI tools,
            including pricing, plans, and features. Detected changes are reviewed before verified information is published.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, marginBottom: 18 }}>
            {[
              ['103', 'Tools'],
              ['2× daily', 'Monitoring runs'],
              ['5,000+', 'Monitoring snapshots'],
              ['🟢', 'System status'],
            ].map(([value, label]) => (
              <div key={label} style={{ background: '#0b1528', border: '1px solid #1a2d4a', borderRadius: 10, padding: '12px 10px' }}>
                <div style={{ color: '#e8f0ff', fontWeight: 800, fontSize: 15 }}>{value}</div>
                <div style={{ color: '#8ba3ca', fontSize: 11, marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>

          <div style={{ color: '#14FFF4', fontSize: 12, fontWeight: 800, letterSpacing: 0.3, marginBottom: 12 }}>
            MONITOR → DETECT → REVIEW → VERIFY & UPDATE
          </div>

          <p style={{ color: '#6f86aa', fontSize: 12.5, lineHeight: 1.6, margin: 0 }}>
            Not every detected change represents a real product change. Automated detections are reviewed before they are treated as verified information.
          </p>
        </div>

        {/* Team */}
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 17, fontWeight: 700, color: '#e8f0ff', marginBottom: 14 }}>
            Who Produces This Content
          </h2>
          <p style={{ color: '#8ba3ca', fontSize: 14, lineHeight: 1.75, marginBottom: 16 }}>
            Every page on Shabelle Hub is owned by a named author and checked by a named editor. Read full
            profiles on our{' '}
            <Link href="/team" style={{ color: '#14FFF4' }}>Team page</Link>, or browse{' '}
            <Link href="/authors" style={{ color: '#14FFF4' }}>Authors</Link> and{' '}
            <Link href="/reviewers" style={{ color: '#14FFF4' }}>Reviewers</Link> individually.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {teamMembers.map(person => (
              <TeamMemberCard key={person.slug} person={person} />
            ))}
          </div>
        </div>

        {/* Policy index */}
        <div>
          <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 17, fontWeight: 700, color: '#e8f0ff', marginBottom: 14 }}>
            All Policies in One Place
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
            {POLICY_LINKS.map(p => (
              <Link key={p.href} href={p.href} style={{ textDecoration: 'none' }}>
                <div style={{ background: '#0f1829', border: '1px solid #1a2d4a', borderRadius: 12, padding: '16px 18px', height: '100%' }}>
                  <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, color: '#e8f0ff', marginBottom: 6, fontSize: 14 }}>
                    {p.label} →
                  </div>
                  <p style={{ color: '#8ba3ca', fontSize: 12.5, lineHeight: 1.6 }}>{p.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
