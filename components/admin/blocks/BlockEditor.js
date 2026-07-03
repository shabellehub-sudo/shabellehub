// components/admin/blocks/BlockEditor.js
// Orchestrates all block types. No new npm packages — pure React + inline styles.

import { useState, useRef, useCallback, useEffect } from 'react';
import { createBlock, BLOCK_MENU, BLOCK_TYPES } from '../../../lib/cms/blocks';

// Block-type editors
import ParagraphBlock        from './ParagraphBlock';
import HeadingBlock          from './HeadingBlock';
import ImageBlock            from './ImageBlock';
import GalleryBlock          from './GalleryBlock';
import TableBlock            from './TableBlock';
import ComparisonTableBlock  from './ComparisonTableBlock';
import YouTubeBlock          from './YouTubeBlock';
import ProsConsBlock         from './ProsConsBlock';
import QuoteBlock            from './QuoteBlock';
import CalloutBlock          from './CalloutBlock';

const EDITOR_MAP = {
  [BLOCK_TYPES.PARAGRAPH]:        ParagraphBlock,
  [BLOCK_TYPES.HEADING]:          HeadingBlock,
  [BLOCK_TYPES.IMAGE]:            ImageBlock,
  [BLOCK_TYPES.GALLERY]:          GalleryBlock,
  [BLOCK_TYPES.TABLE]:            TableBlock,
  [BLOCK_TYPES.COMPARISON_TABLE]: ComparisonTableBlock,
  [BLOCK_TYPES.YOUTUBE]:          YouTubeBlock,
  [BLOCK_TYPES.PROS_CONS]:        ProsConsBlock,
  [BLOCK_TYPES.QUOTE]:            QuoteBlock,
  [BLOCK_TYPES.CALLOUT]:          CalloutBlock,
  [BLOCK_TYPES.DIVIDER]:          () => (
    <div style={{ borderTop: '1px dashed #2a3d5c', margin: '4px 0', pointerEvents: 'none' }} />
  ),
};

const BLOCK_LABELS = Object.fromEntries(BLOCK_MENU.map(b => [b.type, `${b.icon} ${b.label}`]));

// ── Shared styles ─────────────────────────────────────────────────────────────
const iconBtn = (color = '#6b82a8') => ({
  background: 'none', border: 'none', color, cursor: 'pointer',
  fontSize: 14, padding: '4px 6px', borderRadius: 4, lineHeight: 1,
  fontFamily: 'Inter, sans-serif',
});

// ── Single block wrapper ──────────────────────────────────────────────────────
function BlockShell({ block, index, total, onUpdate, onRemove, onMove, onDuplicate, onToggleCollapse, dragHandleProps }) {
  const BlockEditor = EDITOR_MAP[block.type];
  const label       = BLOCK_LABELS[block.type] || block.type;

  return (
    <div
      style={{
        background: '#0f1829', border: '1px solid #1a2d4a', borderRadius: 10,
        marginBottom: 8, overflow: 'hidden',
        boxShadow: dragHandleProps?.isDragging ? '0 4px 20px rgba(0,0,0,0.4)' : 'none',
      }}
    >
      {/* Header bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '7px 10px', background: '#080d1a', borderBottom: block.collapsed ? 'none' : '1px solid #1a2d4a',
        userSelect: 'none',
      }}>
        {/* Drag handle */}
        <span
          {...(dragHandleProps || {})}
          title="Drag to reorder"
          style={{ color: '#2a3d5c', cursor: 'grab', fontSize: 16, lineHeight: 1, padding: '0 2px' }}
        >⠿</span>

        <span style={{ fontSize: 11, fontWeight: 700, color: '#6b82a8', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {label}
        </span>

        {/* Move up/down */}
        <button style={iconBtn()} disabled={index === 0}       onClick={() => onMove(index, -1)} title="Move up">↑</button>
        <button style={iconBtn()} disabled={index >= total - 1} onClick={() => onMove(index, +1)} title="Move down">↓</button>

        {/* Duplicate */}
        <button style={iconBtn()} onClick={() => onDuplicate(index)} title="Duplicate">⧉</button>

        {/* Collapse / expand */}
        <button style={iconBtn('#14FFF4')} onClick={() => onToggleCollapse(index)} title={block.collapsed ? 'Expand' : 'Collapse'}>
          {block.collapsed ? '▸' : '▾'}
        </button>

        {/* Remove */}
        <button style={iconBtn('#ff4d6d')} onClick={() => onRemove(index)} title="Remove block">×</button>
      </div>

      {/* Block content */}
      {!block.collapsed && BlockEditor && (
        <div style={{ padding: 14 }}>
          <BlockEditor block={block} onChange={(updated) => onUpdate(index, updated)} />
        </div>
      )}
    </div>
  );
}

// ── Add block menu ─────────────────────────────────────────────────────────────
function AddBlockMenu({ onAdd }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  const handleBlur = useCallback((e) => {
    if (ref.current && !ref.current.contains(e.relatedTarget)) setOpen(false);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }} onBlur={handleBlur}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '9px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
          background: 'rgba(20,255,244,0.08)', border: '1px solid rgba(20,255,244,0.25)', color: '#14FFF4',
        }}
      >
        + Add Block
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '110%', left: 0, zIndex: 200,
          background: '#0f1829', border: '1px solid #1a2d4a', borderRadius: 10,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2,
          padding: 8, minWidth: 280,
        }}>
          {BLOCK_MENU.map(({ type, label, icon }) => (
            <button
              key={type}
              type="button"
              onClick={() => { onAdd(type); setOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                background: 'transparent', border: 'none', color: '#9fb3d4', textAlign: 'left',
                transition: 'background 0.1s, color 0.1s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(20,255,244,0.08)'; e.currentTarget.style.color = '#14FFF4'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9fb3d4'; }}
            >
              <span style={{ fontSize: 16, width: 20, textAlign: 'center', flexShrink: 0 }}>{icon}</span>
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main BlockEditor ───────────────────────────────────────────────────────────
export default function BlockEditor({ blocks = [], onChange }) {
  // Drag state (simple index-based swap — no external DnD lib)
  const dragIdx  = useRef(null);
  const [dragOver, setDragOver] = useState(null);

  // HTML5 native `draggable` intercepts touch events and blocks tapping/typing
  // into inputs on mobile browsers. Only enable it on devices with a real
  // mouse (pointer: fine); touch/mobile users reorder with the ↑ ↓ buttons.
  const [canDrag, setCanDrag] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    setCanDrag(window.matchMedia('(pointer: fine)').matches);
  }, []);

  function update(index, updated) {
    onChange(blocks.map((b, i) => i === index ? updated : b));
  }
  function remove(index) {
    onChange(blocks.filter((_, i) => i !== index));
  }
  function add(type) {
    onChange([...blocks, createBlock(type)]);
  }
  function move(index, dir) {
    const target = index + dir;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }
  function duplicate(index) {
    const copy = JSON.parse(JSON.stringify(blocks[index]));
    copy.id = `block_${Date.now()}_dup`;
    const next = [...blocks];
    next.splice(index + 1, 0, copy);
    onChange(next);
  }
  function toggleCollapse(index) {
    onChange(blocks.map((b, i) => i === index ? { ...b, collapsed: !b.collapsed } : b));
  }

  // ── Drag-and-drop (HTML5, no lib) ──────────────────────────────────────────
  function onDragStart(idx) { dragIdx.current = idx; }
  function onDragEnd()      { dragIdx.current = null; setDragOver(null); }
  function onDragOver(e, idx) {
    e.preventDefault();
    if (dragIdx.current !== null && dragIdx.current !== idx) setDragOver(idx);
  }
  function onDrop(idx) {
    if (dragIdx.current === null || dragIdx.current === idx) return;
    const next = [...blocks];
    const [moved] = next.splice(dragIdx.current, 1);
    next.splice(idx, 0, moved);
    onChange(next);
    dragIdx.current = null;
    setDragOver(null);
  }

  return (
    <div>
      {blocks.length === 0 && (
        <div style={{ padding: '24px 0', textAlign: 'center', color: '#3d5470', fontSize: 13 }}>
          No blocks yet. Click <strong>+ Add Block</strong> to start writing.
        </div>
      )}

      {blocks.map((block, index) => (
        <div
          key={block.id || index}
          draggable={canDrag}
          onDragStart={() => onDragStart(index)}
          onDragEnd={onDragEnd}
          onDragOver={e => onDragOver(e, index)}
          onDrop={() => onDrop(index)}
          style={{
            outline: dragOver === index ? '2px solid #14FFF4' : 'none',
            borderRadius: 10,
            transition: 'outline 0.1s',
          }}
        >
          <BlockShell
            block={block}
            index={index}
            total={blocks.length}
            onUpdate={update}
            onRemove={remove}
            onMove={move}
            onDuplicate={duplicate}
            onToggleCollapse={toggleCollapse}
          />
        </div>
      ))}

      <AddBlockMenu onAdd={add} />
    </div>
  );
                     }
