// ─── CONTENT BLOCK SCHEMA ────────────────────────────────────────────────────
// Defines all block types used in the Rich Blog Editor (Phase 6B).
// Stored as content_blocks: [] on Firestore post documents.
// Legacy posts keep their `content` field and continue to render unchanged.

export const BLOCK_TYPES = {
  PARAGRAPH:        'paragraph',
  HEADING:          'heading',
  IMAGE:            'image',
  GALLERY:          'gallery',
  TABLE:            'table',
  COMPARISON_TABLE: 'comparison_table',
  YOUTUBE:          'youtube',
  PROS_CONS:        'pros_cons',
  QUOTE:            'quote',
  CALLOUT:          'callout',
  DIVIDER:          'divider',
};

// ── Defaults per block type ───────────────────────────────────────────────────
const TYPE_DEFAULTS = {
  [BLOCK_TYPES.PARAGRAPH]: {
    text: '',
  },
  [BLOCK_TYPES.HEADING]: {
    text: '',
    level: 2, // 1–4
  },
  [BLOCK_TYPES.IMAGE]: {
    url: '',
    alt: '',
    caption: '',
    alignment: 'center', // left | center | right
    width: 'full',       // full | wide | normal
  },
  [BLOCK_TYPES.GALLERY]: {
    images: [], // [{ url, alt, caption }]
    layout: 'grid', // grid | masonry
    columns: 3,
  },
  [BLOCK_TYPES.TABLE]: {
    headers: ['Column 1', 'Column 2'],
    rows: [['', '']],
    hasHeader: true,
  },
  [BLOCK_TYPES.COMPARISON_TABLE]: {
    title: '',
    columns: ['Tool', 'Feature', 'Price'],
    rows: [{ label: '', values: ['', '', ''], highlight: false }],
    highlightColumn: null, // index of "best value" column
  },
  [BLOCK_TYPES.YOUTUBE]: {
    url: '',
    videoId: '',
    title: '',
    aspectRatio: '16/9',
  },
  [BLOCK_TYPES.PROS_CONS]: {
    pros: [''],
    cons: [''],
    title: '',
  },
  [BLOCK_TYPES.QUOTE]: {
    text: '',
    author: '',
    source: '',
  },
  [BLOCK_TYPES.CALLOUT]: {
    type: 'info', // info | success | warning | danger
    title: '',
    text: '',
  },
  [BLOCK_TYPES.DIVIDER]: {},
};

// ── Factory ───────────────────────────────────────────────────────────────────
let _counter = 0;
export function createBlock(type, overrides = {}) {
  if (!TYPE_DEFAULTS[type]) throw new Error(`Unknown block type: ${type}`);
  return {
    id:   `block_${Date.now()}_${++_counter}`,
    type,
    collapsed: false,
    ...JSON.parse(JSON.stringify(TYPE_DEFAULTS[type])),
    ...overrides,
  };
}

// ── Validation ────────────────────────────────────────────────────────────────
export function validateBlock(block) {
  if (!block?.type) return { valid: false, error: 'Block has no type.' };
  if (!TYPE_DEFAULTS[block.type]) return { valid: false, error: `Unknown type: ${block.type}` };

  switch (block.type) {
    case BLOCK_TYPES.IMAGE:
      if (!block.url) return { valid: false, error: 'Image block requires a URL.' };
      break;
    case BLOCK_TYPES.YOUTUBE:
      if (!block.url && !block.videoId) return { valid: false, error: 'YouTube block requires a URL or video ID.' };
      break;
    default:
      break;
  }
  return { valid: true, error: null };
}

// ── YouTube URL → ID ──────────────────────────────────────────────────────────
export function extractYouTubeId(url) {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/,
    /youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

// ── Default blocks for a blank new post ───────────────────────────────────────
export const DEFAULT_BLOCKS = [
  createBlock(BLOCK_TYPES.PARAGRAPH, { text: '' }),
];

// ── Block type menu labels ─────────────────────────────────────────────────────
export const BLOCK_MENU = [
  { type: BLOCK_TYPES.PARAGRAPH,        label: 'Paragraph',        icon: '¶' },
  { type: BLOCK_TYPES.HEADING,          label: 'Heading',          icon: 'H' },
  { type: BLOCK_TYPES.IMAGE,            label: 'Image',            icon: '🖼' },
  { type: BLOCK_TYPES.GALLERY,          label: 'Gallery',          icon: '🗃' },
  { type: BLOCK_TYPES.TABLE,            label: 'Table',            icon: '⊞' },
  { type: BLOCK_TYPES.COMPARISON_TABLE, label: 'Comparison Table', icon: '⚖' },
  { type: BLOCK_TYPES.YOUTUBE,          label: 'YouTube',          icon: '▶' },
  { type: BLOCK_TYPES.PROS_CONS,        label: 'Pros & Cons',      icon: '±' },
  { type: BLOCK_TYPES.QUOTE,            label: 'Quote',            icon: '"' },
  { type: BLOCK_TYPES.CALLOUT,          label: 'Callout',          icon: '!' },
  { type: BLOCK_TYPES.DIVIDER,          label: 'Divider',          icon: '—' },
];
