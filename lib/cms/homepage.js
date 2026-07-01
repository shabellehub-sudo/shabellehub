// ─── CMS DATA ACCESS — HOMEPAGE (SUPABASE site_config) ───────────────────────
import { getConfig, setConfig } from './_base';
const KEY = 'homepage';

export const HOMEPAGE_DEFAULTS = {
  hero: {
    headline: 'Discover the Best AI Tools',
    subheadline: 'Curated reviews, comparisons, and guides for the AI tools that matter.',
    ctaText: 'Explore Tools', ctaUrl: '/tools',
    ctaSecondaryText: 'Read the Blog', ctaSecondaryUrl: '/blog',
    backgroundType: 'gradient', backgroundImage: '', badge: '', enabled: true,
  },
  featuredTools: { title: 'Top AI Tools', subtitle: 'Hand-picked tools our team has tested and recommends.', limit: 6, enabled: true },
  featuredArticles: { title: 'Latest Guides', subtitle: 'In-depth articles to help you get the most out of AI.', limit: 3, enabled: true },
  statistics: {
    enabled: true,
    items: [
      { label: 'Tools Reviewed', value: '200+', icon: '🛠️' },
      { label: 'Monthly Readers', value: '50K+', icon: '👥' },
      { label: 'Categories', value: '20+', icon: '🗂️' },
      { label: 'Hours Saved', value: '10K+', icon: '⏱️' },
    ],
  },
  banners: [],
};

function deepMergeDefaults(defaults, data) {
  const out = { ...data };
  for (const [k, v] of Object.entries(defaults)) {
    if (out[k] === undefined || out[k] === null) {
      out[k] = v;
    } else if (typeof v === 'object' && !Array.isArray(v) && typeof out[k] === 'object' && !Array.isArray(out[k])) {
      out[k] = deepMergeDefaults(v, out[k]);
    }
  }
  return out;
}

export async function getHomepage() {
  const r = await getConfig(KEY, {});
  if (r.error) return r;
  return { data: deepMergeDefaults(HOMEPAGE_DEFAULTS, r.data), error: null };
}
export async function updateHomepage(payload, userId) {
  return setConfig(KEY, payload, { userId });
}
