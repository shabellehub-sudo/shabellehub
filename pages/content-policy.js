import { NextSeo } from 'next-seo';
import Link from 'next/link';
import { siteConfig } from '../data';
import { PageTitle } from '../components/ui';

const SECTIONS = [
  {
    title: 'What We Cover',
    body: 'Shabelle Hub publishes hands-on reviews of AI tools, comparison guides, and explainer articles aimed at people choosing between AI products. We select tools to cover based on reader demand and relevance to our existing categories, not based on advertising or affiliate opportunity. We do not publish content about tools we have not used.',
  },
  {
    title: 'How Content Is Produced',
    body: 'Every review starts with hands-on use of the product: signing up, testing core features across the free and paid tiers where applicable, and recording pricing and limits directly from the provider. A named author then drafts the review, and a named editor independently verifies factual claims (pricing, features, limits) against the provider\u2019s current website before publication. See our Review Methodology for the full process.',
  },
  {
    title: 'Use of AI Writing Tools',
    body: 'As a site that reviews AI tools, we sometimes use AI-assisted drafting or research tools as part of our own workflow \u2014 for example, to organize research notes or produce a first-draft outline. Every published page is written, fact-checked, and approved by a named human author and reviewer before going live; AI assistance is never a substitute for hands-on testing, and ratings reflect the author\u2019s genuine assessment, not generated content.',
  },
  {
    title: 'Sourcing Standards',
    body: 'Pricing, feature lists, and specification claims are sourced from the provider\u2019s own website, official documentation, or direct testing \u2014 not from secondary aggregator sites. Where we reference third-party data (for example, benchmark results), we link to the original source.',
  },
  {
    title: 'No Fake Reviews or Manufactured Engagement',
    body: 'We do not publish fabricated user testimonials, fake comparison "winners" chosen for SEO purposes, or reviews of products our team has not used. Star ratings reflect our editorial team\u2019s genuine assessment based on the criteria in our Review Methodology, not vendor-supplied scores.',
  },
  {
    title: 'Update & Correction Policy',
    body: 'AI tools change pricing and features frequently. Each review displays a "Last Updated" and "Last Reviewed" date. When we identify outdated information \u2014 through our own recurring audits or via reader reports \u2014 we correct the page and update these dates. We do not silently rewrite the substance of a published rating without making the change visible through the updated date.',
  },
  {
    title: 'Prohibited Content',
    body: 'We do not publish doorway pages built only to rank for a keyword with no unique value, thin "roundup" pages with no original testing behind them, plagiarized text, or content designed primarily to maximize ad impressions rather than inform the reader. Every page is expected to provide a complete, standalone answer to the topic it covers.',
  },
  {
    title: 'Reader Corrections',
    body: 'If you spot an error, an outdated price, or a discontinued feature, contact us with the page URL and details. We review correction requests and update the relevant page\u2019s "Last Reviewed" date once verified.',
  },
];

export default function ContentPolicyPage() {
  const canonical = `${siteConfig.url}/content-policy`;
  const title = 'Content Policy — How Shabelle Hub Creates and Maintains Content';
  const description = 'Our editorial guidelines: how we choose what to cover, how reviews are produced and fact-checked, our use of AI-assisted drafting, and our correction policy.';

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteConfig.url },
      { '@type': 'ListItem', position: 2, name: 'Content Policy', item: canonical },
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
            <li><span style={{ color: '#e8f0ff' }} aria-current="page">Content Policy</span></li>
          </ol>
        </nav>

        <PageTitle sub="Last updated June 12, 2026 — how we decide what to cover, produce reviews, and keep them accurate over time.">
          Content Policy
        </PageTitle>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 28, marginBottom: 28 }}>
          {SECTIONS.map((s, i) => (
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
            Related: see our{' '}
            <Link href="/editorial-standards" style={{ color: '#14FFF4' }}>Editorial Standards</Link>,{' '}
            <Link href="/review-methodology" style={{ color: '#14FFF4' }}>Review Methodology</Link>,{' '}
            <Link href="/team" style={{ color: '#14FFF4' }}>Our Team</Link>, or our full{' '}
            <Link href="/site-transparency" style={{ color: '#14FFF4' }}>Site Transparency</Link> overview.
          </p>
        </div>
      </div>
    </>
  );
}
