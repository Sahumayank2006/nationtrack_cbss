import { NextRequest, NextResponse } from 'next/server';

import { getUtilization } from '@/lib/spaces-service';

export async function GET(request: NextRequest) {
  const startDate = request.nextUrl.searchParams.get('startDate') ?? undefined;
  const endDate = request.nextUrl.searchParams.get('endDate') ?? undefined;
  const data = getUtilization(startDate, endDate);
  return NextResponse.json({ success: true, data });
}
