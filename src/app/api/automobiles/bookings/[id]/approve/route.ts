import { NextRequest, NextResponse } from 'next/server';

import { getBookingStore } from '../../store';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json()) as {
    approverName?: string;
    approvalComments?: string;
    driverAssigned?: {
      name: string;
      phone: string;
      licenseNumber: string;
    };
  };

  const booking = getBookingStore().find((item) => item.id === id);
  if (!booking) {
    return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
  }

  booking.status = 'APPROVED';
  booking.approverName = body.approverName ?? 'Admin';
  booking.approvalComments = body.approvalComments ?? 'Approved';
  booking.driverAssigned = body.driverAssigned ?? booking.driverAssigned;
  booking.updatedAt = new Date().toISOString();

  return NextResponse.json({ success: true, data: booking });
}
