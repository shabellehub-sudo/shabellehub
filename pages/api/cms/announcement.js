// pages/api/cms/announcement.js
// Public GET — returns the currently active announcement (if any).
// Used by the frontend AnnouncementBanner component.
import { getActiveAnnouncement } from '../../../lib/cms/announcements';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end();
  }

  const r = await getActiveAnnouncement();
  if (r.error) return res.status(500).json({ error: r.error });

  // Cache for 60 seconds on CDN edge, revalidate in background
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
  return res.status(200).json({ data: r.data });
}
