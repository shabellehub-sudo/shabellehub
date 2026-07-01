import { NextSeo } from 'next-seo';
import Link from 'next/link';
import { reviewers, getReviewer } from '../../data/team';
import { tools, blogPosts, siteConfig } from '../../data';
import { getToolSlugsByReviewer, getBlogSlugsByReviewer, getToolMeta, getBlogMeta } from '../../data/eeat-meta';
import { getPersonStructuredData, getProfileBreadcrumbSchema, formatDate } from '../../lib/eeat';
import { PersonAvatar, ExpertiseTags, CompactByline } from '../../components/eeat';
import { StarRating } from '../../components/ui';

export async function getStaticPaths() {
  return {
    paths: reviewers.map(p => ({ params: { slug: p.slug } })),
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const person = getReviewer(params.slug);
  if (!person) return { notFound: true };

  const reviewedToolSlugs = getToolSlugsByReviewer(person.slug);
  const reviewedBlogSlugs = getBlogSlugsByReviewer(person.slug);

  const reviewedTools = tools
    .filter(t => reviewedToolSlugs.includes(t.slug))
    .map(t => ({ ...t, meta: getToolMeta(t.slug) }));

  const reviewedPosts = blogPosts
    .filter(p => reviewedBlogSlugs.includes(p.slug))
    .map(p => ({ ...p, meta: getBlogMeta(p.slug) }));

  return { props: { person, reviewedTools, reviewedPosts } };
}

export default function ReviewerProfilePage({ person, reviewedTools, reviewedPosts }) {
  const personSchema = getPersonStructuredData(person);
  const breadcrumbSchema = getProfileBreadcrumbSchema(person, 'reviewers');

  const title = `${person.name} — ${person.title} | Shabelle Hub Reviewers`;
  const description = person.shortBio;
  const canonical = `${siteConfig.url}/reviewers/${person.slug}`;

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
          type: 'profile',
          siteName: 'Shabelle Hub',
          images: [{ url: 'https://shabellehub.com/og-image.png', width: 1200, height: 630, alt: title }],
        }}
        twitter={{ handle: '@shabellehub', site: '@shabellehub', cardType: 'summary_large_image' }}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 20px' }}>
        <nav aria-label="Breadcrumb" style={{ fontSize: 13, color: '#6b82a8', marginBottom: 24 }}>
          <ol style={{ listStyle: 'none', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            <li><Link href="/" style={{ color: '#6b82a8' }}>Home</Link></li>
            <li aria-hidden="true" style={{ margin: '0 4px' }}>›</li>
            <li><Link href="/reviewers" style={{ color: '#6b82a8' }}>Reviewers</Link></li>
            <li aria-hidden="true" style={{ margin: '0 4px' }}>›</li>
            <li><span style={{ color: '#e8f0ff' }} aria-current="page">{person.name}</span></li>
          </ol>
        </nav>

        {/* Header */}
        <div style={{ display: 'flex', gap: 18, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
          <PersonAvatar person={person} size={72} />
          <div>
            <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 'clamp(22px,5vw,30px)', fontWeight: 800, color: '#e8f0ff' }}>
              {person.name}
            </h1>
            <div style={{ color: '#00d084', fontSize: 14, fontWeight: 700 }}>{person.title}</div>
            <div style={{ color: '#6b82a8', fontSize: 13, marginTop: 4 }}>
              📍 {person.location} · At Shabelle Hub since {formatDate(person.joined)}
            </div>
          </div>
        </div>

        {/* Review transparency / role disclosure */}
        <div style={{ background: '#0f1829', border: '1px solid #1a2d4a', borderRadius: 16, padding: 24, marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 17, fontWeight: 700, color: '#e8f0ff', marginBottom: 12 }}>
            About {person.name}
          </h2>
          <p style={{ color: '#6b82a8', fontSize: 14, lineHeight: 1.8, marginBottom: 16 }}>
            {person.bio}
          </p>

          <div style={{
            background: 'rgba(0,208,132,0.06)', border: '1px solid rgba(0,208,132,0.2)',
            borderRadius: 10, padding: '12px 16px', marginBottom: 16,
          }}>
            <p style={{ color: '#6b82a8', fontSize: 13, lineHeight: 1.6 }}>
              <strong style={{ color: '#00d084' }}>Role disclosure:</strong> As a reviewer, {person.name.split(' ')[0]}{' '}
              verifies factual claims — pricing, features, and limits — against each provider&rsquo;s own sources.
              Ratings and editorial opinions are produced by the listed author, not the reviewer. See our{' '}
              <Link href="/review-methodology" style={{ color: '#00d084' }}>Review Methodology</Link> for the full process.
            </p>
          </div>

          <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 13, fontWeight: 800, color: '#e8f0ff', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
            Areas of Expertise
          </h3>
          <div style={{ marginBottom: 16 }}>
            <ExpertiseTags items={person.expertise} size={12} />
          </div>

          <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 13, fontWeight: 800, color: '#e8f0ff', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
            Experience & Credentials
          </h3>
          <ul style={{ listStyle: 'none' }}>
            {person.credentials.map((c, i) => (
              <li key={i} style={{ color: '#6b82a8', fontSize: 14, display: 'flex', gap: 8, marginBottom: 6 }}>
                <span aria-hidden="true" style={{ color: '#00d084', flexShrink: 0 }}>✓</span>{c}
              </li>
            ))}
          </ul>
        </div>

        {/* Tool reviews verified */}
        {reviewedTools.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 17, fontWeight: 700, color: '#e8f0ff', marginBottom: 14 }}>
              Reviews Verified by {person.name}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {reviewedTools.map(tool => (
                <Link key={tool.slug} href={`/tools/${tool.slug}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: '#0f1829', border: '1px solid #1a2d4a', borderRadius: 12,
                    padding: '14px 18px', display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', gap: 14, flexWrap: 'wrap',
                  }}>
                    <div>
                      <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, color: '#e8f0ff', marginBottom: 4 }}>
                        {tool.name} Review
                      </div>
                      <StarRating rating={tool.rating} size={12} />
                    </div>
                    <span style={{ color: '#6b82a8', fontSize: 12 }}>
                      Verified <time dateTime={tool.meta.lastReviewed}>{formatDate(tool.meta.lastReviewed)}</time>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Articles verified */}
        {reviewedPosts.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 17, fontWeight: 700, color: '#e8f0ff', marginBottom: 14 }}>
              Articles Verified by {person.name}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {reviewedPosts.map(post => (
                <Link key={post.slug} href={`/blog/${post.slug}`} style={{ textDecoration: 'none' }}>
                  <article style={{ background: '#0f1829', border: '1px solid #1a2d4a', borderRadius: 12, padding: '14px 18px' }}>
                    <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, color: '#e8f0ff', marginBottom: 6 }}>
                      {post.title}
                    </div>
                    <CompactByline linked={false} lastUpdated={post.meta.lastReviewed} />
                  </article>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div style={{ background: '#0f1829', border: '1px solid #1a2d4a', borderRadius: 14, padding: '16px 20px' }}>
          <p style={{ color: '#6b82a8', fontSize: 13, lineHeight: 1.65 }}>
            Want to know how our editorial process works end-to-end? Read our{' '}
            <Link href="/editorial-standards" style={{ color: '#14FFF4' }}>Editorial Standards</Link>{' '}
            or see the full{' '}
            <Link href="/team" style={{ color: '#14FFF4' }}>Shabelle Hub team</Link>.
          </p>
        </div>
      </div>
    </>
  );
}
