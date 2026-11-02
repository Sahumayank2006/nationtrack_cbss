import { NextResponse } from 'next/server';

import { requireRoles } from '@/lib/api-role';
import { bulkApproveBookings } from '@/lib/spaces-service';

export async function POST(request: Request) {
  const guard = requireRoles(request, ['ADMIN', 'MINISTRY']);
  if (!guard.ok) return guard.response;

  const body = (await request.json().catch(() => ({}))) as {
    bookingIds?: string[];
    approverName?: string;
  };

  if (!Array.isArray(body.bookingIds) || body.bookingIds.length === 0) {
    return NextResponse.json(
      { success: false, message: 'bookingIds must be a non-empty array' },
      { status: 400 }
    );
  }

  try {
    const data = bulkApproveBookings(body.bookingIds, body.approverName ?? 'Department Officer');
    return NextResponse.json({ success: true, data, meta: { total: data.length } });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: (error as Error).message },
      { status: 400 }
    );
  }
}
