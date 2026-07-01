import { useState } from 'react';
import { NextSeo } from 'next-seo';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const FIELDS = [
  { key: 'name',  label: 'Your Name',     type: 'text',  required: true },
  { key: 'email', label: 'Email Address', type: 'email', required: true },
];

export default function ContactPage() {
  const [form,    setForm]    = useState({ name: '', email: '', reason: '', message: '' });
  const [sent,    setSent]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const validate = () => {
    if (!form.name.trim())                 return 'Please enter your name.';
    if (!form.email.trim())                return 'Please enter your email address.';
    if (!EMAIL_RE.test(form.email.trim())) return 'Please enter a valid email address.';
    if (!form.message.trim())              return 'Please enter a message.';
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSent(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Something went wrong. Please try again or email us directly.');
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Allow Enter key to submit from any field (except textarea where Enter = newline)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && !loading) {
      handleSubmit();
    }
  };

  return (
    <>
      <NextSeo
        title="Contact — Submit a Tool or Partnership"
        description="Get in touch with Shabelle Hub. Submit a tool for review, ask about partnerships, or send feedback."
        canonical="https://shabellehub.com/contact"
        openGraph={{ title: 'Contact — Shabelle Hub', description: 'Get in touch with the Shabelle Hub team — corrections, tool submissions, and general enquiries.', url: 'https://shabellehub.com/contact', type: 'website', siteName: 'Shabelle Hub', images: [{ url: 'https://shabellehub.com/og-image.png', width: 1200, height: 630, alt: 'Contact — Shabelle Hub' }] }}
        twitter={{ handle: '@shabellehub', site: '@shabellehub', cardType: 'summary_large_image' }}
      />

      <div style={{ maxWidth: 520, margin: '0 auto', padding: '36px 20px' }}>
        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
          Get In Touch
        </h1>
        <p style={{ color: '#6b82a8', fontSize: 14, marginBottom: 28 }}>
          Submit a tool, discuss a partnership, or share feedback with the Shabelle Hub team.
        </p>

        {sent ? (
          <div style={{ background: 'rgba(20,255,244,0.06)', border: '1px solid rgba(20,255,244,0.2)', borderRadius: 12, padding: 24, color: '#14FFF4', fontWeight: 600, textAlign: 'center' }}>
            🚀 Message sent! We&rsquo;ll get back to you within 48 hours.
          </div>
        ) : (
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
            onKeyDown={handleKeyDown}
          >
            {error && (
              <div role="alert" style={{ background: 'rgba(255,77,109,0.08)', border: '1px solid rgba(255,77,109,0.3)', borderRadius: 8, padding: '10px 14px', color: '#ff4d6d', fontSize: 13 }}>
                {error}
              </div>
            )}

            {FIELDS.map(f => (
              <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label
                  htmlFor={`contact-${f.key}`}
                  style={{ fontSize: 12, fontWeight: 600, color: '#6b82a8', textTransform: 'uppercase', letterSpacing: '0.5px' }}
                >
                  {f.label}
                  {f.required && <span aria-hidden="true" style={{ color: '#ff4d6d', marginLeft: 2 }}>*</span>}
                </label>
                <input
                  id={`contact-${f.key}`}
                  type={f.type}
                  value={form[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  required={f.required}
                  aria-required={f.required}
                  autoComplete={f.key === 'email' ? 'email' : 'name'}
                  style={{
                    background: '#0f1829', border: '1px solid #1a2d4a', borderRadius: 10,
                    padding: '13px 14px', color: '#e8f0ff', fontSize: 14, outline: 'none', width: '100%',
                  }}
                />
              </div>
            ))}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label htmlFor="contact-reason" style={{ fontSize: 12, fontWeight: 600, color: '#6b82a8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Reason
              </label>
              <select
                id="contact-reason"
                value={form.reason}
                onChange={e => setForm(p => ({ ...p, reason: e.target.value }))}
                style={{
                  background: '#0f1829', border: '1px solid #1a2d4a', borderRadius: 10,
                  padding: '13px 14px', color: form.reason ? '#e8f0ff' : '#6b82a8',
                  fontSize: 14, outline: 'none', cursor: 'pointer',
                }}
              >
                <option value="">Select reason...</option>
                <option value="tool">Submit a tool for review</option>
                <option value="affiliate">Affiliate / Partnership</option>
                <option value="feedback">Feedback</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label htmlFor="contact-message" style={{ fontSize: 12, fontWeight: 600, color: '#6b82a8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Message <span aria-hidden="true" style={{ color: '#ff4d6d' }}>*</span>
              </label>
              <textarea
                id="contact-message"
                rows={5}
                value={form.message}
                onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                required
                aria-required="true"
                placeholder="How can we help?"
                style={{
                  background: '#0f1829', border: '1px solid #1a2d4a', borderRadius: 10,
                  padding: '13px 14px', color: '#e8f0ff', fontSize: 14, outline: 'none',
                  resize: 'vertical', width: '100%', minHeight: 120,
                }}
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              aria-busy={loading}
              style={{
                background: '#14FFF4', color: '#080d1a', border: 'none',
                borderRadius: 10, padding: 14, fontWeight: 800, fontSize: 14,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                width: '100%', transition: 'opacity 0.2s',
              }}
            >
              {loading ? 'Sending…' : 'Send Message'}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
