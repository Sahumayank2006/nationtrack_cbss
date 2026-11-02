import { NextRequest, NextResponse } from 'next/server';

import { getBookingStore } from '../../store';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json()) as {
    rejectionReason?: string;
  };

  const booking = getBookingStore().find((item) => item.id === id);
  if (!booking) {
    return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
  }

  booking.status = 'REJECTED';
  booking.rejectionReason = body.rejectionReason ?? 'Rejected';
  booking.updatedAt = new Date().toISOString();

  return NextResponse.json({ success: true, data: booking });
}
