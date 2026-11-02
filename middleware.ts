import { NextResponse } from 'next/server';

import { AUTH_COOKIE_NAME, parseSessionCookieValue } from '@/lib/auth-session';

import type { DemoRole } from '@/types/operations';
import type { NextRequest } from 'next/server';

const PROTECTED_PREFIXES = [
  '/admin',
  '/automobiles',
  '/spaces',
  '/bookings',
  '/reports',
  '/audit',
  '/settings',
];

const isProtectedPath = (path: string) =>
  PROTECTED_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));

const readRole = (cookieValue: string | undefined): DemoRole | null => {
  if (!cookieValue) return null;

  const parsed = parseSessionCookieValue(cookieValue);
  if (!parsed) return null;

  if (parsed.role === 'ADMIN' || parsed.role === 'MINISTRY' || parsed.role === 'FIELD_OFFICER') {
    return parsed.role;
  }

  return null;
};

const isForbiddenForRole = (path: string, role: DemoRole): boolean => {
  const isReportsPath = path === '/automobiles/reports' || path.startsWith('/automobiles/reports/');
  const isIdlePath = path === '/automobiles/idle' || path.startsWith('/automobiles/idle/');

  if (role === 'FIELD_OFFICER' && (isReportsPath || isIdlePath)) {
    return true;
  }

  return false;
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cookieValue = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const role = readRole(cookieValue);
  const session = cookieValue ? parseSessionCookieValue(cookieValue) : null;
  const hasSpacesAuthSession = Boolean(session?.uid && session?.openSpaceName);

  const isSpacesAuthPath = pathname === '/spaces/auth';
  const isSpacesPath = pathname === '/spaces' || pathname.startsWith('/spaces/');

  if (isSpacesPath && !isSpacesAuthPath && !hasSpacesAuthSession) {
    return NextResponse.redirect(new URL('/spaces/auth', request.url));
  }

  if (role && isForbiddenForRole(pathname, role)) {
    return NextResponse.redirect(new URL('/automobiles', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/automobiles/:path*',
    '/spaces/auth',
    '/spaces/:path*',
    '/bookings/:path*',
    '/reports/:path*',
    '/audit/:path*',
    '/settings/:path*',
  ],
};
