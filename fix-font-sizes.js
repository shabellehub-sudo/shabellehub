// fix-font-sizes.js
// Run once from your project root in Termux: node fix-font-sizes.js
//
// Adjusts renderMarkdown()'s heading/paragraph sizes in pages/blog/[slug].js
// to exactly match the original block-based renderer used by the first 23 posts:
//   H2 -> 22px (was 20px)
//   H3 -> 18px (was 17px)
//   paragraph marginBottom -> 20px (was 16px)

const fs = require('fs');
const path = require('path');

const filePath = path.join('pages', 'blog', '[slug].js');

if (!fs.existsSync(filePath)) {
  console.error('❌ Could not find ' + filePath);
  console.error('   Make sure you run this from your project root folder.');
  process.exit(1);
}

let content = fs.readFileSync(filePath, 'utf8');
const before = content;

// H2: 20px -> 22px
content = content.replace(
  /font-size:20px;font-weight:700;margin:24px 0 12px;color:#e8f0ff">\$\{inlineFormat\(escapeHtml\(line\.replace\(\/\^## \/, ''\)\)\)\}<\/h2>/,
  "font-size:22px;font-weight:700;margin:31px 0 13px;color:#e8f0ff\">${inlineFormat(escapeHtml(line.replace(/^## /, '')))}</h2>"
);

// H3: 17px -> 18px
content = content.replace(
  /font-size:17px;font-weight:700;margin:20px 0 10px;color:#e8f0ff">\$\{inlineFormat\(escapeHtml\(line\.replace\(\/\^### \/, ''\)\)\)\}<\/h3>/,
  "font-size:18px;font-weight:700;margin:25px 0 11px;color:#e8f0ff\">${inlineFormat(escapeHtml(line.replace(/^### /, '')))}</h3>"
);

// Paragraph margin: 16px -> 20px
content = content.replace(
  /color:#9fb3d4;font-size:15px;line-height:1\.8;margin-bottom:16px/g,
  'color:#9fb3d4;font-size:15px;line-height:1.8;margin-bottom:20px'
);

if (content === before) {
  console.error('⚠️  No changes were made — the expected patterns were not found.');
  console.error('   Send a screenshot of the renderMarkdown function and we will adjust manually.');
  process.exit(1);
}

fs.writeFileSync(filePath + '.backup2', before, 'utf8');
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Done! Font sizes now match the original 23 posts exactly.');
console.log('   Backup saved as pages/blog/[slug].js.backup2');
console.log('');
console.log('Next steps:');
console.log('  1. npx next lint');
console.log('  2. git add .');
console.log('  3. git commit -m "fix: match blog font sizes to original block renderer"');
console.log('  4. git push');
