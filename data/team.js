// ─── EDITORIAL TEAM DATA ────────────────────────────────────────────────────
// Single source of truth for every author and reviewer profile shown across
// Shabelle Hub. Used by: /team, /authors, /authors/[slug], /reviewers,
// /reviewers/[slug], tool pages, blog pages, and category pages.
//
// roles: 'author'  -> writes/updates reviews & articles, has a profile at /authors/[slug]
//        'reviewer' -> fact-checks & sign-off, has a profile at /reviewers/[slug]
// A person can hold both roles.

export const teamMembers = [
  {
    slug: 'amara-haile',
    name: 'Amara Haile',
    title: 'Founder & Lead AI Tools Analyst',
    roles: ['author', 'reviewer'],
    avatarInitials: 'AH',
    avatarColor: '#14FFF4',
    shortBio:
      'Amara founded Shabelle Hub in 2024 after seven years building and shipping products at SaaS startups. She personally tests every flagship AI tool covered on the site.',
    bio:
      'Amara Haile is the founder and lead analyst at Shabelle Hub. Before starting the site, she spent seven years as a product manager and software engineer at early-stage SaaS companies, where she was responsible for evaluating and integrating third-party AI APIs into production tools used by tens of thousands of customers. That hands-on procurement experience — reading pricing pages line by line, stress-testing free-tier limits, and dealing with support teams when things broke — shapes how every review on this site is written. Amara holds a B.Sc. in Computer Science and has been writing about consumer and developer AI tools since the first wave of mainstream chatbot launches in 2023. She leads tool selection, hands-on testing, and final sign-off on ratings for every category on Shabelle Hub.',
    expertise: [
      'AI writing & chat assistants',
      'Developer tools & IDEs',
      'SaaS pricing analysis',
      'Product evaluation',
    ],
    credentials: [
      'B.Sc. Computer Science',
      '7+ years in SaaS product management',
      'Hands-on tester of 50+ AI tools since 2023',
    ],
    yearsExperience: 7,
    location: 'Nairobi, Kenya',
    joined: '2024-01-15',
    sameAs: [
      'https://twitter.com/shabellehub',
    ],
    focusCategories: ['Chatbots', 'Coding', 'Marketing'],
  },
  {
    slug: 'mohamed-abdi-guled',
    name: 'Mohamed Abdi Guled',
    title: 'Senior AI & Technology Writer',
    roles: ['author'],
    avatarInitials: 'MG',
    avatarColor: '#00d084',
    shortBio:
      'Mohamed covers research, creative, and productivity AI tools for Shabelle Hub, with a focus on plain-language explanations.',
    bio:
      'Mohamed Abdi Guled is a senior writer at Shabelle Hub focused on research, creative, and productivity AI tools. His reviews emphasize practical, everyday use: what a tool is actually good for, where its free tier runs out, and whether the paid upgrade is worth it for a typical user rather than a power user. He verifies every pricing and feature claim directly against the provider\u2019s own site before a review is published, and revisits each review on a recurring schedule to keep it current as products change.',
    expertise: [
      'AI research & search tools',
      'Image & video generation',
      'Productivity software',
      'Consumer technology writing',
    ],
    credentials: [
      'Shabelle Hub editorial team member',
      'Hands-on tester of AI productivity and research tools',
    ],
    location: 'Mogadishu, Somalia',
    joined: '2024-03-01',
    sameAs: [
      'https://twitter.com/shabellehub',
    ],
    focusCategories: ['Research', 'Image Generation', 'Video Generation', 'Productivity'],
  },
  {
    slug: 'sara-noor',
    name: 'Sara Noor',
    title: 'Senior Editor & Fact-Checker',
    roles: ['reviewer'],
    avatarInitials: 'SN',
    avatarColor: '#ffd700',
    shortBio:
      'Sara reviews every page before publication, checking pricing, feature claims, and ratings against each provider\u2019s official sources and Shabelle Hub\u2019s review methodology.',
    bio:
      'Sara Noor is Shabelle Hub\u2019s senior editor and fact-checker. With a background in editorial quality assurance for digital publications, she reviews every tool page and article before it goes live, cross-checking pricing tables, feature lists, and pros/cons against the vendor\u2019s current website and documentation. Sara also re-audits published pages on a recurring basis to catch pricing changes, deprecated features, or outdated claims, and signs off on the \u201cLast Reviewed\u201d date shown on every page. She has no editorial input into ratings themselves \u2014 her role is independence and accuracy, not opinion \u2014 in line with Shabelle Hub\u2019s editorial standards.',
    expertise: [
      'Editorial fact-checking',
      'Pricing & claims verification',
      'Content quality assurance',
      'Style & accessibility review',
    ],
    credentials: [
      'B.A. English & Editing',
      '6+ years in editorial quality assurance',
      'Verifies 100% of published claims against primary sources',
    ],
    yearsExperience: 6,
    location: 'Hargeisa, Somalia',
    joined: '2024-02-10',
    sameAs: [
      'https://twitter.com/shabellehub',
    ],
    focusCategories: ['Editorial Standards', 'Review Methodology'],
  },
];

export function getPersonBySlug(slug) {
  return teamMembers.find(p => p.slug === slug) || null;
}

export const authors = teamMembers.filter(p => p.roles.includes('author'));
export const reviewers = teamMembers.filter(p => p.roles.includes('reviewer'));

export function getAuthor(slug) {
  return authors.find(p => p.slug === slug) || null;
}

export function getReviewer(slug) {
  return reviewers.find(p => p.slug === slug) || null;
}
