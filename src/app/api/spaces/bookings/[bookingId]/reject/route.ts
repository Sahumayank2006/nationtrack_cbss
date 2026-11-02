import { NextResponse } from 'next/server';

import { getSessionContext } from '@/lib/api-role';
import { getAdminDb } from '@/lib/firebase-admin';

interface Props {
  params: Promise<{ bookingId: string }>;
}

export async function PATCH(request: Request, { params }: Props) {
  const { bookingId } = await params;
  const body = (await request.json()) as { reason?: string; actorName?: string };
  const session = getSessionContext(request);
  if (!session) {
    return NextResponse.json(
      { success: false, message: 'Authentication required' },
      { status: 401 }
    );
  }

  if (!body.reason?.trim()) {
    return NextResponse.json(
      { success: false, message: 'Rejection reason is required' },
      { status: 400 }
    );
  }

  try {
    const db = getAdminDb();
    const bookingRef = db.collection('bookings').doc(bookingId);
    const snapshot = await bookingRef.get();

    if (!snapshot.exists) {
      return NextResponse.json({ success: false, message: 'Booking not found' }, { status: 404 });
    }

    const rejectedBy = body.actorName ?? session?.openSpaceName ?? session?.name ?? 'Admin Panel';
    await bookingRef.update({
      status: 'REJECTED',
      rejectedReason: body.reason,
      rejectedBy,
      rejectedAt: new Date().toISOString(),
      approvedBy: null,
    });

    return NextResponse.json({
      success: true,
      data: { id: bookingId, status: 'REJECTED', rejectedReason: body.reason, rejectedBy },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: (error as Error).message },
      { status: 400 }
    );
  }
}
