// pages/admin/affiliates/new.js — Create a new affiliate link
import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import AdminLayout from '../../../components/admin/AdminLayout';
import AffiliateForm from '../../../components/admin/AffiliateForm';
import { useAuth } from '../../../lib/cms/useAuth';

const EMPTY = {
  programName:    '',
  affiliateUrl:   '',
  trackingCode:   '',
  toolSlug:       '',
  toolId:         '',
  commissionType: 'percent',
  commissionValue:'',
  cookieDays:     '',
  status:         'draft',
  disclosureText: '',
  notes:          '',
};

export default function NewAffiliate() {
  const router  = useRouter();
  const auth    = useAuth();
  const [form,    setForm]    = useState(EMPTY);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState(null);

  async function handleSubmit() {
    if (!form.programName.trim()) { setError('Program name is required.'); return; }
    if (!form.affiliateUrl.trim()) { setError('Affiliate URL is required.'); return; }
    setSaving(true); setError(null);
    try {
      const token = await auth.user?.getIdToken();
      const res   = await fetch('/api/admin/affiliates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const body = await res.json();
      if (!res.ok) { setError(body.error); setSaving(false); return; }
      router.push('/admin/affiliates');
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <AdminLayout title="New Affiliate Link">
      <div style={{ marginBottom: 20 }}>
        <Link href="/admin/affiliates" style={{ fontSize: 13, color: '#6b82a8', textDecoration: 'none' }}>
          ← Back to Affiliate Links
        </Link>
      </div>
      <AffiliateForm
        form={form}
        onChange={setForm}
        onSubmit={handleSubmit}
        saving={saving}
        error={error}
        isEdit={false}
      />
    </AdminLayout>
  );
}
