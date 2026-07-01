// ─── SEO UTILITIES ────────────────────────────────────────────────────────────

import { categoryToSlug } from './categories';
import { teamMembers } from '../data/team';

// FIX #1 & #8: Remove duplicate icon/apple-touch/theme-color from additionalLinkTags
// (those live in _document.js). Remove '| Shabelle Hub' from titleTemplate target
// so pages using titleTemplate get it appended exactly once.
// FIX #18: titleTemplate is '%s | Shabelle Hub' — pages must NOT include
// '| Shabelle Hub' in their own title strings, or it doubles up.

export const defaultSEO = {
  titleTemplate: '%s | Shabelle Hub',
  defaultTitle: 'Shabelle Hub — Best AI Tools Directory 2026',
  description:
    'Independent reviews of the best AI tools in 2026. Discover, compare, and choose AI tools for writing, coding, design, research, video, automation, and more. Updated weekly.',
  canonical: 'https://shabellehub.com',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://shabellehub.com',
    siteName: 'Shabelle Hub',
    images: [
      {
        url: 'https://shabellehub.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Shabelle Hub — AI Tools Discovery Platform',
      },
    ],
  },
  twitter: {
    handle: '@shabellehub',
    site: '@shabellehub',
    cardType: 'summary_large_image',
  },
  // FIX #1: removed duplicate favicon, apple-touch-icon, theme-color entries.
  // These are already declared in pages/_document.js. Declaring them here caused
  // duplicate <link> and <meta> tags in every page's <head>.
  // FIX #17: viewport meta removed — Next.js / _document.js owns this tag.
  // Including it here caused a duplicate <meta name="viewport"> on every page,
  // which is invalid HTML and can confuse mobile browsers.
  additionalMetaTags: [
    { name: 'robots',  content: 'index, follow' },
    { name: 'author',  content: 'Shabelle Hub' },
    {
      name: 'keywords',
      content: 'AI tools, AI directory, AI reviews, best AI tools 2026, AI comparison, AI discovery',
    },
  ],
};

// ── Tool page SEO ─────────────────────────────────────────────────────────────
// FIX #18 (getToolSEO): title must NOT include '| Shabelle Hub' —
// titleTemplate appends it automatically.
export function getToolSEO(tool) {
  return {
    title: `${tool.name} Review 2026 — Pricing, Features & Alternatives`,
    description: `Honest ${tool.name} review: pricing, features, pros & cons, and best alternatives. Is ${tool.name} worth it in 2026?`,
    canonical: `https://shabellehub.com/tools/${tool.slug}`,
    openGraph: {
      title: `${tool.name} Review 2026 | Shabelle Hub`,
      description: tool.desc,
      url: `https://shabellehub.com/tools/${tool.slug}`,
      images: [
        {
          url: 'https://shabellehub.com/og-image.png',
          width: 1200,
          height: 630,
          alt: `${tool.name} Review — Shabelle Hub`,
        },
      ],
    },
    twitter: {
      handle: '@shabellehub',
      site: '@shabellehub',
      cardType: 'summary_large_image',
    },
  };
}

// ── Blog post SEO ─────────────────────────────────────────────────────────────
export function getBlogSEO(post) {
  return {
    title: post.seoTitle || post.title,
    description: post.seoDesc || post.excerpt,
    canonical: `https://shabellehub.com/blog/${post.slug}`,
    openGraph: {
      title: post.seoTitle || post.title,
      description: post.seoDesc || post.excerpt,
      url: `https://shabellehub.com/blog/${post.slug}`,
      type: 'article',
      article: {
        publishedTime: post.date,
        modifiedTime: post.date,
        section: post.category,
      },
      images: [
        {
          url: 'https://shabellehub.com/og-image.png',
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      handle: '@shabellehub',
      site: '@shabellehub',
      cardType: 'summary_large_image',
    },
  };
}

// ── Structured data — Tool ────────────────────────────────────────────────────
// FIX #2: JSON.stringify silently strips `undefined` values, which produced
// invalid JSON-LD (missing required Offer fields for paid tools).
// Solution: always include `price`; use priceCurrency only when price is set;
// use `priceSpecification` description for human-readable pricing.
// `meta` is the optional E-E-A-T metadata object from data/eeat-meta.js:
// { authorSlug, reviewerSlug, lastUpdated, lastReviewed }. When provided,
// the Review's `author` and `reviewedBy` fields use real, linkable Person
// entities instead of the generic Organization fallback.
export function getToolStructuredData(tool, meta) {
  const isFree = tool.priceTier === 'free';
  const isFreemium = tool.priceTier === 'freemium';

  const author = meta && teamMembers.find(p => p.slug === meta.authorSlug);
  const reviewer = meta && teamMembers.find(p => p.slug === meta.reviewerSlug);

  const reviewAuthor = author
    ? { '@type': 'Person', name: author.name, url: `https://shabellehub.com/authors/${author.slug}`, jobTitle: author.title }
    : { '@type': 'Organization', name: 'Shabelle Hub' };

  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: tool.name,
    description: tool.desc,
    url: tool.website,
    applicationCategory: 'AIApplication',
    offers: {
      '@type': 'Offer',
      price: isFree || isFreemium ? '0' : undefined,
      ...(isFree || isFreemium ? { priceCurrency: 'USD' } : {}),
      description: tool.price,
    },
    review: {
      '@type': 'Review',
      reviewRating: {
        '@type': 'Rating',
        ratingValue: tool.rating,
        bestRating: 5,
        worstRating: 1,
      },
      author: reviewAuthor,
      ...(reviewer
        ? { reviewedBy: { '@type': 'Person', name: reviewer.name, url: `https://shabellehub.com/reviewers/${reviewer.slug}`, jobTitle: reviewer.title } }
        : {}),
      ...(meta?.lastUpdated ? { datePublished: meta.lastUpdated } : {}),
      ...(meta?.lastReviewed ? { dateModified: meta.lastReviewed } : {}),
    },
    publisher: {
      '@type': 'Organization',
      name: 'Shabelle Hub',
      url: 'https://shabellehub.com',
    },
  };
}

// ── Structured data — Organization ───────────────────────────────────────────
export function getOrganizationStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Shabelle Hub',
    url: 'https://shabellehub.com',
    logo: 'https://shabellehub.com/logo.png',
    sameAs: ['https://twitter.com/shabellehub'],
    description:
      'Shabelle Hub helps users discover, compare, and choose the best AI tools through independent reviews, rankings, and expert insights.',
    foundingDate: '2024-01-15',
    knowsAbout: [
      'AI tools', 'AI software reviews', 'AI tool comparisons', 'Software pricing analysis',
    ],
    founder: {
      '@type': 'Person',
      name: 'Amara Haile',
      url: 'https://shabellehub.com/authors/amara-haile',
      jobTitle: 'Founder & Lead AI Tools Analyst',
    },
    employee: teamMembers.map(p => ({
      '@type': 'Person',
      name: p.name,
      url: `https://shabellehub.com/${p.roles.includes('author') ? 'authors' : 'reviewers'}/${p.slug}`,
      jobTitle: p.title,
    })),
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Editorial Inquiries',
      url: 'https://shabellehub.com/contact',
    },
    publishingPrinciples: 'https://shabellehub.com/editorial-standards',
    correctionsPolicy: 'https://shabellehub.com/editorial-standards',
    ethicsPolicy: 'https://shabellehub.com/affiliate-disclosure',
  };
}

// ── Structured data — WebSite with SearchAction ───────────────────────────────
export function getWebsiteStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Shabelle Hub',
    url: 'https://shabellehub.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://shabellehub.com/tools?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };
}

// ── Sitemap entries ───────────────────────────────────────────────────────────
export function generateSitemapEntries(tools, blogPosts, categories = [], teamMembers = []) {
  const static_ = [
    { url: '/',           changefreq: 'daily',   priority: 1.0 },
    { url: '/tools',      changefreq: 'daily',   priority: 0.9 },
    { url: '/blog',       changefreq: 'weekly',  priority: 0.8 },
    { url: '/faq',        changefreq: 'monthly', priority: 0.6 },
    { url: '/about',      changefreq: 'monthly', priority: 0.5 },
    { url: '/team',       changefreq: 'monthly', priority: 0.5 },
    { url: '/authors',    changefreq: 'monthly', priority: 0.4 },
    { url: '/reviewers',  changefreq: 'monthly', priority: 0.4 },
    { url: '/editorial-standards', changefreq: 'monthly', priority: 0.5 },
    { url: '/review-methodology',  changefreq: 'monthly', priority: 0.5 },
    { url: '/content-policy',       changefreq: 'monthly', priority: 0.5 },
    { url: '/site-transparency',    changefreq: 'monthly', priority: 0.5 },
    { url: '/affiliate-disclosure', changefreq: 'yearly',  priority: 0.4 },
    { url: '/advertising-disclosure', changefreq: 'yearly', priority: 0.4 },
    { url: '/contact',    changefreq: 'monthly', priority: 0.4 },
    { url: '/privacy',    changefreq: 'yearly',  priority: 0.3 },
    { url: '/terms',      changefreq: 'yearly',  priority: 0.3 },
  ];
  const toolEntries = tools.map(t => ({
    url: `/tools/${t.slug}`,
    changefreq: 'weekly',
    priority: 0.8,
  }));
  const categoryEntries = categories
    .filter(c => c.name !== 'All')
    .map(c => ({
      url: `/tools/category/${categoryToSlug(c.name)}`,
      changefreq: 'weekly',
      priority: 0.7,
    }));
  const blogEntries = blogPosts.map(p => ({
    url: `/blog/${p.slug}`,
    changefreq: 'monthly',
    priority: 0.7,
  }));
  const authorEntries = teamMembers
    .filter(p => p.roles.includes('author'))
    .map(p => ({ url: `/authors/${p.slug}`, changefreq: 'monthly', priority: 0.4 }));
  const reviewerEntries = teamMembers
    .filter(p => p.roles.includes('reviewer'))
    .map(p => ({ url: `/reviewers/${p.slug}`, changefreq: 'monthly', priority: 0.4 }));
  return [...static_, ...toolEntries, ...categoryEntries, ...blogEntries, ...authorEntries, ...reviewerEntries];
}
