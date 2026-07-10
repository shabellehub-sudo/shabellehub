/**
 * useTrackEvent — fire-and-forget event tracking for the trending
 * calculation. Never blocks the UI and never throws: a failed tracking
 * call should be invisible to the visitor (no error state, no retry
 * loop, nothing to await before navigation happens).
 */
export function useTrackEvent() {
  return function trackEvent(toolId, eventType) {
    if (typeof window === 'undefined') return;
    try {
      // navigator.sendBeacon survives page navigation (important: this
      // fires right as the visitor clicks through to /tools/[slug] or an
      // affiliate link, i.e. right as the page is about to unload).
      const payload = JSON.stringify({ toolId, eventType });
      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon('/api/track', blob);
      } else {
        fetch('/api/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    } catch {
      // Swallow — tracking must never affect the visitor's experience.
    }
  };
}
