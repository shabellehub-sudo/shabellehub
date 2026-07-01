// ─── E-E-A-T CONTENT METADATA ───────────────────────────────────────────────
// Maps every tool review and blog post to its author, reviewer, and
// publication/maintenance dates. Kept separate from data/index.js so the
// large tools/blogPosts arrays don't need to be rewritten, and so this file
// can be the single place that's updated whenever a page is re-reviewed.
//
// lastUpdated  -> last time the content itself (pricing, features, copy) changed
// lastReviewed -> last time an editor/fact-checker verified the content

const DEFAULT_META = {
  authorSlug: 'amara-haile',
  reviewerSlug: 'sara-noor',
  lastUpdated: '2026-06-01',
  lastReviewed: '2026-05-30',
};

export const toolReviewMeta = {
  claude: {
    authorSlug: 'amara-haile',
    reviewerSlug: 'sara-noor',
    lastUpdated: '2026-06-12',
    lastReviewed: '2026-06-10',
  },
  chatgpt: {
    authorSlug: 'mohamed-abdi-guled',
    reviewerSlug: 'sara-noor',
    lastUpdated: '2026-06-11',
    lastReviewed: '2026-06-09',
  },
  midjourney: {
    authorSlug: 'amara-haile',
    reviewerSlug: 'sara-noor',
    lastUpdated: '2026-06-08',
    lastReviewed: '2026-06-05',
  },
  cursor: {
    authorSlug: 'mohamed-abdi-guled',
    reviewerSlug: 'amara-haile',
    lastUpdated: '2026-06-10',
    lastReviewed: '2026-06-07',
  },
  'runway-gen3': {
    authorSlug: 'amara-haile',
    reviewerSlug: 'sara-noor',
    lastUpdated: '2026-06-02',
    lastReviewed: '2026-05-30',
  },
  'perplexity-ai': {
    authorSlug: 'mohamed-abdi-guled',
    reviewerSlug: 'sara-noor',
    lastUpdated: '2026-06-04',
    lastReviewed: '2026-06-01',
  },
  elevenlabs: {
    authorSlug: 'mohamed-abdi-guled',
    reviewerSlug: 'sara-noor',
    lastUpdated: '2026-05-29',
    lastReviewed: '2026-05-27',
  },
  'notion-ai': {
    authorSlug: 'mohamed-abdi-guled',
    reviewerSlug: 'amara-haile',
    lastUpdated: '2026-05-25',
    lastReviewed: '2026-05-22',
  },
  'jasper-ai': {
    authorSlug: 'amara-haile',
    reviewerSlug: 'sara-noor',
    lastUpdated: '2026-05-20',
    lastReviewed: '2026-05-18',
  },
  gemini: {
    authorSlug: 'mohamed-abdi-guled',
    reviewerSlug: 'sara-noor',
    lastUpdated: '2026-06-13',
    lastReviewed: '2026-06-11',
  },
  deepseek: {
    authorSlug: 'amara-haile',
    reviewerSlug: 'sara-noor',
    lastUpdated: '2026-06-12',
    lastReviewed: '2026-06-10',
  },
  bolt: {
    authorSlug: 'mohamed-abdi-guled',
    reviewerSlug: 'amara-haile',
    lastUpdated: '2026-06-09',
    lastReviewed: '2026-06-07',
  },
  lovable: {
    authorSlug: 'mohamed-abdi-guled',
    reviewerSlug: 'amara-haile',
    lastUpdated: '2026-06-08',
    lastReviewed: '2026-06-06',
  },
  heygen: {
    authorSlug: 'amara-haile',
    reviewerSlug: 'sara-noor',
    lastUpdated: '2026-06-07',
    lastReviewed: '2026-06-05',
  },
  synthesia: {
    authorSlug: 'amara-haile',
    reviewerSlug: 'sara-noor',
    lastUpdated: '2026-06-06',
    lastReviewed: '2026-06-04',
  },
  pika: {
    authorSlug: 'mohamed-abdi-guled',
    reviewerSlug: 'sara-noor',
    lastUpdated: '2026-06-03',
    lastReviewed: '2026-06-01',
  },
  'luma-ai': {
    authorSlug: 'mohamed-abdi-guled',
    reviewerSlug: 'sara-noor',
    lastUpdated: '2026-06-02',
    lastReviewed: '2026-05-31',
  },
  gamma: {
    authorSlug: 'mohamed-abdi-guled',
    reviewerSlug: 'amara-haile',
    lastUpdated: '2026-05-31',
    lastReviewed: '2026-05-29',
  },
  notebooklm: {
    authorSlug: 'mohamed-abdi-guled',
    reviewerSlug: 'sara-noor',
    lastUpdated: '2026-06-10',
    lastReviewed: '2026-06-08',
  },
  fireflies: {
    authorSlug: 'amara-haile',
    reviewerSlug: 'sara-noor',
    lastUpdated: '2026-05-27',
    lastReviewed: '2026-05-25',
  },
  otter: {
    authorSlug: 'amara-haile',
    reviewerSlug: 'sara-noor',
    lastUpdated: '2026-05-26',
    lastReviewed: '2026-05-24',
  },
  descript: {
    authorSlug: 'mohamed-abdi-guled',
    reviewerSlug: 'sara-noor',
    lastUpdated: '2026-05-24',
    lastReviewed: '2026-05-22',
  },
  murf: {
    authorSlug: 'amara-haile',
    reviewerSlug: 'sara-noor',
    lastUpdated: '2026-05-23',
    lastReviewed: '2026-05-21',
  },
  writesonic: {
    authorSlug: 'mohamed-abdi-guled',
    reviewerSlug: 'amara-haile',
    lastUpdated: '2026-05-19',
    lastReviewed: '2026-05-17',
  },
  'copy-ai': {
    authorSlug: 'mohamed-abdi-guled',
    reviewerSlug: 'amara-haile',
    lastUpdated: '2026-05-18',
    lastReviewed: '2026-05-16',
  },
  rytr: {
    authorSlug: 'mohamed-abdi-guled',
    reviewerSlug: 'sara-noor',
    lastUpdated: '2026-05-17',
    lastReviewed: '2026-05-15',
  },
  make: {
    authorSlug: 'amara-haile',
    reviewerSlug: 'sara-noor',
    lastUpdated: '2026-06-11',
    lastReviewed: '2026-06-09',
  },
  'zapier-ai': {
    authorSlug: 'amara-haile',
    reviewerSlug: 'sara-noor',
    lastUpdated: '2026-06-09',
    lastReviewed: '2026-06-07',
  },
  'replit-ai': {
    authorSlug: 'mohamed-abdi-guled',
    reviewerSlug: 'amara-haile',
    lastUpdated: '2026-06-13',
    lastReviewed: '2026-06-11',
  },
  devin: {
    authorSlug: 'amara-haile',
    reviewerSlug: 'sara-noor',
    lastUpdated: '2026-06-12',
    lastReviewed: '2026-06-10',
  },
  windsurf: {
    authorSlug: 'mohamed-abdi-guled',
    reviewerSlug: 'amara-haile',
    lastUpdated: '2026-06-10',
    lastReviewed: '2026-06-08',
  },
  'blackbox-ai': {
    authorSlug: 'mohamed-abdi-guled',
    reviewerSlug: 'sara-noor',
    lastUpdated: '2026-05-30',
    lastReviewed: '2026-05-28',
  },
  phind: {
    authorSlug: 'mohamed-abdi-guled',
    reviewerSlug: 'sara-noor',
    lastUpdated: '2026-06-04',
    lastReviewed: '2026-06-02',
  },
  'suno-ai': {
    authorSlug: 'amara-haile',
    reviewerSlug: 'sara-noor',
    lastUpdated: '2026-06-05',
    lastReviewed: '2026-06-03',
  },
  'github-copilot': {
    authorSlug: 'mohamed-abdi-guled',
    reviewerSlug: 'amara-haile',
    lastUpdated: '2026-06-11',
    lastReviewed: '2026-06-09',
  },
};

export const blogReviewMeta = {
  'claude-vs-chatgpt-2026': {
    authorSlug: 'amara-haile',
    reviewerSlug: 'sara-noor',
    lastUpdated: '2026-06-05',
    lastReviewed: '2026-06-04',
  },
  'best-free-ai-tools-students-2026': {
    authorSlug: 'mohamed-abdi-guled',
    reviewerSlug: 'sara-noor',
    lastUpdated: '2026-06-01',
    lastReviewed: '2026-05-31',
  },
  'freelancers-earning-more-ai-2026': {
    authorSlug: 'amara-haile',
    reviewerSlug: 'sara-noor',
    lastUpdated: '2026-05-28',
    lastReviewed: '2026-05-27',
  },
  'best-ai-tools-for-students-2026': {
    authorSlug: 'mohamed-abdi-guled',
    reviewerSlug: 'sara-noor',
    lastUpdated: '2026-06-10',
    lastReviewed: '2026-06-09',
  },
  'best-free-ai-tools-beginners': {
    authorSlug: 'mohamed-abdi-guled',
    reviewerSlug: 'sara-noor',
    lastUpdated: '2026-06-09',
    lastReviewed: '2026-06-08',
  },
  'how-to-use-chatgpt-for-productivity': {
    authorSlug: 'amara-haile',
    reviewerSlug: 'sara-noor',
    lastUpdated: '2026-06-08',
    lastReviewed: '2026-06-07',
  },
  'claude-vs-chatgpt-complete-comparison': {
    authorSlug: 'amara-haile',
    reviewerSlug: 'sara-noor',
    lastUpdated: '2026-06-07',
    lastReviewed: '2026-06-06',
  },
  'gemini-vs-chatgpt': {
    authorSlug: 'mohamed-abdi-guled',
    reviewerSlug: 'sara-noor',
    lastUpdated: '2026-06-06',
    lastReviewed: '2026-06-05',
  },
  'best-ai-writing-tools-bloggers': {
    authorSlug: 'amara-haile',
    reviewerSlug: 'sara-noor',
    lastUpdated: '2026-06-05',
    lastReviewed: '2026-06-04',
  },
  'best-ai-coding-assistants-2026': {
    authorSlug: 'amara-haile',
    reviewerSlug: 'sara-noor',
    lastUpdated: '2026-06-04',
    lastReviewed: '2026-06-03',
  },
  'best-ai-image-generators-compared': {
    authorSlug: 'mohamed-abdi-guled',
    reviewerSlug: 'sara-noor',
    lastUpdated: '2026-06-03',
    lastReviewed: '2026-06-02',
  },
  'best-ai-tools-for-small-businesses': {
    authorSlug: 'amara-haile',
    reviewerSlug: 'sara-noor',
    lastUpdated: '2026-06-02',
    lastReviewed: '2026-06-01',
  },
  'ai-prompt-engineering-guide': {
    authorSlug: 'mohamed-abdi-guled',
    reviewerSlug: 'sara-noor',
    lastUpdated: '2026-06-01',
    lastReviewed: '2026-05-31',
  },
  'chatgpt-prompt-engineering-guide': {
    authorSlug: 'amara-haile',
    reviewerSlug: 'sara-noor',
    lastUpdated: '2026-05-30',
    lastReviewed: '2026-05-29',
  },
  'claude-prompt-engineering-guide': {
    authorSlug: 'amara-haile',
    reviewerSlug: 'sara-noor',
    lastUpdated: '2026-05-29',
    lastReviewed: '2026-05-28',
  },
  'gemini-prompt-engineering-guide': {
    authorSlug: 'mohamed-abdi-guled',
    reviewerSlug: 'sara-noor',
    lastUpdated: '2026-05-28',
    lastReviewed: '2026-05-27',
  },
  'how-to-write-better-ai-prompts': {
    authorSlug: 'mohamed-abdi-guled',
    reviewerSlug: 'sara-noor',
    lastUpdated: '2026-05-27',
    lastReviewed: '2026-05-26',
  },
  '100-best-chatgpt-prompts': {
    authorSlug: 'mohamed-abdi-guled',
    reviewerSlug: 'amara-haile',
    lastUpdated: '2026-05-26',
    lastReviewed: '2026-05-25',
  },
  '100-best-claude-prompts': {
    authorSlug: 'amara-haile',
    reviewerSlug: 'sara-noor',
    lastUpdated: '2026-05-25',
    lastReviewed: '2026-05-24',
  },
  'chatgpt-vs-claude-vs-gemini-2026': {
    authorSlug: 'amara-haile',
    reviewerSlug: 'sara-noor',
    lastUpdated: '2026-05-24',
    lastReviewed: '2026-05-23',
  },
  'best-ai-tools-productivity-2026': {
    authorSlug: 'mohamed-abdi-guled',
    reviewerSlug: 'sara-noor',
    lastUpdated: '2026-05-23',
    lastReviewed: '2026-05-22',
  },
  'best-ai-tools-content-creators': {
    authorSlug: 'mohamed-abdi-guled',
    reviewerSlug: 'sara-noor',
    lastUpdated: '2026-05-22',
    lastReviewed: '2026-05-21',
  },
  'best-ai-research-tools-2026': {
    authorSlug: 'mohamed-abdi-guled',
    reviewerSlug: 'sara-noor',
    lastUpdated: '2026-05-21',
    lastReviewed: '2026-05-20',
  },
  'best-ai-workflow-guide': {
    authorSlug: 'amara-haile',
    reviewerSlug: 'sara-noor',
    lastUpdated: '2026-05-20',
    lastReviewed: '2026-05-19',
  },
};

export function getToolMeta(slug) {
  return toolReviewMeta[slug] || DEFAULT_META;
}

export function getBlogMeta(slug) {
  return blogReviewMeta[slug] || DEFAULT_META;
}

// ── Reverse lookups: given a person's slug, find every tool/post they ──────
// authored or reviewed. Used on /authors/[slug] and /reviewers/[slug].
export function getToolSlugsByAuthor(authorSlug) {
  return Object.entries(toolReviewMeta)
    .filter(([, meta]) => meta.authorSlug === authorSlug)
    .map(([slug]) => slug);
}

export function getToolSlugsByReviewer(reviewerSlug) {
  return Object.entries(toolReviewMeta)
    .filter(([, meta]) => meta.reviewerSlug === reviewerSlug)
    .map(([slug]) => slug);
}

export function getBlogSlugsByAuthor(authorSlug) {
  return Object.entries(blogReviewMeta)
    .filter(([, meta]) => meta.authorSlug === authorSlug)
    .map(([slug]) => slug);
}

export function getBlogSlugsByReviewer(reviewerSlug) {
  return Object.entries(blogReviewMeta)
    .filter(([, meta]) => meta.reviewerSlug === reviewerSlug)
    .map(([slug]) => slug);
}
