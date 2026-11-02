import { NextResponse } from 'next/server';

import { requireAnyRole, requireRoles, requireSpaceSession } from '@/lib/api-role';
import { getAllBookings, getBookingsByBooker } from '@/lib/spaces-service';

import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const scope = request.nextUrl.searchParams.get('scope') ?? 'all';

  if (scope === 'all') {
    const guard = requireRoles(request, ['ADMIN', 'MINISTRY']);
    if (!guard.ok) return guard.response;

    const data = getAllBookings();
    return NextResponse.json({ success: true, data, meta: { total: data.length } });
  }

  if (scope === 'my') {
    const sessionGuard = requireSpaceSession(request);
    if (!sessionGuard.ok) return sessionGuard.response;

    const data = getBookingsByBooker(sessionGuard.session.uid);
    return NextResponse.json({ success: true, data, meta: { total: data.length } });
  }

  if (scope === 'incoming') {
    const sessionGuard = requireSpaceSession(request);
    if (sessionGuard.ok) {
      const data = getAllBookings().filter(
        (booking) => booking.spaceId === sessionGuard.session.openSpaceId
      );
      return NextResponse.json({ success: true, data, meta: { total: data.length } });
    }

    // Fallback for non-space admin sessions to keep existing admin inbox compatibility.
    const roleGuard = requireRoles(request, ['ADMIN', 'MINISTRY']);
    if (!roleGuard.ok) return roleGuard.response;

    const data = getAllBookings();
    return NextResponse.json({ success: true, data, meta: { total: data.length } });
  }

  const guard = requireAnyRole(request);
  if (!guard.ok) return guard.response;

  const userId = request.nextUrl.searchParams.get('userId') ?? '';

  if (!userId) {
    return NextResponse.json(
      { success: false, message: 'userId is required when scope is not all' },
      { status: 400 }
    );
  }

  const data = getBookingsByBooker(userId);
  return NextResponse.json({ success: true, data, meta: { total: data.length } });
}
