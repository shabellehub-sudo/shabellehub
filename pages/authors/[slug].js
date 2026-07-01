import { NextSeo } from 'next-seo';
import Link from 'next/link';
import { authors, getAuthor } from '../../data/team';
import { tools, blogPosts, siteConfig } from '../../data';
import { getToolSlugsByAuthor, getBlogSlugsByAuthor, getToolMeta, getBlogMeta } from '../../data/eeat-meta';
import { getPersonStructuredData, getProfileBreadcrumbSchema, formatDate } from '../../lib/eeat';
import { PersonAvatar, ExpertiseTags, CompactByline } from '../../components/eeat';
import { StarRating } from '../../components/ui';

export async function getStaticPaths() {
  return {
    paths: authors.map(p => ({ params: { slug: p.slug } })),
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const person = getAuthor(params.slug);
  if (!person) return { notFound: true };

  const authoredToolSlugs = getToolSlugsByAuthor(person.slug);
  const authoredBlogSlugs = getBlogSlugsByAuthor(person.slug);

  const authoredTools = tools
    .filter(t => authoredToolSlugs.includes(t.slug))
    .map(t => ({ ...t, meta: getToolMeta(t.slug) }));

  const authoredPosts = blogPosts
    .filter(p => authoredBlogSlugs.includes(p.slug))
    .map(p => ({ ...p, meta: getBlogMeta(p.slug) }));

  return { props: { person, authoredTools, authoredPosts } };
}

export default function AuthorProfilePage({ person, authoredTools, authoredPosts }) {
  const personSchema = getPersonStructuredData(person);
  const breadcrumbSchema = getProfileBreadcrumbSchema(person, 'authors');

  const title = `${person.name} — ${person.title} | Shabelle Hub Authors`;
  const description = person.shortBio;
  const canonical = `${siteConfig.url}/authors/${person.slug}`;

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
            <li><Link href="/authors" style={{ color: '#6b82a8' }}>Authors</Link></li>
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
            <div style={{ color: '#14FFF4', fontSize: 14, fontWeight: 700 }}>{person.title}</div>
            <div style={{ color: '#6b82a8', fontSize: 13, marginTop: 4 }}>
              📍 {person.location} · At Shabelle Hub since {formatDate(person.joined)}
            </div>
          </div>
        </div>

        {/* Experience & expertise disclosure */}
        <div style={{ background: '#0f1829', border: '1px solid #1a2d4a', borderRadius: 16, padding: 24, marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 17, fontWeight: 700, color: '#e8f0ff', marginBottom: 12 }}>
            About {person.name}
          </h2>
          <p style={{ color: '#6b82a8', fontSize: 14, lineHeight: 1.8, marginBottom: 16 }}>
            {person.bio}
          </p>

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
                <span aria-hidden="true" style={{ color: '#14FFF4', flexShrink: 0 }}>✓</span>{c}
              </li>
            ))}
          </ul>
        </div>

        {/* Reviews written */}
        {authoredTools.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 17, fontWeight: 700, color: '#e8f0ff', marginBottom: 14 }}>
              Reviews by {person.name}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {authoredTools.map(tool => (
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
                      Updated <time dateTime={tool.meta.lastUpdated}>{formatDate(tool.meta.lastUpdated)}</time>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Articles written */}
        {authoredPosts.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 17, fontWeight: 700, color: '#e8f0ff', marginBottom: 14 }}>
              Articles by {person.name}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {authoredPosts.map(post => (
                <Link key={post.slug} href={`/blog/${post.slug}`} style={{ textDecoration: 'none' }}>
                  <article style={{ background: '#0f1829', border: '1px solid #1a2d4a', borderRadius: 12, padding: '14px 18px' }}>
                    <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, color: '#e8f0ff', marginBottom: 6 }}>
                      {post.title}
                    </div>
                    <CompactByline linked={false} lastUpdated={post.meta.lastUpdated} />
                  </article>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div style={{ background: '#0f1829', border: '1px solid #1a2d4a', borderRadius: 14, padding: '16px 20px' }}>
          <p style={{ color: '#6b82a8', fontSize: 13, lineHeight: 1.65 }}>
            All content by {person.name} is fact-checked against primary sources by our editorial team before
            and after publication. Read our{' '}
            <Link href="/editorial-standards" style={{ color: '#14FFF4' }}>Editorial Standards</Link>{' '}
            or see the full{' '}
            <Link href="/team" style={{ color: '#14FFF4' }}>Shabelle Hub team</Link>.
          </p>
        </div>
      </div>
    </>
  );
}
