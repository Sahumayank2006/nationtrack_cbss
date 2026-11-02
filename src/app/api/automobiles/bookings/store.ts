import { getVehicles } from '@/lib/automobiles-service';
import type { BookingCalendarEntry, VehicleBookingRequest } from '@/types/admin-automobiles';
import type { DepartmentSector } from '@/types/automobiles';

const toIso = (daysOffset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString();
};

const subtypeToSector: Record<string, DepartmentSector | null> = {
  AMBULANCE: 'AMBULANCE_108',
  PATROL: 'POLICE_PATROL',
  WASTE_TRUCK: 'GMC_WASTE',
  PWD_MACHINERY: 'PWD_HEAVY',
  HEALTH_VAN: 'HEALTH_VAN',
  ELECTION: 'ELECTION_REQUISITION',
  SEIZED: null,
  ALL: null,
};

const bookings: VehicleBookingRequest[] = [
  {
    id: 'book-001',
    vehicleId: 'veh-gwl-001',
    requesterName: 'Rahul Singh',
    requesterDepartment: 'Traffic Control',
    requesterPhone: '9876543210',
    purpose: 'MAINTENANCE',
    startDate: toIso(0),
    endDate: toIso(2),
    estimatedDistance: 120,
    status: 'PENDING',
    createdAt: toIso(-1),
    updatedAt: toIso(-1),
  },
  {
    id: 'book-002',
    vehicleId: 'veh-gwl-002',
    requesterName: 'Anita Verma',
    requesterDepartment: 'Health Department',
    requesterPhone: '9876500001',
    purpose: 'EMERGENCY',
    startDate: toIso(1),
    endDate: toIso(3),
    estimatedDistance: 80,
    status: 'PENDING',
    createdAt: toIso(-2),
    updatedAt: toIso(-2),
  },
  {
    id: 'book-003',
    vehicleId: 'veh-gwl-003',
    requesterName: 'Aman Khan',
    requesterDepartment: 'Election Cell',
    requesterPhone: '9876500002',
    purpose: 'ELECTION',
    startDate: toIso(4),
    endDate: toIso(6),
    estimatedDistance: 200,
    status: 'APPROVED',
    approverName: 'Admin',
    approvalComments: 'Approved for election deployment',
    driverAssigned: {
      name: 'Suresh Yadav',
      phone: '9876500101',
      licenseNumber: 'MP30-2020-1234567',
    },
    createdAt: toIso(-5),
    updatedAt: toIso(-1),
  },
  {
    id: 'book-004',
    vehicleId: 'veh-gwl-001',
    requesterName: 'Ritu Sharma',
    requesterDepartment: 'Police HQ',
    requesterPhone: '9876500003',
    purpose: 'TRANSFER',
    startDate: toIso(1),
    endDate: toIso(2),
    estimatedDistance: 50,
    status: 'PENDING',
    createdAt: toIso(-1),
    updatedAt: toIso(-1),
  },
];

export const getBookingStore = () => bookings;

const BOOKING_CONFLICT_STATUSES = new Set(['PENDING', 'APPROVED', 'ACTIVE']);

const toDate = (value: string) => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const hasBookingConflict = (vehicleId: string, startDate: string, endDate: string) => {
  const start = toDate(startDate);
  const end = toDate(endDate);

  if (!start || !end || start >= end) {
    return true;
  }

  return bookings.some((item) => {
    if (item.vehicleId !== vehicleId || !BOOKING_CONFLICT_STATUSES.has(item.status)) {
      return false;
    }

    const existingStart = toDate(item.startDate);
    const existingEnd = toDate(item.endDate);
    if (!existingStart || !existingEnd) {
      return false;
    }

    return start < existingEnd && end > existingStart;
  });
};

export const createBooking = (
  payload: Omit<
    VehicleBookingRequest,
    'id' | 'status' | 'createdAt' | 'updatedAt' | 'approverName' | 'approvalComments'
  >
) => {
  const createdAt = new Date().toISOString();

  const item: VehicleBookingRequest = {
    id: `book-${String(bookings.length + 1).padStart(3, '0')}`,
    ...payload,
    status: 'PENDING',
    createdAt,
    updatedAt: createdAt,
  };

  bookings.unshift(item);
  return item;
};

export const updateBookingStatus = (
  bookingId: string,
  status: VehicleBookingRequest['status'],
  updates: Partial<VehicleBookingRequest> = {}
) => {
  const item = bookings.find((booking) => booking.id === bookingId);
  if (!item) {
    return null;
  }

  item.status = status;
  item.updatedAt = new Date().toISOString();
  Object.assign(item, updates);
  return item;
};

export const filterBookingsBySubtype = (items: VehicleBookingRequest[], subtype: string) => {
  if (!subtype || subtype === 'ALL') return items;

  const vehicles = getVehicles();
  const sector = subtypeToSector[subtype] ?? null;

  if (subtype === 'SEIZED') {
    const seizedIds = new Set(
      vehicles.filter((v) => v.displayName.toLowerCase().includes('seized')).map((v) => v.id)
    );
    return items.filter((b) => seizedIds.has(b.vehicleId));
  }

  if (!sector) return items;

  const ids = new Set(vehicles.filter((v) => v.sector === sector).map((v) => v.id));
  return items.filter((b) => ids.has(b.vehicleId));
};

export const toCalendarEntries = (items: VehicleBookingRequest[]): BookingCalendarEntry[] => {
  const vehicles = new Map(getVehicles().map((v) => [v.id, v]));

  return items.map((item) => ({
    id: item.id,
    vehicleId: item.vehicleId,
    registrationNumber: vehicles.get(item.vehicleId)?.registrationNumber ?? item.vehicleId,
    startDate: item.startDate,
    endDate: item.endDate,
    requesterName: item.requesterName,
    purpose: item.purpose,
    status: item.status,
    driverName: item.driverAssigned?.name,
  }));
};
