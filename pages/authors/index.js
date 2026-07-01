import { NextSeo } from 'next-seo';
import Link from 'next/link';
import { authors } from '../../data/team';
import { siteConfig } from '../../data';
import { PageTitle } from '../../components/ui';
import { AuthorCard } from '../../components/eeat';

export default function AuthorsIndexPage() {
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteConfig.url },
      { '@type': 'ListItem', position: 2, name: 'Our Team', item: `${siteConfig.url}/team` },
      { '@type': 'ListItem', position: 3, name: 'Authors', item: `${siteConfig.url}/authors` },
    ],
  };

  return (
    <>
      <NextSeo
        title="Our Authors — Shabelle Hub"
        description="Meet the writers and analysts behind Shabelle Hub's AI tool reviews and guides, with their backgrounds and areas of expertise."
        canonical={`${siteConfig.url}/authors`}
        openGraph={{
          title: 'Our Authors — Shabelle Hub',
          description: "Meet the writers and analysts behind Shabelle Hub's AI tool reviews and guides.",
          url: `${siteConfig.url}/authors`,
          type: 'website',
          siteName: 'Shabelle Hub',
          images: [{ url: 'https://shabellehub.com/og-image.png', width: 1200, height: 630, alt: 'Shabelle Hub Authors' }],
        }}
        twitter={{ handle: '@shabellehub', site: '@shabellehub', cardType: 'summary_large_image' }}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 20px' }}>
        <nav aria-label="Breadcrumb" style={{ fontSize: 13, color: '#6b82a8', marginBottom: 16 }}>
          <ol style={{ listStyle: 'none', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            <li><Link href="/" style={{ color: '#6b82a8' }}>Home</Link></li>
            <li aria-hidden="true" style={{ margin: '0 4px' }}>›</li>
            <li><Link href="/team" style={{ color: '#6b82a8' }}>Our Team</Link></li>
            <li aria-hidden="true" style={{ margin: '0 4px' }}>›</li>
            <li><span style={{ color: '#e8f0ff' }} aria-current="page">Authors</span></li>
          </ol>
        </nav>

        <PageTitle sub="Every review and guide on Shabelle Hub has a named author with disclosed experience and expertise.">
          Authors
        </PageTitle>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
          {authors.map(person => (
            <AuthorCard key={person.slug} person={person} />
          ))}
        </div>
      </div>
    </>
  );
}
