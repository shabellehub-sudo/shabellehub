// components/admin/AffiliateForm.js
// Shared form for create & edit affiliate links — used by new.js and [id].js
import { AdminCard, Button, ErrorBanner } from './ui';

const FIELD = ({ label, required, hint, children }) => (
  <div style={{ marginBottom: 18 }}>
    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#9fb3d4', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
      {label}{required && <span style={{ color: '#ff4d6d', marginLeft: 3 }}>*</span>}
    </label>
    {children}
    {hint && <p style={{ fontSize: 11, color: '#3d5470', marginTop: 4 }}>{hint}</p>}
  </div>
);

const INPUT = ({ value, onChange, placeholder, type = 'text', ...rest }) => (
  <input
    type={type}
    value={value ?? ''}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    {...rest}
    style={{
      width: '100%', boxSizing: 'border-box',
      background: '#080d1a', border: '1px solid #1a2d4a', borderRadius: 8,
      padding: '9px 12px', fontSize: 13, color: '#e8f0ff',
      outline: 'none', fontFamily: 'Inter, sans-serif',
    }}
  />
);

const SELECT = ({ value, onChange, children }) => (
  <select value={value ?? ''} onChange={e => onChange(e.target.value)} style={{
    width: '100%', background: '#080d1a', border: '1px solid #1a2d4a', borderRadius: 8,
    padding: '9px 12px', fontSize: 13, color: '#e8f0ff',
    outline: 'none', fontFamily: 'Inter, sans-serif',
  }}>
    {children}
  </select>
);

const TEXTAREA = ({ value, onChange, placeholder, rows = 3 }) => (
  <textarea
    value={value ?? ''}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    rows={rows}
    style={{
      width: '100%', boxSizing: 'border-box', resize: 'vertical',
      background: '#080d1a', border: '1px solid #1a2d4a', borderRadius: 8,
      padding: '9px 12px', fontSize: 13, color: '#e8f0ff',
      outline: 'none', fontFamily: 'Inter, sans-serif',
    }}
  />
);

export default function AffiliateForm({ form, onChange, onSubmit, saving, error, isEdit = false }) {
  function set(key) {
    return (val) => onChange({ ...form, [key]: val });
  }

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(); }} noValidate>
      <ErrorBanner message={error} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>

        {/* Left column */}
        <AdminCard>
          <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 14, fontWeight: 700, color: '#e8f0ff', marginBottom: 16 }}>
            Program Info
          </h3>

          <FIELD label="Program Name" required>
            <INPUT value={form.programName} onChange={set('programName')} placeholder="e.g. Jasper AI Affiliate Program" />
          </FIELD>

          <FIELD label="Affiliate URL" required hint="The full URL with your affiliate tracking parameters.">
            <INPUT value={form.affiliateUrl} onChange={set('affiliateUrl')} placeholder="https://app.jasper.ai/signup?fpr=yourcode" />
          </FIELD>

          <FIELD label="Tracking Code" hint="Your unique affiliate/referral code if separate from URL.">
            <INPUT value={form.trackingCode} onChange={set('trackingCode')} placeholder="yourcode123" />
          </FIELD>

          <FIELD label="Status">
            <SELECT value={form.status} onChange={set('status')}>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
            </SELECT>
          </FIELD>
        </AdminCard>

        {/* Right column */}
        <AdminCard>
          <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 14, fontWeight: 700, color: '#e8f0ff', marginBottom: 16 }}>
            Tool Association
          </h3>

          <FIELD label="Tool Slug" hint="Matches the tool's slug in Firestore/data/index.js. Leave blank for a program-level link.">
            <INPUT value={form.toolSlug} onChange={set('toolSlug')} placeholder="jasper-ai" />
          </FIELD>

          <FIELD label="Tool ID" hint="Optional Firestore document ID of the tool.">
            <INPUT value={form.toolId} onChange={set('toolId')} placeholder="Firestore doc ID" />
          </FIELD>
        </AdminCard>

        {/* Commission */}
        <AdminCard>
          <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 14, fontWeight: 700, color: '#e8f0ff', marginBottom: 16 }}>
            Commission Details
          </h3>

          <FIELD label="Commission Type">
            <SELECT value={form.commissionType} onChange={set('commissionType')}>
              <option value="percent">Percent (%)</option>
              <option value="flat">Flat ($)</option>
              <option value="variable">Variable</option>
            </SELECT>
          </FIELD>

          <FIELD label="Commission Value" hint="Numeric value (e.g. 30 for 30%, or 50 for $50).">
            <INPUT type="number" value={form.commissionValue} onChange={set('commissionValue')} placeholder="30" />
          </FIELD>

          <FIELD label="Cookie Days" hint="How long the affiliate cookie lasts in days.">
            <INPUT type="number" value={form.cookieDays} onChange={set('cookieDays')} placeholder="30" />
          </FIELD>
        </AdminCard>

        {/* Disclosure */}
        <AdminCard>
          <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 14, fontWeight: 700, color: '#e8f0ff', marginBottom: 16 }}>
            Disclosure & Notes
          </h3>

          <FIELD label="Disclosure Text" hint="Shown on tool pages if set. Falls back to the site default disclosure.">
            <TEXTAREA
              value={form.disclosureText}
              onChange={set('disclosureText')}
              placeholder="We may earn a commission if you purchase through this link, at no extra cost to you."
              rows={3}
            />
          </FIELD>

          <FIELD label="Internal Notes" hint="Not shown publicly. Use for program terms, payout history, etc.">
            <TEXTAREA
              value={form.notes}
              onChange={set('notes')}
              placeholder="30-day cookie, pays out monthly via PayPal, min $50 threshold."
              rows={3}
            />
          </FIELD>
        </AdminCard>
      </div>

      {/* Submit */}
      <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Affiliate Link'}
        </Button>
      </div>
    </form>
  );
}
