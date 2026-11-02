import { NextRequest, NextResponse } from 'next/server';

import { requireSpaceSession } from '@/lib/api-role';
import { getBookingsByBooker } from '@/lib/spaces-service';

export async function GET(request: NextRequest) {
  const sessionGuard = requireSpaceSession(request);
  if (!sessionGuard.ok) return sessionGuard.response;

  const data = getBookingsByBooker(sessionGuard.session.uid);
  return NextResponse.json({ success: true, data, meta: { total: data.length } });
}
