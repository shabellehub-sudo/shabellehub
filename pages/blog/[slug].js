// pages/blog/[slug].js — Phase 6B: Rich Block Renderer + Legacy Markdown fallback
// FIXED: getStaticPaths and getStaticProps now use Firebase Admin SDK so that
// ISR/SSG reads bypass Firestore security rules (unauthenticated client SDK
// list queries were being denied by the "Missing or insufficient permissions" error).
import { NextSeo, ArticleJsonLd } from 'next-seo';
import Link from 'next/link';
import {
  adminListPublishedPosts,
  adminGetPostBySlug,
  adminGetAuthorById,
  adminGetCategoryById,
} from '../../lib/cms/postsAdmin';

// Phase 6B — block view components
import ImageBlockView      from '../../components/blog/blocks/ImageBlockView';
import GalleryBlockView    from '../../components/blog/blocks/GalleryBlockView';
import TableBlockView      from '../../components/blog/blocks/TableBlockView';
import ComparisonTableView from '../../components/blog/blocks/ComparisonTableView';
import YouTubeEmbedView    from '../../components/blog/blocks/YouTubeEmbedView';
import ProsConsView        from '../../components/blog/blocks/ProsConsView';
import QuoteBlockView      from '../../components/blog/blocks/QuoteBlockView';
import CalloutBlockView    from '../../components/blog/blocks/CalloutBlockView';
import { BLOCK_TYPES }     from '../../lib/cms/blocks';
import NewsletterSignupForm from '../../components/newsletter/SignupForm';

// ── Build-time paths ─────────────────────────────────────────────────────────
export async function getStaticPaths() {
  try {
    const { data: posts } = await adminListPublishedPosts({ limit: 500 });
    return {
      paths: (posts || []).map(p => ({ params: { slug: p.slug } })),
      fallback: 'blocking', // new posts appear without a full rebuild
    };
  } catch {
    return { paths: [], fallback: 'blocking' };
  }
}

export async function getStaticProps({ params }) {
  try {
    const { data: post } = await adminGetPostBySlug(params.slug);
    if (!post || post.status !== 'published') return { notFound: true };

    // Hydrate author & category for display
    const [authorRes, categoryRes] = await Promise.all([
      post.author_id   ? adminGetAuthorById(post.author_id)     : Promise.resolve({ data: null }),
      post.category_id ? adminGetCategoryById(post.category_id) : Promise.resolve({ data: null }),
    ]);

    return {
      props: {
        post: {
          ...post,
          author:   authorRes.data   || null,
          category: categoryRes.data || null,
        },
      },
      revalidate: 60,
    };
  } catch {
    return { notFound: true };
  }
}

// ── Markdown renderer (same safe logic as existing site) ─────────────────────
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
}
function inlineFormat(esc) {
  return esc
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#e8f0ff;font-weight:700">$1</strong>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" style="color:#14FFF4;text-decoration:underline">$1</a>');
}
function renderMarkdown(md) {
  if (!md) return '';
  return md.split('\n')
    .filter((line, idx) => {
      const firstContent = md.split('\n').findIndex(l => l.trim() !== '') === idx;
      return !(firstContent && /^# .+$/.test(line));
    })
    .map(line => {
      if (/^### (.+)$/.test(line)) return `<h3 style="font-family:Space Grotesk,sans-serif;font-size:17px;font-weight:700;margin:20px 0 10px;color:#e8f0ff">${inlineFormat(escapeHtml(line.replace(/^### /, '')))}</h3>`;
      if (/^## (.+)$/.test(line))  return `<h2 style="font-family:Space Grotesk,sans-serif;font-size:20px;font-weight:700;margin:24px 0 12px;color:#e8f0ff">${inlineFormat(escapeHtml(line.replace(/^## /, '')))}</h2>`;
      if (/^# (.+)$/.test(line))   return `<h2 style="font-family:Space Grotesk,sans-serif;font-size:clamp(20px,4.5vw,28px);font-weight:800;margin:28px 0 16px;color:#e8f0ff">${inlineFormat(escapeHtml(line.replace(/^# /, '')))}</h2>`;
      { const imgMatch = line.trim().match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
        if (imgMatch) {
          const [, alt, src] = imgMatch;
          return `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" loading="lazy" style="width:100%;height:auto;border-radius:12px;border:1px solid #1a2d4a;margin:20px 0;display:block" />`;
        }
      }
      if (/^- (.+)$/.test(line))   return `<li style="color:#6b82a8;font-size:14px;line-height:1.7;margin-bottom:6px">${inlineFormat(escapeHtml(line.replace(/^- /, '')))}</li>`;
      if (/^\d+\. (.+)$/.test(line)) return `<li style="color:#6b82a8;font-size:14px;line-height:1.7;margin-bottom:6px" data-ordered="true">${inlineFormat(escapeHtml(line.replace(/^\d+\. /, '')))}</li>`;
      if (line.trim() === '') return '';
      return `<p style="color:#6b82a8;font-size:15px;line-height:1.8;margin-bottom:16px">${inlineFormat(escapeHtml(line))}</p>`;
    })
    .join('\n')
    .replace(/(<li[^>]*data-ordered="true"[^>]*>.*<\/li>\n?)+/g, m => `<ol style="padding-left:18px;margin:12px 0">${m.replace(/ data-ordered="true"/g, '')}</ol>`)
    .replace(/(<li(?![^>]*data-ordered)[^>]*>.*<\/li>\n?)+/g, m => `<ul style="padding-left:18px;margin:12px 0">${m}</ul>`);
}

// ── Block renderer ────────────────────────────────────────────────────────────
function renderBlock(block, idx) {
  if (!block?.type) return null;

  switch (block.type) {
    case BLOCK_TYPES.PARAGRAPH:
      if (!block.text) return null;
      return (
        <p key={idx} style={{ color: '#9fb3d4', fontSize: 15, lineHeight: 1.8, marginBottom: 20 }}>
          {block.text}
        </p>
      );

    case BLOCK_TYPES.HEADING: {
      const Tag = `h${Math.min(Math.max(block.level || 2, 1), 4)}`;
      const sizes = { 1: 28, 2: 22, 3: 18, 4: 15 };
      const size  = sizes[block.level || 2];
      return (
        <Tag key={idx} style={{
          fontFamily: 'Space Grotesk, sans-serif',
          fontSize: size,
          fontWeight: 800,
          color: '#e8f0ff',
          margin: `${size * 1.4}px 0 ${size * 0.6}px`,
          lineHeight: 1.25,
        }}>
          {block.text}
        </Tag>
      );
    }

    case BLOCK_TYPES.IMAGE:
      return <ImageBlockView key={idx} block={block} />;

    case BLOCK_TYPES.GALLERY:
      return <GalleryBlockView key={idx} block={block} />;

    case BLOCK_TYPES.TABLE:
      return <TableBlockView key={idx} block={block} />;

    case BLOCK_TYPES.COMPARISON_TABLE:
      return <ComparisonTableView key={idx} block={block} />;

    case BLOCK_TYPES.YOUTUBE:
      return <YouTubeEmbedView key={idx} block={block} />;

    case BLOCK_TYPES.PROS_CONS:
      return <ProsConsView key={idx} block={block} />;

    case BLOCK_TYPES.QUOTE:
      return <QuoteBlockView key={idx} block={block} />;

    case BLOCK_TYPES.CALLOUT:
      return <CalloutBlockView key={idx} block={block} />;

    case BLOCK_TYPES.DIVIDER:
      return (
        <hr key={idx} style={{
          border: 'none',
          borderTop: '1px solid #1a2d4a',
          margin: '36px 0',
        }} />
      );

    default:
      return null;
  }
}

function BlockContent({ blocks }) {
  return (
    <div>
      {blocks.map((block, idx) => renderBlock(block, idx))}
    </div>
  );
}

// ── FAQ Schema block ─────────────────────────────────────────────────────────
function FAQSchema({ faqs }) {
  if (!faqs?.length) return null;
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function BlogPostPage({ post }) {
  const siteUrl    = 'https://shabellehub.com';
  const postUrl    = `${siteUrl}/blog/${post.slug}`;
  const seoTitle   = post.seo_title   || post.title;
  const seoDesc    = post.seo_description || post.excerpt || '';
  const ogImage    = post.og_image_url || post.featured_image_url || `${siteUrl}/og-image.png`;
  const canonical  = post.canonical_url || postUrl;

  const pubDate    = post.published_at ? new Date(post.published_at).toISOString() : null;
  const modDate    = post.updated_at   ? new Date(post.updated_at).toISOString()   : pubDate;
  const pubDisplay = pubDate ? new Date(pubDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '';

  return (
    <>
      <NextSeo
        title={seoTitle}
        description={seoDesc}
        canonical={canonical}
        openGraph={{
          title: seoTitle,
          description: seoDesc,
          url: postUrl,
          type: 'article',
          siteName: 'Shabelle Hub',
          images: [{ url: ogImage, width: 1200, height: 630, alt: seoTitle }],
          article: {
            publishedTime: pubDate,
            modifiedTime:  modDate,
            authors:       post.author?.name ? [post.author.name] : [],
            tags:          post.tags || [],
          },
        }}
        twitter={{ handle: '@shabellehub', site: '@shabellehub', cardType: 'summary_large_image' }}
      />

      {pubDate && (
        <ArticleJsonLd
          type="BlogPosting"
          url={postUrl}
          title={seoTitle}
          description={seoDesc}
          images={[ogImage]}
          datePublished={pubDate}
          dateModified={modDate}
          authorName={post.author?.name || 'Shabelle Hub'}
          publisherName="Shabelle Hub"
          publisherLogo={`${siteUrl}/logo.png`}
        />
      )}

      <FAQSchema faqs={post.faqs} />

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 20px' }}>
        {/* Breadcrumb */}
        <nav style={{ fontSize: 12, color: '#6b82a8', marginBottom: 20 }}>
          <Link href="/" style={{ color: '#6b82a8', textDecoration: 'none' }}>Home</Link>
          <span style={{ margin: '0 6px' }}>›</span>
          <Link href="/blog" style={{ color: '#6b82a8', textDecoration: 'none' }}>Blog</Link>
          {post.category && (
            <>
              <span style={{ margin: '0 6px' }}>›</span>
              <span style={{ color: '#9fb3d4' }}>{post.category.name}</span>
            </>
          )}
        </nav>

        {/* Category & tags */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
          {post.category?.name && (
            <span style={{ color: '#14FFF4', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {post.category.name}
            </span>
          )}
          {post.tags?.map(tag => (
            <span key={tag} style={{ background: 'rgba(20,255,244,0.07)', color: '#14FFF4', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, border: '1px solid rgba(20,255,244,0.15)' }}>
              #{tag}
            </span>
          ))}
          {post.featured && (
            <span style={{ background: '#14FFF4', color: '#080d1a', fontSize: 11, fontWeight: 800, borderRadius: 4, padding: '2px 8px' }}>
              FEATURED
            </span>
          )}
        </div>

        {/* Title */}
        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 'clamp(22px,5vw,36px)', fontWeight: 800, lineHeight: 1.2, color: '#e8f0ff', marginBottom: 16 }}>
          {post.title}
        </h1>

        {/* Byline */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', marginBottom: 28, paddingBottom: 20, borderBottom: '1px solid #1a2d4a', fontSize: 13, color: '#6b82a8' }}>
          {post.author?.name && (
            <span>By <strong style={{ color: '#9fb3d4' }}>{post.author.name}</strong></span>
          )}
          {pubDisplay && <time dateTime={pubDate}>{pubDisplay}</time>}
          {post.read_time && <span>{post.read_time} read</span>}
        </div>

        {/* Featured image */}
        {post.featured_image_url && (
          <img
            src={post.featured_image_url}
            alt={post.featured_image_alt || post.title}
            style={{ width: '100%', borderRadius: 14, marginBottom: 28, objectFit: 'cover', maxHeight: 420 }}
          />
        )}

        {/* Excerpt callout */}
        {post.excerpt && (
          <div style={{ background: 'rgba(20,255,244,0.05)', border: '1px solid rgba(20,255,244,0.15)', borderRadius: 12, padding: '16px 20px', marginBottom: 28 }}>
            <p style={{ color: '#9fb3d4', fontSize: 15, lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>
              {post.excerpt}
            </p>
          </div>
        )}

        {/* ── Content: block system or legacy markdown ── */}
        {Array.isArray(post.content_blocks) && post.content_blocks.length > 0
          ? <BlockContent blocks={post.content_blocks} />
          : <div dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }} />
        }

        {/* FAQs */}
        {post.faqs?.length > 0 && (
          <div style={{ marginTop: 40, borderTop: '1px solid #1a2d4a', paddingTop: 32 }}>
            <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 22, fontWeight: 800, color: '#e8f0ff', marginBottom: 20 }}>
              Frequently Asked Questions
            </h2>
            {post.faqs.map((faq, i) => (
              <details key={i} style={{ marginBottom: 12, background: '#0f1829', border: '1px solid #1a2d4a', borderRadius: 10 }}>
                <summary style={{ padding: '14px 18px', cursor: 'pointer', fontWeight: 700, fontSize: 14.5, color: '#e8f0ff', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {faq.question|| faq.q}
                  <span style={{ color: '#14FFF4', fontSize: 18, fontWeight: 400, flexShrink: 0 }}>+</span>
                </summary>
                <div style={{ padding: '0 18px 16px', color: '#9fb3d4', fontSize: 14, lineHeight: 1.7 }}>
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        )}

        {/* Newsletter CTA */}
        <NewsletterSignupForm
          source="blog"
          variant="inline"
          heading="Get the latest AI tool reviews"
          subheading="Expert picks and comparisons, weekly. No spam."
        />

        {/* Back link */}
        <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid #1a2d4a' }}>
          <Link href="/blog" style={{ color: '#14FFF4', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
            ← Back to Blog
          </Link>
        </div>
      </div>
    </>
  );
}
