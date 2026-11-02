import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { listSpaces } from '@/lib/spaces-service';

const signupSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120),
  password: z.string().min(8).max(72),
  openSpaceName: z.string().trim().min(2).max(180),
});

const normalize = (value: string) => value.trim().toLowerCase();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = signupSchema.parse(body);

    const matchedSpace = listSpaces().find(
      (space) => normalize(space.name) === normalize(payload.openSpaceName)
    );

    if (!matchedSpace) {
      return NextResponse.json(
        {
          ok: false,
          message:
            'Open space not found in the registered list. Please select a valid registered open space name.',
        },
        { status: 400 }
      );
    }

    const adminAuth = getAdminAuth();
    const createdUser = await adminAuth.createUser({
      email: payload.email,
      password: payload.password,
      displayName: payload.name,
      emailVerified: false,
      disabled: false,
    });

    await getAdminDb().collection('space_users').doc(createdUser.uid).set(
      {
        uid: createdUser.uid,
        name: payload.name,
        email: payload.email,
        openSpaceId: matchedSpace.id,
        openSpaceName: matchedSpace.name,
        role: 'SPACE_ADMIN',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    return NextResponse.json({
      ok: true,
      message: 'Account created successfully. You can now sign in.',
      user: {
        uid: createdUser.uid,
        email: createdUser.email,
        displayName: createdUser.displayName,
        openSpaceId: matchedSpace.id,
        openSpaceName: matchedSpace.name,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, message: 'Invalid signup data.', issues: error.flatten() },
        { status: 400 }
      );
    }

    const errorMessage =
      error instanceof Error && /already exists|email-already-exists/i.test(error.message)
        ? 'An account with this email already exists. Please sign in.'
        : 'Unable to create account at this time.';

    return NextResponse.json({ ok: false, message: errorMessage }, { status: 400 });
  }
}
