// middleware.js — Edge-compatible admin route protection
// The Supabase JS SDK is heavy for the Edge runtime, so we use a session
// cookie (__session) as a lightweight presence signal. The actual security
// boundary is Postgres Row Level Security + Supabase Auth token verification
// in each API route — the middleware is purely a UX redirect gate.
//
// Loop prevention:
//   - /admin/login is explicitly excluded from the matcher
//   - We never redirect FROM /admin/login, so there's no loop possible
//   - Matcher is limited to /admin paths only

import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // /admin/login never needs a session — always allow through
  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  const isConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL.length > 10 &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('YOUR');

  // If Supabase isn't configured, redirect to login which shows the setup guide
  if (!isConfigured) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin/login';
    url.search = '';
    return NextResponse.redirect(url);
  }

  // Check for our session cookie
  const sessionCookie = request.cookies.get('__session');
  const hasSession = Boolean(sessionCookie?.value);

  if (!hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin/login';
    // Preserve the intended destination so login can redirect back
    url.search = `?from=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // IMPORTANT: explicitly exclude /admin/login from middleware
  // to prevent any possible redirect loop
  matcher: [
    '/admin',
    '/admin/((?!login).+)',
  ],
};
