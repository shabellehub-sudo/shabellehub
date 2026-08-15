// lib/monitoring/diffSnapshots.js
import { diffWords } from 'diff';
import { classifyChange } from './classifyChange';

function isNoiseHunk(value) {
  const trimmed = value.trim();
  if (trimmed.length < 4) return true;
  if (/^[\d\s:/,.-]+$/.test(trimmed)) return true;
  return false;
}

export function diffSnapshots(oldText, newText) {
  const parts = diffWords(oldText, newText);
  const hunks = [];

  for (const part of parts) {
    if (!part.added && !part.removed) continue;
    if (isNoiseHunk(part.value)) continue;
    hunks.push({ type: part.added ? 'added' : 'removed', text: part.value.trim() });
  }

  if (hunks.length === 0) {
    return { changed: false, excerpt: '', category: 'unknown', confidence: 'low', signal: false };
  }

  const excerpt = hunks
    .slice(0, 6)
    .map((h) => (h.type === 'added' ? `+ ${h.text}` : `- ${h.text}`))
    .join('\n')
    .slice(0, 1000);

  const classification = classifyChange(excerpt);

  return {
    changed: true,
    excerpt,
    category: classification.category,
    confidence: classification.confidence,
    signal: classification.signal,
  };
}
