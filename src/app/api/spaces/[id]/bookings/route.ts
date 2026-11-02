import { NextResponse } from 'next/server';

import { requireAnyRole, requireSpaceSession } from '@/lib/api-role';
import { createBooking, getSpaceBookings } from '@/lib/spaces-service';
import type { CreateBookingPayload } from '@/types/spaces';

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: Props) {
  const { id } = await params;
  const data = getSpaceBookings(id);
  return NextResponse.json({ success: true, data, meta: { total: data.length } });
}

export async function POST(request: Request, { params }: Props) {
  const authGuard = requireAnyRole(request);
  if (!authGuard.ok) return authGuard.response;

  const sessionGuard = requireSpaceSession(request);
  if (!sessionGuard.ok) return sessionGuard.response;

  const { id } = await params;
  const payload = (await request.json()) as CreateBookingPayload;

  const normalizedPayload: CreateBookingPayload = {
    ...payload,
    bookedByName: sessionGuard.session.openSpaceName,
    bookedByPhone: payload.bookedByPhone?.trim() || 'NA',
    bookedByRole: 'MINISTRY',
  };

  try {
    const data = createBooking(id, normalizedPayload);
    data.bookedBy = sessionGuard.session.uid;
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: (error as Error).message },
      { status: 400 }
    );
  }
}
