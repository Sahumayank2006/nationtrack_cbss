import { NextResponse } from 'next/server';
import { z } from 'zod';

import { startTrip } from '@/lib/automobiles-service';

const startTripSchema = z.object({
  purpose: z.string().trim().min(3).max(120),
  driverName: z.string().trim().min(3).max(80),
  startAddress: z.string().trim().min(3).max(140),
  startOdometer: z.coerce.number().nonnegative(),
});

interface RouteContext {
  params: Promise<{
    vehicleId: string;
  }>;
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const resolved = await params;
    const body = await request.json();
    const payload = startTripSchema.parse(body);

    const trip = startTrip({
      vehicleId: resolved.vehicleId,
      purpose: payload.purpose,
      driverName: payload.driverName,
      startAddress: payload.startAddress,
      startOdometer: payload.startOdometer,
    });

    return NextResponse.json({ success: true, trip });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to start trip';
    const status = message.includes('ongoing') ? 409 : message.includes('not found') ? 404 : 400;
    return NextResponse.json({ success: false, message }, { status });
  }
}
