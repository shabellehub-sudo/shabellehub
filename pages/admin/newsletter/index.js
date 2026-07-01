// pages/admin/newsletter/index.js — Phase 7A
// /admin/newsletter — Newsletter overview redirect to subscribers

import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function NewsletterIndex() {
  const router = useRouter();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { router.replace('/admin/newsletter/subscribers'); }, []);
  return null;
}
