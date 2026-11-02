import { NextRequest, NextResponse } from 'next/server';

import { getVehicles } from '@/lib/automobiles-service';
import type { MaintenanceTicket } from '@/types/admin-automobiles';

const dayMs = 24 * 60 * 60 * 1000;
const now = Date.now();

const tickets: MaintenanceTicket[] = [
  {
    id: 'mt-001',
    vehicleId: 'veh-gwl-001',
    registrationNumber: 'MP07-AA-1201',
    title: 'Brake pad replacement',
    description: 'Brake response degraded during patrol',
    reportedBy: 'Field Officer',
    reportedAt: new Date(now - 5 * dayMs).toISOString(),
    severity: 'HIGH',
    status: 'ASSIGNED',
    assignedTo: 'Depot Team A',
    estimatedCost: 12000,
    partsCost: 8000,
    laborCost: 4000,
  },
  {
    id: 'mt-002',
    vehicleId: 'veh-gwl-002',
    registrationNumber: 'MP07-AM-2234',
    title: 'Engine overheating',
    description: 'Temperature warning while in emergency route',
    reportedBy: 'Driver',
    reportedAt: new Date(now - 2 * dayMs).toISOString(),
    severity: 'CRITICAL',
    status: 'IN_PROGRESS',
    assignedTo: 'Rapid Repair Unit',
    estimatedCost: 42000,
    partsCost: 30000,
    laborCost: 12000,
  },
  {
    id: 'mt-003',
    vehicleId: 'veh-gwl-003',
    registrationNumber: 'MP07-EL-4550',
    title: 'Tyre rotation',
    description: 'Scheduled preventive maintenance',
    reportedBy: 'Automated Schedule',
    reportedAt: new Date(now - 10 * dayMs).toISOString(),
    severity: 'LOW',
    status: 'RESOLVED',
    assignedTo: 'Depot Team B',
    estimatedCost: 3000,
    resolvedAt: new Date(now - 7 * dayMs).toISOString(),
    resolutionNote: 'Tyres rotated and pressure calibrated',
    partsCost: 1000,
    laborCost: 2000,
  },
];

const subtypeToKeyword: Record<string, string | null> = {
  ALL: null,
  AMBULANCE: 'AM',
  PATROL: 'AA',
  WASTE_TRUCK: 'WT',
  PWD_MACHINERY: 'PWD',
  HEALTH_VAN: 'HV',
  ELECTION: 'EL',
  SEIZED: 'SZ',
};

export async function GET(request: NextRequest) {
  const subtype = request.nextUrl.searchParams.get('subtype') ?? 'ALL';

  let data = tickets;
  const marker = subtypeToKeyword[subtype] ?? null;
  if (marker) {
    data = data.filter((item) => item.registrationNumber.includes(marker));
  }

  if (!marker && subtype !== 'ALL') {
    const vehicles = getVehicles();
    const ids = new Set(vehicles.map((v) => v.id));
    data = data.filter((item) => ids.has(item.vehicleId));
  }

  return NextResponse.json({ success: true, data });
}
