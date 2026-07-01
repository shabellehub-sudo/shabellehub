// ─── AFFILIATE TRACKING SYSTEM ───────────────────────────────────────────────
// All window/localStorage/document access is guarded with
// typeof window !== 'undefined' to prevent SSR crashes on Next.js.

export function trackAffiliateClick(toolName, toolSlug, destination) {
  if (typeof window === 'undefined') return;

  try {
    const raw = localStorage.getItem('sh_affiliate_clicks');
    const clicks = raw ? JSON.parse(raw) : [];
    clicks.push({
      tool: toolName,
      slug: toolSlug,
      destination,
      timestamp: new Date().toISOString(),
      page: window.location.pathname,
      referrer: document.referrer || 'direct',
    });
    if (clicks.length > 100) clicks.splice(0, clicks.length - 100);
    localStorage.setItem('sh_affiliate_clicks', JSON.stringify(clicks));
  } catch (e) {
    // Silently fail — tracking must never break UX
  }

  if (window.gtag) {
    window.gtag('event', 'affiliate_click', {
      tool_name: toolName,
      tool_slug: toolSlug,
      destination_url: destination,
      page_path: window.location.pathname,
    });
  }

  if (window.plausible) {
    window.plausible('Affiliate Click', {
      props: { tool: toolName, destination },
    });
  }
}

// Build affiliate URL with UTM parameters — safe to call on server
// NOTE: exported for use by future comparison pages and RSS feed
export function buildAffiliateUrl(baseUrl, toolSlug, source = 'shabellehub') {
  try {
    const url = new URL(baseUrl);
    url.searchParams.set('utm_source', source);
    url.searchParams.set('utm_medium', 'affiliate');
    url.searchParams.set('utm_campaign', toolSlug);
    return url.toString();
  } catch (e) {
    return baseUrl;
  }
}

// Open affiliate link with tracking — browser-only, guarded
export function openAffiliateLink(tool) {
  if (typeof window === 'undefined') return;
  const { name, slug, affiliateLink } = tool;
  // Guard: if affiliateLink is missing (data error), fall back to website
  const url = affiliateLink || tool.website;
  if (!url) {
    console.warn('[ShabelleHub] No affiliate link or website for tool:', name);
    return;
  }
  trackAffiliateClick(name, slug, url);
  window.open(url, '_blank', 'noopener,noreferrer');
}
