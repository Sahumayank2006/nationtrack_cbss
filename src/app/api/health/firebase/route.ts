import { NextResponse } from 'next/server';

import { getAdminDb, isFirebaseAdminConfigured } from '@/lib/firebase-admin';

export async function GET() {
  if (!isFirebaseAdminConfigured) {
    return NextResponse.json(
      {
        success: false,
        backend: 'firebase-admin',
        reachable: false,
        error:
          'Firebase Admin is not configured. Add FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY to your environment.',
      },
      { status: 503 }
    );
  }

  try {
    const adminDb = getAdminDb();
    const snapshot = await adminDb.collection('_health').limit(1).get();

    return NextResponse.json({
      success: true,
      backend: 'firebase-admin',
      projectId: process.env.FIREBASE_PROJECT_ID,
      reachable: true,
      healthDocsRead: snapshot.size,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Firebase Admin error';

    return NextResponse.json(
      {
        success: false,
        backend: 'firebase-admin',
        reachable: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
