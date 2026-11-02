import { NextResponse } from 'next/server';

import { requireRoles } from '@/lib/api-role';
import { bulkRejectBookings } from '@/lib/spaces-service';

export async function POST(request: Request) {
  const guard = requireRoles(request, ['ADMIN', 'MINISTRY']);
  if (!guard.ok) return guard.response;

  const body = (await request.json().catch(() => ({}))) as {
    bookingIds?: string[];
    reason?: string;
    actorName?: string;
  };

  if (!Array.isArray(body.bookingIds) || body.bookingIds.length === 0) {
    return NextResponse.json(
      { success: false, message: 'bookingIds must be a non-empty array' },
      { status: 400 }
    );
  }

  if (!body.reason?.trim()) {
    return NextResponse.json({ success: false, message: 'reason is required' }, { status: 400 });
  }

  try {
    const data = bulkRejectBookings(
      body.bookingIds,
      body.reason,
      body.actorName ?? 'Department Officer'
    );
    return NextResponse.json({ success: true, data, meta: { total: data.length } });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: (error as Error).message },
      { status: 400 }
    );
  }
}
