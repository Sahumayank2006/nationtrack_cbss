import { NextRequest, NextResponse } from 'next/server';

import { getVehicles } from '@/lib/automobiles-service';
import type { RevenueDashboard } from '@/types/admin-automobiles';

export async function GET(request: NextRequest) {
  const subtype = request.nextUrl.searchParams.get('subtype') ?? 'ALL';
  const vehicles = getVehicles();

  const salesBase = [
    { month: 'Jan', count: 3, revenue: 820000 },
    { month: 'Feb', count: 2, revenue: 610000 },
    { month: 'Mar', count: 4, revenue: 1120000 },
    { month: 'Apr', count: 5, revenue: 1340000 },
    { month: 'May', count: 3, revenue: 920000 },
    { month: 'Jun', count: 4, revenue: 1260000 },
  ];

  const typeMap = new Map<string, { type: string; count: number; revenue: number }>();

  for (const vehicle of vehicles.slice(0, 20)) {
    const key = vehicle.vehicleType;
    const entry = typeMap.get(key) ?? { type: key, count: 0, revenue: 0 };
    entry.count += 1;
    entry.revenue += Math.round(150000 + Math.random() * 350000);
    typeMap.set(key, entry);
  }

  const topVehicleTypes = Array.from(typeMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const filteredTop =
    subtype === 'ALL'
      ? topVehicleTypes
      : topVehicleTypes.filter((item) => item.type.toUpperCase().includes(subtype.split('_')[0]));

  const totalRevenue = salesBase.reduce((sum, row) => sum + row.revenue, 0);
  const soldCount = salesBase.reduce((sum, row) => sum + row.count, 0);

  const data: RevenueDashboard = {
    totalRevenue,
    soldCount,
    averagePrice: soldCount > 0 ? Math.round(totalRevenue / soldCount) : 0,
    yearlyBreakdown: salesBase,
    topVehicleTypes: filteredTop,
  };

  return NextResponse.json({ success: true, data });
}
