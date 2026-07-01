// ─── CMS DATA ACCESS — CAMPAIGNS (SUPABASE) ──────────────────────────────────
// Note: superseded by lib/cms/newsletters.js (kept for backward compatibility;
// currently unused elsewhere in the app).
export {
  listCampaigns, getCampaign, createCampaign, updateCampaign, deleteCampaign,
} from './newsletters';
