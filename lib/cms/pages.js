// ─── CMS DATA ACCESS — PAGES (ABOUT + CONTACT, SUPABASE site_config) ─────────
import { getConfig, setConfig } from './_base';

export const ABOUT_DEFAULTS = {
  heroTitle: 'About ShabelleHub',
  heroSubtitle: 'We help you navigate the world of AI tools with honest, expert-backed reviews.',
  missionTitle: 'Our Mission',
  missionText: 'ShabelleHub was founded to cut through the noise in the AI tools space. We independently test and review hundreds of tools so you can make confident decisions.',
  storyTitle: 'Our Story',
  storyText: 'Started in 2024 by a team of AI enthusiasts and tech writers, ShabelleHub has grown into a trusted resource for thousands of professionals, entrepreneurs, and creators.',
  valuesTitle: 'Our Values',
  values: [
    { icon: '🔍', title: 'Independent', description: 'We never take payment for positive reviews. Our opinions are always our own.' },
    { icon: '✅', title: 'Thorough', description: 'Every tool is tested hands-on by our team before we publish a review.' },
    { icon: '🎯', title: 'Practical', description: 'We focus on real-world use cases, not just feature lists.' },
    { icon: '🔄', title: 'Up-to-date', description: 'We revisit reviews regularly as tools evolve.' },
  ],
  teamTitle: 'Meet the Team',
  teamEnabled: true,
  ctaTitle: 'Want to work with us?',
  ctaText: "We're always looking for expert contributors and reviewers.",
  ctaButtonText: 'Get in touch',
  ctaButtonUrl: '/contact',
  seoTitle: 'About ShabelleHub | AI Tool Reviews You Can Trust',
  seoDescription: "Learn about ShabelleHub's mission, team, and editorial standards for AI tool reviews.",
};

export const CONTACT_DEFAULTS = {
  heroTitle: 'Get in Touch',
  heroSubtitle: "Have a question, suggestion, or want to work with us? We'd love to hear from you.",
  formEnabled: true,
  formTitle: 'Send us a message',
  formSubtitle: 'We typically respond within 1–2 business days.',
  contactEmail: '',
  reasons: [
    { label: 'General Enquiry', value: 'general' },
    { label: 'Tool Submission', value: 'tool-submission' },
    { label: 'Press / Media', value: 'press' },
    { label: 'Advertising', value: 'advertising' },
    { label: 'Other', value: 'other' },
  ],
  infoCards: [
    { icon: '✉️', title: 'Email', text: 'hello@shabellehub.com', enabled: false },
    { icon: '🐦', title: 'Twitter', text: '@shabellehub', enabled: false },
    { icon: '💼', title: 'LinkedIn', text: 'linkedin.com/shabellehub', enabled: false },
  ],
  seoTitle: 'Contact ShabelleHub | Get in Touch',
  seoDescription: 'Contact the ShabelleHub team for questions, tool submissions, press enquiries, and more.',
};

export async function getPage(pageId) {
  const defaults = pageId === 'about' ? ABOUT_DEFAULTS : CONTACT_DEFAULTS;
  return getConfig(`page:${pageId}`, defaults);
}
export async function updatePage(pageId, payload, userId) {
  return setConfig(`page:${pageId}`, payload, { userId });
}
