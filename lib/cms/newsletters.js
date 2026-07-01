// ─── CMS DATA ACCESS — NEWSLETTERS & CAMPAIGNS (SUPABASE) ────────────────────
import { isSupabaseConfigured } from '../supabase';
import { list, getById, create, update, remove, count, NOT_CONFIGURED } from './_base';

const NEWSLETTERS = 'newsletters';
const CAMPAIGNS = 'newsletter_campaigns';

// ── NEWSLETTERS ───────────────────────────────────────────────────────────
export async function listNewsletters({ status, lim = 200 } = {}) {
  return list(NEWSLETTERS, { filters: { status }, orderField: 'updated_at', orderDir: 'desc', lim });
}
export async function getNewsletter(id) {
  const r = await getById(NEWSLETTERS, id);
  if (r.error) return r;
  if (!r.data) return { data: null, error: 'Newsletter not found.' };
  return r;
}
export async function createNewsletter(payload, userId) {
  return create(NEWSLETTERS, {
    subject: payload.subject || 'Untitled Newsletter',
    previewText: payload.previewText || '',
    content_blocks: payload.content_blocks || [],
    status: 'draft',
  }, { userId });
}
export async function updateNewsletter(id, payload, userId) {
  return update(NEWSLETTERS, id, payload, { userId });
}
export async function deleteNewsletter(id) {
  const r = await remove(NEWSLETTERS, id);
  if (r.error) return { data: null, error: r.error };
  return { data: { id }, error: null };
}
export async function duplicateNewsletter(id, userId) {
  const { data, error } = await getNewsletter(id);
  if (error) return { data: null, error };
  return createNewsletter({
    subject: `Copy of ${data.subject}`,
    previewText: data.previewText,
    content_blocks: data.content_blocks,
  }, userId);
}

// ── CAMPAIGNS ─────────────────────────────────────────────────────────────
export async function listCampaigns({ status, lim = 200 } = {}) {
  return list(CAMPAIGNS, { filters: status && status !== 'all' ? { status } : {}, orderField: 'created_at', orderDir: 'desc', lim });
}
export async function getCampaign(id) {
  const r = await getById(CAMPAIGNS, id);
  if (r.error) return r;
  if (!r.data) return { data: null, error: 'Campaign not found.' };
  return r;
}
export async function createCampaign(payload, userId) {
  return create(CAMPAIGNS, {
    newsletterId: payload.newsletterId || null,
    subject: payload.subject || '',
    status: 'draft', scheduledAt: null, sentAt: null,
    recipientCount: 0, opens: 0, clicks: 0,
  }, { userId });
}
export async function updateCampaign(id, payload, userId) {
  return update(CAMPAIGNS, id, payload, { userId });
}
export async function deleteCampaign(id) {
  const r = await remove(CAMPAIGNS, id);
  if (r.error) return { data: null, error: r.error };
  return { data: { id }, error: null };
}

export async function getNewsletterAnalytics() {
  if (!isSupabaseConfigured()) return { data: null, error: NOT_CONFIGURED.error };
  try {
    const [subCount, sentCount, sentCampaigns] = await Promise.all([
      count('subscribers', { status: 'active' }),
      count(CAMPAIGNS, { status: 'sent' }),
      list(CAMPAIGNS, { filters: { status: 'sent' }, orderField: 'sentAt', orderDir: 'desc', lim: 50 }),
    ]);
    const campaigns = sentCampaigns.data || [];
    const totalSent = campaigns.reduce((s, c) => s + (c.recipientCount || 0), 0);
    const totalOpens = campaigns.reduce((s, c) => s + (c.opens || 0), 0);
    const totalClicks = campaigns.reduce((s, c) => s + (c.clicks || 0), 0);
    return {
      data: {
        activeSubscribers: subCount.data,
        campaignsSent: sentCount.data,
        totalSent,
        openRate: totalSent > 0 ? ((totalOpens / totalSent) * 100).toFixed(1) : '0.0',
        clickRate: totalSent > 0 ? ((totalClicks / totalSent) * 100).toFixed(1) : '0.0',
        recentCampaigns: campaigns.slice(0, 5),
      },
      error: null,
    };
  } catch (err) {
    return { data: null, error: err.message };
  }
}
