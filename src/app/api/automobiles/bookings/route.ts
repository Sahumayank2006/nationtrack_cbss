import { NextRequest, NextResponse } from 'next/server';

import { getVehicles } from '@/lib/automobiles-service';

import {
  createBooking,
  filterBookingsBySubtype,
  getBookingStore,
  hasBookingConflict,
} from './store';

export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get('status') ?? 'ALL';
  const subtype = request.nextUrl.searchParams.get('subtype') ?? 'ALL';

  let bookings = filterBookingsBySubtype(getBookingStore(), subtype);
  if (status !== 'ALL') {
    bookings = bookings.filter((item) => item.status === status);
  }

  return NextResponse.json({ success: true, data: bookings });
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    stationId?: string;
    requesterName?: string;
    requesterDepartment?: string;
    requesterPhone?: string;
    purpose?: 'ELECTION' | 'EMERGENCY' | 'MAINTENANCE' | 'TRANSFER' | 'OTHER';
    startDate?: string;
    endDate?: string;
    estimatedDistance?: number;
  };

  if (
    !body.stationId ||
    !body.requesterName ||
    !body.requesterDepartment ||
    !body.requesterPhone ||
    !body.purpose ||
    !body.startDate ||
    !body.endDate
  ) {
    return NextResponse.json(
      { success: false, message: 'Missing required booking details.' },
      { status: 400 }
    );
  }

  const stationVehicles = getVehicles().filter(
    (vehicle) => vehicle.locationLabel === body.stationId
  );
  if (stationVehicles.length === 0) {
    return NextResponse.json(
      { success: false, message: 'No vehicles currently available at selected station.' },
      { status: 400 }
    );
  }

  const vehicle = stationVehicles.find(
    (candidate) => !hasBookingConflict(candidate.id, body.startDate!, body.endDate!)
  );

  if (!vehicle) {
    return NextResponse.json(
      { success: false, message: 'Requested time slot conflicts with existing bookings.' },
      { status: 409 }
    );
  }

  const created = createBooking({
    vehicleId: vehicle.id,
    requesterName: body.requesterName,
    requesterDepartment: body.requesterDepartment,
    requesterPhone: body.requesterPhone,
    purpose: body.purpose,
    startDate: body.startDate,
    endDate: body.endDate,
    estimatedDistance: body.estimatedDistance,
  });

  return NextResponse.json({
    success: true,
    message: 'Booking submitted successfully.',
    data: {
      bookingId: created.id,
      vehicleId: created.vehicleId,
      status: created.status,
    },
  });
}
