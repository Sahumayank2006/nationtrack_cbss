import { NextResponse } from 'next/server';

import { getBookingCsvRows } from '@/lib/spaces-service';

export async function GET() {
  const rows = getBookingCsvRows();
  const headers = [
    'Booking ID',
    'Asset ID',
    'Space Name',
    'Booker',
    'Status',
    'Start Date',
    'Start Time',
    'End Time',
    'Duration (hours)',
    'Rating',
  ];

  const csvRows = [
    headers.join(','),
    ...rows.map((row) =>
      [
        row.bookingId,
        row.assetId,
        row.spaceName,
        row.booker,
        row.status,
        row.startDate,
        row.startTime,
        row.endTime,
        row.durationHours,
        row.rating,
      ]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(',')
    ),
  ];

  return new NextResponse(csvRows.join('\n'), {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="nationtrack-spaces-bookings-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
