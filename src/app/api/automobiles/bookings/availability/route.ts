import { NextRequest, NextResponse } from 'next/server';

import { getVehicles } from '@/lib/automobiles-service';

import { hasBookingConflict } from '../store';

export async function GET(request: NextRequest) {
  const stationId = request.nextUrl.searchParams.get('stationId') ?? '';
  const startDate = request.nextUrl.searchParams.get('startDate') ?? '';
  const endDate = request.nextUrl.searchParams.get('endDate') ?? '';

  if (!stationId || !startDate || !endDate) {
    return NextResponse.json(
      { success: false, message: 'stationId, startDate and endDate are required.' },
      { status: 400 }
    );
  }

  const stationVehicles = getVehicles().filter((vehicle) => vehicle.locationLabel === stationId);
  const availableVehicles = stationVehicles.filter(
    (vehicle) => !hasBookingConflict(vehicle.id, startDate, endDate)
  );

  return NextResponse.json({
    success: true,
    data: {
      stationId,
      totalVehicles: stationVehicles.length,
      availableVehicles: availableVehicles.length,
      hasAvailability: availableVehicles.length > 0,
    },
  });
}
