import { NextResponse } from 'next/server';

import { updateBookingStatus } from '../../store';

interface Context {
  params: Promise<{ id: string }>;
}

export async function PATCH(_: Request, { params }: Context) {
  const { id } = await params;

  const updated = updateBookingStatus(id, 'COMPLETED');
  if (!updated) {
    return NextResponse.json({ success: false, message: 'Booking not found.' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    message: 'Vehicle marked as returned.',
    data: updated,
  });
}
