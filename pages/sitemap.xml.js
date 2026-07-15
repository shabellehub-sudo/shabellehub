// pages/sitemap.xml.js — merges static tools + Firestore published posts
import { tools as staticTools, categories } from '../data';
import { teamMembers } from '../data/team';
import { generateSitemapEntries } from '../lib/seo';
import { listPublishedPosts } from '../lib/cms/posts';
import { listTools } from '../lib/cms/tools';

const BASE_URL = 'https://shabellehub.com';

function SitemapPage() { return null; }

export async function getServerSideProps({ res }) {
  // Try to get live tools from Supabase (covers tools added after the last
  // static build); fall back to the static bundle, same fail-soft pattern
  // used site-wide.
  let tools = staticTools;
  try {
    const toolsRes = await listTools({ status: 'published', lim: 200 });
    if (!toolsRes.error && toolsRes.data?.length > 0) tools = toolsRes.data;
  } catch { /* keep staticTools fallback */ }

  // Try to get live posts from Firestore; fall back to empty array
  let livePosts = [];
  try {
    const { data } = await listPublishedPosts({ limit: 500 });
    if (data && data.length > 0) {
      livePosts = data.map(p => ({
        slug: p.slug,
        category: p.category_name || '',
        date: p.published_at ? new Date(p.published_at).toISOString().split('T')[0] : '',
      }));
    }
  } catch { /* Firestore not configured — sitemap still works */ }

  const entries = generateSitemapEntries(tools, livePosts, categories, teamMembers);
  const today   = new Date().toISOString().split('T')[0];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.map(e => `  <url>
    <loc>${BASE_URL}${e.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=3600');
  res.write(xml);
  res.end();

  return { props: {} };
}

export default SitemapPage;
