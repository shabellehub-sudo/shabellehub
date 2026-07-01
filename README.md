# ShabelleHub v1.0

AI Tools discovery and review platform built with Next.js 14, Firebase, and Firestore.

## Stack

- **Frontend**: Next.js 14 (Pages Router), React 18
- **Database**: Firebase Firestore
- **Auth**: Firebase Authentication
- **Storage**: Firebase Storage
- **SEO**: next-seo
- **Email**: Resend (via native fetch — no extra npm deps)
- **Deployment**: Vercel

## Features

### Public Platform
- AI Tools directory with affiliate integration
- Rich blog with block-based content (10 block types)
- Author and reviewer profiles
- Newsletter signup (homepage, footer, blog inline)
- AdSense integration
- Structured data + full SEO framework

### Admin CMS (/admin)
- Homepage, Navigation, Footer, Site Settings CMS
- Blog post editor with BlockEditor
- Tools CMS with affiliate link management
- Authors, Reviewers, Categories, Tags management
- Media library (Firebase Storage)
- Newsletter: Subscribers, Templates, Campaigns
- Affiliate program management
- Announcement banner
- User/role management

### Newsletter Platform
- Subscriber management with search, filter, CSV export
- Newsletter builder (reuses BlockEditor)
- Campaign wizard and management
- Email delivery via Resend API
- Open rate + click rate analytics

## Quick Start

```bash
cp .env.local.example .env.local
# Fill in Firebase + Resend credentials
npm install
npm run dev
```

## Environment Variables

See `.env.local.example` for all required variables.

## Firebase Setup

```bash
npm install -g firebase-tools
firebase login
firebase use <your-project-id>
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
firebase deploy --only storage
```

## Deployment

Connect to Vercel, add all env vars from `.env.local.example`, deploy.

See `AUDIT_REPORT.md` for the complete deployment, testing, and launch checklist.

## Audit

Run `node scripts/check-env-leakage.js` to verify no Firebase Admin secrets
are exposed in browser-facing files. This also runs automatically as a
prebuild step.
