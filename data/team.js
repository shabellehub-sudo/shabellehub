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
    slug: 'mohamed-abdi-guled',
    name: 'Mohamed Abdi Guled',
    title: 'Founder, Writer & Reviewer',
    roles: ['author', 'reviewer'],
    avatarInitials: 'MG',
    avatarColor: '#00d084',
    shortBio:
      'Mohamed founded and runs Shabelle Hub as a solo project, covering research, creative, coding, and productivity AI tools, and personally fact-checks every page before publication.',
    bio:
      'Mohamed Abdi Guled is the founder, writer, and reviewer behind Shabelle Hub. He researches and writes every review and comparison on the site, focused on practical, everyday use: what a tool is actually good for, where its free tier runs out, and whether the paid upgrade is worth it for a typical user rather than a power user. He verifies every pricing and feature claim directly against the provider\u2019s own site before a review is published, and revisits each review on a recurring schedule to keep it current as products change. As a solo operator, he also handles the fact-checking and sign-off step himself before anything goes live.',
    expertise: [
      'AI research & search tools',
      'Image & video generation',
      'Productivity software',
      'Developer tools & IDEs',
      'Consumer technology writing',
    ],
    credentials: [
      'Founder & sole editorial reviewer at Shabelle Hub',
      'Hands-on tester of AI productivity, research, and coding tools',
    ],
    location: 'Mogadishu, Somalia',
    joined: '2024-03-01',
    sameAs: [
      'https://twitter.com/shabellehub',
    ],
    focusCategories: ['Chatbots', 'Coding', 'Research', 'Image Generation', 'Video Generation', 'Productivity'],
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
