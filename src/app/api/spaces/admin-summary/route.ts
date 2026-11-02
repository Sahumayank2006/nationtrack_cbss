import { NextRequest, NextResponse } from 'next/server';

import { getSpacesAdminSummary } from '@/lib/spaces-service';
import type { SpaceType } from '@/types/spaces';

export async function GET(request: NextRequest) {
  const type = (request.nextUrl.searchParams.get('type') as SpaceType | 'ALL') ?? 'ALL';
  const data = getSpacesAdminSummary(type);
  return NextResponse.json({ success: true, data });
}
