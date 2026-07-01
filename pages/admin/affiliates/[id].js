// pages/admin/affiliates/[id].js — Edit an existing affiliate link
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import AdminLayout from '../../../components/admin/AdminLayout';
import AffiliateForm from '../../../components/admin/AffiliateForm';
import { Button, ErrorBanner } from '../../../components/admin/ui';
import { useAuth } from '../../../lib/cms/useAuth';

export default function EditAffiliate() {
  const router  = useRouter();
  const { id }  = router.query;
  const auth    = useAuth();

  const [form,     setForm]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error,    setError]    = useState(null);
  const [success,  setSuccess]  = useState(false);

  // ── Load existing record ────────────────────────────────────────────────────
  useEffect(() => {
    if (!id || !auth.user) return;
    async function load() {
      setLoading(true); setError(null);
      try {
        const token = await auth.user.getIdToken();
        const res   = await fetch(`/api/admin/affiliates/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const body = await res.json();
        if (!res.ok) { setError(body.error); setLoading(false); return; }
        // Normalise — coerce nulls to empty strings for controlled inputs
        const d = body.data;
        setForm({
          programName:     d.programName     ?? '',
          affiliateUrl:    d.affiliateUrl    ?? '',
          trackingCode:    d.trackingCode    ?? '',
          toolSlug:        d.toolSlug        ?? '',
          toolId:          d.toolId          ?? '',
          commissionType:  d.commissionType  ?? 'percent',
          commissionValue: d.commissionValue ?? '',
          cookieDays:      d.cookieDays      ?? '',
          status:          d.status          ?? 'draft',
          disclosureText:  d.disclosureText  ?? '',
          notes:           d.notes           ?? '',
        });
      } catch (err) {
        setError(err.message);
      }
      setLoading(false);
    }
    load();
  }, [id, auth.user]);

  // ── Save ────────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!form.programName.trim()) { setError('Program name is required.'); return; }
    if (!form.affiliateUrl.trim()) { setError('Affiliate URL is required.'); return; }
    setSaving(true); setError(null); setSuccess(false);
    try {
      const token = await auth.user?.getIdToken();
      const res   = await fetch(`/api/admin/affiliates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const body = await res.json();
      if (!res.ok) { setError(body.error); setSaving(false); return; }
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  }

  // ── Delete ──────────────────────────────────────────────────────────────────
  async function handleDelete() {
    if (!window.confirm(`Delete "${form?.programName}"? This cannot be undone.`)) return;
    setDeleting(true); setError(null);
    try {
      const token = await auth.user?.getIdToken();
      const res   = await fetch(`/api/admin/affiliates/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = await res.json();
        setError(body.error); setDeleting(false); return;
      }
      router.push('/admin/affiliates');
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  }

  return (
    <AdminLayout title={form ? `Edit: ${form.programName}` : 'Edit Affiliate Link'}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <Link href="/admin/affiliates" style={{ fontSize: 13, color: '#6b82a8', textDecoration: 'none' }}>
          ← Back to Affiliate Links
        </Link>
        {auth.isAdmin && form && (
          <Button onClick={handleDelete} disabled={deleting} style={{
            background: 'rgba(255,77,109,0.1)', color: '#ff4d6d',
            border: '1px solid rgba(255,77,109,0.3)',
          }}>
            {deleting ? 'Deleting…' : 'Delete Link'}
          </Button>
        )}
      </div>

      {success && (
        <div style={{
          background: 'rgba(0,208,132,0.1)', border: '1px solid rgba(0,208,132,0.3)',
          borderRadius: 8, padding: '10px 16px', color: '#00d084', fontSize: 13, marginBottom: 20,
        }}>
          ✓ Changes saved successfully.
        </div>
      )}

      {loading ? (
        <p style={{ color: '#6b82a8', fontSize: 13 }}>Loading affiliate link…</p>
      ) : form ? (
        <AffiliateForm
          form={form}
          onChange={setForm}
          onSubmit={handleSubmit}
          saving={saving}
          error={error}
          isEdit={true}
        />
      ) : (
        <ErrorBanner message={error || 'Affiliate link not found.'} />
      )}
    </AdminLayout>
  );
}
