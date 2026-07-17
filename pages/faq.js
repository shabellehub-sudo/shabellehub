import { NextSeo } from 'next-seo';
import { getFaqs } from '../data/faqs';
import { getToolCounts } from '../lib/cms/tools';
import { tools as staticTools } from '../data';

// Supabase-backed counts — falls back to the static bundle if the DB
// fetch failed, same fail-soft pattern used site-wide.
export async function getStaticProps() {
  let toolsCount;
  let categoriesCount;
  try {
    const countsRes = await getToolCounts();
    if (!countsRes.error && countsRes.data.published) {
      toolsCount = countsRes.data.published;
    } else {
      toolsCount = staticTools.length;
    }
  } catch {
    toolsCount = staticTools.length;
  }
  categoriesCount = new Set(staticTools.map(t => t.category).filter(Boolean)).size;

  return { props: { toolsCount, categoriesCount }, revalidate: 300 };
}

export default function FAQPage({ toolsCount, categoriesCount }) {
  const FAQS = getFaqs({ toolsCount, categoriesCount });

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <>
      <NextSeo
        title="Frequently Asked Questions"
        description="Answers to common questions about Shabelle Hub's AI tool reviews, our testing process, and editorial independence."
        canonical="https://shabellehub.com/faq"
        openGraph={{
          title: 'FAQ — Shabelle Hub',
          description: 'Answers to common questions about Shabelle Hub — how we review AI tools, our editorial standards, and how to use the directory.',
          url: 'https://shabellehub.com/faq',
          type: 'website',
          siteName: 'Shabelle Hub',
          images: [{ url: 'https://shabellehub.com/og-image.png', width: 1200, height: 630, alt: 'FAQ — Shabelle Hub' }],
        }}
        twitter={{ handle: '@shabellehub', site: '@shabellehub', cardType: 'summary_large_image' }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '36px 20px' }}>
        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 28, fontWeight: 800, marginBottom: 32 }}>
          Frequently Asked Questions
        </h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {FAQS.map((f, i) => (
            <div key={i} style={{ background: '#0f1829', border: '1px solid #1a2d4a', borderRadius: 14, padding: 20 }}>
              <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 15, fontWeight: 700, marginBottom: 8, color: '#e8f0ff' }}>
                {f.q}
              </h2>
              <p style={{ color: '#6b82a8', fontSize: 14, lineHeight: 1.7 }}>{f.a}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
