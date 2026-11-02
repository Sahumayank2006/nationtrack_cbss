import { NextResponse } from 'next/server';

import { getTripsByVehicle } from '@/lib/automobiles-service';

interface RouteContext {
  params: Promise<{
    vehicleId: string;
  }>;
}

export async function GET(_: Request, { params }: RouteContext) {
  const resolvedParams = await params;
  const trips = getTripsByVehicle(resolvedParams.vehicleId);
  return NextResponse.json({ vehicleId: resolvedParams.vehicleId, trips });
}
