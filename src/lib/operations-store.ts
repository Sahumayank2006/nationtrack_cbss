import { z } from 'zod';

import type {
  AuctionLot,
  OfficeAsset,
  OfficeContract,
  PlatformAuditEntry,
  SeizedVehicleCase,
  UnifiedDashboardMetrics,
  VehicleRegistryRecord,
  VehicleRental,
  VehicleTrip,
} from '@/types/operations';

const STORAGE_VERSION = 'v1';

const KEYS = {
  version: 'nt.ops.version',
  vehicles: 'nt.ops.vehicles',
  trips: 'nt.ops.trips',
  rentals: 'nt.ops.rentals',
  seizures: 'nt.ops.seizures',
  auctions: 'nt.ops.auctions',
  officeAssets: 'nt.ops.office.assets',
  officeContracts: 'nt.ops.office.contracts',
  audit: 'nt.ops.audit',
};

const nonEmptyString = z.string().trim().min(1);

const vehicleSchema = z.object({
  id: nonEmptyString,
  registration: nonEmptyString,
  owner: nonEmptyString,
  type: nonEmptyString,
  status: nonEmptyString,
  state: nonEmptyString,
  district: nonEmptyString,
  department: nonEmptyString,
  category: nonEmptyString,
  insuranceExpiry: nonEmptyString,
  permitExpiry: nonEmptyString,
  fitnessExpiry: nonEmptyString,
  pollutionExpiry: nonEmptyString,
  riskScore: z.number().min(0).max(100),
  coordinates: z.object({ lat: z.number(), lng: z.number() }),
  createdAt: nonEmptyString,
  updatedAt: nonEmptyString,
});

const readJson = <T>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  const value = window.localStorage.getItem(key);
  if (!value) return fallback;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const writeJson = <T>(key: string, value: T) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
};

const nowIso = () => new Date().toISOString();

const seedVehicles = (): VehicleRegistryRecord[] => [
  {
    id: 'veh-001',
    registration: 'MP07-GA-1021',
    owner: 'Transport Directorate',
    type: 'AMBULANCE',
    status: 'ACTIVE',
    state: 'Madhya Pradesh',
    district: 'Gwalior',
    department: 'Health',
    category: 'Emergency',
    insuranceExpiry: '2027-01-15',
    permitExpiry: '2026-11-30',
    fitnessExpiry: '2026-09-10',
    pollutionExpiry: '2026-06-20',
    riskScore: 22,
    coordinates: { lat: 26.2183, lng: 78.1828 },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: 'veh-002',
    registration: 'MP07-PT-9902',
    owner: 'Police Department',
    type: 'PATROL',
    status: 'MAINTENANCE',
    state: 'Madhya Pradesh',
    district: 'Gwalior',
    department: 'Home',
    category: 'Law Enforcement',
    insuranceExpiry: '2026-05-11',
    permitExpiry: '2026-08-12',
    fitnessExpiry: '2026-04-05',
    pollutionExpiry: '2026-04-02',
    riskScore: 73,
    coordinates: { lat: 26.204, lng: 78.177 },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: 'veh-003',
    registration: 'MP07-UT-1101',
    owner: 'PWD Logistics',
    type: 'UTILITY',
    status: 'SEIZED',
    state: 'Madhya Pradesh',
    district: 'Morar',
    department: 'PWD',
    category: 'Field Operations',
    insuranceExpiry: '2025-12-02',
    permitExpiry: '2025-10-01',
    fitnessExpiry: '2025-11-08',
    pollutionExpiry: '2025-09-20',
    riskScore: 88,
    coordinates: { lat: 26.252, lng: 78.22 },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
];

const seedTrips = (): VehicleTrip[] => [
  {
    id: 'trip-001',
    vehicleId: 'veh-001',
    officerName: 'A. Sharma',
    purpose: 'District hospital transfer',
    geofenceStatus: 'INSIDE',
    odometerStart: 32110,
    odometerEnd: 32164,
    fuelUsedLiters: 8,
    approvalStatus: 'APPROVED',
    anomalyTag: 'NONE',
    createdAt: nowIso(),
  },
  {
    id: 'trip-002',
    vehicleId: 'veh-002',
    officerName: 'P. Singh',
    purpose: 'Night patrol',
    geofenceStatus: 'OUTSIDE',
    odometerStart: 55320,
    odometerEnd: 55401,
    fuelUsedLiters: 14,
    approvalStatus: 'PENDING',
    anomalyTag: 'GEOFENCE_BREACH',
    createdAt: nowIso(),
  },
];

const seedRentals = (): VehicleRental[] => [
  {
    id: 'rent-001',
    vehicleId: 'veh-003',
    renterName: 'North Block Projects',
    kycStatus: 'VERIFIED',
    bookingStart: '2026-03-10T08:00:00.000Z',
    bookingEnd: '2026-03-15T18:00:00.000Z',
    pricePerDay: 3500,
    deposit: 10000,
    penalty: 0,
    returnFuelLevelPercent: 65,
    returnCondition: 'INSPECT_REQUIRED',
    status: 'OVERDUE',
  },
];

const seedSeizures = (): SeizedVehicleCase[] => [
  {
    id: 'sez-001',
    vehicleId: 'veh-003',
    caseNumber: 'GWL-2026-9921',
    policeStation: 'Morar PS',
    courtStatus: 'UNDER_REVIEW',
    pendingDays: 67,
    auctionReady: true,
  },
];

const seedAuctions = (): AuctionLot[] => [
  {
    id: 'auc-001',
    vehicleId: 'veh-003',
    basePrice: 250000,
    reservePrice: 300000,
    highestBid: 315000,
    status: 'ACTIVE',
    bidderKycVerified: true,
    endDate: '2026-04-12T12:00:00.000Z',
  },
];

const seedOfficeAssets = (): OfficeAsset[] => [
  {
    id: 'oa-001',
    name: 'District Secretariat Block B',
    assetType: 'OFFICE',
    state: 'Madhya Pradesh',
    district: 'Gwalior',
    occupancyPercent: 92,
    revenueMonthly: 220000,
    status: 'ACTIVE',
    coordinates: { lat: 26.215, lng: 78.176 },
  },
  {
    id: 'oa-002',
    name: 'Logistics Warehouse East',
    assetType: 'LOGISTICS',
    state: 'Madhya Pradesh',
    district: 'Bhind',
    occupancyPercent: 54,
    revenueMonthly: 98000,
    status: 'VACANT',
    coordinates: { lat: 26.59, lng: 78.79 },
  },
];

const seedOfficeContracts = (): OfficeContract[] => [
  {
    id: 'oc-001',
    assetId: 'oa-001',
    tenantName: 'Citizen Services Directorate',
    startDate: '2025-04-01',
    endDate: '2028-03-31',
    monthlyRent: 220000,
    status: 'SIGNED',
  },
  {
    id: 'oc-002',
    assetId: 'oa-002',
    tenantName: 'Supply Chain Unit',
    startDate: '2026-05-01',
    endDate: '2027-04-30',
    monthlyRent: 98000,
    status: 'DRAFT',
  },
];

const seedAudit = (): PlatformAuditEntry[] => [
  {
    id: 'aud-001',
    action: 'PLATFORM_BOOTSTRAP',
    module: 'SYSTEM',
    actor: 'system',
    actorRole: 'ADMIN',
    timestamp: nowIso(),
    metadata: { source: 'seed' },
  },
];

const ensureSeeded = () => {
  if (typeof window === 'undefined') return;
  const version = window.localStorage.getItem(KEYS.version);
  if (version === STORAGE_VERSION) return;

  writeJson(KEYS.vehicles, seedVehicles());
  writeJson(KEYS.trips, seedTrips());
  writeJson(KEYS.rentals, seedRentals());
  writeJson(KEYS.seizures, seedSeizures());
  writeJson(KEYS.auctions, seedAuctions());
  writeJson(KEYS.officeAssets, seedOfficeAssets());
  writeJson(KEYS.officeContracts, seedOfficeContracts());
  writeJson(KEYS.audit, seedAudit());
  window.localStorage.setItem(KEYS.version, STORAGE_VERSION);
};

const getVehicles = (): VehicleRegistryRecord[] => {
  ensureSeeded();
  const items = readJson<VehicleRegistryRecord[]>(KEYS.vehicles, []);
  return items.filter((item) => vehicleSchema.safeParse(item).success);
};

const getTrips = (): VehicleTrip[] => {
  ensureSeeded();
  return readJson<VehicleTrip[]>(KEYS.trips, []);
};

const getRentals = (): VehicleRental[] => {
  ensureSeeded();
  return readJson<VehicleRental[]>(KEYS.rentals, []);
};

const getSeizures = (): SeizedVehicleCase[] => {
  ensureSeeded();
  return readJson<SeizedVehicleCase[]>(KEYS.seizures, []);
};

const getAuctions = (): AuctionLot[] => {
  ensureSeeded();
  return readJson<AuctionLot[]>(KEYS.auctions, []);
};

const getOfficeAssets = (): OfficeAsset[] => {
  ensureSeeded();
  return readJson<OfficeAsset[]>(KEYS.officeAssets, []);
};

const getOfficeContracts = (): OfficeContract[] => {
  ensureSeeded();
  return readJson<OfficeContract[]>(KEYS.officeContracts, []);
};

const getAuditEntries = (): PlatformAuditEntry[] => {
  ensureSeeded();
  return readJson<PlatformAuditEntry[]>(KEYS.audit, []).sort((a, b) =>
    a.timestamp < b.timestamp ? 1 : -1
  );
};

const writeAudit = (entry: PlatformAuditEntry) => {
  const current = getAuditEntries();
  writeJson(KEYS.audit, [entry, ...current].slice(0, 500));
};

const upsertVehicle = (record: VehicleRegistryRecord) => {
  const vehicles = getVehicles();
  const existing = vehicles.find((item) => item.id === record.id);
  const payload = existing
    ? vehicles.map((item) => (item.id === record.id ? { ...record, updatedAt: nowIso() } : item))
    : [{ ...record, createdAt: nowIso(), updatedAt: nowIso() }, ...vehicles];

  writeJson(KEYS.vehicles, payload);
};

const unifiedMetrics = (): UnifiedDashboardMetrics => {
  const vehicles = getVehicles();
  const officeAssets = getOfficeAssets();
  const rentals = getRentals();
  const alerts = vehicles.filter(
    (item) => item.status === 'MAINTENANCE' || item.status === 'SEIZED'
  ).length;

  return {
    vehicles: vehicles.length,
    officeAssets: officeAssets.length,
    activeRevenue:
      rentals.reduce((sum, item) => sum + item.pricePerDay, 0) +
      officeAssets.reduce((sum, item) => sum + item.revenueMonthly, 0),
    alerts,
    activeBookings: rentals.filter((item) => item.status === 'ACTIVE' || item.status === 'OVERDUE')
      .length,
  };
};

export const operationsStore = {
  ensureSeeded,
  getVehicles,
  getTrips,
  getRentals,
  getSeizures,
  getAuctions,
  getOfficeAssets,
  getOfficeContracts,
  getAuditEntries,
  unifiedMetrics,
  upsertVehicle,
  writeAudit,
};
