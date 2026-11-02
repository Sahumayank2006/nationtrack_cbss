import { NextResponse } from 'next/server';

import { getVehicles } from '@/lib/automobiles-service';

import { hasBookingConflict } from '../store';

import type { GeoPoint } from '@/types/automobiles';
import type { NextRequest } from 'next/server';

const distanceInKm = (from: GeoPoint, to: GeoPoint) => {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDelta = toRadians(to.lat - from.lat);
  const longitudeDelta = toRadians(to.lng - from.lng);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(toRadians(from.lat)) * Math.cos(toRadians(to.lat)) * Math.sin(longitudeDelta / 2) ** 2;

  return 6371 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
};

const parseCoordinate = (value: string | null) => {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const stationId = params.get('stationId')?.trim() ?? '';
  const vehicleType = params.get('vehicleType')?.trim().toLowerCase() ?? '';
  const startDate = params.get('startDate') ?? '';
  const endDate = params.get('endDate') ?? '';
  const latitude = parseCoordinate(params.get('latitude'));
  const longitude = parseCoordinate(params.get('longitude'));
  const userLocation =
    latitude !== null && longitude !== null ? { lat: latitude, lng: longitude } : null;

  if (Boolean(startDate) !== Boolean(endDate)) {
    return NextResponse.json(
      { success: false, message: 'Both startDate and endDate are required together.' },
      { status: 400 }
    );
  }

  const candidates = getVehicles()
    .filter((vehicle) => vehicle.status === 'IDLE')
    .filter((vehicle) => userLocation || !stationId || vehicle.locationLabel === stationId)
    .filter((vehicle) => !startDate || !hasBookingConflict(vehicle.id, startDate, endDate));
  const vehicles = candidates
    .filter((vehicle) => !vehicleType || vehicle.vehicleType.toLowerCase() === vehicleType)
    .map((vehicle) => ({
      id: vehicle.id,
      registrationNumber: vehicle.registrationNumber,
      displayName: vehicle.displayName,
      vehicleType: vehicle.vehicleType,
      locationLabel: vehicle.locationLabel,
      distanceKm: userLocation
        ? Number(distanceInKm(userLocation, vehicle.coordinates).toFixed(1))
        : null,
    }))
    .sort((first, second) => {
      if (first.distanceKm !== null && second.distanceKm !== null) {
        return first.distanceKm - second.distanceKm;
      }
      return first.locationLabel.localeCompare(second.locationLabel);
    });

  return NextResponse.json({
    success: true,
    data: {
      vehicles,
      vehicleTypes: [...new Set(candidates.map((vehicle) => vehicle.vehicleType))].sort(),
    },
  });
}
