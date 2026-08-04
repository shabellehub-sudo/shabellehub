require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

const { getSupabaseAdmin } = require('../lib/supabaseAdmin');
const supabase = getSupabaseAdmin();

const CATEGORY_IDS = {
  'Guide': '1ef1ed63-d007-4ba4-a586-e87ec1cd5bb8',
  'Comparison': '7a17df93-1153-4ee2-8b37-4e2d2d252888',
  'Building in Public': '9da37474-fd0e-4fff-8931-d0d4afef7ece',
};
const AUTHOR_ID = 'a20e11c2-6652-41f8-aa75-5b6f77b55232';
const REVIEWER_ID = '65752a4a-6b37-493a-a772-fe3b65093d60';

function wrapTitle(title, width = 21, maxLines = 3) {
  const words = title.split(' ');
  const lines = [];
  let current = '';
  for (const w of words) {
    if ((current + ' ' + w).trim().length > width && current) {
      lines.push(current.trim());
      current = w;
    } else {
      current = (current + ' ' + w).trim();
    }
  }
  if (current) lines.push(current);
  if (lines.length > maxLines) {
    const trimmed = lines.slice(0, maxLines);
    trimmed[maxLines - 1] = trimmed[maxLines - 1].replace(/\s*$/, '') + '…';
    return trimmed;
  }
  return lines;
}

function escapeXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
}

function makeHeroSvg(title, category) {
  const lines = wrapTitle(title);
  const badge = category.toUpperCase();
  const startY = 392 - (lines.length - 1) * 64;
  const tspans = lines.map((l, i) => `<tspan x="90" y="${startY + i * 64}">${escapeXml(l)}</tspan>`).join('');
  const badgeWidth = Math.max(160, 34 + badge.length * 11);
  const diagLines = [];
  for (let x = 0; x <= 1460; x += 90) {
    diagLines.push(`<line x1="${x - 200}" y1="0" x2="${x + 20}" y2="630" stroke="#141f33" stroke-width="2"/>`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0f1829"/>
      <stop offset="100%" stop-color="#0a0e16"/>
    </linearGradient>
    <radialGradient id="glow" cx="85%" cy="15%" r="55%">
      <stop offset="0%" stop-color="#14FFF4" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="#14FFF4" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <g opacity="0.5">${diagLines.join('')}</g>
  <circle cx="1040" cy="160" r="90" fill="none" stroke="#14FFF4" stroke-width="5" opacity="0.85"/>
  <circle cx="1040" cy="160" r="14" fill="#14FFF4"/>
  <circle cx="1040.0" cy="250.0" r="9" fill="#0a0e16" stroke="#14FFF4" stroke-width="3"/>
  <circle cx="962.1" cy="115.0" r="9" fill="#0a0e16" stroke="#14FFF4" stroke-width="3"/>
  <circle cx="1117.9" cy="115.0" r="9" fill="#0a0e16" stroke="#14FFF4" stroke-width="3"/>
  <rect x="90" y="90" width="${badgeWidth}" height="42" rx="21" fill="#14FFF4" opacity="0.12" stroke="#14FFF4" stroke-width="1.5"/>
  <text x="${90 + badgeWidth / 2}" y="117" font-family="Arial, sans-serif" font-size="15" font-weight="700" fill="#14FFF4" text-anchor="middle" letter-spacing="1">${escapeXml(badge)}</text>
  <text font-family="Arial, sans-serif" font-size="52" font-weight="800" fill="#e8f0ff">${tspans}</text>
  <text x="90" y="580" font-family="Arial, sans-serif" font-size="26" font-weight="800" fill="#e8f0ff">Shabelle<tspan fill="#14FFF4">Hub</tspan></text>
</svg>`;
}

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: node scripts/publish-article.js path/to/article.md');
    process.exit(1);
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  const titleMatch = raw.match(/^Title:\s*(.+)$/m);
  const categoryMatch = raw.match(/^Category:\s*(.+)$/m);
  const slugMatch = raw.match(/^Slug:\s*(.+)$/m);
  const excerptMatch = raw.match(/^Excerpt:\s*(.+)$/m);

  if (!titleMatch || !categoryMatch || !slugMatch) {
    console.error('Markdown file must have Title:, Category:, and Slug: header lines.');
    process.exit(1);
  }

  const title = titleMatch[1].trim();
  const category = categoryMatch[1].trim();
  const slug = slugMatch[1].trim();
  const excerpt = excerptMatch ? excerptMatch[1].trim() : '';

  if (!CATEGORY_IDS[category]) {
    console.error(`Unknown category "${category}". Must be one of: ${Object.keys(CATEGORY_IDS).join(', ')}`);
    process.exit(1);
  }

  const body = raw.split(/^---\s*$/m)[1]?.trim();
  if (!body) {
    console.error('Could not find article body after "---" separator.');
    process.exit(1);
  }

  const svg = makeHeroSvg(title, category);
  const b64 = Buffer.from(svg, 'utf8').toString('base64');
  const heroMd = `

![${title}](data:image/svg+xml;base64,${b64})

\n\n`;
  const content = heroMd + body;

  const now = new Date().toISOString();
  const doc = {
    slug, title, category, content, excerpt,
    author: 'Mohamed Abdi Guled',
    author_id: AUTHOR_ID,
    reviewer_id: REVIEWER_ID,
    status: 'draft',
    category_id: CATEGORY_IDS[category],
    featured: false,
    tags: [],
    seoTitle: title,
    seo_title: title,
    seoDescription: excerpt,
    seo_description: excerpt,
    faqs: [],
    related_tool_slugs: [],
    content_blocks: null,
    created_at: now,
    updated_at: now,
    created_by: AUTHOR_ID,
    updated_by: AUTHOR_ID,
  };

  const { data, error } = await supabase.from('posts').insert({ doc }).select('id, doc').single();
  if (error) {
    console.error('FAILED:', error.message);
    process.exit(1);
  }
  console.log('✅ Published as draft:', data.doc.slug, '| id:', data.id, '| content length:', content.length);
}

main();
