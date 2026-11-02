import { NextRequest, NextResponse } from 'next/server';

import { getAutomobileRecentEvents } from '@/lib/automobiles-service';

export async function GET(request: NextRequest) {
  const limit = Number(request.nextUrl.searchParams.get('limit') ?? '10');
  const type = request.nextUrl.searchParams.get('type') ?? 'ALL';

  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 100) : 10;
  const data = getAutomobileRecentEvents(safeLimit, type);
  return NextResponse.json({ success: true, data, meta: { total: data.length } });
}
