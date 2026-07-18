// fix-markdown.js
// Run this once from your project root in Termux: node fix-markdown.js
//
// It finds the old renderMarkdown code between two known marker comments
// in pages/blog/[slug].js and replaces it with the fixed version that
// properly handles ```code blocks``` and `inline code`.
//
// It automatically makes a backup first: pages/blog/[slug].js.backup

const fs = require('fs');
const path = require('path');

const filePath = path.join('pages', 'blog', '[slug].js');

if (!fs.existsSync(filePath)) {
  console.error('❌ Could not find ' + filePath);
  console.error('   Make sure you run this command from your project root folder');
  console.error('   (the folder that contains "pages", "components", etc.)');
  process.exit(1);
}

const original = fs.readFileSync(filePath, 'utf8');

const startMarker = '// ── Markdown renderer';
const endMarker = '// ── Block renderer';

const startIdx = original.indexOf(startMarker);
const endIdx = original.indexOf(endMarker);

if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
  console.error('❌ Could not find the expected markers in the file.');
  console.error('   Nothing was changed. Please check the file manually.');
  process.exit(1);
}

const newBlock = `// ── Markdown renderer (FIXED: handles fenced code blocks + inline code) ──────
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
}
function inlineFormat(esc) {
  return esc
    .replace(/\\*\\*(.+?)\\*\\*/g, '<strong style="color:#e8f0ff;font-weight:700">$1</strong>')
    .replace(/\\[(.+?)\\]\\((.+?)\\)/g, '<a href="$2" style="color:#14FFF4;text-decoration:underline">$1</a>')
    .replace(/\`([^\`]+)\`/g, '<code style="background:#0f1829;color:#14FFF4;padding:2px 6px;border-radius:4px;font-family:Menlo,Consolas,monospace;font-size:0.9em">$1</code>');
}

function renderMarkdown(md) {
  if (!md) return '';

  const lines = md.split('\\n');
  const html = [];
  let inCodeBlock = false;
  let codeBuffer = [];
  let skippedFirstH1 = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const fenceMatch = line.match(/^\`\`\`(\\w*)\\s*\$/);
    if (fenceMatch) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeBuffer = [];
      } else {
        inCodeBlock = false;
        const codeHtml = escapeHtml(codeBuffer.join('\\n'));
        html.push(
          \`<pre style="background:#0a0e16;border:1px solid #1a2d4a;border-radius:10px;padding:16px 18px;overflow-x:auto;margin:20px 0"><code style="font-family:Menlo,Consolas,monospace;font-size:13.5px;line-height:1.6;color:#c5d3ea;white-space:pre">\${codeHtml}</code></pre>\`
        );
        codeBuffer = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    if (!skippedFirstH1 && /^# .+\$/.test(line)) {
      skippedFirstH1 = true;
      continue;
    }

    if (/^### (.+)\$/.test(line)) {
      html.push(\`<h3 style="font-family:Space Grotesk,sans-serif;font-size:17px;font-weight:700;margin:20px 0 10px;color:#e8f0ff">\${inlineFormat(escapeHtml(line.replace(/^### /, '')))}</h3>\`);
      continue;
    }
    if (/^## (.+)\$/.test(line)) {
      html.push(\`<h2 style="font-family:Space Grotesk,sans-serif;font-size:20px;font-weight:700;margin:24px 0 12px;color:#e8f0ff">\${inlineFormat(escapeHtml(line.replace(/^## /, '')))}</h2>\`);
      continue;
    }
    if (/^# (.+)\$/.test(line)) {
      html.push(\`<h2 style="font-family:Space Grotesk,sans-serif;font-size:clamp(20px,4.5vw,28px);font-weight:800;margin:28px 0 16px;color:#e8f0ff">\${inlineFormat(escapeHtml(line.replace(/^# /, '')))}</h2>\`);
      continue;
    }

    const imgMatch = line.trim().match(/^!\\[([^\\]]*)\\]\\(([^)]+)\\)\$/);
    if (imgMatch) {
      const [, alt, src] = imgMatch;
      html.push(\`<img src="\${escapeHtml(src)}" alt="\${escapeHtml(alt)}" loading="lazy" style="width:100%;height:auto;border-radius:12px;border:1px solid #1a2d4a;margin:20px 0;display:block" />\`);
      continue;
    }

    if (line.trim() === '---') {
      html.push('<hr style="border:none;border-top:1px solid #1a2d4a;margin:36px 0" />');
      continue;
    }

    if (/^- (.+)\$/.test(line)) {
      html.push(\`<li style="color:#9fb3d4;font-size:15px;line-height:1.8;margin-bottom:6px">\${inlineFormat(escapeHtml(line.replace(/^- /, '')))}</li>\`);
      continue;
    }
    if (/^\\d+\\. (.+)\$/.test(line)) {
      html.push(\`<li data-ordered="true" style="color:#9fb3d4;font-size:15px;line-height:1.8;margin-bottom:6px">\${inlineFormat(escapeHtml(line.replace(/^\\d+\\. /, '')))}</li>\`);
      continue;
    }

    if (line.trim() === '') {
      html.push('');
      continue;
    }

    html.push(\`<p style="color:#9fb3d4;font-size:15px;line-height:1.8;margin-bottom:16px">\${inlineFormat(escapeHtml(line))}</p>\`);
  }

  return html.join('\\n')
    .replace(/(<li[^>]*data-ordered="true"[^>]*>.*<\\/li>\\n?)+/g, m => \`<ol style="padding-left:18px;margin:12px 0">\${m.replace(/ data-ordered="true"/g, '')}</ol>\`)
    .replace(/(<li(?![^>]*data-ordered)[^>]*>.*<\\/li>\\n?)+/g, m => \`<ul style="padding-left:18px;margin:12px 0">\${m}</ul>\`);
}

`;

// Backup first
fs.writeFileSync(filePath + '.backup', original, 'utf8');

const updated = original.slice(0, startIdx) + newBlock + original.slice(endIdx);
fs.writeFileSync(filePath, updated, 'utf8');

console.log('✅ Done! pages/blog/[slug].js has been updated.');
console.log('   A backup of the original was saved as pages/blog/[slug].js.backup');
console.log('');
console.log('Next steps:');
console.log('  1. npx next lint');
console.log('  2. git add pages/blog/[slug].js');
console.log('  3. git commit -m "fix: render fenced code blocks and inline code in blog markdown"');
console.log('  4. git push');
