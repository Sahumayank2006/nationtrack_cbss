import { NextRequest, NextResponse } from 'next/server';

import { getSpacesPendingActions } from '@/lib/spaces-service';
import type { SpaceType } from '@/types/spaces';

export async function GET(request: NextRequest) {
  const limit = Number(request.nextUrl.searchParams.get('limit') ?? '5');
  const type = (request.nextUrl.searchParams.get('type') as SpaceType | 'ALL') ?? 'ALL';

  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 100) : 5;
  const data = getSpacesPendingActions(safeLimit, type);

  return NextResponse.json({ success: true, data, meta: { total: data.length } });
}
