// pages/rss.xml.js
// Public RSS feed for the AI Tool Change Log. Server-rendered, following the
// same getServerSideProps + res.write pattern as pages/sitemap.xml.js.
import { getPublicChanges } from '../lib/changes';
import { SITE_URL } from '../lib/changes/site';

function RssPage() { return null; }

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function getServerSideProps({ res }) {
  // Query failures THROW inside getPublicChanges(); no empty-feed fallback
  // for a genuine failure. Next.js will render the default error page for
  // this route, which is preferable to serving a feed that looks correct
  // but silently has zero items.
  const { rss } = await getPublicChanges();

  const items = rss
    .map((c) => {
      const link = `${SITE_URL}/changes#${c.anchor}`;
      const guid = `shabellehub:${c.anchor}`;
      const pubDate = new Date(c.pubMs).toUTCString();
      const sourceLine = c.evidence_url
        ? `\n      <link>${esc(c.evidence_url)}</link>`
        : '';
      return `    <item>
      <title>${esc(c.tool_name)} — ${esc(c.category)}</title>
      <link>${esc(link)}</link>
      <guid isPermaLink="false">${esc(guid)}</guid>
      <pubDate>${esc(pubDate)}</pubDate>
      <category>${esc(c.category)}</category>
      <description>${esc(c.summary)}</description>${sourceLine}
    </item>`;
    })
    .join('\n');

  const timestamps = rss.map((c) => c.pubMs);
  const lastBuildDate = timestamps.length > 0
    ? `\n    <lastBuildDate>${esc(new Date(Math.max(...timestamps)).toUTCString())}</lastBuildDate>`
    : '';

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>AI Tool Change Log — Shabelle Hub</title>
    <link>${esc(SITE_URL)}/changes</link>
    <description>Track confirmed changes across AI tools, including pricing, plans, models, and other important updates.</description>${lastBuildDate}
${items}
  </channel>
</rss>`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=600');
  res.write(xml);
  res.end();

  return { props: {} };
}

export default RssPage;
