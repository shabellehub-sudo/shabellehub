import { NextSeo } from 'next-seo';
import Link from 'next/link';
import { reviewers } from '../../data/team';
import { siteConfig } from '../../data';
import { PageTitle } from '../../components/ui';
import { ReviewerCard } from '../../components/eeat';

export default function ReviewersIndexPage() {
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteConfig.url },
      { '@type': 'ListItem', position: 2, name: 'Our Team', item: `${siteConfig.url}/team` },
      { '@type': 'ListItem', position: 3, name: 'Reviewers', item: `${siteConfig.url}/reviewers` },
    ],
  };

  return (
    <>
      <NextSeo
        title="Our Reviewers — Shabelle Hub"
        description="Meet the editors and fact-checkers who verify every claim on Shabelle Hub before and after publication."
        canonical={`${siteConfig.url}/reviewers`}
        openGraph={{
          title: 'Our Reviewers — Shabelle Hub',
          description: 'Meet the editors and fact-checkers who verify every claim on Shabelle Hub.',
          url: `${siteConfig.url}/reviewers`,
          type: 'website',
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
            <li><span style={{ color: '#e8f0ff' }} aria-current="page">Reviewers</span></li>
          </ol>
        </nav>

        <PageTitle sub="Every page on Shabelle Hub is independently fact-checked by a named editor before and after publication.">
          Reviewers
        </PageTitle>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
          {reviewers.map(person => (
            <ReviewerCard key={person.slug} person={person} />
          ))}
        </div>
      </div>
    </>
  );
}
