import { NextResponse } from 'next/server';

import { AUTH_COOKIE_NAME, createDemoSession, parseLoginPayload } from '@/lib/auth-session';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

const setSessionCookie = (response: NextResponse, payload: Record<string, unknown>) => {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: JSON.stringify(payload),
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
};

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body && typeof body.idToken === 'string' && body.idToken.length > 0) {
      const adminAuth = getAdminAuth();
      const decoded = await adminAuth.verifyIdToken(body.idToken);
      const userRecord = await adminAuth.getUser(decoded.uid);

      const profileSnap = await getAdminDb().collection('space_users').doc(decoded.uid).get();
      const profile = (profileSnap.data() ?? {}) as {
        openSpaceId?: string;
        openSpaceName?: string;
      };

      if (!profile.openSpaceId || !profile.openSpaceName) {
        return NextResponse.json(
          { ok: false, message: 'No linked open space profile found for this account.' },
          { status: 403 }
        );
      }

      const response = NextResponse.json({
        ok: true,
        session: {
          id: `firebase-${decoded.uid}`,
          uid: decoded.uid,
          name: userRecord.displayName ?? decoded.name ?? 'Space Admin',
          email: userRecord.email ?? decoded.email ?? '',
          role: 'MINISTRY',
          openSpaceId: profile.openSpaceId,
          openSpaceName: profile.openSpaceName,
          signedInAt: new Date().toISOString(),
        },
      });

      setSessionCookie(response, {
        id: `firebase-${decoded.uid}`,
        uid: decoded.uid,
        role: 'MINISTRY',
        name: userRecord.displayName ?? decoded.name ?? 'Space Admin',
        email: userRecord.email ?? decoded.email ?? '',
        openSpaceId: profile.openSpaceId,
        openSpaceName: profile.openSpaceName,
      });

      return response;
    }

    const payload = parseLoginPayload(body);
    const session = createDemoSession(payload);

    const response = NextResponse.json({ ok: true, session });
    setSessionCookie(response, { id: session.id, role: session.role });

    return response;
  } catch {
    return NextResponse.json(
      { ok: false, message: 'Invalid login data. Provide valid name, email, and role.' },
      { status: 400 }
    );
  }
}
