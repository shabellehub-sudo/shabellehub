// ─── CMS DATA ACCESS — SITE SETTINGS (SUPABASE site_config) ──────────────────
import { getConfig, setConfig } from './_base';
const KEY = 'site_settings';

export const SITE_SETTINGS_DEFAULTS = {
  siteName: 'ShabelleHub',
  siteTagline: 'Your trusted source for AI tool reviews and guides.',
  siteUrl: '',
  logoUrl: '/logo.png',
  logoAlt: 'ShabelleHub',
  faviconUrl: '/favicon.ico',
  defaultTitle: 'ShabelleHub – AI Tools Reviews & Guides',
  defaultDescription: 'Discover, compare and choose the best AI tools. Expert reviews, in-depth guides and curated recommendations.',
  defaultOgImage: '/og-image.png',
  twitterHandle: '',
  googleSiteVerification: '',
  googleAnalyticsId: '',
  googleAdsenseId: '',
  maintenanceMode: false,
  maintenanceMessage: "We're performing scheduled maintenance. Back shortly!",
  cookieBannerEnabled: true,
  newsletterEnabled: true,
};

export async function getSiteSettings() {
  return getConfig(KEY, SITE_SETTINGS_DEFAULTS);
}
export async function updateSiteSettings(payload, userId) {
  return setConfig(KEY, payload, { userId });
}
