import { NextResponse } from 'next/server';

import { requireRoles } from '@/lib/api-role';
import { checkOutBooking } from '@/lib/spaces-service';

interface Props {
  params: Promise<{ bookingId: string }>;
}

export async function POST(request: Request, { params }: Props) {
  const guard = requireRoles(request, ['ADMIN', 'MINISTRY', 'FIELD_OFFICER']);
  if (!guard.ok) return guard.response;

  const { bookingId } = await params;
  const body = (await request.json().catch(() => ({}))) as { actorName?: string };

  try {
    const data = checkOutBooking(bookingId, body.actorName ?? 'Field Staff');
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: (error as Error).message },
      { status: 400 }
    );
  }
}
