import { NextRequest, NextResponse } from 'next/server';

import { getUtilizationReport } from '@/lib/automobiles-service';

export async function GET(request: NextRequest) {
  const days = Number(request.nextUrl.searchParams.get('days') ?? '30');
  const normalizedDays = Number.isFinite(days) ? Math.min(90, Math.max(7, Math.floor(days))) : 30;

  return NextResponse.json({
    report: getUtilizationReport(normalizedDays),
    generatedAt: new Date().toISOString(),
  });
}
