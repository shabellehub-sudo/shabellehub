// lib/email/template.js — Phase 7B
// Converts newsletter content_blocks → responsive HTML email.
// Pulls branding from site_settings. No external dependencies.

// ── Inline CSS reset for email clients ───────────────────────────────────────
function baseStyles() {
  return `
    body,html{margin:0;padding:0;background:#f4f7fb;font-family:Inter,Arial,sans-serif;color:#1a1a2e;}
    a{color:#14c8be;}
    img{border:0;display:block;max-width:100%;}
    p{margin:0 0 16px;}
    h1,h2,h3,h4{margin:0 0 12px;font-family:'Space Grotesk',Arial,sans-serif;line-height:1.25;}
    table{border-collapse:collapse;}
    @media only screen and (max-width:600px){
      .container{width:100%!important;padding:0 12px!important;}
      .header-logo{font-size:20px!important;}
    }
  `.trim();
}

// ── Block → HTML converters ───────────────────────────────────────────────────
function blockToHtml(block) {
  switch (block.type) {
    case 'paragraph':
      return `<p style="font-size:15px;line-height:1.7;color:#2d3748;margin:0 0 16px;">${escHtml(block.data?.text || '')}</p>`;

    case 'heading': {
      const level = block.data?.level || 2;
      const sizes = { 1: '28px', 2: '22px', 3: '18px', 4: '15px' };
      return `<h${level} style="font-size:${sizes[level]||'20px'};font-weight:800;color:#111827;margin:24px 0 12px;font-family:'Space Grotesk',Arial,sans-serif;">${escHtml(block.data?.text || '')}</h${level}>`;
    }

    case 'image': {
      const { url, alt, caption, alignment = 'center' } = block.data || {};
      if (!url) return '';
      const align = alignment === 'left' ? 'left' : alignment === 'right' ? 'right' : 'center';
      return `
        <div style="text-align:${align};margin:20px 0;">
          <img src="${escAttr(url)}" alt="${escAttr(alt||'')}" style="max-width:100%;border-radius:8px;" />
          ${caption ? `<p style="font-size:12px;color:#6b7280;margin-top:6px;font-style:italic;">${escHtml(caption)}</p>` : ''}
        </div>`;
    }

    case 'quote': {
      const { text, attribution } = block.data || {};
      return `
        <blockquote style="border-left:4px solid #14c8be;padding:12px 20px;margin:20px 0;background:#f0fffe;border-radius:0 8px 8px 0;">
          <p style="font-size:16px;font-style:italic;color:#1a1a2e;margin:0 0 8px;">${escHtml(text||'')}</p>
          ${attribution ? `<cite style="font-size:13px;color:#6b7280;font-style:normal;">— ${escHtml(attribution)}</cite>` : ''}
        </blockquote>`;
    }

    case 'callout': {
      const { text, type = 'info' } = block.data || {};
      const bgMap  = { info: '#e0f2fe', warning: '#fef9c3', success: '#dcfce7', error: '#fee2e2' };
      const clrMap = { info: '#0369a1', warning: '#854d0e', success: '#166534', error: '#991b1b' };
      const bg  = bgMap[type]  || bgMap.info;
      const clr = clrMap[type] || clrMap.info;
      return `
        <div style="background:${bg};border-left:4px solid ${clr};padding:14px 18px;border-radius:0 8px 8px 0;margin:16px 0;">
          <p style="color:${clr};font-size:14px;font-weight:600;margin:0;">${escHtml(text||'')}</p>
        </div>`;
    }

    case 'pros_cons': {
      const { pros = [], cons = [] } = block.data || {};
      const proRows = pros.map(p => `<li style="margin-bottom:6px;color:#166534;">✓ ${escHtml(p)}</li>`).join('');
      const conRows = cons.map(c => `<li style="margin-bottom:6px;color:#991b1b;">✗ ${escHtml(c)}</li>`).join('');
      return `
        <table width="100%" style="margin:20px 0;border-collapse:collapse;">
          <tr>
            <td width="50%" valign="top" style="padding-right:8px;">
              <p style="font-weight:700;color:#166534;margin:0 0 8px;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;">Pros</p>
              <ul style="padding-left:0;list-style:none;margin:0;">${proRows}</ul>
            </td>
            <td width="50%" valign="top" style="padding-left:8px;">
              <p style="font-weight:700;color:#991b1b;margin:0 0 8px;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;">Cons</p>
              <ul style="padding-left:0;list-style:none;margin:0;">${conRows}</ul>
            </td>
          </tr>
        </table>`;
    }

    case 'table': {
      const { headers = [], rows = [] } = block.data || {};
      const headerRow = headers.length
        ? `<tr>${headers.map(h => `<th style="padding:10px 12px;background:#1a1a2e;color:#fff;font-size:13px;text-align:left;font-weight:700;">${escHtml(h)}</th>`).join('')}</tr>`
        : '';
      const dataRows = rows.map((row, i) =>
        `<tr style="background:${i%2===0?'#f9fafb':'#ffffff'};">${row.map(c => `<td style="padding:9px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#374151;">${escHtml(c)}</td>`).join('')}</tr>`
      ).join('');
      return `<table width="100%" style="margin:20px 0;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">${headerRow}${dataRows}</table>`;
    }

    case 'comparison_table': {
      const { headers = [], rows = [] } = block.data || {};
      const th = headers.map(h => `<th style="padding:10px 12px;background:#0f172a;color:#14c8be;font-size:12px;text-align:left;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">${escHtml(h)}</th>`).join('');
      const trs = rows.map((row, i) =>
        `<tr style="background:${i%2===0?'#f8fafc':'#ffffff'};">${row.map(c => `<td style="padding:9px 12px;border-bottom:1px solid #e2e8f0;font-size:14px;">${escHtml(c)}</td>`).join('')}</tr>`
      ).join('');
      return `<table width="100%" style="margin:20px 0;border:1px solid #cbd5e1;border-radius:8px;overflow:hidden;"><tr>${th}</tr>${trs}</table>`;
    }

    case 'divider':
      return `<hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0;" />`;

    default:
      return '';
  }
}

// ── HTML escape helpers ───────────────────────────────────────────────────────
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
function escAttr(str) {
  return String(str).replace(/"/g, '&quot;');
}

// ── Main template builder ─────────────────────────────────────────────────────
export function buildEmailHtml({
  subject,
  previewText = '',
  content_blocks = [],
  settings = {},
  unsubscribeUrl = '#',
}) {
  const siteName   = settings.siteName   || 'ShabelleHub';
  const siteUrl    = settings.siteUrl    || 'https://shabellehub.com';
  const logoUrl    = settings.logoUrl    || '';
  const twitterHandle = settings.twitterHandle || '';

  const bodyContent = content_blocks.map(blockToHtml).filter(Boolean).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${escHtml(subject)}</title>
  ${previewText ? `<meta name="description" content="${escAttr(previewText)}" />` : ''}
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <style>${baseStyles()}</style>
</head>
<body>

<!-- Preview text (hidden) -->
${previewText ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escHtml(previewText)}</div>` : ''}

<!-- Wrapper -->
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb;padding:32px 0;">
  <tr>
    <td align="center">
      <table class="container" width="620" cellpadding="0" cellspacing="0" style="width:620px;max-width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#0a0f1e;border-radius:12px 12px 0 0;padding:24px 32px;" align="center">
            ${logoUrl
              ? `<a href="${escAttr(siteUrl)}"><img src="${escAttr(logoUrl)}" alt="${escAttr(siteName)}" height="36" style="height:36px;max-width:180px;" /></a>`
              : `<a href="${escAttr(siteUrl)}" class="header-logo" style="font-family:'Space Grotesk',Arial,sans-serif;font-size:22px;font-weight:900;color:#14c8be;text-decoration:none;">${escHtml(siteName)}</a>`
            }
          </td>
        </tr>

        <!-- Subject banner -->
        <tr>
          <td style="background:#111827;padding:18px 32px 16px;">
            <h1 style="font-family:'Space Grotesk',Arial,sans-serif;font-size:22px;font-weight:800;color:#f9fafb;margin:0;line-height:1.3;">${escHtml(subject)}</h1>
            ${previewText ? `<p style="font-size:13px;color:#9ca3af;margin:6px 0 0;">${escHtml(previewText)}</p>` : ''}
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#ffffff;padding:32px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
            ${bodyContent || '<p style="color:#6b7280;font-size:14px;">No content yet.</p>'}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#0a0f1e;border-radius:0 0 12px 12px;padding:24px 32px;" align="center">
            <p style="color:#6b7280;font-size:12px;margin:0 0 10px;">
              You're receiving this because you subscribed at
              <a href="${escAttr(siteUrl)}" style="color:#14c8be;">${escHtml(siteName)}</a>.
            </p>
            ${twitterHandle ? `
            <p style="margin:0 0 10px;">
              <a href="https://twitter.com/${escAttr(twitterHandle)}" style="color:#14c8be;font-size:12px;">Follow us on X/Twitter</a>
            </p>` : ''}
            <p style="color:#4b5563;font-size:12px;margin:0;">
              <a href="${escAttr(unsubscribeUrl)}" style="color:#9ca3af;text-decoration:underline;">Unsubscribe</a>
              &nbsp;·&nbsp;
              <a href="${escAttr(siteUrl)}/privacy" style="color:#9ca3af;text-decoration:none;">Privacy Policy</a>
            </p>
            <p style="color:#374151;font-size:11px;margin:12px 0 0;">
              © ${new Date().getFullYear()} ${escHtml(siteName)}. All rights reserved.
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

// ── Plain text fallback ───────────────────────────────────────────────────────
export function buildEmailText({ subject, content_blocks = [], settings = {}, unsubscribeUrl = '#' }) {
  const siteUrl = settings.siteUrl || 'https://shabellehub.com';
  const lines   = [`${subject}`, '='.repeat(subject.length), ''];

  for (const block of content_blocks) {
    switch (block.type) {
      case 'paragraph': lines.push(block.data?.text || '', ''); break;
      case 'heading':   lines.push((block.data?.text || '').toUpperCase(), ''); break;
      case 'quote':     lines.push(`"${block.data?.text || ''}"`, block.data?.attribution ? `— ${block.data.attribution}` : '', ''); break;
      case 'callout':   lines.push(`[${(block.data?.type||'info').toUpperCase()}] ${block.data?.text || ''}`, ''); break;
      case 'pros_cons':
        lines.push('Pros:', ...(block.data?.pros||[]).map(p=>`  + ${p}`), 'Cons:', ...(block.data?.cons||[]).map(c=>`  - ${c}`), '');
        break;
      case 'divider':   lines.push('---', ''); break;
    }
  }

  lines.push('---');
  lines.push(`Unsubscribe: ${unsubscribeUrl}`);
  lines.push(`Privacy Policy: ${siteUrl}/privacy`);
  return lines.join('\n');
}
