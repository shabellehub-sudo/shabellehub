import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { NextSeo } from 'next-seo';
import { tools, blogPosts, toolsCount, categoriesCount, avgRating } from '../data';
import { getOrganizationStructuredData, getWebsiteStructuredData } from '../lib/seo';
import { ToolCard, NewsletterForm, Section } from '../components/ui';
import { TransparencyNotice } from '../components/compliance';
import AdSlot from '../components/AdSlot';
import NewsletterSignupForm from '../components/newsletter/SignupForm';
import { getHomepageBlogProps } from '../lib/cms/homepageBlog';

export async function getStaticProps() {
  try {
    const blogProps = await getHomepageBlogProps();
    return { props: { ...blogProps }, revalidate: 60 };
  } catch {
    return { props: { featuredPosts: [], recentPosts: [] }, revalidate: 30 };
  }
}

export default function HomePage({ favorites = [], toggleFavorite, featuredPosts = [], recentPosts = [] }) {
  // Merge Firestore posts with static fallback — Firestore takes priority
  const livePosts = [...featuredPosts, ...recentPosts];
  const displayPosts = livePosts.length > 0 ? livePosts : blogPosts;
  const [query, setQuery] = useState('');
  const router = useRouter();

  const featuredTools = tools.filter(t => t.featured);

  const handleSearch = () => {
    const q = query.trim();
    if (q) router.push(`/tools?q=${encodeURIComponent(q)}`);
  };

  return (
    <>
      {/* FIX #8/#18: title does NOT include '| Shabelle Hub' — titleTemplate appends it */}
      <NextSeo
        title="Discover the Best AI Tools in One Place"
        description="Compare, review, and explore the world's top AI tools for writing, coding, productivity, design, video, automation, and more. Independent reviews. No sponsored content."
        canonical="https://shabellehub.com"
        openGraph={{
          title: 'Shabelle Hub — Discover the Best AI Tools in One Place',
          description: "Compare, review, and explore the world's top AI tools. Independent reviews, honest rankings, and expert insights.",
          url: 'https://shabellehub.com',
          type: 'website',
          siteName: 'Shabelle Hub',
          images: [{ url: 'https://shabellehub.com/og-image.png', width: 1200, height: 630, alt: 'Shabelle Hub — AI Tools Discovery Platform' }],
        }}
        twitter={{ handle: '@shabellehub', site: '@shabellehub', cardType: 'summary_large_image' }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(getOrganizationStructuredData()) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(getWebsiteStructuredData()) }}
      />

      {/* ── HERO ── */}
      <section style={{
        padding: '60px 20px 48px', textAlign: 'center',
        background: 'radial-gradient(ellipse 90% 55% at 50% 0%, rgba(20,255,244,0.07), transparent 70%)',
      }}>
        <p style={{ color: '#14FFF4', fontSize: 11, fontWeight: 800, letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 14 }}>
          The Ultimate 2026 AI Discovery Platform
        </p>
        <h1 style={{
          fontFamily: 'Space Grotesk, sans-serif',
          fontSize: 'clamp(28px, 7vw, 52px)',
          fontWeight: 800, lineHeight: 1.12, marginBottom: 20, color: '#e8f0ff',
        }}>
          Discover the Best<br />
          <span style={{ color: '#14FFF4' }}>AI Tools in One Place</span>
        </h1>
        <p style={{ color: '#6b82a8', fontSize: 16, maxWidth: 520, margin: '0 auto 36px', lineHeight: 1.7 }}>
          Compare, review, and explore the world&rsquo;s top AI tools for writing, coding,
          productivity, design, video, automation, and more.
        </p>

        {/* Search */}
        <div style={{
          display: 'flex', background: '#0f1829', border: '1px solid #1a2d4a',
          borderRadius: 14, padding: 5, maxWidth: 480, margin: '0 auto', gap: 5,
        }}
          role="search"
        >
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Search AI tools..."
            aria-label="Search AI tools"
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              padding: '0 14px', color: '#e8f0ff', fontSize: 15, minHeight: 44,
            }}
          />
          <button
            onClick={handleSearch}
            aria-label="Submit search"
            style={{
              background: '#14FFF4', color: '#080d1a', border: 'none',
              borderRadius: 10, padding: '0 22px', fontWeight: 800, fontSize: 14, cursor: 'pointer',
            }}
          >
            Search
          </button>
        </div>

        {/* Primary CTAs */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 24 }}>
          <Link href="/tools" style={{
            display: 'inline-block', background: '#14FFF4', color: '#080d1a',
            borderRadius: 12, padding: '13px 28px', fontWeight: 800, fontSize: 15, textDecoration: 'none',
          }}>
            Explore Tools →
          </Link>
          <Link href="/blog" style={{
            display: 'inline-block', background: 'none', color: '#e8f0ff',
            border: '1px solid #1a2d4a', borderRadius: 12, padding: '13px 28px',
            fontWeight: 700, fontSize: 15, textDecoration: 'none',
          }}>
            Latest AI Reviews
          </Link>
        </div>

        {/* Category pills */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginTop: 20 }}>
          {['Writing', 'Coding', 'Images', 'Research', 'Video', 'Automation'].map(tag => (
            <Link key={tag} href={`/tools?q=${tag}`} style={{
              fontSize: 12, color: '#6b82a8', background: 'rgba(26,45,74,0.5)',
              border: '1px solid #1a2d4a', borderRadius: 20, padding: '5px 14px', textDecoration: 'none',
            }}>
              {tag}
            </Link>
          ))}
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <div style={{ background: '#0c1522', borderTop: '1px solid #1a2d4a', borderBottom: '1px solid #1a2d4a', padding: '18px 20px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'center', gap: 40, flexWrap: 'wrap' }}>
          {[
            { num: String(toolsCount),       label: 'Tools Reviewed' },
            { num: String(categoriesCount),  label: 'Categories' },
            { num: '100%',                   label: 'Independent' },
            { num: `${avgRating}★`,          label: 'Avg Rating' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 22, fontWeight: 800, color: '#14FFF4' }}>{s.num}</div>
              <div style={{ fontSize: 11, color: '#6b82a8', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── TRUST BAR ── */}
      <div style={{ background: '#080d1a', padding: '14px 20px', borderBottom: '1px solid #1a2d4a' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'center', gap: 32, flexWrap: 'wrap', alignItems: 'center' }}>
          {[
            { icon: '🛡️', text: 'No Sponsored Content' },
            { icon: '🔍', text: 'Hands-On Tested'      },
            { icon: '📊', text: 'Honest Comparisons'   },
            { icon: '🔄', text: 'Updated Weekly'        },
          ].map(item => (
            <span key={item.text} style={{ fontSize: 12, color: '#6b82a8', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span aria-hidden="true">{item.icon}</span> {item.text}
            </span>
          ))}
        </div>
      </div>

      {/* ── FEATURED TOOLS ── */}
      <Section surface>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 20, fontWeight: 800 }}>⚡ Featured AI Tools</h2>
          <Link href="/tools" style={{ fontSize: 13, color: '#6b82a8', textDecoration: 'none', border: '1px solid #1a2d4a', borderRadius: 8, padding: '6px 14px' }}>
            View all →
          </Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 16 }}>
          {featuredTools.map(tool => (
            <ToolCard
              key={tool.id}
              tool={tool}
              isFavorite={favorites.includes(tool.id)}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      </Section>

      {/* ── NEWSLETTER ── */}
      <section style={{
        padding: '52px 20px', textAlign: 'center',
        background: 'linear-gradient(135deg, rgba(20,255,244,0.04), rgba(20,255,244,0.01))',
        borderTop: '1px solid #1a2d4a', borderBottom: '1px solid #1a2d4a',
      }}>
        <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 22, fontWeight: 800, marginBottom: 10 }}>
          Get the <span style={{ color: '#14FFF4' }}>Weekly AI Digest</span>
        </h2>
        <p style={{ color: '#6b82a8', fontSize: 14, maxWidth: 380, margin: '0 auto 26px', lineHeight: 1.6 }}>
          New tool reviews, exclusive deals, and AI tips — delivered every Tuesday. Free forever.
        </p>
        <div style={{ maxWidth: 440, margin: '0 auto' }}>
          <NewsletterForm />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 16, flexWrap: 'wrap' }}>
          {['New tool alerts', 'Exclusive discounts', 'No spam, ever'].map(perk => (
            <span key={perk} style={{ fontSize: 12, color: '#6b82a8', display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ color: '#14FFF4', fontWeight: 800 }} aria-hidden="true">✓</span> {perk}
            </span>
          ))}
        </div>
      </section>

      {/* ── LATEST BLOG ── */}
      <Section surface>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 20, fontWeight: 800 }}>📝 Latest AI Reviews</h2>
          <Link href="/blog" style={{ fontSize: 13, color: '#6b82a8', textDecoration: 'none', border: '1px solid #1a2d4a', borderRadius: 8, padding: '6px 14px' }}>
            All posts →
          </Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {displayPosts.slice(0, 3).map(post => (
            <Link key={post.id || post.slug} href={`/blog/${post.slug}`} style={{ textDecoration: 'none' }}>
              <article style={{
                background: '#0f1829', border: '1px solid #1a2d4a', borderRadius: 14,
                padding: 22, height: '100%', display: 'flex', flexDirection: 'column', gap: 10,
              }}>
                <div style={{ display: 'flex', gap: 8, color: '#14FFF4', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
                  <span>{post.category || post.category_name}</span>
                  {(post.date || post.published_at) && (
                    <>
                      <span style={{ opacity: 0.5 }} aria-hidden="true">·</span>
                      <time dateTime={post.date || post.published_at} style={{ opacity: 0.7 }}>
                        {post.date || (post.published_at ? new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '')}
                      </time>
                    </>
                  )}
                  {(post.readTime || post.read_time) && (
                    <>
                      <span style={{ opacity: 0.5 }} aria-hidden="true">·</span>
                      <span style={{ opacity: 0.7 }}>{post.readTime || post.read_time} read</span>
                    </>
                  )}
                </div>
                <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 16, fontWeight: 700, color: '#e8f0ff', lineHeight: 1.35, flex: 1 }}>
                  {post.title}
                </h3>
                <p style={{ color: '#6b82a8', fontSize: 13, lineHeight: 1.6 }}>{post.excerpt}</p>
              </article>
            </Link>
          ))}
        </div>
      </Section>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px' }}>
        <TransparencyNotice />
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px' }}>
        <AdSlot slot="5555555555" label="Homepage ad" />
      </div>

      {/* ── NEWSLETTER ── */}
      <section style={{ padding: '52px 20px', borderTop: '1px solid #1a2d4a' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <NewsletterSignupForm
            source="homepage"
            variant="default"
            heading="Stay ahead of the AI curve"
            subheading="New tool reviews, comparisons, and expert picks — delivered weekly. No spam, ever."
          />
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section style={{ padding: '52px 20px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 'clamp(20px, 4vw, 28px)', fontWeight: 800, marginBottom: 14 }}>
          Ready to find your perfect AI tool?
        </h2>
        <p style={{ color: '#6b82a8', fontSize: 14, marginBottom: 28 }}>
          Browse {toolsCount} tools across {categoriesCount} categories — all independently reviewed by Shabelle Hub.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/tools" style={{
            display: 'inline-block', background: '#14FFF4', color: '#080d1a',
            borderRadius: 12, padding: '14px 32px', fontWeight: 800, fontSize: 15, textDecoration: 'none',
          }}>
            Browse the Full Directory →
          </Link>
          <Link href="/blog" style={{
            display: 'inline-block', background: 'none', color: '#e8f0ff',
            border: '1px solid #1a2d4a', borderRadius: 12, padding: '14px 28px',
            fontWeight: 700, fontSize: 15, textDecoration: 'none',
          }}>
            Read AI Reviews
          </Link>
        </div>
      </section>
    </>
  );
}
