import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { limitByIp, clientIp } from '@/lib/ratelimit';

const PUBLIC_PATHS = ['/', '/login', '/signup', '/check-email', '/auth/confirm', '/auth/error'];

function buildCsp(nonce) {
  const supa = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supaWs = supa.replace(/^https:/, 'wss:');
  const dev = process.env.NODE_ENV !== 'production';
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: https://i.ytimg.com https://yt3.ggpht.com https://yt3.googleusercontent.com ${supa}`,
    "frame-src https://www.youtube-nocookie.com",
    "font-src 'self'",
    `connect-src 'self' ${supa} ${supaWs}`,
    "worker-src 'self' blob:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    'upgrade-insecure-requests'
  ].join('; ');
}

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  // 1) Rate limit every API route: 100 requests / minute / IP
  if (pathname.startsWith('/api/')) {
    const r = await limitByIp(clientIp(req));
    if (!r.success) {
      return NextResponse.json({ error: 'Too many requests. Try again in a minute.' }, {
        status: 429,
        headers: { 'Retry-After': '60', 'X-RateLimit-Limit': String(r.limit), 'X-RateLimit-Remaining': '0', 'Cache-Control': 'no-store' }
      });
    }
  }

  // 2) Nonce-based Content Security Policy (Next applies the nonce to its own scripts)
  const nonce = btoa(crypto.randomUUID());
  const csp = buildCsp(nonce);
  const reqHeaders = new Headers(req.headers);
  reqHeaders.set('x-nonce', nonce);
  reqHeaders.set('Content-Security-Policy', csp);

  let res = NextResponse.next({ request: { headers: reqHeaders } });

  // 3) Refresh the Supabase session cookie and read the user
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => req.cookies.set(name, value));
        res = NextResponse.next({ request: { headers: reqHeaders } });
        list.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      }
    }
  });
  const { data: { user } } = await supabase.auth.getUser();

  const isPublic = PUBLIC_PATHS.includes(pathname);
  const isApi = pathname.startsWith('/api/');

  // 4) Protect the app: signed-out users go to /login; signed-in users skip login/signup
  if (!user && !isPublic && !isApi) {
    const url = req.nextUrl.clone(); url.pathname = '/login'; url.search = '';
    return NextResponse.redirect(url);
  }
  if (user && (pathname === '/login' || pathname === '/signup' || pathname === '/')) {
    const url = req.nextUrl.clone(); url.pathname = '/cook'; url.search = '';
    return NextResponse.redirect(url);
  }

  res.headers.set('Content-Security-Policy', csp);
  // 5) Never cache authenticated pages or API responses (shared caches, back button, CDN)
  if (user || isApi) {
    res.headers.set('Cache-Control', 'private, no-store, no-cache, must-revalidate, max-age=0');
    res.headers.set('Pragma', 'no-cache');
    res.headers.set('Expires', '0');
  }
  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg|sw.js|manifest.webmanifest|stamps/|thumbs/|.*\\.(?:png|jpg|jpeg|webp|svg|ico|woff2?)$).*)']
};
