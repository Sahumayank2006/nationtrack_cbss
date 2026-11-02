import { NextResponse } from 'next/server';

import { requireRoles } from '@/lib/api-role';
import { getAdminDashboardStats } from '@/lib/admin-service';

export async function GET(request: Request) {
  const guard = requireRoles(request, ['ADMIN', 'MINISTRY']);
  if (!guard.ok) return guard.response;

  const data = await getAdminDashboardStats();
  return NextResponse.json({ success: true, data, cachedForSeconds: 60 });
}
