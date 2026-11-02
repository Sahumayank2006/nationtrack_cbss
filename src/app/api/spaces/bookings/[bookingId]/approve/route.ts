import { NextResponse } from 'next/server';

import { getSessionContext } from '@/lib/api-role';
import { getAdminDb } from '@/lib/firebase-admin';

interface Props {
  params: Promise<{ bookingId: string }>;
}

export async function PATCH(request: Request, { params }: Props) {
  const { bookingId } = await params;
  const body = (await request.json().catch(() => ({}))) as { approverName?: string };
  const session = getSessionContext(request);
  if (!session) {
    return NextResponse.json(
      { success: false, message: 'Authentication required' },
      { status: 401 }
    );
  }

  try {
    const db = getAdminDb();
    const bookingRef = db.collection('bookings').doc(bookingId);
    const snapshot = await bookingRef.get();

    if (!snapshot.exists) {
      return NextResponse.json({ success: false, message: 'Booking not found' }, { status: 404 });
    }

    const approvedBy =
      body.approverName ?? session?.openSpaceName ?? session?.name ?? 'Admin Panel';
    await bookingRef.update({
      status: 'APPROVED',
      approvedBy,
      approvedAt: new Date().toISOString(),
      rejectedReason: null,
    });

    return NextResponse.json({
      success: true,
      data: { id: bookingId, status: 'APPROVED', approvedBy },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: (error as Error).message },
      { status: 400 }
    );
  }
}
