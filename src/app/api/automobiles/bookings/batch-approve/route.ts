import { NextRequest, NextResponse } from 'next/server';

import { getBookingStore } from '../store';

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    bookingIds?: string[];
    approverName?: string;
    approvalComments?: string;
  };

  const bookingIds = body.bookingIds ?? [];
  const store = getBookingStore();
  const now = new Date().toISOString();

  const updated = store
    .filter((item) => bookingIds.includes(item.id))
    .map((item) => {
      item.status = 'APPROVED';
      item.approverName = body.approverName ?? 'Admin';
      item.approvalComments = body.approvalComments ?? 'Batch approved';
      item.updatedAt = now;
      return item;
    });

  return NextResponse.json({
    success: true,
    data: {
      approvedCount: updated.length,
      updated,
    },
  });
}
