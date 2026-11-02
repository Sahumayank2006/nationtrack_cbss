export type UserRole = 'ADMIN' | 'DEPT_OFFICER' | 'FIELD_STAFF' | 'CITIZEN' | 'AUDITOR';

export type AssetType = 'VEHICLE' | 'SPACE';

export type VehicleType =
  | 'AMBULANCE'
  | 'PATROL'
  | 'WASTE_TRUCK'
  | 'PWD_MACHINERY'
  | 'HEALTH_VAN'
  | 'ELECTION'
  | 'SEIZED';

export type SpaceType =
  | 'HOSPITAL_ROOM'
  | 'CLASSROOM'
  | 'COMMUNITY_HALL'
  | 'PWD_OFFICE'
  | 'TRANSIT_ROOM';

export type AssetStatus = 'ACTIVE' | 'IDLE' | 'MAINTENANCE' | 'DECOMMISSIONED' | 'BOOKED';

export type EventType =
  | 'STATUS_CHANGE'
  | 'LOCATION_UPDATE'
  | 'TRIP_START'
  | 'TRIP_END'
  | 'BOOKING_CREATED'
  | 'BOOKING_APPROVED'
  | 'BOOKING_REJECTED'
  | 'CHECKIN'
  | 'CHECKOUT'
  | 'RATING_SUBMITTED'
  | 'MAINTENANCE_RAISED'
  | 'MAINTENANCE_RESOLVED'
  | 'COMPLIANCE_ALERT'
  | 'IDLE_FLAGGED'
  | 'IDLE_CLEARED'
  | 'REUSE_SUGGESTED'
  | 'PHOTO_UPLOADED'
  | 'SOS_TRIGGERED';

export interface AssetEvent {
  eventId: string;
  type: EventType;
  timestamp: string;
  performedBy: string;
  performedByRole: UserRole;
  data: Record<string, unknown>;
  hash: string;
}

export interface VehicleMetadata {
  registrationNumber: string;
  make: string;
  model: string;
  year: number;
  fuelType: 'PETROL' | 'DIESEL' | 'CNG' | 'ELECTRIC';
  ais140DeviceId?: string;
  pucExpiry?: string;
  insuranceExpiry?: string;
  lastServiceDate?: string;
  nextServiceDue?: string;
  odometer?: number;
  assignedDriverId?: string;
  currentLocation?: {
    coordinates: [number, number];
    updatedAt: string;
    speed: number;
    ignition: boolean;
  };
}

export interface SpaceMetadata {
  capacityPersons: number;
  areaSqft: number;
  amenities: Array<'AC' | 'PROJECTOR' | 'WIFI' | 'PARKING' | 'GENERATOR' | 'CCTV' | 'ACCESSIBLE'>;
  operatingHours?: {
    open: string;
    close: string;
    daysOpen: number[];
  };
  bookingType: 'AUTO_APPROVE' | 'MANUAL_APPROVE';
  isSecureTransit: boolean;
  pricePerHour: number;
  pamPortalId?: string;
  currentOccupancy?: number;
}

export interface AssetPassport {
  id: string;
  assetId: string;
  type: AssetType;
  subType: VehicleType | SpaceType;
  name: string;
  department: string;
  district: string;
  address: string;
  coordinates?: [number, number];
  status: AssetStatus;
  metadata?: VehicleMetadata | SpaceMetadata;
  events?: AssetEvent[];
  auditHash?: string;
  photos?: string[];
  qrCode?: string;
  tags?: string[];
  isIdle: boolean;
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string;
}

export type BookingStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export interface Booking {
  id: string;
  spaceId: string;
  spaceName: string;
  bookedBy: string;
  bookedByName: string;
  purpose: string;
  organizationName?: string;
  expectedAttendees: number;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  checkinAt?: string;
  checkoutAt?: string;
  qrToken?: string;
  rating?: 1 | 2 | 3 | 4 | 5;
  feedback?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  assetId: string;
  eventId: string;
  action: EventType;
  performedBy: string;
  performedByRole: UserRole;
  timestamp: string;
  prevHash: string;
  hash: string;
  payload: string;
}

export interface DashboardMetrics {
  totalAssets: number;
  activeAssets: number;
  idleAssets: number;
  maintenanceAssets: number;
  activeBookings: number;
}
