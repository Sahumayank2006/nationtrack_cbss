import { NextResponse } from 'next/server';

import { getBookingPurposeBreakdown, getBookingTypeBreakdown } from '@/lib/spaces-service';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      byType: getBookingTypeBreakdown(),
      byPurpose: getBookingPurposeBreakdown(),
    },
  });
}
