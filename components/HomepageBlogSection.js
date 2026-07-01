// components/HomepageBlogSection.js
// Drop-in component for pages/index.js — shows featured + recent blog posts from Firestore.
// Usage in getStaticProps: import { getHomepageBlogProps } from '../lib/cms/posts'
// Then pass { featuredPosts, recentPosts } as props to your page.

import Link from 'next/link';

function MiniCard({ post }) {
  const pubDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';
  return (
    <Link href={`/blog/${post.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
      <article style={{
        background: '#0f1829', border: '1px solid #1a2d4a', borderRadius: 12, padding: 18,
        transition: 'border-color 0.2s', height: '100%', boxSizing: 'border-box',
      }}>
        {post.category_name && (
          <span style={{ color: '#14FFF4', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 8 }}>
            {post.category_name}
          </span>
        )}
        <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 14.5, fontWeight: 700, color: '#e8f0ff', lineHeight: 1.35, marginBottom: 8 }}>
          {post.title}
        </h3>
        {post.excerpt && (
          <p style={{ color: '#6b82a8', fontSize: 12.5, lineHeight: 1.6, marginBottom: 10,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {post.excerpt}
          </p>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {pubDate && <time dateTime={post.published_at} style={{ fontSize: 11, color: '#6b82a8' }}>{pubDate}</time>}
          <span style={{ color: '#14FFF4', fontSize: 12, fontWeight: 600 }}>Read →</span>
        </div>
      </article>
    </Link>
  );
}

function FeaturedCard({ post }) {
  const pubDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : '';
  return (
    <Link href={`/blog/${post.slug}`} style={{ textDecoration: 'none', display: 'block', marginBottom: 24 }}>
      <article style={{
        background: 'linear-gradient(135deg, rgba(20,255,244,0.06), rgba(20,255,244,0.02))',
        border: '1px solid rgba(20,255,244,0.2)', borderRadius: 16, padding: 26,
        transition: 'border-color 0.2s',
      }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ background: '#14FFF4', color: '#080d1a', fontSize: 10, fontWeight: 800, borderRadius: 4, padding: '2px 8px' }}>
            FEATURED
          </span>
          {post.tags?.slice(0, 2).map(tag => (
            <span key={tag} style={{ color: '#14FFF4', fontSize: 10, fontWeight: 600, opacity: 0.7 }}>#{tag}</span>
          ))}
        </div>
        <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 'clamp(16px,3vw,20px)', fontWeight: 800, color: '#e8f0ff', lineHeight: 1.3, marginBottom: 10 }}>
          {post.title}
        </h3>
        {post.excerpt && (
          <p style={{ color: '#6b82a8', fontSize: 13.5, lineHeight: 1.65, marginBottom: 12 }}>
            {post.excerpt}
          </p>
        )}
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', color: '#6b82a8', fontSize: 12 }}>
          {post.author_name && <span>By <strong style={{ color: '#9fb3d4' }}>{post.author_name}</strong></span>}
          {pubDate && <time dateTime={post.published_at}>{pubDate}</time>}
          <span style={{ marginLeft: 'auto', color: '#14FFF4', fontWeight: 600 }}>Read more →</span>
        </div>
      </article>
    </Link>
  );
}

export default function HomepageBlogSection({ featuredPosts = [], recentPosts = [] }) {
  if (featuredPosts.length === 0 && recentPosts.length === 0) return null;

  return (
    <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px 60px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 'clamp(18px,3vw,24px)', fontWeight: 800, color: '#e8f0ff', margin: 0 }}>
          Latest from the Blog
        </h2>
        <Link href="/blog" style={{ color: '#14FFF4', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
          View all →
        </Link>
      </div>

      {/* Featured */}
      {featuredPosts[0] && <FeaturedCard post={featuredPosts[0]} />}

      {/* Recent grid */}
      {recentPosts.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 16,
        }}>
          {recentPosts.slice(0, 3).map(post => (
            <MiniCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </section>
  );
}

// ── Server-side helper ────────────────────────────────────────────────────────
// Import this in getStaticProps of pages/index.js:
//
//   import { getHomepageBlogProps } from '../lib/cms/homepageBlog';
//   const blogProps = await getHomepageBlogProps();
//   return { props: { ...otherProps, ...blogProps }, revalidate: 60 };
