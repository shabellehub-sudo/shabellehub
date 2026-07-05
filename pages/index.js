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

      {/* ── HERO (Premium Redesign — Phase 1) ── */}
      <section className="hero-premium">
        <div className="hero-glow" aria-hidden="true" />
        <div className="hero-grid">
          <div className="hero-copy">
            <p className="hero-eyebrow">Tested by hand · Ranked without sponsorship</p>
            <h1 className="hero-title">
              Find the AI tool<br />
              that actually <span className="hero-accent">does the job.</span>
            </h1>
            <p className="hero-sub">
              {toolsCount}+ tools, hands-on tested across writing, coding, productivity,
              design, video, and automation — no sponsored placements, ever.
            </p>

            <div className="hero-search" role="search">
              <input
                type="search"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Search AI tools..."
                aria-label="Search AI tools"
                className="hero-search-input"
              />
              <button onClick={handleSearch} aria-label="Submit search" className="hero-search-btn">
                Search
              </button>
            </div>

            <div className="hero-ctas">
              <Link href="/tools" className="hero-cta-primary">Explore Tools →</Link>
              <Link href="/blog" className="hero-cta-secondary">Latest AI Reviews</Link>
            </div>

            <div className="hero-tags">
              {['Writing', 'Coding', 'Images', 'Research', 'Video', 'Automation'].map(tag => (
                <Link key={tag} href={`/tools?q=${tag}`} className="hero-tag">
                  {tag}
                </Link>
              ))}
            </div>
          </div>

          <div className="hero-proof" aria-hidden="true">
            {featuredTools.slice(0, 3).map((t, i) => (
              <div key={t.id || t.name} className="proof-card" style={{ '--i': i }}>
                <div className="proof-avatar">{t.name.charAt(0)}</div>
                <div className="proof-body">
                  <div className="proof-name">{t.name}</div>
                  <div className="proof-meta">{t.category} · {t.rating}★</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <style jsx>{`
          .hero-premium { position: relative; padding: 64px 20px 56px; overflow: hidden; }
          .hero-glow {
            position: absolute; inset: 0; pointer-events: none;
            background:
              radial-gradient(ellipse 70% 60% at 15% 0%, rgba(20,255,244,0.10), transparent 65%),
              radial-gradient(ellipse 50% 45% at 92% 15%, rgba(255,193,71,0.07), transparent 70%);
          }
          .hero-grid {
            position: relative; max-width: 1160px; margin: 0 auto;
            display: grid; grid-template-columns: 1fr; gap: 40px; align-items: center;
          }
          @media (min-width: 900px) {
            .hero-grid { grid-template-columns: 1.15fr 0.85fr; gap: 24px; }
          }
          .hero-copy {
            text-align: center;
            animation: heroRise 0.6s ease both;
          }
          @media (min-width: 900px) { .hero-copy { text-align: left; } }
          .hero-eyebrow {
            color: #14FFF4; font-size: 11px; font-weight: 800; letter-spacing: 2px;
            text-transform: uppercase; margin-bottom: 16px;
          }
          .hero-title {
            font-family: 'Space Grotesk', sans-serif; font-size: clamp(30px, 6.5vw, 54px);
            font-weight: 800; line-height: 1.08; color: #e8f0ff; margin-bottom: 18px;
          }
          .hero-accent { color: #14FFF4; }
          .hero-sub {
            color: #8fa3c4; font-size: 16px; line-height: 1.7; max-width: 480px;
            margin: 0 auto 30px;
          }
          @media (min-width: 900px) { .hero-sub { margin: 0 0 30px; } }
          .hero-search {
            display: flex; background: #0f1829; border: 1px solid #1a2d4a; border-radius: 14px;
            padding: 5px; max-width: 480px; margin: 0 auto 22px; gap: 5px;
            transition: border-color 0.2s, box-shadow 0.2s;
          }
          @media (min-width: 900px) { .hero-search { margin: 0 0 22px; } }
          .hero-search:focus-within { border-color: #14FFF4; box-shadow: 0 0 0 4px rgba(20,255,244,0.12); }
          .hero-search-input {
            flex: 1; background: none; border: none; outline: none;
            padding: 0 14px; color: #e8f0ff; font-size: 15px; min-height: 44px;
          }
          .hero-search-btn {
            background: #14FFF4; color: #080d1a; border: none; border-radius: 10px;
            padding: 0 22px; font-weight: 800; font-size: 14px; cursor: pointer;
            transition: filter 0.15s;
          }
          .hero-search-btn:hover { filter: brightness(1.08); }
          .hero-ctas {
            display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; margin-bottom: 22px;
          }
          @media (min-width: 900px) { .hero-ctas { justify-content: flex-start; } }
          .hero-cta-primary {
            display: inline-block; background: #14FFF4; color: #080d1a; border-radius: 12px;
            padding: 13px 28px; font-weight: 800; font-size: 15px; text-decoration: none;
            transition: transform 0.15s, filter 0.15s;
          }
          .hero-cta-primary:hover { transform: translateY(-1px); filter: brightness(1.06); }
          .hero-cta-secondary {
            display: inline-block; background: none; color: #e8f0ff; border: 1px solid #1a2d4a;
            border-radius: 12px; padding: 13px 28px; font-weight: 700; font-size: 15px;
            text-decoration: none; transition: border-color 0.15s, color 0.15s;
          }
          .hero-cta-secondary:hover { border-color: #14FFF4; color: #14FFF4; }
          .hero-tags {
            display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;
          }
          @media (min-width: 900px) { .hero-tags { justify-content: flex-start; } }
          .hero-tag {
            font-size: 12px; color: #6b82a8; background: rgba(26,45,74,0.5);
            border: 1px solid #1a2d4a; border-radius: 20px; padding: 5px 14px;
            text-decoration: none; transition: color 0.15s, border-color 0.15s;
          }
          .hero-tag:hover { color: #14FFF4; border-color: #14FFF4; }

          .hero-proof { position: relative; height: 240px; display: none; }
          @media (min-width: 900px) { .hero-proof { display: block; } }
          .proof-card {
            position: absolute; display: flex; gap: 12px; align-items: center;
            background: #0f1829; border: 1px solid #1a2d4a; border-radius: 14px;
            padding: 14px 18px; width: 230px; box-shadow: 0 20px 40px rgba(0,0,0,0.35);
            opacity: 0; animation: proofIn 0.5s ease both;
            animation-delay: calc(var(--i) * 0.15s + 0.2s);
          }
          .proof-card:hover { border-color: #14FFF4; }
          .proof-card:nth-child(1) { top: 0;    left: 8%;  transform: rotate(-4deg); }
          .proof-card:nth-child(2) { top: 92px; left: 32%; transform: rotate(3deg); z-index: 2; }
          .proof-card:nth-child(3) { top: 184px; left: 4%;  transform: rotate(-2deg); }
          .proof-avatar {
            flex-shrink: 0; width: 38px; height: 38px; border-radius: 10px;
            background: rgba(20,255,244,0.12); color: #14FFF4; font-weight: 800; font-size: 16px;
            display: flex; align-items: center; justify-content: center;
          }
          .proof-name { color: #e8f0ff; font-weight: 700; font-size: 14px; }
          .proof-meta { color: #6b82a8; font-size: 12px; margin-top: 2px; }

          @keyframes heroRise {
            from { opacity: 0; transform: translateY(14px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes proofIn {
            from { opacity: 0; transform: translateY(10px) rotate(var(--r, 0deg)); }
            to   { opacity: 1; }
          }
          @media (prefers-reduced-motion: reduce) {
            .hero-copy, .proof-card { animation: none !important; opacity: 1 !important; }
          }
        `}</style>
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
