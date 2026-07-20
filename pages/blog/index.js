// pages/blog/index.js — uses Firebase Admin SDK in getStaticProps
// so ISR/SSG reads bypass Firestore security rules (which block unauthenticated
// client-SDK list queries).  The public-facing React component is unchanged.
import { useState } from 'react';
import { NextSeo } from 'next-seo';
import Link from 'next/link';
import {
  adminListPublishedPosts,
  adminListTags,
  adminListCategories,
} from '../../lib/cms/postsAdmin';

export async function getStaticProps() {
  try {
    const [postsRes, tagsRes, catsRes] = await Promise.all([
      adminListPublishedPosts({ limit: 60 }),
      adminListTags(),
      adminListCategories(),
    ]);

    if (postsRes.error) {
      console.error('[blog/index.js] adminListPublishedPosts failed:', postsRes.error);
    }

    return {
      props: {
        posts:      postsRes.data  || [],
        tags:       tagsRes.data   || [],
        categories: catsRes.data   || [],
        debugError: postsRes.error || null,
      },
      revalidate: 60, // ISR — regenerate every 60 s
    };
  } catch (err) {
    console.error('[blog/index.js] getStaticProps threw:', err.message);
    return { props: { posts: [], tags: [], categories: [], debugError: err.message }, revalidate: 30 };
  }
}

function PostCard({ post, featured = false, categories = [] }) {
  const categoryName = categories.find(c => c.id === post.category_id)?.name || null;
  const pubDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : '';

  return (
    <Link href={`/blog/${post.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
      <article style={{
        background: featured
          ? 'linear-gradient(135deg, rgba(20,255,244,0.05), rgba(20,255,244,0.02))'
          : '#0f1829',
        border: featured ? '1px solid rgba(20,255,244,0.2)' : '1px solid #1a2d4a',
        borderRadius: featured ? 16 : 14,
        padding: featured ? 28 : 22,
        transition: 'border-color 0.2s',
      }}>
        {/* Badges */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {featured && (
            <span style={{ background: '#14FFF4', color: '#080d1a', fontSize: 11, fontWeight: 800, borderRadius: 4, padding: '2px 8px' }}>
              FEATURED
            </span>
          )}
          {categoryName && (
            <span style={{ color: '#14FFF4', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', opacity: featured ? 0.8 : 1 }}>
              {categoryName}
            </span>
          )}
          {pubDate && (
            <>
              <span style={{ opacity: 0.4, fontSize: 11 }} aria-hidden="true">·</span>
              <time dateTime={post.published_at} style={{ color: '#6b82a8', fontSize: 11 }}>{pubDate}</time>
            </>
          )}
          {post.read_time && (
            <>
              <span style={{ opacity: 0.4, fontSize: 11 }} aria-hidden="true">·</span>
              <span style={{ color: '#6b82a8', fontSize: 11 }}>{post.read_time} read</span>
            </>
          )}
        </div>

        <h2 style={{
          fontFamily: 'Space Grotesk, sans-serif',
          fontSize: featured ? 'clamp(18px,4vw,24px)' : 17,
          fontWeight: 800, color: '#e8f0ff',
          marginBottom: 10, lineHeight: 1.3,
        }}>
          {post.title}
        </h2>

        {post.excerpt && (
          <p style={{ color: '#6b82a8', fontSize: featured ? 14 : 13, lineHeight: 1.65, marginBottom: 12 }}>
            {post.excerpt}
          </p>
        )}

        {/* Tags */}
        {post.tags?.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {post.tags.slice(0, 4).map(tag => (
              <span key={tag} style={{ background: 'rgba(20,255,244,0.07)', color: '#14FFF4', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, border: '1px solid rgba(20,255,244,0.15)' }}>
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Author */}
        {post.author_name && (
          <p style={{ fontSize: 12, color: '#6b82a8', marginBottom: 8 }}>
            By <span style={{ color: '#9fb3d4', fontWeight: 600 }}>{post.author_name}</span>
          </p>
        )}

        <span style={{ color: '#14FFF4', fontSize: 13, fontWeight: 600 }}>Read more →</span>
      </article>
    </Link>
  );
}

export default function BlogPage({ posts = [], tags = [], categories = [], debugError = null }) {
  const [activeTag, setActiveTag]   = useState('');
  const [activeCat, setActiveCat]   = useState('');

  const filtered = posts.filter(p => {
    if (activeTag && !p.tags?.includes(activeTag)) return false;
    if (activeCat && p.category_id !== activeCat)  return false;
    return true;
  });

  const featured = filtered.find(p => p.featured && p.category_id !== '9da37474-fd0e-4fff-8931-d0d4afef7ece');
  const rest     = filtered.filter(p => !p.featured);

  return (
    <>
      <NextSeo
        title="AI Tools Blog 2026 — Reviews, Guides & Comparisons"
        description="In-depth AI tool reviews, comparisons, and guides from Shabelle Hub. Learn which AI tools are worth paying for and how to use them effectively."
        canonical="https://shabellehub.com/blog"
        openGraph={{
          title: 'AI Tools Blog 2026 — Reviews, Guides & Comparisons',
          description: 'In-depth AI tool reviews, comparisons, and guides from Shabelle Hub.',
          url: 'https://shabellehub.com/blog',
          type: 'website',
          siteName: 'Shabelle Hub',
          images: [{ url: 'https://shabellehub.com/og-image.png', width: 1200, height: 630, alt: 'Shabelle Hub AI Blog' }],
        }}
        twitter={{ handle: '@shabellehub', site: '@shabellehub', cardType: 'summary_large_image' }}
      />

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 20px' }}>
        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 'clamp(24px,5vw,34px)', fontWeight: 800, marginBottom: 8 }}>
          AI Insights &amp; Reviews
        </h1>
        <p style={{ color: '#6b82a8', fontSize: 15, marginBottom: 28 }}>
          Independent AI tool reviews, comparisons, and guides from Shabelle Hub.
        </p>

        {/* Debug error only shown in dev or if explicitly enabled */}
        {process.env.NODE_ENV !== 'production' && debugError && (
          <div style={{ background: 'rgba(255,77,109,0.1)', border: '1px solid #ff4d6d', borderRadius: 10, padding: 14, marginBottom: 20, color: '#ff8fa3', fontSize: 13, fontFamily: 'monospace' }}>
            DEBUG — listPublishedPosts error: {debugError}
          </div>
        )}

        {/* ── Filters ── */}
        {(categories.length > 0 || tags.length > 0) && (
          <div style={{ marginBottom: 28 }}>
            {categories.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                <button onClick={() => setActiveCat('')} style={filterBtn(activeCat === '')}>All</button>
                {categories.map(c => (
                  <button key={c.id} onClick={() => setActiveCat(activeCat === c.id ? '' : c.id)} style={filterBtn(activeCat === c.id)}>
                    {c.name}
                  </button>
                ))}
              </div>
            )}
            {tags.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {tags.map(t => (
                  <button key={t.slug} onClick={() => setActiveTag(activeTag === t.slug ? '' : t.slug)} style={tagBtn(activeTag === t.slug)}>
                    #{t.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Featured ── */}
        {featured && (
          <div style={{ marginBottom: 24 }}>
            <PostCard post={featured} featured categories={categories} />
          </div>
        )}

        {/* ── Post list ── */}
        {rest.length === 0 && !featured ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#6b82a8' }}>
            {activeTag || activeCat ? 'No posts match this filter.' : 'No posts published yet.'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {rest.map(post => <PostCard key={post.id} post={post} categories={categories} />)}
          </div>
        )}
      </div>
    </>
  );
}

function filterBtn(active) {
  return {
    padding: '6px 14px', borderRadius: 20, fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
    border: active ? '1px solid #14FFF4' : '1px solid #2a3d5c',
    background: active ? 'rgba(20,255,244,0.1)' : 'transparent',
    color: active ? '#14FFF4' : '#9fb3d4',
    transition: 'all 0.12s',
  };
}

function tagBtn(active) {
  return {
    padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
    border: active ? '1px solid rgba(20,255,244,0.5)' : '1px solid rgba(20,255,244,0.15)',
    background: active ? 'rgba(20,255,244,0.12)' : 'rgba(20,255,244,0.04)',
    color: '#14FFF4',
    transition: 'all 0.12s',
  };
}
