import { NextRequest, NextResponse } from 'next/server';

import { getDashboardPayload } from '@/lib/automobiles-service';
import type { VehicleLayerFilter } from '@/types/automobiles';

const parseLayer = (value: string | null): VehicleLayerFilter => {
  const allowed: VehicleLayerFilter[] = [
    'ALL',
    'ACTIVE_ONLY',
    'IDLE_ONLY',
    'POLICE',
    'AMBULANCES',
    'PWD',
  ];

  if (!value) return 'ALL';
  return allowed.includes(value as VehicleLayerFilter) ? (value as VehicleLayerFilter) : 'ALL';
};

export async function GET(request: NextRequest) {
  const subtype = request.nextUrl.searchParams.get('subtype');
  const status = request.nextUrl.searchParams.get('status');
  const layer = parseLayer(request.nextUrl.searchParams.get('layer'));
  const query = request.nextUrl.searchParams.get('q') ?? '';

  const payload = getDashboardPayload(layer, query);

  if (subtype || status) {
    const filteredVehicles = payload.vehicles.filter((vehicle) => {
      const subtypeMatch =
        !subtype ||
        subtype === 'ALL' ||
        vehicle.sector === subtype ||
        vehicle.vehicleType.toUpperCase().includes(subtype.replace('_', ' '));

      const statusMatch = !status || status === 'ALL' || vehicle.status === status;
      return subtypeMatch && statusMatch;
    });

    return NextResponse.json({ success: true, data: filteredVehicles });
  }

  return NextResponse.json(payload);
}
