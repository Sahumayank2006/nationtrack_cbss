import { NextRequest, NextResponse } from 'next/server';

import { getMapPins } from '@/lib/spaces-service';

export async function GET(request: NextRequest) {
  const availableOnly = request.nextUrl.searchParams.get('availableOnly') === 'true';
  return NextResponse.json({ success: true, data: getMapPins(availableOnly) });
}
