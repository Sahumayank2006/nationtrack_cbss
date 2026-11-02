import { NextResponse } from 'next/server';

import { getSpaceSummary } from '@/lib/spaces-service';

export async function GET() {
  return NextResponse.json({ success: true, data: getSpaceSummary() });
}
