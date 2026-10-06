import { NextSeo } from 'next-seo';
import Link from 'next/link';
import { siteConfig } from '../data';
import { PageTitle } from '../components/ui';

const SECTIONS = [
  {
    title: 'Advertising Status',
    body: 'Shabelle Hub currently does not display third-party advertisements. Our current monetization may include affiliate commissions from qualifying tool sign-ups, as described in our Affiliate Disclosure.',
  },
  {
    title: 'If Display Advertising Is Introduced',
    body: 'Advertisements are visually distinguished from editorial content and are not written, reviewed, or approved by our editorial team. No advertiser \u2014 including companies whose tools we review \u2014 has any influence over our ratings, rankings, ranking order, or written opinions. An ad appearing alongside a review does not imply endorsement of the advertiser by Shabelle Hub, nor does it imply that the advertised product was reviewed.',
  },
  {
    title: 'Third-Party Advertising Cookies',
    body: 'Shabelle Hub currently does not use third-party advertising cookies to serve display advertisements. Any future advertising technology will be disclosed here when introduced.'
  },
  {
    title: 'Advertising Choices',
    body: 'Because Shabelle Hub currently does not display third-party advertisements, there are no Shabelle Hub advertising cookies to opt out of. Browser privacy and cookie controls remain available for other site functionality.'
  },
  {
    title: 'Children\u2019s Privacy',
    body: 'This site is not directed at children under 13, and we do not knowingly collect personal information from children. If we become aware that a child under 13 has provided us with personal information, we will take steps to delete such information.',
  },
  {
    title: 'Relationship to Affiliate Links',
    body: 'Affiliate links may appear within our reviews and articles, such as "Try Free" or "Visit" buttons. These links are separate from display advertising. For details on affiliate relationships, see our Affiliate Disclosure.',
  },
  {
    title: 'Questions',
    body: 'If you have questions about advertising or affiliate relationships on Shabelle Hub, contact us via the Contact page.',
  },
];

export default function AdvertisingDisclosurePage() {
  const canonical = `${siteConfig.url}/advertising-disclosure`;
  const title = 'Advertising Disclosure — Shabelle Hub';
  const description = 'Shabelle Hub advertising status, affiliate relationships, and our separation of monetization from editorial ratings and opinions.';

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
        <nav aria-label="Breadcrumb" style={{ fontSize: 13, color: '#8ba3ca', marginBottom: 16 }}>
          <ol style={{ listStyle: 'none', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            <li><Link href="/" style={{ color: '#8ba3ca' }}>Home</Link></li>
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
              <p style={{ color: '#8ba3ca', fontSize: 14, lineHeight: 1.75 }}>{s.body}</p>
            </div>
          ))}
        </div>

        <div style={{ background: '#0f1829', border: '1px solid #1a2d4a', borderRadius: 14, padding: '16px 20px' }}>
          <p style={{ color: '#8ba3ca', fontSize: 13, lineHeight: 1.65 }}>
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
