import { NextResponse } from 'next/server';

import { requireAnyRole } from '@/lib/api-role';
import { cancelBooking } from '@/lib/spaces-service';

interface Props {
  params: Promise<{ bookingId: string }>;
}

export async function PATCH(request: Request, { params }: Props) {
  const guard = requireAnyRole(request);
  if (!guard.ok) return guard.response;

  const { bookingId } = await params;
  const body = (await request.json().catch(() => ({}))) as { actorName?: string };

  try {
    const data = cancelBooking(bookingId, body.actorName ?? 'Citizen User');
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: (error as Error).message },
      { status: 400 }
    );
  }
}
