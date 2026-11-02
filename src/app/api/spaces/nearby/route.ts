import { NextRequest, NextResponse } from 'next/server';

import { getNearbySpaces } from '@/lib/spaces-service';

export async function GET(request: NextRequest) {
  const lat = Number(request.nextUrl.searchParams.get('lat'));
  const lng = Number(request.nextUrl.searchParams.get('lng'));
  const radiusKm = Number(request.nextUrl.searchParams.get('radiusKm') ?? '5');

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(radiusKm)) {
    return NextResponse.json(
      { success: false, message: 'lat, lng and radiusKm are required' },
      { status: 400 }
    );
  }

  const data = getNearbySpaces(lat, lng, radiusKm);
  return NextResponse.json({ success: true, data, meta: { total: data.length } });
}
