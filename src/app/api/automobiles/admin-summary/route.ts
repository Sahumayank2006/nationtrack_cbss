import { NextRequest, NextResponse } from 'next/server';

import { getAutomobilesAdminSummary } from '@/lib/automobiles-service';

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get('type') ?? 'ALL';
  const data = getAutomobilesAdminSummary(type);
  return NextResponse.json({ success: true, data });
}
