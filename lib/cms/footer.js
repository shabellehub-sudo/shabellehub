// ─── CMS DATA ACCESS — FOOTER (SUPABASE site_config) ─────────────────────────
import { getConfig, setConfig } from './_base';
const KEY = 'footer';

export const FOOTER_DEFAULTS = {
  copyrightText: '© {year} ShabelleHub. All rights reserved.',
  tagline: 'Your trusted source for AI tool reviews and guides.',
  columns: [
    { id: 'explore', heading: 'Explore', links: [
      { label: 'AI Tools', url: '/tools' }, { label: 'Blog', url: '/blog' },
      { label: 'Categories', url: '/tools' }, { label: 'Authors', url: '/authors' },
    ] },
    { id: 'company', heading: 'Company', links: [
      { label: 'About', url: '/about' }, { label: 'Contact', url: '/contact' },
      { label: 'Advertise', url: '/advertising-disclosure' },
    ] },
    { id: 'legal', heading: 'Legal', links: [
      { label: 'Privacy Policy', url: '/privacy' }, { label: 'Terms of Use', url: '/terms' },
      { label: 'Disclosure', url: '/disclosure' }, { label: 'Content Policy', url: '/content-policy' },
    ] },
  ],
  socialLinks: [
    { platform: 'Twitter', url: '', icon: '🐦', enabled: false },
    { platform: 'LinkedIn', url: '', icon: '💼', enabled: false },
    { platform: 'YouTube', url: '', icon: '▶️', enabled: false },
    { platform: 'RSS', url: '/blog', icon: '📡', enabled: true },
  ],
  bottomLinks: [
    { label: 'Site Transparency', url: '/site-transparency' },
    { label: 'Editorial Standards', url: '/editorial-standards' },
  ],
};

export async function getFooter() {
  return getConfig(KEY, FOOTER_DEFAULTS);
}
export async function updateFooter(payload, userId) {
  return setConfig(KEY, payload, { userId });
}
