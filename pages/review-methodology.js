import { NextSeo } from 'next-seo';
import Link from 'next/link';
import { toolsCount } from '../data';

// ─── REVIEW METHODOLOGY ─────────────────────────────────────────────────────
// E-E-A-T page: explains how tools are selected, how they're tested, and how
// the 1-5 star rating + pricing tier labels shown across the site are derived.
// Pairs with /editorial-standards (the "how we write & correct" page) and
// /disclosure (the "how we make money" page).

const SELECTION_CRITERIA = [
  {
    icon: '📈',
    title: 'Real Usage',
    body: 'The tool is widely used, actively discussed, or solves a problem readers regularly search for \u2014 not a niche product with no real-world track record.',
  },
  {
    icon: '🔄',
    title: 'Actively Maintained',
    body: 'The product is still being developed and supported. We do not list abandoned tools or ones whose pricing pages return errors.',
  },
  {
    icon: '🧩',
    title: 'Clear Use Case',
    body: 'We can describe, in plain language, who the tool is for and what task it replaces or improves \u2014 if we can\u2019t explain that simply, it doesn\u2019t get a page.',
  },
  {
    icon: '💳',
    title: 'Transparent Pricing',
    body: 'Pricing is published and verifiable on the provider\u2019s own site. \u201cContact us for pricing\u201d products are noted as such rather than given a misleading price tag.',
  },
];

const TESTING_STEPS = [
  {
    step: '1',
    title: 'Sign-up & First Impressions',
    body: 'We create an account using the same onboarding flow a new user would experience, including the free tier where one exists. Friction points \u2014 confusing setup, required credit cards, unclear plan differences \u2014 are noted here.',
  },
  {
    step: '2',
    title: 'Core Task Testing',
    body: 'We run the tool through tasks typical for its category: writing and editing for chat assistants, code generation and debugging for coding tools, prompt-to-image generation for image tools, and so on. We pay attention to output quality, speed, and how often results need manual correction.',
  },
  {
    step: '3',
    title: 'Limits & Edge Cases',
    body: 'We test what happens at the edges \u2014 free-tier usage caps, longer inputs, less common requests \u2014 since these are often where marketing claims and real-world experience diverge most.',
  },
  {
    step: '4',
    title: 'Paid Tier Comparison',
    body: 'Where a paid plan exists, we compare it directly against the free tier to determine whether the upgrade is worth it, and for whom. This becomes the basis of the \u201cIs it worth paying for?\u201d guidance in each review.',
  },
  {
    step: '5',
    title: 'Write-Up & Rating',
    body: 'Findings are written up as pros, cons, use cases, and a numeric rating (see below). The review is checked against the provider\u2019s current pricing and feature pages before publishing.',
  },
];

const RATING_FACTORS = [
  { label: 'Output Quality', weight: '30%', desc: 'How good are the results for the tasks the tool is designed for, compared to category alternatives?' },
  { label: 'Value for Money', weight: '25%', desc: 'Does the free tier offer enough to be useful, and does the paid tier justify its price relative to competitors?' },
  { label: 'Ease of Use', weight: '20%', desc: 'How quickly can a new user get from sign-up to a useful result, without a steep learning curve?' },
  { label: 'Reliability & Speed', weight: '15%', desc: 'Consistency of output quality and response times across repeated use, including during peak periods.' },
  { label: 'Support & Documentation', weight: '10%', desc: 'Quality of official docs, community resources, and responsiveness to common issues.' },
];

const RATING_SCALE = [
  { range: '4.7 \u2013 5.0', label: 'Exceptional', desc: 'Category-leading on most factors above. Few meaningful drawbacks for its intended use case.' },
  { range: '4.3 \u2013 4.6', label: 'Excellent', desc: 'Strong all-round performer with minor, specific limitations noted in the \u201cCons\u201d section.' },
  { range: '3.8 \u2013 4.2', label: 'Good', desc: 'Solid and useful for its core use case, but with notable gaps \u2014 price, limits, or polish \u2014 compared to top alternatives.' },
  { range: 'Below 3.8', label: 'Not Currently Listed', desc: 'Tools that score below this range during testing are not published as full reviews. We\u2019d rather cover fewer tools well than pad the directory with weak ones.' },
];

const PRICING_TIERS = [
  { tag: 'free', label: 'Free', desc: 'Fully usable without payment, with no plan upgrade required for the core feature set.' },
  { tag: 'freemium', label: 'Freemium', desc: 'A genuinely useful free tier exists, with optional paid plans for higher limits, advanced features, or commercial use.' },
  { tag: 'paid', label: 'Paid', desc: 'No functional free tier \u2014 a paid plan or trial is required to use the product meaningfully.' },
];

export default function ReviewMethodologyPage() {
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://shabellehub.com' },
      { '@type': 'ListItem', position: 2, name: 'Review Methodology', item: 'https://shabellehub.com/review-methodology' },
    ],
  };

  return (
    <>
      {/* FIX #8/#18 convention: no brand suffix in title — titleTemplate appends it */}
      <NextSeo
        title="Review Methodology"
        description="How Shabelle Hub selects, tests, and rates AI tools. Our selection criteria, hands-on testing process, rating factors, and what each star rating and pricing tier means."
        canonical="https://shabellehub.com/review-methodology"
        openGraph={{
          title: 'Review Methodology | Shabelle Hub',
          description: 'How we select, test, and rate every AI tool covered on Shabelle Hub — selection criteria, testing steps, and rating scale.',
          url: 'https://shabellehub.com/review-methodology',
          type: 'website',
          siteName: 'Shabelle Hub',
          images: [{ url: 'https://shabellehub.com/og-image.png', width: 1200, height: 630, alt: 'Shabelle Hub Review Methodology' }],
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
            <li><span style={{ color: '#e8f0ff' }} aria-current="page">Review Methodology</span></li>
          </ol>
        </nav>

        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 30, fontWeight: 800, marginBottom: 16 }}>
          Review Methodology
        </h1>
        <p style={{ color: '#6b82a8', fontSize: 15, lineHeight: 1.75, marginBottom: 28 }}>
          This page explains exactly how a tool ends up on Shabelle Hub, how it\u2019s tested, and how the
          star rating and pricing tier shown on every review are determined. For our broader editorial
          principles \u2014 sourcing, corrections, and use of AI in our process \u2014 see our{' '}
          <Link href="/editorial-standards" style={{ color: '#14FFF4' }}>Editorial Standards</Link>.
        </p>

        {/* Selection criteria */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 18, fontWeight: 700, marginBottom: 16, color: '#e8f0ff' }}>
            1. How We Choose Which Tools to Cover
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
            {SELECTION_CRITERIA.map(c => (
              <div key={c.title} style={{ background: '#0f1829', border: '1px solid #1a2d4a', borderRadius: 14, padding: 20 }}>
                <div style={{ fontSize: 22, marginBottom: 10 }} aria-hidden="true">{c.icon}</div>
                <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 15, fontWeight: 700, color: '#e8f0ff', marginBottom: 6 }}>
                  {c.title}
                </h3>
                <p style={{ color: '#6b82a8', fontSize: 13, lineHeight: 1.65 }}>{c.body}</p>
              </div>
            ))}
          </div>
          <p style={{ color: '#6b82a8', fontSize: 13, lineHeight: 1.7, marginTop: 14, opacity: 0.85 }}>
            We currently cover {toolsCount} tools under these criteria. Curated coverage means some popular
            tools may not yet have a page \u2014 not because they failed testing, but because we haven\u2019t
            tested them yet. See our{' '}
            <Link href="/contact" style={{ color: '#14FFF4' }}>Contact page</Link> to suggest one.
          </p>
        </section>

        {/* Testing process */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 18, fontWeight: 700, marginBottom: 16, color: '#e8f0ff' }}>
            2. The Testing Process
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {TESTING_STEPS.map(s => (
              <div key={s.step} style={{ background: '#0f1829', border: '1px solid #1a2d4a', borderRadius: 14, padding: 20, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div aria-hidden="true" style={{
                  width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                  background: 'rgba(20,255,244,0.1)', border: '1px solid rgba(20,255,244,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: 14, color: '#14FFF4',
                }}>
                  {s.step}
                </div>
                <div>
                  <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 15, fontWeight: 700, color: '#e8f0ff', marginBottom: 6 }}>
                    {s.title}
                  </h3>
                  <p style={{ color: '#6b82a8', fontSize: 14, lineHeight: 1.7 }}>{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Rating factors */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 18, fontWeight: 700, marginBottom: 8, color: '#e8f0ff' }}>
            3. How the Star Rating Is Calculated
          </h2>
          <p style={{ color: '#6b82a8', fontSize: 14, lineHeight: 1.7, marginBottom: 16 }}>
            Every tool receives a rating out of 5, weighted across five factors observed during testing:
          </p>
          <div style={{ background: '#0f1829', border: '1px solid #1a2d4a', borderRadius: 14, padding: 4, overflow: 'hidden' }}>
            {RATING_FACTORS.map((f, i) => (
              <div key={f.label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16,
                padding: '16px 18px',
                borderBottom: i < RATING_FACTORS.length - 1 ? '1px solid #1a2d4a' : 'none',
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, color: '#e8f0ff', fontSize: 14, marginBottom: 4 }}>
                    {f.label}
                  </div>
                  <div style={{ color: '#6b82a8', fontSize: 13, lineHeight: 1.6 }}>{f.desc}</div>
                </div>
                <span style={{
                  background: 'rgba(20,255,244,0.08)', color: '#14FFF4',
                  border: '1px solid rgba(20,255,244,0.2)', borderRadius: 8,
                  padding: '4px 10px', fontSize: 13, fontWeight: 700, flexShrink: 0,
                }}>
                  {f.weight}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Rating scale */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 18, fontWeight: 700, marginBottom: 16, color: '#e8f0ff' }}>
            4. What the Score Means
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {RATING_SCALE.map(r => (
              <div key={r.label} style={{ background: '#0f1829', border: '1px solid #1a2d4a', borderRadius: 14, padding: '16px 20px', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{
                  fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: 14, color: '#14FFF4',
                  minWidth: 90,
                }}>
                  {r.range}
                </span>
                <div>
                  <div style={{ fontWeight: 700, color: '#e8f0ff', fontSize: 14, marginBottom: 2 }}>{r.label}</div>
                  <div style={{ color: '#6b82a8', fontSize: 13, lineHeight: 1.6 }}>{r.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing tiers */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 18, fontWeight: 700, marginBottom: 16, color: '#e8f0ff' }}>
            5. What &quot;Free&quot;, &quot;Freemium&quot;, and &quot;Paid&quot; Mean
          </h2>
          <p style={{ color: '#6b82a8', fontSize: 14, lineHeight: 1.7, marginBottom: 16 }}>
            Each tool is tagged with one of three pricing labels, used consistently across the directory,
            category pages, and individual reviews:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
            {PRICING_TIERS.map(t => (
              <div key={t.tag} style={{ background: '#0f1829', border: '1px solid #1a2d4a', borderRadius: 14, padding: 20 }}>
                <span style={{
                  display: 'inline-block', marginBottom: 10,
                  background: 'rgba(20,255,244,0.08)', color: '#14FFF4',
                  border: '1px solid rgba(20,255,244,0.2)', borderRadius: 8,
                  padding: '4px 12px', fontSize: 13, fontWeight: 700,
                }}>
                  {t.label}
                </span>
                <p style={{ color: '#6b82a8', fontSize: 13, lineHeight: 1.65 }}>{t.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Update cadence + limitations */}
        <section style={{
          background: 'linear-gradient(135deg, rgba(20,255,244,0.05), rgba(20,255,244,0.02))',
          border: '1px solid rgba(20,255,244,0.2)', borderRadius: 16, padding: 24,
        }}>
          <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 17, fontWeight: 800, marginBottom: 10, color: '#e8f0ff' }}>
            Updates & Limitations
          </h2>
          <p style={{ color: '#6b82a8', fontSize: 14, lineHeight: 1.75, marginBottom: 12 }}>
            AI tools change pricing, features, and limits frequently \u2014 sometimes within weeks of a
            review going live. We periodically re-test listed tools and update ratings and pricing when
            something has materially changed, but a published date does not guarantee every detail is
            current at the moment you read it. Always confirm current pricing on the provider\u2019s own
            site before subscribing.
          </p>
          <p style={{ color: '#6b82a8', fontSize: 14, lineHeight: 1.75 }}>
            Ratings reflect our team\u2019s testing and judgment and are inherently subjective \u2014 a tool
            scored 4.5 here may suit your specific workflow better than one scored 4.8, or vice versa.
            Use our reviews as one input alongside free trials and your own testing.
          </p>
        </section>
      </div>
    </>
  );
}
