export type DemoRole = 'ADMIN' | 'MINISTRY' | 'FIELD_OFFICER';

export type VehicleStatus = 'ACTIVE' | 'MAINTENANCE' | 'SEIZED' | 'IDLE';
export type VehicleType =
  | 'AMBULANCE'
  | 'PATROL'
  | 'UTILITY'
  | 'TRANSPORT'
  | 'FIRE_RESPONSE'
  | 'INSPECTION';

export interface VehicleRegistryRecord {
  id: string;
  registration: string;
  owner: string;
  type: VehicleType;
  status: VehicleStatus;
  state: string;
  district: string;
  department: string;
  category: string;
  insuranceExpiry: string;
  permitExpiry: string;
  fitnessExpiry: string;
  pollutionExpiry: string;
  riskScore: number;
  coordinates: {
    lat: number;
    lng: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface VehicleTrip {
  id: string;
  vehicleId: string;
  officerName: string;
  purpose: string;
  geofenceStatus: 'INSIDE' | 'OUTSIDE' | 'UNKNOWN';
  odometerStart: number;
  odometerEnd: number;
  fuelUsedLiters: number;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  anomalyTag: string;
  createdAt: string;
}

export interface VehicleRental {
  id: string;
  vehicleId: string;
  renterName: string;
  kycStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  bookingStart: string;
  bookingEnd: string;
  pricePerDay: number;
  deposit: number;
  penalty: number;
  returnFuelLevelPercent: number;
  returnCondition: 'GOOD' | 'DAMAGED' | 'INSPECT_REQUIRED';
  status: 'ACTIVE' | 'COMPLETED' | 'OVERDUE';
}

export interface SeizedVehicleCase {
  id: string;
  vehicleId: string;
  caseNumber: string;
  policeStation: string;
  courtStatus: 'PENDING_HEARING' | 'UNDER_REVIEW' | 'RELEASED' | 'CONFISCATED';
  pendingDays: number;
  auctionReady: boolean;
}

export interface AuctionLot {
  id: string;
  vehicleId: string;
  basePrice: number;
  reservePrice: number;
  highestBid: number;
  status: 'LISTED' | 'ACTIVE' | 'SOLD' | 'UNSOLD';
  bidderKycVerified: boolean;
  endDate: string;
}

export interface OfficeAsset {
  id: string;
  name: string;
  assetType: 'OFFICE' | 'COMMERCIAL' | 'LOGISTICS' | 'PUBLIC';
  state: string;
  district: string;
  occupancyPercent: number;
  revenueMonthly: number;
  status: 'ACTIVE' | 'VACANT' | 'MAINTENANCE';
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface OfficeContract {
  id: string;
  assetId: string;
  tenantName: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  status: 'DRAFT' | 'SIGNED' | 'EXPIRED';
}

export interface PlatformAuditEntry {
  id: string;
  action: string;
  module: 'AUTOMOBILES' | 'OFFICE' | 'AUTH' | 'BOOKINGS' | 'DASHBOARD' | 'SYSTEM';
  actor: string;
  actorRole: DemoRole;
  timestamp: string;
  metadata: Record<string, string | number | boolean>;
}

export interface DemoSession {
  id: string;
  name: string;
  role: DemoRole;
  email: string;
  signedInAt: string;
}

export interface UnifiedDashboardMetrics {
  vehicles: number;
  officeAssets: number;
  activeRevenue: number;
  alerts: number;
  activeBookings: number;
}
