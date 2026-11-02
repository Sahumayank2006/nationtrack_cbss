import { NextResponse } from 'next/server';

import { getVehicleById } from '@/lib/automobiles-service';

interface RouteContext {
  params: Promise<{
    vehicleId: string;
  }>;
}

export async function GET(_: Request, { params }: RouteContext) {
  const resolved = await params;
  const vehicle = getVehicleById(resolved.vehicleId);

  if (!vehicle) {
    return NextResponse.json({ message: 'Vehicle not found' }, { status: 404 });
  }

  return NextResponse.json({ vehicle });
}
