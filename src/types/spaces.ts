export type SpaceType =
  | 'HOSPITAL_ROOM'
  | 'CLASSROOM'
  | 'COMMUNITY_HALL'
  | 'PWD_OFFICE'
  | 'TRANSIT_ROOM'
  | 'TRAINING_HALL';

export type SpaceStatus = 'AVAILABLE' | 'BOOKED' | 'MAINTENANCE' | 'IDLE' | 'RESTRICTED';

export type BookingStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REJECTED';

export type SpaceEventType =
  | 'STATUS_CHANGE'
  | 'BOOKING_CREATED'
  | 'BOOKING_APPROVED'
  | 'BOOKING_REJECTED'
  | 'BOOKING_CANCELLED'
  | 'CHECKIN'
  | 'CHECKOUT'
  | 'IDLE_FLAGGED'
  | 'IDLE_CLEARED'
  | 'MAINTENANCE_RAISED'
  | 'MAINTENANCE_RESOLVED'
  | 'REUSE_SUGGESTED'
  | 'SECURE_TRANSIT_ACTIVATED'
  | 'SECURE_TRANSIT_CLEARED'
  | 'RATING_SUBMITTED';

export interface Space {
  id: string;
  assetId: string;
  spaceType: SpaceType;
  name: string;
  department: string;
  district: 'Lashkar' | 'Morar' | 'Thatipur' | 'Gwalior East';
  address: string;
  coordinates: [number, number];
  capacity: number;
  areaSqFt: number;
  floor: number;
  amenities: string[];
  accessibilityFeatures: string[];
  photos: string[];
  status: SpaceStatus;
  isIdle: boolean;
  idleSince?: string;
  isSecureTransit: boolean;
  requiresManualApproval: boolean;
  availableFrom: string;
  availableTo: string;
  availableDays: number[];
  minBookingHours: number;
  maxBookingHours: number;
  contactOfficer: string;
  contactPhone: string;
  rules: string[];
  qrCode: string;
  pamPortalId?: string;
  lastBookedAt?: string;
  lastActivityAt?: string;
  totalBookingsCount: number;
  avgRating: number;
  auditHash: string;
  maintenanceOpenCount: number;
}

export interface Booking {
  id: string;
  bookingId: string;
  spaceId: string;
  assetId: string;
  bookedBy: string;
  bookedByName: string;
  bookedByRole: 'ADMIN' | 'MINISTRY' | 'FIELD_OFFICER' | 'CITIZEN';
  bookedByPhone: string;
  organizationName?: string;
  purpose: string;
  expectedAttendees: number;
  startDateTime: string;
  endDateTime: string;
  durationHours: number;
  status: BookingStatus;
  approvedBy?: string;
  approvedAt?: string;
  rejectedReason?: string;
  isSecureTransit: boolean;
  secureTransitClearanceRef?: string;
  checkInTime?: string;
  checkOutTime?: string;
  checkInPhoto?: string;
  postUsageRating?: number;
  postUsageFeedback?: string;
  auditHash: string;
  createdAt: string;
}

export interface SpaceEvent {
  id: string;
  spaceId: string;
  eventType: SpaceEventType;
  timestamp: string;
  actorName: string;
  actorRole: string;
  metadata: Record<string, string | number | boolean | null>;
  hash: string;
}

export interface MaintenanceTicket {
  id: string;
  spaceId: string;
  createdAt: string;
  createdBy: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  photos: string[];
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  resolvedAt?: string;
}

export interface SpaceListFilters {
  status?: SpaceStatus | 'ALL';
  type?: SpaceType | 'ALL';
  district?: Space['district'] | 'ALL';
  amenities?: string[];
  minCapacity?: number;
  isIdle?: boolean;
  date?: string;
  startTime?: string;
  endTime?: string;
  search?: string;
}

export interface CreateBookingPayload {
  purpose: string;
  expectedAttendees: number;
  startDateTime: string;
  endDateTime: string;
  organizationName?: string;
  bookedByName: string;
  bookedByRole: Booking['bookedByRole'];
  bookedByPhone: string;
}

export interface AvailabilitySlot {
  hour: string;
  available: boolean;
  bookingId?: string;
  status?: BookingStatus;
}

export interface SpaceMapPinProperties {
  id: string;
  assetId: string;
  name: string;
  status: SpaceStatus;
  type: SpaceType;
  district: Space['district'];
  capacity: number;
  avgRating: number;
}

export interface SpaceMapFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: SpaceMapPinProperties;
}

export interface SpaceMapFeatureCollection {
  type: 'FeatureCollection';
  features: SpaceMapFeature[];
}

export interface IdleSuggestion {
  spaceId: string;
  idleDays: number;
  suggestions: string[];
}

export interface SpaceSummaryRow {
  type: SpaceType;
  total: number;
  available: number;
  booked: number;
  idle: number;
  restricted: number;
}

export interface UtilizationPoint {
  date: string;
  bookings: number;
  occupancyPercent: number;
  idlePercent: number;
}

export interface BookingPurposeBreakdown {
  category: string;
  count: number;
}
