import { NextSeo } from 'next-seo';
import Link from 'next/link';
import { siteConfig } from '../data';
import { PageTitle } from '../components/ui';

const SECTIONS = [
  {
    title: 'What ShabelleHub Is',
    body: 'ShabelleHub is an AI-tools discovery directory and blog: 102 tool listings and 87 articles, built on Next.js 14, Supabase/PostgreSQL, and deployed on Vercel. It includes a custom Admin CMS for managing listings and content, and an automated monitoring pipeline (GitHub Actions, twice-daily) that detects real pricing and status changes across listed tools and routes them through human review before anything is published.',
  },
  {
    title: 'What\u2019s Included',
    body: 'The full codebase and GitHub repository, the Supabase database (tools, posts, and the change-monitoring schema), the monitoring pipeline, the admin CMS, and existing SEO groundwork (structured data, sitemaps, editorial pages). Active affiliate relationships (currently Sembly AI and Profitio) would need to be re-established by the new owner under their own accounts.',
  },
  {
    title: 'Where It Stands Financially',
    body: 'ShabelleHub is pre-revenue. Two affiliate programs are live as of September 2026. Organic search traffic is early-stage; Google Search Console data is available on request for serious inquiries.',
  },
  {
    title: 'Why It\u2019s For Sale',
    body: 'The founder built and has operated ShabelleHub solo, entirely from an Android phone, and is currently looking for a quicker path to income than continuing to grow it independently. Open to a fair offer reflecting its pre-revenue stage.',
  },
  {
    title: 'How to Inquire',
    body: 'Serious inquiries only, please. Reach out via the contact page with a brief note about your background and what you\u2019re looking for \u2014 happy to share repo access, traffic data, and a walkthrough of the codebase and monitoring pipeline.',
  },
];

export default function SiteForSalePage() {
  const canonical = `${siteConfig.url}/this-site-is-for-sale`;
  const title = 'ShabelleHub Is For Sale — Acquisition Details';
  const description = 'ShabelleHub, a solo-built AI tools directory and blog, is available for acquisition. Tech stack, financials, and inquiry details.';

  return (
    <>
      <NextSeo
        title={title}
        description={description}
        canonical={canonical}
        openGraph={{ title, description, url: canonical, type: 'website' }}
      />
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 20px 80px' }}>
        <PageTitle sub="Pre-revenue, solo-built, and open to a fair offer.">
          This Site Is For Sale
        </PageTitle>

        {SECTIONS.map((s) => (
          <div key={s.title} style={{ marginTop: 28 }}>
            <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 18, color: '#e8f0ff', marginBottom: 8 }}>
              {s.title}
            </h2>
            <p style={{ color: '#8ba3ca', fontSize: 14, lineHeight: 1.7 }}>{s.body}</p>
          </div>
        ))}

        <div style={{ marginTop: 36, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <Link href="/contact" style={{ color: '#14FFF4', textDecoration: 'underline' }}>
            Contact →
          </Link>
          <a
            href="https://wa.me/252616956634"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#14FFF4', textDecoration: 'underline' }}
          >
            WhatsApp →
          </a>
        </div>
      </div>
    </>
  );
}
