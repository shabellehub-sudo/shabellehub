// pages/api/cron/monitor-tools.js
// NOTE: Active execution migrated to GitHub Actions Direct Runner (.github/workflows/monitor.yml)
export default async function handler(req, res) {
  return res.status(200).json({
    ok: true,
    message: 'Cron execution is managed by GitHub Actions Direct Worker to avoid Vercel Hobby 10s timeout limits.',
  });
}
