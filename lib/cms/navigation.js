// ─── CMS DATA ACCESS — NAVIGATION (SUPABASE site_config) ─────────────────────
import { getConfig, setConfig } from './_base';
const KEY = 'navigation';

export const NAV_DEFAULTS = {
  items: [
    { id: 'tools',   label: 'AI Tools',  url: '/tools',  enabled: true,  order: 0, openInNewTab: false },
    { id: 'blog',    label: 'Blog',      url: '/blog',   enabled: true,  order: 1, openInNewTab: false },
    { id: 'about',   label: 'About',     url: '/about',  enabled: true,  order: 2, openInNewTab: false },
    { id: 'contact', label: 'Contact',   url: '/contact',enabled: true,  order: 3, openInNewTab: false },
  ],
};

export async function getNavigation() {
  const r = await getConfig(KEY, NAV_DEFAULTS);
  if (r.error) return r;
  if (!r.data.items || !r.data.items.length) r.data.items = NAV_DEFAULTS.items;
  return r;
}
export async function updateNavigation(payload, userId) {
  return setConfig(KEY, payload, { userId });
}
export function sortNavItems(items = []) {
  return [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}
