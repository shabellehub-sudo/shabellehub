// fix-overflow.js
// Run once from your project root in Termux: node fix-overflow.js
//
// Fixes a page-wide horizontal overflow / "zoomed out" bug on mobile caused by
// long unbroken lines (URLs, long code lines) inside <pre> code blocks pushing
// the whole page wider than the mobile viewport.

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

content = content.replace(
  /background:#0a0e16;border:1px solid #1a2d4a;border-radius:10px;padding:16px 18px;overflow-x:auto;margin:20px 0/g,
  'background:#0a0e16;border:1px solid #1a2d4a;border-radius:10px;padding:16px 18px;overflow-x:auto;margin:20px 0;max-width:100%;box-sizing:border-box'
);

content = content.replace(
  /font-family:Menlo,Consolas,monospace;font-size:13\.5px;line-height:1\.6;color:#c5d3ea;white-space:pre/g,
  'font-family:Menlo,Consolas,monospace;font-size:13.5px;line-height:1.6;color:#c5d3ea;white-space:pre;overflow-wrap:normal'
);

content = content.replace(
  /maxWidth: 760, margin: '0 auto', padding: '32px 20px' \}\}/,
  "maxWidth: 760, margin: '0 auto', padding: '32px 20px', overflowX: 'hidden', width: '100%', boxSizing: 'border-box' }}"
);

if (content === before) {
  console.error('⚠️  No changes were made — the expected patterns were not found.');
  console.error('   Send a screenshot of the current renderMarkdown pre/code style and the outer content div style.');
  process.exit(1);
}

fs.writeFileSync(filePath + '.backup3', before, 'utf8');
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Done! Page-wide overflow protection added.');
console.log('   Backup saved as pages/blog/[slug].js.backup3');
console.log('');
console.log('Next steps:');
console.log('  1. npx next lint');
console.log('  2. git add .');
console.log('  3. git commit -m "fix: prevent page-wide horizontal overflow from long code lines"');
console.log('  4. git push');
