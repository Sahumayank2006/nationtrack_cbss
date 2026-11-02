import { NextResponse } from 'next/server';

import { getFleetSummary } from '@/lib/automobiles-service';

export async function GET() {
  return NextResponse.json({ rows: getFleetSummary(), generatedAt: new Date().toISOString() });
}
