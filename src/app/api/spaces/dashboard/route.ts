import { NextResponse } from 'next/server';

import { getDashboardStats, getUpcomingBookings } from '@/lib/spaces-service';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      stats: getDashboardStats(),
      upcomingBookings: getUpcomingBookings(5),
    },
  });
}
