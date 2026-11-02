import { NextRequest, NextResponse } from 'next/server';

import { filterBookingsBySubtype, getBookingStore, toCalendarEntries } from '../store';

export async function GET(request: NextRequest) {
  const subtype = request.nextUrl.searchParams.get('subtype') ?? 'ALL';
  const monthParam = request.nextUrl.searchParams.get('month');
  const yearParam = request.nextUrl.searchParams.get('year');

  const month = Math.max(1, Math.min(12, Number(monthParam ?? '1')));
  const year = Number(yearParam ?? String(new Date().getFullYear()));

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);

  const scoped = filterBookingsBySubtype(getBookingStore(), subtype);
  const entries = toCalendarEntries(scoped).filter((item) => {
    const itemStart = new Date(item.startDate).getTime();
    const itemEnd = new Date(item.endDate).getTime();
    return itemStart <= end.getTime() && itemEnd >= start.getTime();
  });

  return NextResponse.json({ success: true, data: entries });
}
