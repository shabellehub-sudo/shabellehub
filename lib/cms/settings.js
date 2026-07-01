// ─── CMS DATA ACCESS — SETTINGS (SUPABASE site_config) ───────────────────────
import { getConfig, setConfig } from './_base';
const KEY = 'settings';

export async function getSettings() {
  const r = await getConfig(KEY, {});
  if (r.error) return r;
  // Mirror old behaviour: null when nothing has ever been saved AND no id-only stub wanted.
  return r;
}
export async function updateSettings(payload, userId) {
  return setConfig(KEY, payload, { userId });
}
