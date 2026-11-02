export type AutomobileRole = 'ADMIN' | 'DEPARTMENT_OFFICER' | 'FIELD_STAFF' | 'CITIZEN';

export type VehicleOperationalStatus = 'MOVING' | 'IDLE' | 'BREAKDOWN' | 'OFFLINE';

export type VehicleLayerFilter =
  | 'ALL'
  | 'ACTIVE_ONLY'
  | 'IDLE_ONLY'
  | 'POLICE'
  | 'AMBULANCES'
  | 'PWD';

export type GpsSourceTier = 'AIS_140' | 'QR_PWA' | 'MANUAL_CSV';

export type DepartmentSector =
  | 'GMC_WASTE'
  | 'AMBULANCE_108'
  | 'POLICE_PATROL'
  | 'PWD_HEAVY'
  | 'HEALTH_VAN'
  | 'ELECTION_REQUISITION';

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface ComplianceDates {
  pucExpiry: string;
  insuranceExpiry: string;
  fitnessExpiry: string;
}

export interface UtilizationStats {
  hoursToday: number;
  hoursWeek: number;
  idlePercent: number;
}

export interface AutomobileAsset {
  id: string;
  registrationNumber: string;
  displayName: string;
  sector: DepartmentSector;
  vehicleType: string;
  driverName: string;
  departmentName: string;
  locationLabel: string;
  status: VehicleOperationalStatus;
  isMoving: boolean;
  speedKmph: number;
  heading: number;
  coordinates: GeoPoint;
  lastSeenAt: string;
  idleMinutes: number;
  idleSinceDate?: string;
  gpsSource: GpsSourceTier;
  compliance: ComplianceDates;
  utilization: UtilizationStats;
  maintenanceRiskScore: number;
  photoUrl: string;
  specs: {
    fuelType: string;
    capacity: string;
    model: string;
    year: number;
  };
  pathTrail24h: GeoPoint[];
}

export interface TripLog {
  id: string;
  vehicleId: string;
  driverName: string;
  purpose: string;
  status: 'ONGOING' | 'COMPLETED' | 'ABORTED';
  startedAt: string;
  endedAt?: string;
  startAddress: string;
  endAddress?: string;
  distanceKm?: number;
  durationMinutes?: number;
  startOdometer: number;
  endOdometer?: number;
  fuelLiters?: number;
  routePath: GeoPoint[];
}

export interface StartTripPayload {
  vehicleId: string;
  purpose: string;
  driverName: string;
  startAddress: string;
  startOdometer: number;
}

export interface EndTripPayload {
  vehicleId: string;
  endAddress: string;
  endOdometer: number;
}

export interface MaintenanceEvent {
  id: string;
  vehicleId: string;
  title: string;
  loggedAt: string;
  costInr: number;
  note: string;
}

export interface ComplianceAlert {
  id: string;
  vehicleId: string;
  registrationNumber: string;
  type: 'PUC' | 'INSURANCE' | 'FITNESS';
  expiresOn: string;
  daysRemaining: number;
  severity: 'CRITICAL' | 'WARNING' | 'OK';
}

export interface IdleReuseSuggestion {
  id: string;
  vehicleId: string;
  registrationNumber: string;
  idleDays: number;
  suggestedAction: 'ELECTION_DEPLOYMENT' | 'INTER_DEPARTMENT_TRANSFER' | 'GEM_AUCTION';
  reasoning: string;
  targetDepartment: string;
}

export interface FieldIncidentReport {
  id: string;
  vehicleId: string;
  reporterName: string;
  createdAt: string;
  location: GeoPoint;
  message: string;
  photoUrl?: string;
  isOfflineCaptured: boolean;
  syncStatus: 'PENDING_SYNC' | 'SYNCED';
}

export interface ImmutableAuditLog {
  id: string;
  actorRole: AutomobileRole;
  actorName: string;
  actionType: string;
  occurredAt: string;
  entityType: 'VEHICLE' | 'TRIP' | 'COMPLIANCE' | 'INCIDENT' | 'REPORT';
  entityId: string;
  metadata: Record<string, string | number | boolean>;
}

export interface LiveVehicleDelta {
  vehicleId: string;
  coordinates: GeoPoint;
  speedKmph: number;
  heading: number;
  status: VehicleOperationalStatus;
  idleMinutes: number;
  lastSeenAt: string;
  gpsSource: GpsSourceTier;
}

export interface DashboardResponse {
  vehicles: AutomobileAsset[];
  complianceAlerts: ComplianceAlert[];
  idleSuggestions: IdleReuseSuggestion[];
  generatedAt: string;
}

export interface FleetSummaryRow {
  sector: DepartmentSector;
  sectorLabel: string;
  total: number;
  moving: number;
  idle: number;
  maintenance: number;
  offline: number;
  utilizationPercent: number;
}

export interface UtilizationPoint {
  date: string;
  activeKm: number;
  idleKm: number;
  trips: number;
}

export interface UtilizationSummary {
  totalKm: number;
  averageTripsPerVehiclePerWeek: number;
  utilizationPercent: number;
}

export interface UtilizationReportResponse {
  points: UtilizationPoint[];
  summary: UtilizationSummary;
  fleetSummary: FleetSummaryRow[];
}

export interface StationFleetSummary {
  stationId: string;
  stationName: string;
  zone: 'Central' | 'North' | 'South' | 'East' | 'West';
  coordinates: GeoPoint;
  totalVehicles: number;
  statusCounts: Record<VehicleOperationalStatus, number>;
  vehicleTypeCounts: Record<string, number>;
  complianceAlertCount: number;
}

export interface VehicleMetadata {
  chassisNumber: string;
  engineNumber: string;
  vehicleType: string;
  makeModel: string;
  yearOfManufacture: number;
  fuelType: string;
  seatingCapacity: number;
  color: string;
  grossWeightKg: number;
  odometerKm: number;
  gpsSource: GpsSourceTier;
  department: string;
  sector: DepartmentSector;
  assignedStation: string;
  driverName: string;
  driverContact: string;
}

export interface LegalRecord {
  id: string;
  vehicleId: string;
  type: 'CHALLAN' | 'COURT_CASE' | 'ACCIDENT' | 'SEIZURE';
  referenceNumber: string;
  date: string;
  description: string;
  status: 'PENDING' | 'RESOLVED' | 'ACTIVE' | 'APPEALED';
  amount?: number;
  nextActionDate?: string;
  authority: string;
}

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  serviceType: string;
  serviceDate: string;
  odometerKm: number;
  costInr: number;
  notes: string;
  status: 'COMPLETED' | 'DUE' | 'OVERDUE';
}

export interface VehicleDetailPanelProps {
  vehicle: (AutomobileAsset & { metadata: VehicleMetadata }) | null;
  legalRecords: LegalRecord[];
  maintenanceHistory: MaintenanceRecord[];
  isOpen: boolean;
  onClose: () => void;
}

export type VehicleInventoryKey = 'PATROL_CAR' | 'MOTORCYCLE' | 'VAN' | 'HEAVY';

export type VehicleInventoryByType = Record<VehicleInventoryKey, number>;

export interface AutomobileStationAccount {
  uid: string;
  email: string;
  stationId: string;
  stationName: string;
  role: 'ADMIN' | 'STATION_OFFICER' | 'FIELD_STAFF';
}

export interface StationFleetInventory {
  stationId: string;
  stationName: string;
  availableByType: VehicleInventoryByType;
  updatedAt: string;
}

export interface AutomobileTransferRequest {
  id: string;
  requesterUid: string;
  requesterEmail: string;
  requesterStationId: string;
  requesterStationName: string;
  sourceStationId: string;
  sourceStationName: string;
  destinationStationId: string;
  destinationStationName: string;
  startDateTime: string;
  endDateTime: string;
  requestedByType: VehicleInventoryByType;
  purpose: string;
  comments?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALLOCATED' | 'COMPLETED';
  reviewedByUid?: string;
  reviewedByEmail?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}
