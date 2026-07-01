// pages/blog/tag/[tag].js — Public tag archive page
// FIXED: Uses Firebase Admin SDK in getStaticProps/getStaticPaths to bypass
// Firestore security rules (unauthenticated client-SDK queries were denied).
import { NextSeo } from 'next-seo';
import Link from 'next/link';
import {
  adminListTags,
  adminListPublishedPosts,
} from '../../../lib/cms/postsAdmin';
import { getTagBySlug } from '../../../lib/cms/tags';

export async function getStaticPaths() {
  try {
    const { data: tags } = await adminListTags();
    return {
      paths: (tags || []).map(t => ({ params: { tag: t.slug } })),
      fallback: 'blocking',
    };
  } catch {
    return { paths: [], fallback: 'blocking' };
  }
}

export async function getStaticProps({ params }) {
  try {
    // getTagBySlug reads /tags collection which has allow read: if true
    // so client SDK is fine here; posts use Admin SDK.
    const [tagRes, postsRes] = await Promise.all([
      getTagBySlug(params.tag),
      adminListPublishedPosts({ tagSlug: params.tag, limit: 50 }),
    ]);
    if (!tagRes.data) return { notFound: true };
    return {
      props: { tag: tagRes.data, posts: postsRes.data || [] },
      revalidate: 60,
    };
  } catch {
    return { notFound: true };
  }
}

export default function TagArchivePage({ tag, posts }) {
  const title = `#${tag.name} — Shabelle Hub Blog`;
  const desc  = `All Shabelle Hub blog posts tagged with "${tag.name}". AI tool reviews, guides and comparisons.`;

  return (
    <>
      <NextSeo
        title={title}
        description={desc}
        canonical={`https://shabellehub.com/blog/tag/${tag.slug}`}
        openGraph={{ title, description: desc, url: `https://shabellehub.com/blog/tag/${tag.slug}`, type: 'website' }}
      />

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 20px' }}>
        {/* Breadcrumb */}
        <nav style={{ fontSize: 12, color: '#6b82a8', marginBottom: 20 }}>
          <Link href="/" style={{ color: '#6b82a8', textDecoration: 'none' }}>Home</Link>
          <span style={{ margin: '0 6px' }}>›</span>
          <Link href="/blog" style={{ color: '#6b82a8', textDecoration: 'none' }}>Blog</Link>
          <span style={{ margin: '0 6px' }}>›</span>
          <span>#{tag.name}</span>
        </nav>

        <div style={{ marginBottom: 28 }}>
          <span style={{ background: 'rgba(20,255,244,0.1)', color: '#14FFF4', fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20, border: '1px solid rgba(20,255,244,0.2)' }}>
            #{tag.name}
          </span>
        </div>

        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 'clamp(22px,5vw,32px)', fontWeight: 800, marginBottom: 8, color: '#e8f0ff' }}>
          Posts tagged &quot;{tag.name}&quot;
        </h1>
        <p style={{ color: '#6b82a8', fontSize: 14, marginBottom: 32 }}>
          {posts.length} {posts.length === 1 ? 'post' : 'posts'} found
        </p>

        {posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#6b82a8' }}>
            No posts with this tag yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {posts.map(post => {
              const pubDate = post.published_at
                ? new Date(post.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                : '';
              return (
                <Link key={post.id} href={`/blog/${post.slug}`} style={{ textDecoration: 'none' }}>
                  <article style={{ background: '#0f1829', border: '1px solid #1a2d4a', borderRadius: 14, padding: 22, transition: 'border-color 0.2s' }}>
                    {pubDate && (
                      <time dateTime={post.published_at} style={{ fontSize: 11, color: '#6b82a8', display: 'block', marginBottom: 8 }}>
                        {pubDate}
                      </time>
                    )}
                    <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 17, fontWeight: 700, color: '#e8f0ff', marginBottom: 8, lineHeight: 1.35 }}>
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p style={{ color: '#6b82a8', fontSize: 13, lineHeight: 1.6, marginBottom: 10 }}>
                        {post.excerpt}
                      </p>
                    )}
                    <span style={{ color: '#14FFF4', fontSize: 13, fontWeight: 600 }}>Read more →</span>
                  </article>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
