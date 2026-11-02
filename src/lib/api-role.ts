import { NextResponse } from 'next/server';

import { AUTH_COOKIE_NAME, parseSessionCookieValue } from '@/lib/auth-session';
import type { DemoRole } from '@/types/operations';

const isDemoRole = (value: unknown): value is DemoRole => {
  return value === 'ADMIN' || value === 'MINISTRY' || value === 'FIELD_OFFICER';
};

export const getSessionContext = (request: Request) => {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;

  const cookies = parseCookieHeader(cookieHeader);
  const sessionCookie = cookies[AUTH_COOKIE_NAME];
  if (!sessionCookie) return null;

  return parseSessionCookieValue(sessionCookie);
};

const parseCookieHeader = (cookieHeader: string): Record<string, string> => {
  return cookieHeader
    .split(';')
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, pair) => {
      const separator = pair.indexOf('=');
      if (separator <= 0) return acc;
      const key = pair.slice(0, separator);
      const value = pair.slice(separator + 1);

      // Guard against malformed percent-encoding in non-app cookies.
      try {
        acc[key] = decodeURIComponent(value);
      } catch {
        acc[key] = value;
      }

      return acc;
    }, {});
};

export const getRequestRole = (request: Request): DemoRole | null => {
  const session = getSessionContext(request);
  if (!session || !isDemoRole(session.role)) return null;
  return session.role;
};

export const requireAnyRole = (request: Request) => {
  const role = getRequestRole(request);
  if (!role) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      ),
    };
  }

  return {
    ok: true as const,
    role,
  };
};

export const requireRoles = (request: Request, allowedRoles: DemoRole[]) => {
  const roleResult = requireAnyRole(request);
  if (!roleResult.ok) {
    return roleResult;
  }

  if (!allowedRoles.includes(roleResult.role)) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { success: false, message: 'Forbidden for current role' },
        { status: 403 }
      ),
    };
  }

  return roleResult;
};

export const requireSpaceSession = (request: Request) => {
  const session = getSessionContext(request);

  if (!session?.uid || !session.openSpaceId || !session.openSpaceName) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { success: false, message: 'Open space authentication required' },
        { status: 401 }
      ),
    };
  }

  const spaceSession = {
    ...session,
    uid: session.uid,
    openSpaceId: session.openSpaceId,
    openSpaceName: session.openSpaceName,
  };

  return {
    ok: true as const,
    session: spaceSession,
  };
};
