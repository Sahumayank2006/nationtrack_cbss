import { NextRequest, NextResponse } from 'next/server';

import { getAvailabilityCalendar } from '@/lib/spaces-service';

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Props) {
  const { id } = await params;
  const daysRaw = Number(request.nextUrl.searchParams.get('days') ?? '30');
  const days = Number.isFinite(daysRaw) ? Math.min(60, Math.max(7, Math.floor(daysRaw))) : 30;

  try {
    const data = getAvailabilityCalendar(id, days);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: (error as Error).message },
      { status: 400 }
    );
  }
}
