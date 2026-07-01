import { NextSeo } from 'next-seo';
import Link from 'next/link';
import { siteConfig } from '../data';
import { PageTitle } from '../components/ui';

const SECTIONS = [
  {
    title: 'Advertising on Shabelle Hub',
    body: 'Shabelle Hub may display advertisements provided by Google AdSense and other third-party advertising networks. These ads help support the cost of researching, testing, and writing the independent AI tool reviews and guides published on this site.',
  },
  {
    title: 'Ads Are Separate From Our Editorial Content',
    body: 'Advertisements are visually distinguished from editorial content and are not written, reviewed, or approved by our editorial team. No advertiser \u2014 including companies whose tools we review \u2014 has any influence over our ratings, rankings, rankings order, or written opinions. An ad appearing alongside a review does not imply endorsement of the advertiser by Shabelle Hub, nor does it imply that the advertised product was reviewed.',
  },
  {
    title: 'How Third-Party Vendors Use Cookies',
    body: "Third-party vendors, including Google, use cookies and similar technologies to serve ads based on a visitor's prior visits to this and other websites. Google's use of advertising cookies enables it and its partners to serve ads to visitors based on their visit to this site and/or other sites on the internet.",
  },
  {
    title: 'Your Choices: Opting Out of Personalized Ads',
    body: "Visitors can opt out of the use of cookies for personalized advertising by visiting Google's Ads Settings. Alternatively, visitors can opt out of a third-party vendor's use of cookies for personalized advertising by visiting www.aboutads.info. Most browsers also allow you to block or delete cookies entirely, though this may affect other site functionality.",
  },
  {
    title: 'Children\u2019s Privacy',
    body: 'This site is not directed at children under 13, and we do not knowingly collect personal information from children. If we become aware that a child under 13 has provided us with personal information, we will take steps to delete such information.',
  },
  {
    title: 'Relationship to Affiliate Links',
    body: 'Display advertising is separate from the affiliate links that appear within our reviews and articles (for example, "Try Free" or "Visit" buttons). For details on those relationships, see our Affiliate Disclosure.',
  },
  {
    title: 'Questions',
    body: 'If you have questions about advertising on Shabelle Hub or how to opt out of personalized ads, contact us via the Contact page.',
  },
];

export default function AdvertisingDisclosurePage() {
  const canonical = `${siteConfig.url}/advertising-disclosure`;
  const title = 'Advertising Disclosure — Shabelle Hub';
  const description = 'How Shabelle Hub uses Google AdSense and third-party advertising, how ads relate to our editorial content, and how to control ad personalization.';

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteConfig.url },
      { '@type': 'ListItem', position: 2, name: 'Advertising Disclosure', item: canonical },
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
            <li><span style={{ color: '#e8f0ff' }} aria-current="page">Advertising Disclosure</span></li>
          </ol>
        </nav>

        <PageTitle sub="Last updated June 12, 2026 — how ads work on Shabelle Hub and how they relate to our editorial content.">
          Advertising Disclosure
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
            Related: read our{' '}
            <Link href="/affiliate-disclosure" style={{ color: '#14FFF4' }}>Affiliate Disclosure</Link>,{' '}
            <Link href="/privacy" style={{ color: '#14FFF4' }}>Privacy Policy</Link>, or our full{' '}
            <Link href="/site-transparency" style={{ color: '#14FFF4' }}>Site Transparency</Link> overview.
          </p>
        </div>
      </div>
    </>
  );
}
