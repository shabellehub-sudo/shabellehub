import { NextSeo } from 'next-seo';
import Link from 'next/link';

const SECTIONS = [
  {
    title: 'Acceptance of Terms',
    body: 'By accessing or using Shabelle Hub, you agree to these Terms of Service. If you do not agree, please do not use the site.',
  },
  {
    title: 'Use of Content',
    body: 'All reviews, ratings, articles, and other content on Shabelle Hub are provided for informational purposes only. You may read, share, and link to our content, but you may not republish, reproduce, or redistribute substantial portions of our articles without prior written permission.',
  },
  {
    title: 'No Professional Advice',
    body: 'Content on this site reflects our own hands-on testing and opinions. It is not professional, legal, financial, or technical advice. Always evaluate any AI tool against your own requirements, data-handling policies, and applicable regulations before adopting it, especially for business or sensitive use cases.',
  },
  {
    title: 'Accuracy of Information',
    body: 'We make a genuine effort to keep tool pricing, features, and ratings accurate and up to date, but third-party products change frequently and without notice. Always verify current pricing and features on the provider\'s official website before making a purchase decision.',
  },
  {
    title: 'Third-Party Links and Affiliate Relationships',
    body: 'Shabelle Hub contains links to third-party websites, including affiliate links. We are not responsible for the content, policies, or practices of any third-party site. See our Affiliate Disclosure for details on how affiliate links work.',
  },
  {
    title: 'Limitation of Liability',
    body: 'Shabelle Hub is provided "as is" without warranties of any kind. We are not liable for any losses or damages arising from your use of this site, your reliance on its content, or your use of any third-party tool reviewed here.',
  },
  {
    title: 'Changes to These Terms',
    body: 'We may update these Terms of Service from time to time. Continued use of the site after changes are posted constitutes acceptance of the revised terms.',
  },
  {
    title: 'Contact',
    body: 'Questions about these terms? Reach out via our Contact page.',
  },
];

export default function TermsPage() {
  return (
    <>
      <NextSeo
        title="Terms of Service"
        description="Terms of Service for Shabelle Hub — the rules and disclaimers that apply when using our AI tool reviews and content."
        canonical="https://shabellehub.com/terms"
        openGraph={{ title: 'Terms of Service — Shabelle Hub', description: 'Shabelle Hub terms of service — the conditions that govern your use of this site.', url: 'https://shabellehub.com/terms', type: 'website', siteName: 'Shabelle Hub', images: [{ url: 'https://shabellehub.com/og-image.png', width: 1200, height: 630, alt: 'Terms of Service — Shabelle Hub' }] }}
        twitter={{ handle: '@shabellehub', site: '@shabellehub', cardType: 'summary_large_image' }}
      />
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '36px 20px' }}>
        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 28, fontWeight: 800, marginBottom: 12 }}>
          Terms of Service
        </h1>
        <p style={{ color: '#6b82a8', fontSize: 13, marginBottom: 32 }}>
          Last updated: June 2026
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {SECTIONS.map((s, i) => (
            <div key={i}>
              <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 16, fontWeight: 700, marginBottom: 8, color: '#e8f0ff' }}>
                {s.title}
              </h2>
              <p style={{ color: '#6b82a8', fontSize: 14, lineHeight: 1.7 }}>{s.body}</p>
            </div>
          ))}
        </div>
        <p style={{ color: '#6b82a8', fontSize: 13, marginTop: 32 }}>
          See also our <Link href="/privacy" style={{ color: '#14FFF4' }}>Privacy Policy</Link> and{' '}
          <Link href="/affiliate-disclosure" style={{ color: '#14FFF4' }}>Affiliate Disclosure</Link>.
        </p>
      </div>
    </>
  );
}
