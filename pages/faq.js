import { NextSeo } from 'next-seo';
import { toolsCount, categoriesCount } from '../data';

const FAQS = [
  {
    q: 'How does Shabelle Hub choose which AI tools to review?',
    a: `We focus on AI tools that are widely used or solve a clear, common problem — general assistants, coding tools, image and video generation, research tools, voice AI, and productivity add-ons. We currently cover ${toolsCount} tools across ${categoriesCount} categories, and we're adding more as we test them.`,
  },
  {
    q: 'Are your reviews really independent?',
    a: 'Yes. We do not accept payment for inclusion or for positive coverage. Some of our links are affiliate links, which means we may earn a commission if you sign up through them — but this never determines which tools we cover or how we rate them. See our Affiliate Disclosure for full details.',
  },
  {
    q: 'How do you test each tool?',
    a: 'Every tool is signed up for and used hands-on across realistic tasks relevant to its category. We test the free tier where one exists, then the paid tier, and note specific strengths and limitations we encounter. Ratings reflect this testing, not vendor marketing claims.',
  },
  {
    q: 'How often is content updated?',
    a: 'AI tools change quickly — pricing, features, and limits can shift with little notice. We aim to revisit and update our reviews periodically, but always check the provider\'s official site for the most current pricing before subscribing.',
  },
  {
    q: 'Do you offer a free newsletter?',
    a: 'Yes — you can subscribe from the homepage or footer to get updates when we publish new reviews and comparisons.',
  },
  {
    q: 'I think a review is inaccurate or outdated. How can I let you know?',
    a: 'Please use our Contact page to let us know. We review all feedback and update pages when something has genuinely changed.',
  },
  {
    q: 'Can I suggest a tool for you to review?',
    a: 'Absolutely — send suggestions through the Contact page. We can\'t review everything, but we do prioritize tools that readers ask about most.',
  },
];

export default function FAQPage() {
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
