import { NextSeo } from 'next-seo';
import Link from 'next/link';

const SECTIONS = [
  {
    title: 'Information We Collect',
    body: 'We collect information you provide directly, such as your email address when subscribing to our newsletter or submitting our contact form. We may also use third-party analytics tools to understand aggregate site usage, such as which pages are visited. We do not sell your personal data.',
  },
  {
    title: 'How We Use Your Information',
    body: 'We use the email address you provide to deliver newsletter content (if you subscribe) or to respond to your contact form submission. We use any analytics data to improve site content and understand which tools and articles are most useful to readers.',
  },
  {
    title: 'Cookies and Similar Technologies',
    body: 'We use cookies or local storage to remember your preferences, such as tools you have saved. If we enable an analytics service, it may set its own cookies to measure site usage. You can disable cookies in your browser settings, though this may affect site functionality such as saved tools.',
  },
  {
    title: 'Advertising',
    body: "This site may display advertisements served by Google AdSense and other third-party advertising networks. These networks may use cookies, device identifiers, and similar technologies to serve ads based on your visits to this and other websites. Google's use of advertising cookies enables it and its partners to serve ads based on your visit to this site and/or other sites on the internet. You can opt out of personalized advertising by visiting Google's Ads Settings, and you can learn more about how Google uses data from sites that use its services at Google's Privacy & Terms site.",
  },
  {
    title: 'Affiliate Links',
    body: 'Some links on this site are affiliate links. Clicking them and making a purchase or signing up may result in us receiving a commission. This does not affect our editorial opinions or rankings. See our Affiliate Disclosure for details.',
  },
  {
    title: 'Contact',
    body: 'Questions about this privacy policy? Use the Contact page to reach the Shabelle Hub team.',
  },
];

export default function PrivacyPage() {
  return (
    <>
      {/* FIX #8/#18: strip brand suffix */}
      <NextSeo
        title="Privacy Policy"
        description="Privacy policy for Shabelle Hub — how we collect, use, and protect your data."
        canonical="https://shabellehub.com/privacy"
        openGraph={{ title: 'Privacy Policy — Shabelle Hub', description: 'Shabelle Hub privacy policy — how we collect, use, and protect your data.', url: 'https://shabellehub.com/privacy', type: 'website', siteName: 'Shabelle Hub', images: [{ url: 'https://shabellehub.com/og-image.png', width: 1200, height: 630, alt: 'Privacy Policy — Shabelle Hub' }] }}
        twitter={{ handle: '@shabellehub', site: '@shabellehub', cardType: 'summary_large_image' }}
      />
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '36px 20px' }}>
        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 28, fontWeight: 800, marginBottom: 32 }}>
          Privacy Policy
        </h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {SECTIONS.map((s, i) => (
            <div key={i}>
              <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 16, fontWeight: 700, marginBottom: 8, color: '#e8f0ff' }}>
                {s.title}
              </h2>
              <p style={{ color: '#6b82a8', fontSize: 14, lineHeight: 1.7 }}>{s.body}</p>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid #1a2d4a' }}>
          <p style={{ color: '#6b82a8', fontSize: 13 }}>
            See also:{' '}
            <Link href="/affiliate-disclosure" style={{ color: '#14FFF4' }}>Affiliate Disclosure</Link>
          </p>
        </div>
      </div>
    </>
  );
}
