import { NextResponse } from 'next/server';

import { getBookingById } from '@/lib/spaces-service';

interface Props {
  params: Promise<{ bookingId: string }>;
}

export async function GET(_request: Request, { params }: Props) {
  const { bookingId } = await params;
  const data = getBookingById(bookingId);

  if (!data) {
    return NextResponse.json({ success: false, message: 'Booking not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, data });
}
