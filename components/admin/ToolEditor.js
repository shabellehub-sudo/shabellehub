// components/admin/ToolEditor.js
// Complete tool create/edit form with logo upload, screenshot management,
// pros/cons/features builders, and all SEO fields.

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../lib/cms/useAuth';
import {
  createTool, updateTool, publishTool, unpublishTool, deleteTool,
  saveDraftTool, isSlugTaken,
} from '../../lib/cms/tools';
import { uploadToolLogo, uploadToolScreenshot, deleteStorageFile } from '../../lib/cms/toolImages';
import {
  AdminCard, Button, TextInput, TextArea, Select, ErrorBanner, StatusBadge,
} from './ui';

const PRICE_TIERS = ['free', 'freemium', 'paid', 'enterprise'];
const CATEGORIES = [
  'Chatbots', 'Coding', 'Image Generation', 'Video Generation', 'Audio & Voice',
  'Writing', 'Research', 'Productivity', 'Marketing', 'Design', 'Data & Analytics',
  'Education', 'Customer Support', 'SEO', 'Other',
];

function slugify(str) {
  return str.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

const EMPTY = {
  name: '', slug: '', status: 'draft',
  category: '', badge: '', rating: '', price: '', priceTier: 'freemium',
  desc: '', longDesc: '',
  website: '', affiliateLink: '',
  logo_url: '', logo_storage_path: '',
  screenshots: [],          // [{ url, storagePath, alt }]
  features: [],             // ['string']
  pros: [],                 // ['string']
  cons: [],                 // ['string']
  tags: [],                 // ['string']
  useCases: [],             // ['string']
  alternatives: [],         // ['slug']
  featured: false, hot: false,
  seoTitle: '', seoDescription: '', seoKeywords: [],
  canonical_url: '',
};

function mapToForm(tool) {
  return {
    ...EMPTY,
    ...tool,
    rating: String(tool.rating ?? ''),
    tags: tool.tags || [],
    features: tool.features || [],
    pros: tool.pros || [],
    cons: tool.cons || [],
    useCases: tool.useCases || [],
    alternatives: tool.alternatives || [],
    seoKeywords: tool.seoKeywords || [],
    screenshots: tool.screenshots || [],
    logo_url: tool.logo_url || '',
    logo_storage_path: tool.logo_storage_path || '',
  };
}

// ── Small sub-components ──────────────────────────────────────────────────────
function ListEditor({ label, items, onChange, placeholder = 'Add item…' }) {
  const [draft, setDraft] = useState('');
  function add() {
    const v = draft.trim();
    if (!v || items.includes(v)) return;
    onChange([...items, v]);
    setDraft('');
  }
  return (
    <div style={{ marginBottom: 16 }}>
      <span style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#9fb3d4', marginBottom: 8 }}>{label}</span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
        {items.map((item, i) => (
          <span key={i} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(20,255,244,0.08)', border: '1px solid rgba(20,255,244,0.2)',
            borderRadius: 6, padding: '4px 10px', fontSize: 12.5, color: '#e8f0ff',
          }}>
            {item}
            <button
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              style={{ background: 'none', border: 'none', color: '#6b82a8', cursor: 'pointer', padding: 0, fontSize: 13, lineHeight: 1 }}
            >×</button>
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder={placeholder}
          style={{ flex: 1, background: '#080d1a', border: '1px solid #2a3d5c', borderRadius: 8, padding: '8px 12px', color: '#e8f0ff', fontSize: 13 }}
        />
        <Button variant="secondary" onClick={add} style={{ padding: '8px 14px', fontSize: 12 }}>Add</Button>
      </div>
    </div>
  );
}

function ImageUploader({ label, currentUrl, onUpload, uploading, accept = 'image/*', style = {} }) {
  const fileRef = useRef(null);
  return (
    <div style={{ marginBottom: 16, ...style }}>
      <span style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#9fb3d4', marginBottom: 8 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {currentUrl && (
          <img src={currentUrl} alt="preview" style={{ width: 56, height: 56, objectFit: 'contain', borderRadius: 8, background: '#14213a', border: '1px solid #2a3d5c' }} />
        )}
        <Button
          variant="secondary"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          style={{ fontSize: 12, padding: '7px 14px' }}
        >
          {uploading ? 'Uploading…' : currentUrl ? 'Replace' : 'Upload'}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept={accept}
          style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) { onUpload(f); e.target.value = ''; } }}
        />
      </div>
    </div>
  );
}

// ── Main editor ───────────────────────────────────────────────────────────────
export default function ToolEditor({ mode, initialTool, onSaved }) {
  const auth = useAuth();
  const [form, setForm] = useState(() => mode === 'edit' && initialTool ? mapToForm(initialTool) : EMPTY);
  const [slugTouched, setSlugTouched] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);
  const [slugError, setSlugError] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const uid = auth.user?.uid;
  const set = useCallback((field, value) => setForm(f => ({ ...f, [field]: value })), []);

  function handleNameChange(value) {
    set('name', value);
    if (!slugTouched) set('slug', slugify(value));
  }

  async function validateSlug(slug) {
    if (!slug) { setSlugError('Slug is required.'); return false; }
    if (!/^[a-z0-9-]+$/.test(slug)) { setSlugError('Only lowercase letters, numbers, and hyphens.'); return false; }
    const taken = await isSlugTaken(slug, mode === 'edit' ? initialTool?.id : null);
    if (taken) { setSlugError('This slug is already in use.'); return false; }
    setSlugError('');
    return true;
  }

  function buildPayload(extra = {}) {
    const payload = {
      ...form,
      rating: parseFloat(form.rating) || 0,
      ...extra,
    };
    // Remove internal UI state
    delete payload.id;
    delete payload.created_at;
    delete payload.updated_at;
    delete payload.created_by;
    delete payload.updated_by;
    return payload;
  }

  async function save(extra = {}) {
    setSaving(true); setError(null); setSuccess(null);
    const slugOk = await validateSlug(form.slug);
    if (!slugOk) { setSaving(false); return null; }

    const payload = buildPayload(extra);
    const result = mode === 'create'
      ? await createTool(payload, uid)
      : await updateTool(initialTool.id, payload, uid);

    setSaving(false);
    if (result.error) { setError(result.error); return null; }
    return result.data;
  }

  async function handleSaveDraft() {
    const data = await save({ status: 'draft' });
    if (data) { setSuccess('Draft saved.'); onSaved?.(data); }
  }

  async function handlePublish() {
    const data = await save({ status: 'published', published_at: new Date().toISOString() });
    if (data) { setSuccess('Published.'); onSaved?.(data); }
  }

  async function handleUnpublish() {
    if (mode !== 'edit') return;
    setSaving(true); setError(null);
    const result = await unpublishTool(initialTool.id, uid);
    setSaving(false);
    if (result.error) { setError(result.error); return; }
    setSuccess('Unpublished.');
    onSaved?.(result.data);
  }

  async function handleDelete() {
    if (mode !== 'edit') return;
    if (!window.confirm(`Delete "${form.name}"? This cannot be undone.`)) return;
    setSaving(true);
    const result = await deleteTool(initialTool.id);
    setSaving(false);
    if (result.error) { setError(result.error); return; }
    onSaved?.({ deleted: true });
  }

  async function handleLogoUpload(file) {
    if (!form.slug) { setError('Set the slug before uploading images.'); return; }
    setUploadingLogo(true);
    if (form.logo_storage_path) await deleteStorageFile(form.logo_storage_path);
    const result = await uploadToolLogo(file, form.slug);
    setUploadingLogo(false);
    if (result.error) { setError(result.error); return; }
    set('logo_url', result.url);
    set('logo_storage_path', result.storagePath);
  }

  async function handleScreenshotUpload(file) {
    if (!form.slug) { setError('Set the slug before uploading images.'); return; }
    setUploadingScreenshot(true);
    const result = await uploadToolScreenshot(file, form.slug);
    setUploadingScreenshot(false);
    if (result.error) { setError(result.error); return; }
    set('screenshots', [...form.screenshots, { url: result.url, storagePath: result.storagePath, alt: '' }]);
  }

  async function removeScreenshot(i) {
    const shot = form.screenshots[i];
    if (shot.storagePath) await deleteStorageFile(shot.storagePath);
    set('screenshots', form.screenshots.filter((_, j) => j !== i));
  }

  function updateScreenshotAlt(i, alt) {
    const next = form.screenshots.map((s, j) => j === i ? { ...s, alt } : s);
    set('screenshots', next);
  }

  const currentStatus = mode === 'edit' ? (initialTool?.status || 'draft') : 'draft';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>
      {/* ── Left column — main content ── */}
      <div>
        <ErrorBanner message={error} />
        {success && (
          <div style={{ background: 'rgba(0,208,132,0.1)', border: '1px solid rgba(0,208,132,0.3)', borderRadius: 8, padding: '10px 14px', color: '#00d084', fontSize: 13, marginBottom: 16 }}>
            {success}
          </div>
        )}

        {/* Core info */}
        <AdminCard style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#6b82a8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 16 }}>Core Info</h3>
          <TextInput label="Tool Name *" value={form.name} onChange={e => handleNameChange(e.target.value)} placeholder="e.g. Midjourney" />
          <div>
            <TextInput
              label="Slug *"
              value={form.slug}
              onChange={e => { setSlugTouched(true); set('slug', slugify(e.target.value)); setSlugError(''); }}
              onBlur={() => form.slug && validateSlug(form.slug)}
              placeholder="e.g. midjourney"
            />
            {slugError && <p style={{ color: '#ff8080', fontSize: 12, marginTop: -10, marginBottom: 12 }}>{slugError}</p>}
          </div>
          <TextInput label="Short Description *" value={form.desc} onChange={e => set('desc', e.target.value)} placeholder="One-sentence summary shown in listings" />
          <TextArea label="Full Review (Markdown) *" rows={12} value={form.longDesc} onChange={e => set('longDesc', e.target.value)} style={{ fontFamily: 'monospace', fontSize: 13 }} />
        </AdminCard>

        {/* Features, Pros, Cons */}
        <AdminCard style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#6b82a8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 16 }}>Features & Verdict</h3>
          <ListEditor label="Key Features" items={form.features} onChange={v => set('features', v)} placeholder="e.g. 200K context window" />
          <ListEditor label="Pros" items={form.pros} onChange={v => set('pros', v)} placeholder="e.g. Best reasoning quality" />
          <ListEditor label="Cons" items={form.cons} onChange={v => set('cons', v)} placeholder="e.g. No image generation" />
          <ListEditor label="Use Cases" items={form.useCases} onChange={v => set('useCases', v)} placeholder="e.g. Long-form writing" />
        </AdminCard>

        {/* Images */}
        <AdminCard style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#6b82a8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 16 }}>Images</h3>
          <ImageUploader
            label="Logo (square PNG/SVG, min 200×200)"
            currentUrl={form.logo_url}
            onUpload={handleLogoUpload}
            uploading={uploadingLogo}
          />
          <div style={{ marginBottom: 8 }}>
            <span style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#9fb3d4', marginBottom: 8 }}>Screenshots</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
              {form.screenshots.map((shot, i) => (
                <div key={i} style={{ background: '#0c1522', border: '1px solid #1a2d4a', borderRadius: 8, padding: 8, width: 160 }}>
                  <img src={shot.url} alt={shot.alt} style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', borderRadius: 4, marginBottom: 6 }} />
                  <input
                    value={shot.alt}
                    onChange={e => updateScreenshotAlt(i, e.target.value)}
                    placeholder="Alt text…"
                    style={{ width: '100%', background: '#080d1a', border: '1px solid #2a3d5c', borderRadius: 6, padding: '5px 8px', fontSize: 11, color: '#e8f0ff', marginBottom: 6, boxSizing: 'border-box' }}
                  />
                  <Button variant="danger" onClick={() => removeScreenshot(i)} style={{ width: '100%', padding: '4px 0', fontSize: 11 }}>Remove</Button>
                </div>
              ))}
            </div>
            <Button
              variant="secondary"
              disabled={uploadingScreenshot}
              onClick={() => {
                const inp = document.createElement('input');
                inp.type = 'file'; inp.accept = 'image/*';
                inp.onchange = e => { const f = e.target.files?.[0]; if (f) handleScreenshotUpload(f); };
                inp.click();
              }}
              style={{ fontSize: 12, padding: '7px 14px' }}
            >
              {uploadingScreenshot ? 'Uploading…' : '+ Add Screenshot'}
            </Button>
          </div>
        </AdminCard>

        {/* SEO */}
        <AdminCard>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#6b82a8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 16 }}>SEO</h3>
          <TextInput label="SEO Title" value={form.seoTitle || ''} onChange={e => set('seoTitle', e.target.value)} placeholder="Defaults to tool name if blank" />
          <TextArea label="SEO Description" rows={2} value={form.seoDescription || ''} onChange={e => set('seoDescription', e.target.value)} placeholder="Defaults to short description if blank" />
          <ListEditor label="SEO Keywords" items={form.seoKeywords || []} onChange={v => set('seoKeywords', v)} placeholder="e.g. midjourney review" />
          <TextInput label="Canonical URL" value={form.canonical_url || ''} onChange={e => set('canonical_url', e.target.value)} placeholder="Leave blank to use default" />
        </AdminCard>
      </div>

      {/* ── Right sidebar ── */}
      <div style={{ position: 'sticky', top: 24 }}>
        {/* Publish controls */}
        <AdminCard style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#9fb3d4' }}>Status</span>
            <StatusBadge status={currentStatus} />
          </div>
          <Button onClick={handleSaveDraft} disabled={saving} variant="secondary" style={{ width: '100%', marginBottom: 8 }}>
            Save Draft
          </Button>
          <Button onClick={handlePublish} disabled={saving} style={{ width: '100%', marginBottom: 8 }}>
            {currentStatus === 'published' ? 'Update Published' : 'Publish'}
          </Button>
          {mode === 'edit' && currentStatus === 'published' && (
            <Button onClick={handleUnpublish} disabled={saving} variant="secondary" style={{ width: '100%', marginBottom: 8 }}>
              Unpublish
            </Button>
          )}
          {mode === 'edit' && (
            <Button onClick={handleDelete} disabled={saving} variant="danger" style={{ width: '100%', marginTop: 8 }}>
              Delete Tool
            </Button>
          )}
        </AdminCard>

        {/* Metadata */}
        <AdminCard style={{ marginBottom: 14 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#6b82a8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 }}>Metadata</h3>
          <Select label="Category *" value={form.category} onChange={e => set('category', e.target.value)}>
            <option value="">— Select —</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </Select>
          <Select label="Price Tier" value={form.priceTier} onChange={e => set('priceTier', e.target.value)}>
            {PRICE_TIERS.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </Select>
          <TextInput label="Price Label" value={form.price} onChange={e => set('price', e.target.value)} placeholder="e.g. Free / $20mo" />
          <TextInput label="Rating (0–5)" type="number" min="0" max="5" step="0.1" value={form.rating} onChange={e => set('rating', e.target.value)} />
          <TextInput label="Badge" value={form.badge || ''} onChange={e => set('badge', e.target.value)} placeholder="e.g. Editor's Choice" />
        </AdminCard>

        {/* Links */}
        <AdminCard style={{ marginBottom: 14 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#6b82a8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 }}>Links</h3>
          <TextInput label="Official URL *" value={form.website} onChange={e => set('website', e.target.value)} placeholder="https://example.com" />
          <TextInput label="Affiliate URL" value={form.affiliateLink || ''} onChange={e => set('affiliateLink', e.target.value)} placeholder="https://example.com/?ref=shabellehub" />
        </AdminCard>

        {/* Flags */}
        <AdminCard style={{ marginBottom: 14 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#6b82a8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 }}>Flags</h3>
          {[
            { field: 'featured', label: '⭐ Featured' },
            { field: 'hot',      label: '🔥 Trending / Hot' },
          ].map(({ field, label }) => (
            <label key={field} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={!!form[field]}
                onChange={e => set(field, e.target.checked)}
                style={{ width: 16, height: 16, accentColor: '#14FFF4', cursor: 'pointer' }}
              />
              <span style={{ fontSize: 13, color: '#e8f0ff' }}>{label}</span>
            </label>
          ))}
        </AdminCard>

        {/* Tags & Relations */}
        <AdminCard>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#6b82a8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 }}>Tags & Relations</h3>
          <ListEditor label="Tags" items={form.tags} onChange={v => set('tags', v)} placeholder="e.g. Writing" />
          <ListEditor label="Alternatives (slugs)" items={form.alternatives} onChange={v => set('alternatives', v)} placeholder="e.g. chatgpt" />
        </AdminCard>
      </div>
    </div>
  );
}
