import { NextResponse } from 'next/server';
import { z } from 'zod';

import { endTrip } from '@/lib/automobiles-service';

const endTripSchema = z.object({
  endAddress: z.string().trim().min(3).max(140),
  endOdometer: z.coerce.number().nonnegative(),
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
    const payload = endTripSchema.parse(body);

    const trip = endTrip({
      vehicleId: resolved.vehicleId,
      endAddress: payload.endAddress,
      endOdometer: payload.endOdometer,
    });

    return NextResponse.json({ success: true, trip });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to end trip';
    const status = message.includes('ongoing') ? 404 : message.includes('odometer') ? 409 : 400;
    return NextResponse.json({ success: false, message }, { status });
  }
}
