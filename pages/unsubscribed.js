// pages/unsubscribed.js
import { NextSeo } from 'next-seo';
import { useRouter } from 'next/router';
import Link from 'next/link';

const MESSAGES = {
  success: { title: 'You have been unsubscribed', body: "You won't receive any more newsletter emails from us. Sorry to see you go." },
  invalid: { title: 'Invalid unsubscribe link', body: 'This unsubscribe link is missing or malformed. Please try again from a recent newsletter email.' },
  error: { title: 'Something went wrong', body: "We couldn't process your unsubscribe request right now. Please try again shortly." },
};

export default function UnsubscribedPage() {
  const router = useRouter();
  const status = typeof router.query.status === 'string' ? router.query.status : 'success';
  const msg = MESSAGES[status] || MESSAGES.success;

  return (
    <>
      <NextSeo title={msg.title} noindex nofollow />
      <div style={{ maxWidth: 480, margin: '80px auto', padding: '0 20px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 24, fontWeight: 800, color: '#e8f0ff', marginBottom: 12 }}>
          {msg.title}
        </h1>
        <p style={{ color: '#8ba3ca', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>{msg.body}</p>
        <Link href="/" style={{ color: '#14FFF4', fontSize: 14, textDecoration: 'none' }}>← Back to Shabelle Hub</Link>
      </div>
    </>
  );
}
