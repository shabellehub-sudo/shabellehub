import { NextSeo } from 'next-seo';
import Link from 'next/link';
import { toolsCount } from '../data';

// ─── EDITORIAL STANDARDS ────────────────────────────────────────────────────
// E-E-A-T page: explains who writes/reviews content, how independence is
// maintained, how sources and claims are verified, how AI assistance is used
// in production, and how corrections are handled. Paired with
// /review-methodology (the "how we score" page) and /disclosure
// (the "how we make money" page) — together these three pages form the
// trust-signal backbone Google's Helpful Content / AdSense reviewers look for.

const PRINCIPLES = [
  {
    icon: '🎯',
    title: 'Purpose Before Profit',
    body:
      'Every page on Shabelle Hub exists to help a reader make a decision — which AI tool to try, ' +
      'which plan to pick, or whether a tool is worth their time at all. If a piece of content does not ' +
      'serve that purpose, we do not publish it, regardless of its SEO value.',
  },
  {
    icon: '🔍',
    title: 'Verify Before Publish',
    body:
      'Pricing, feature claims, and limits are checked directly against the provider\u2019s official ' +
      'website, pricing page, or documentation at the time of writing. We do not rely on press releases, ' +
      'third-party blog posts, or vendor marketing copy as a primary source.',
  },
  {
    icon: '🤝',
    title: 'Independence From Vendors',
    body:
      'No company can pay for inclusion, a higher rating, or favorable wording. Affiliate relationships ' +
      'may exist (see our Affiliate Disclosure), but they never determine which tools we cover or how we ' +
      'rate them. We have removed tools from the directory, lowered ratings, and added \u201ccon\u201d ' +
      'points for tools we have an active affiliate relationship with when our testing warranted it.',
  },
  {
    icon: '🧾',
    title: 'Plain Language Over Hype',
    body:
      'We avoid superlatives we cannot back up (\u201cthe best AI tool ever made\u201d) and unverifiable ' +
      'statistics. When a tool has a real limitation \u2014 a paywall, a usage cap, a missing feature \u2014 ' +
      'we say so in the first few paragraphs, not buried at the bottom.',
  },
];

const AI_USE_POINTS = [
  'AI writing and coding tools (including some of the tools we review) are used to help draft, ' +
    'structure, and edit pages \u2014 the way most modern publications use word processors, grammar ' +
    'checkers, and editing software.',
  'Every factual claim about a tool\u2019s pricing, features, or limitations is checked by a human ' +
    'against the provider\u2019s own site before publication, regardless of how the draft was produced.',
  'Hands-on impressions, pros, cons, and ratings reflect actual use of the tools, not AI-generated ' +
    'guesses about what a tool probably does.',
  'We do not publish AI-generated \u201creviews\u201d of tools no one on our team has used. If a page ' +
    'describes a tool, that tool has been tried.',
];

const CORRECTIONS = [
  {
    title: 'Pricing & Feature Changes',
    body:
      'AI products change pricing and feature sets frequently, often with little notice. When we ' +
      'become aware that a page is out of date \u2014 through our own checks or a reader report \u2014 ' +
      'we update the page directly rather than leaving the outdated version live with a disclaimer.',
  },
  {
    title: 'Factual Errors',
    body:
      'If we get something wrong \u2014 a pricing tier, a feature claim, a comparison point \u2014 we ' +
      'correct it as soon as it is verified, with no minimum severity threshold. Small errors get fixed ' +
      'just as quickly as large ones.',
  },
  {
    title: 'Reporting an Issue',
    body:
      'Readers can report inaccurate or outdated information through our Contact page. We review every ' +
      'submission and reply if a correction is made or if we need more information to verify the claim.',
  },
];

export default function EditorialStandardsPage() {
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://shabellehub.com' },
      { '@type': 'ListItem', position: 2, name: 'Editorial Standards', item: 'https://shabellehub.com/editorial-standards' },
    ],
  };

  return (
    <>
      {/* FIX #8/#18 convention: no brand suffix in title — titleTemplate appends it */}
      <NextSeo
        title="Editorial Standards"
        description="How Shabelle Hub researches, writes, fact-checks, and corrects AI tool reviews. Our editorial independence, sourcing standards, and use of AI in content production."
        canonical="https://shabellehub.com/editorial-standards"
        openGraph={{
          title: 'Editorial Standards | Shabelle Hub',
          description: 'How we research, fact-check, and maintain independence across every AI tool review on Shabelle Hub.',
          url: 'https://shabellehub.com/editorial-standards',
          type: 'website',
          siteName: 'Shabelle Hub',
          images: [{ url: 'https://shabellehub.com/og-image.png', width: 1200, height: 630, alt: 'Shabelle Hub Editorial Standards' }],
        }}
        twitter={{ handle: '@shabellehub', site: '@shabellehub', cardType: 'summary_large_image' }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '36px 20px' }}>

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" style={{ fontSize: 13, color: '#6b82a8', marginBottom: 20 }}>
          <ol style={{ listStyle: 'none', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            <li><Link href="/" style={{ color: '#6b82a8' }}>Home</Link></li>
            <li aria-hidden="true" style={{ margin: '0 4px' }}>›</li>
            <li><span style={{ color: '#e8f0ff' }} aria-current="page">Editorial Standards</span></li>
          </ol>
        </nav>

        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 30, fontWeight: 800, marginBottom: 16 }}>
          Editorial Standards
        </h1>
        <p style={{ color: '#6b82a8', fontSize: 15, lineHeight: 1.75, marginBottom: 28 }}>
          Shabelle Hub publishes independent reviews and comparisons of AI tools. This page explains the
          standards every piece of content on this site is held to \u2014 how we research, who is
          accountable for accuracy, how we use AI tools in our own production process, and what happens
          when something needs to be corrected. For how we score and rate tools specifically, see our{' '}
          <Link href="/review-methodology" style={{ color: '#14FFF4' }}>Review Methodology</Link>. For how
          we make money, see our{' '}
          <Link href="/affiliate-disclosure" style={{ color: '#14FFF4' }}>Affiliate Disclosure</Link>.
        </p>

        {/* Core principles */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 18, fontWeight: 700, marginBottom: 16, color: '#e8f0ff' }}>
            Core Principles
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {PRINCIPLES.map(p => (
              <div key={p.title} style={{ background: '#0f1829', border: '1px solid #1a2d4a', borderRadius: 14, padding: 20, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <span aria-hidden="true" style={{ fontSize: 22, flexShrink: 0 }}>{p.icon}</span>
                <div>
                  <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 15, fontWeight: 700, color: '#e8f0ff', marginBottom: 6 }}>
                    {p.title}
                  </h3>
                  <p style={{ color: '#6b82a8', fontSize: 14, lineHeight: 1.7 }}>{p.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Sourcing & verification */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 18, fontWeight: 700, marginBottom: 12, color: '#e8f0ff' }}>
            Sourcing & Fact-Checking
          </h2>
          <div style={{ background: '#0f1829', border: '1px solid #1a2d4a', borderRadius: 14, padding: 22 }}>
            <p style={{ color: '#6b82a8', fontSize: 14, lineHeight: 1.75, marginBottom: 12 }}>
              Claims about pricing, plan limits, supported integrations, and headline features are checked
              against each provider\u2019s own pricing page, product documentation, or official changelog
              at the time a page is written or updated. Where a provider\u2019s own materials are ambiguous
              or conflicting, we note the ambiguity rather than guess.
            </p>
            <p style={{ color: '#6b82a8', fontSize: 14, lineHeight: 1.75 }}>
              Opinions, ratings, and \u201cpros and cons\u201d sections reflect direct use of each tool
              covered on this site \u2014 see our{' '}
              <Link href="/review-methodology" style={{ color: '#14FFF4' }}>Review Methodology</Link> for
              the step-by-step testing process and rating criteria.
            </p>
          </div>
        </section>

        {/* AI in our process */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 18, fontWeight: 700, marginBottom: 12, color: '#e8f0ff' }}>
            Use of AI Tools in Our Content Process
          </h2>
          <div style={{ background: '#0f1829', border: '1px solid #1a2d4a', borderRadius: 14, padding: 22 }}>
            <p style={{ color: '#6b82a8', fontSize: 14, lineHeight: 1.75, marginBottom: 14 }}>
              Because Shabelle Hub reviews AI tools, transparency about our own use of AI is part of being
              trustworthy. Here is exactly where AI fits into our process and where it does not:
            </p>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {AI_USE_POINTS.map((point, i) => (
                <li key={i} style={{ color: '#e8f0ff', fontSize: 14, lineHeight: 1.7, display: 'flex', gap: 10 }}>
                  <span aria-hidden="true" style={{ color: '#14FFF4', flexShrink: 0 }}>›</span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Corrections policy */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 18, fontWeight: 700, marginBottom: 16, color: '#e8f0ff' }}>
            Corrections & Update Policy
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {CORRECTIONS.map(c => (
              <div key={c.title} style={{ background: '#0f1829', border: '1px solid #1a2d4a', borderRadius: 14, padding: 20 }}>
                <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 15, fontWeight: 700, color: '#e8f0ff', marginBottom: 6 }}>
                  {c.title}
                </h3>
                <p style={{ color: '#6b82a8', fontSize: 14, lineHeight: 1.7 }}>{c.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Accountability */}
        <section style={{
          background: 'linear-gradient(135deg, rgba(20,255,244,0.05), rgba(20,255,244,0.02))',
          border: '1px solid rgba(20,255,244,0.2)', borderRadius: 16, padding: 24,
        }}>
          <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 17, fontWeight: 800, marginBottom: 10, color: '#e8f0ff' }}>
            Accountability
          </h2>
          <p style={{ color: '#6b82a8', fontSize: 14, lineHeight: 1.75, marginBottom: 14 }}>
            Shabelle Hub currently covers {toolsCount} AI tools, each reviewed under the standards on this
            page. As we expand coverage, every new page is held to the same bar before it is published \u2014
            no exceptions for content that is faster to produce but lower quality.
          </p>
          <p style={{ color: '#6b82a8', fontSize: 14, lineHeight: 1.75 }}>
            Spotted something that doesn\u2019t meet these standards?{' '}
            <Link href="/contact" style={{ color: '#14FFF4', fontWeight: 700 }}>Let us know</Link> \u2014
            we take it seriously.
          </p>
        </section>
      </div>
    </>
  );
}
