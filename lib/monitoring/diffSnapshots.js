// lib/monitoring/diffSnapshots.js
import { diffWords } from 'diff';
import { classifyChange } from './classifyChange';
import { classifyWithAI } from './classifyWithAI';

// Matches a trailing currency symbol on the unchanged text immediately
// before a hunk (e.g. "...$" before "20"), and a leading price-unit
// suffix immediately after (e.g. "/month" after "25").
const CURRENCY_BEFORE = /[$€£¥]\s?$/;
const PRICE_UNIT_AFTER = /^\s?\/\s?(mo|month|yr|year)\b/i;

// Fix (Phase 1 evidence bug): a bare short number like "20" or "30" was
// always discarded as noise regardless of context, which silently
// swallowed real price changes ("$20/month" -> "$25/month" produced
// changed=false). A number is only real "noise" (timestamp, date,
// version) when nothing marks it as a price; when it's genuinely a
// price digit it must be kept. Non-numeric short words (plan/model
// names like "Max") are legitimate at 2+ characters -- the old flat
// length<4 threshold rejected "Max" (3 chars) while letting "Team" (4
// chars) through, producing inconsistent oldValue/newValue pairs.
function isNoiseHunk(value, { before = '', after = '' } = {}) {
  const trimmed = value.trim();
  if (trimmed.length === 0) return true;

  // Punctuation/whitespace-only fragments are always noise.
  if (/^[\s.,:;/-]+$/.test(trimmed)) return true;

  const isPureNumeric = /^\d+$/.test(trimmed);
  if (isPureNumeric) {
    if (CURRENCY_BEFORE.test(before) || PRICE_UNIT_AFTER.test(after)) return false;
    // No price context -- almost always a timestamp/date/version digit
    // (e.g. "12:30" -> "12:31"). Stays filtered as noise.
    return true;
  }

  // A lone stray character is still noise; short real words (plan/model
  // names such as "Max", "Pro") are legitimate and must be kept.
  if (trimmed.length < 2) return true;

  return false;
}

// Reattach the adjacent currency symbol / price-unit suffix to a price
// digit hunk so both the classifier (needs "$" + "/month" to recognize
// pricing) and the stored evidence (oldValue/newValue) show the full
// price, not a bare number like "25".
function enrichPriceText(value, before, after) {
  let text = value.trim();
  if (CURRENCY_BEFORE.test(before)) text = before.trim() + text;
  const unitMatch = after.match(PRICE_UNIT_AFTER);
  if (unitMatch) text = text + unitMatch[0].trim();
  return text;
}

export async function diffSnapshots(oldText, newText) {
  const parts = diffWords(oldText, newText);
  const hunks = [];

  let i = 0;
  while (i < parts.length) {
    const part = parts[i];
    if (!part.added && !part.removed) {
      i++;
      continue;
    }

    // Group this run of consecutive added/removed parts (e.g. a removed
    // old value immediately followed by its added replacement) so noise
    // detection and price/plan context use the surrounding unchanged
    // text, not just an isolated token like "20" or "$".
    const groupStart = i;
    let j = i;
    while (j < parts.length && (parts[j].added || parts[j].removed)) j++;

    const before = groupStart > 0 ? parts[groupStart - 1].value : '';
    const after = parts[j] ? parts[j].value + (parts[j + 1] ? parts[j + 1].value : '') : '';

    for (const p of parts.slice(groupStart, j)) {
      if (isNoiseHunk(p.value, { before, after })) continue;

      const isPriceDigit = /^\d+$/.test(p.value.trim()) &&
        (CURRENCY_BEFORE.test(before) || PRICE_UNIT_AFTER.test(after));
      const text = isPriceDigit ? enrichPriceText(p.value, before, after) : p.value.trim();

      // Wider context used only for keyword classification, so short
      // plan/model names (e.g. "Team" -> "Max") still match phrases
      // like "team plan"/"max plan" even though the clean evidence
      // value (oldValue/newValue) stays just the name.
      const afterWord = after.trim().split(/\s+/)[0] || '';
      const classifyText = isPriceDigit ? text : `${text}${afterWord ? ' ' + afterWord : ''}`;

      hunks.push({ type: p.added ? 'added' : 'removed', text, classifyText });
    }

    i = j;
  }

  if (hunks.length === 0) {
    return { changed: false, excerpt: '', category: 'unknown', confidence: 'low', signal: false };
  }

  const excerpt = hunks
    .slice(0, 6)
    .map((h) => (h.type === 'added' ? `+ ${h.classifyText}` : `- ${h.classifyText}`))
    .join('\n')
    .slice(0, 1000);

  // Structured evidence: first removed/added hunk (clean value, not the
  // wider classifyText), kept separately from the combined excerpt so
  // downstream consumers (Tool Intelligence Profiles, evidence history)
  // can show a clean before/after without re-parsing the diff text.
  const oldValue = hunks.find((h) => h.type === 'removed')?.text || null;
  const newValue = hunks.find((h) => h.type === 'added')?.text || null;

  const classification = classifyChange(excerpt);

  let result = {
    changed: true,
    excerpt,
    oldValue,
    newValue,
    category: classification.category,
    confidence: classification.confidence,
    signal: classification.signal,
    summary: null,
    classifiedBy: 'keyword',
  };

  // AI refinement -- only runs when the keyword layer already found a
  // signal, to conserve free-tier quota. Any AI failure silently falls
  // back to the keyword result above (classifyWithAI never throws).
  if (classification.signal) {
    const aiResult = await classifyWithAI(excerpt, classification.category);
    if (aiResult) {
      result = {
        ...result,
        category: aiResult.category,
        confidence: aiResult.confidence,
        signal: aiResult.signal,
        summary: aiResult.summary,
        classifiedBy: 'ai',
      };
    }
  }

  return result;
}
