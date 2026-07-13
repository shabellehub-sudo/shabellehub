import { NextSeo } from 'next-seo';
import Link from 'next/link';
import { siteConfig } from '../data';
import { PageTitle } from '../components/ui';
import { listTools } from '../lib/cms/tools';

const FALLBACK_TOOL_NAMES = ['ChatGPT', 'Claude', 'Midjourney', 'Notion AI', 'Grammarly', 'Perplexity AI'];

const getSections = (sampleToolNames) => [
  {
    title: 'How Affiliate Links Work on Shabelle Hub',
    body: 'Many of the "Try Free", "Visit", and "Get Started" buttons on this site are affiliate links. When you click one of these links and then sign up for, subscribe to, or purchase a product, Shabelle Hub may receive a commission from the company whose product you chose. This commission comes from the company, not from you — using an affiliate link never increases the price you pay.',
  },
  {
    title: 'Programs We Currently Participate In',
    body: `Shabelle Hub participates in affiliate or referral programs for some of the tools we cover, including ${sampleToolNames.join(', ')}, and others. Not every tool listed on this site has an affiliate relationship attached to it — some links are simply direct, non-monetized links to the provider's site.`,
  },
  {
    title: 'Editorial Independence: How We Keep Reviews Honest',
    body: 'Affiliate relationships are decided after a tool has been reviewed, never before — we do not accept payment in exchange for a favorable review, and we do not change a published rating because an affiliate deal starts or ends. The author of each review is listed on the page, and a separate editor verifies factual claims independently of any commercial relationship. If a tool with an affiliate program is genuinely not worth recommending, our review says so.',
  },
  {
    title: 'What This Means for You',
    body: 'Clicking an affiliate link and then deciding not to sign up costs you nothing and has no effect on you. If you do sign up, the commission we may receive helps fund the hands-on testing, research, and editorial work that goes into this site, at no extra cost to you. We disclose this relationship so you have full context for evaluating our recommendations.',
  },
  {
    title: 'How to Identify Affiliate Links',
    body: 'On individual tool review pages, primary call-to-action buttons are typically affiliate links, and we include a short note directly below them stating this. You can also assume any "Visit", "Try Free", "Get Started", or "Sign Up" button pointing to a third-party tool\u2019s website may be an affiliate link, governed by this disclosure.',
  },
  {
    title: 'Advertising vs. Affiliate Links',
    body: 'Affiliate links are different from display advertising. This page covers affiliate relationships embedded in our content and recommendations. For information about banner/display ads that may appear on this site, see our Advertising Disclosure.',
  },
  {
    title: 'FTC Compliance',
    body: 'In accordance with the U.S. Federal Trade Commission\u2019s Guides Concerning the Use of Endorsements and Testimonials (16 CFR Part 255), we disclose material affiliate connections clearly and conspicuously, both on this page and near the relevant links throughout the site.',
  },
  {
    title: 'Questions or Corrections',
    body: 'If you believe a piece of content should have an affiliate disclosure that is missing, or you have questions about a specific relationship, contact us and we will review and correct it.',
  },
];

export async function getStaticProps() {
  try {
    const toolsRes = await listTools({ status: 'published', lim: 6 });
    if (toolsRes.error) throw new Error(toolsRes.error);
    const names = toolsRes.data.map((t) => t.name).filter(Boolean);
    return {
      props: { sampleToolNames: names.length ? names : FALLBACK_TOOL_NAMES },
      revalidate: 3600,
    };
  } catch {
    return {
      props: { sampleToolNames: FALLBACK_TOOL_NAMES },
      revalidate: 60,
    };
  }
}

export default function AffiliateDisclosurePage({ sampleToolNames = FALLBACK_TOOL_NAMES }) {
  const canonical = `${siteConfig.url}/affiliate-disclosure`;
  const title = 'Affiliate Disclosure — How Shabelle Hub Makes Money';
  const description = 'How Shabelle Hub uses affiliate links, which programs we participate in, and how we keep our AI tool reviews editorially independent of any commission.';

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteConfig.url },
      { '@type': 'ListItem', position: 2, name: 'Affiliate Disclosure', item: canonical },
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 20px' }}>
        <nav aria-label="Breadcrumb" style={{ fontSize: 13, color: '#6b82a8', marginBottom: 16 }}>
          <ol style={{ listStyle: 'none', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            <li><Link href="/" style={{ color: '#6b82a8' }}>Home</Link></li>
            <li aria-hidden="true" style={{ margin: '0 4px' }}>›</li>
            <li><span style={{ color: '#e8f0ff' }} aria-current="page">Affiliate Disclosure</span></li>
          </ol>
        </nav>

        <PageTitle sub="Last updated June 12, 2026 — how affiliate links fund Shabelle Hub without affecting our ratings.">
          Affiliate Disclosure
        </PageTitle>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 28, marginBottom: 28 }}>
          {getSections(sampleToolNames).map((s, i) => (
            <div key={i}>
              <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 16, fontWeight: 700, marginBottom: 8, color: '#e8f0ff' }}>
                {s.title}
              </h2>
              <p style={{ color: '#6b82a8', fontSize: 14, lineHeight: 1.75 }}>{s.body}</p>
            </div>
          ))}
        </div>

        <div style={{ background: '#0f1829', border: '1px solid #1a2d4a', borderRadius: 14, padding: '16px 20px' }}>
          <p style={{ color: '#6b82a8', fontSize: 13, lineHeight: 1.65 }}>
            Related: read our{' '}
            <Link href="/advertising-disclosure" style={{ color: '#14FFF4' }}>Advertising Disclosure</Link>,{' '}
            <Link href="/review-methodology" style={{ color: '#14FFF4' }}>Review Methodology</Link>,{' '}
            <Link href="/editorial-standards" style={{ color: '#14FFF4' }}>Editorial Standards</Link>, or our full{' '}
            <Link href="/site-transparency" style={{ color: '#14FFF4' }}>Site Transparency</Link> overview.
          </p>
        </div>
      </div>
    </>
  );
}
