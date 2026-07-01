// ─── E-E-A-T STRUCTURED DATA & FORMATTING HELPERS ──────────────────────────
// Person/author/reviewer schema generators and shared formatting used by
// tool pages, blog pages, author/reviewer profile pages, and the team page.

import { siteConfig } from '../data';

// ── Format an ISO date (YYYY-MM-DD) as "June 10, 2026" ──────────────────────
export function formatDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return dateStr;
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

// ── Person schema for an author or reviewer profile page ───────────────────
export function getPersonStructuredData(person) {
  if (!person) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: person.name,
    url: `${siteConfig.url}/authors/${person.slug}`,
    jobTitle: person.title,
    description: person.shortBio,
    knowsAbout: person.expertise,
    image: `${siteConfig.url}/og-image.png`,
    worksFor: {
      '@type': 'Organization',
      name: siteConfig.name,
      url: siteConfig.url,
    },
    sameAs: person.sameAs || [],
  };
}

// ── Minimal Person reference used inside author/reviewedBy fields ──────────
function personRef(person, kind) {
  if (!person) return undefined;
  return {
    '@type': 'Person',
    name: person.name,
    url: `${siteConfig.url}/${kind}/${person.slug}`,
    jobTitle: person.title,
  };
}

// ── author / reviewedBy / dates block, merged into Review or Article schema ─
export function getAuthorshipSchema({ author, reviewer, datePublished, dateModified }) {
  const schema = {};
  const authorRef = personRef(author, 'authors');
  const reviewerRef = personRef(reviewer, 'reviewers');
  if (authorRef) schema.author = authorRef;
  if (reviewerRef) schema.reviewedBy = reviewerRef;
  if (datePublished) schema.datePublished = datePublished;
  if (dateModified) schema.dateModified = dateModified;
  return schema;
}

// ── BreadcrumbList for /authors/[slug] and /reviewers/[slug] ───────────────
export function getProfileBreadcrumbSchema(person, kind) {
  const sectionLabel = kind === 'reviewers' ? 'Reviewers' : 'Authors';
  const sectionUrl = `${siteConfig.url}/${kind}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteConfig.url },
      { '@type': 'ListItem', position: 2, name: 'Our Team', item: `${siteConfig.url}/team` },
      { '@type': 'ListItem', position: 3, name: sectionLabel, item: sectionUrl },
      { '@type': 'ListItem', position: 4, name: person.name, item: `${siteConfig.url}/${kind}/${person.slug}` },
    ],
  };
}
