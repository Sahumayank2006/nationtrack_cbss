import { GWALIOR_POLICE_STATIONS, type PoliceStationPoint } from '@/lib/gwalior-police-stations';

import type { AdminPendingAction, AdminRecentEvent, AdminSummary } from '@/types/admin';
import type {
  DriverAssignment,
  FuelCheckLog,
  VehicleBookingRequest,
} from '@/types/admin-automobiles';
import type {
  AutomobileAsset,
  ComplianceAlert,
  DashboardResponse,
  DepartmentSector,
  EndTripPayload,
  FleetSummaryRow,
  GeoPoint,
  IdleReuseSuggestion,
  LegalRecord,
  LiveVehicleDelta,
  MaintenanceEvent,
  MaintenanceRecord,
  StartTripPayload,
  StationFleetSummary,
  TripLog,
  UtilizationPoint,
  UtilizationReportResponse,
  VehicleLayerFilter,
  VehicleMetadata,
  VehicleOperationalStatus,
} from '@/types/automobiles';

const GWALIOR_CENTER: GeoPoint = { lat: 26.2183, lng: 78.1828 };

const ACTIVE_SECTORS: DepartmentSector[] = ['POLICE_PATROL'];

const sectorLabel: Record<DepartmentSector, string> = {
  GMC_WASTE: 'GMC Municipal',
  AMBULANCE_108: '108 Ambulance',
  POLICE_PATROL: 'Police Patrol',
  PWD_HEAVY: 'PWD Heavy Machinery',
  HEALTH_VAN: 'Health Department',
  ELECTION_REQUISITION: 'Election Duty',
};

const toIsoDate = (daysAhead: number) => {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return date.toISOString();
};

const buildTrail = (origin: GeoPoint, index: number): GeoPoint[] => {
  const points: GeoPoint[] = [];
  for (let i = 0; i < 24; i += 1) {
    points.push({
      lat: origin.lat + Math.sin((index + i) * 0.3) * 0.0009,
      lng: origin.lng + Math.cos((index + i) * 0.3) * 0.0009,
    });
  }
  return points;
};

const hashString = (value: string): number => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
};

const mulberry32 = (seed: number) => {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const getParkedCoordinate = (
  station: PoliceStationPoint,
  slotIndex: number,
  seed: number
): GeoPoint => {
  const rnd = mulberry32(seed + slotIndex * 97);
  const angle = rnd() * Math.PI * 2;
  const radiusMeters = 28 + rnd() * 135;
  const latOffset = (radiusMeters / 111320) * Math.cos(angle);
  const lngOffset =
    (radiusMeters / (111320 * Math.cos((station.coordinates.lat * Math.PI) / 180))) *
    Math.sin(angle);

  return {
    lat: Number((station.coordinates.lat + latOffset).toFixed(6)),
    lng: Number((station.coordinates.lng + lngOffset).toFixed(6)),
  };
};

const SEIZED_TYPES = [
  'Seized Hatchback',
  'Seized Sedan',
  'Seized SUV',
  'Seized Pickup',
  'Seized Motorcycle',
  'Seized Auto Rickshaw',
  'Seized Truck',
  'Seized Bus',
  'Seized Tractor',
  'Seized JCB',
];

const STATION_VEHICLE_PLAN = GWALIOR_POLICE_STATIONS.flatMap((station) => {
  const stationSeed = hashString(station.id);
  const rnd = mulberry32(stationSeed);
  const count = 4 + Math.floor(rnd() * 8);

  return Array.from({ length: count }, (_, slotIndex) => ({
    station,
    slotIndex,
    seed: stationSeed + slotIndex * 17,
  }));
});

const createSeedVehicle = (
  i: number,
  station: PoliceStationPoint,
  slotIndex: number,
  seed: number
): AutomobileAsset => {
  const type = SEIZED_TYPES[(i + slotIndex) % SEIZED_TYPES.length];
  const coordinates = getParkedCoordinate(station, slotIndex, seed);
  const status: VehicleOperationalStatus =
    i % 13 === 0 ? 'BREAKDOWN' : i % 7 === 0 ? 'OFFLINE' : 'IDLE';
  const idleMinutes = status === 'OFFLINE' ? 18000 + i * 33 : 480 + i * 22;

  return {
    id: `nt-auto-${String(i + 1).padStart(4, '0')}`,
    registrationNumber: `MP07-SZ-${String(1000 + i)}`,
    displayName: `Seized ${type.replace('Seized ', '')} | ${station.name}`,
    sector: ACTIVE_SECTORS[0],
    vehicleType: type,
    driverName: 'In Police Custody',
    departmentName: 'Gwalior Police Seized Yard',
    locationLabel: station.name,
    status,
    isMoving: false,
    speedKmph: 0,
    heading: (i * 19) % 360,
    coordinates,
    lastSeenAt: new Date(Date.now() - (i % 18) * 120000).toISOString(),
    idleMinutes,
    idleSinceDate: toIsoDate(-Math.max(1, Math.floor(idleMinutes / 1440))),
    gpsSource: 'MANUAL_CSV',
    compliance: {
      pucExpiry: toIsoDate(-Math.max(10, i % 220)),
      insuranceExpiry: toIsoDate(-Math.max(12, i % 260)),
      fitnessExpiry: toIsoDate(-Math.max(15, i % 300)),
    },
    utilization: {
      hoursToday: 0,
      hoursWeek: 0,
      idlePercent: 100,
    },
    maintenanceRiskScore: Math.min(99, 45 + (i % 12) * 4),
    photoUrl: '/NationTrack-placeholder.jpg',
    specs: {
      fuelType:
        type.includes('JCB') || type.includes('Truck') || type.includes('Bus')
          ? 'Diesel'
          : 'Petrol/Diesel',
      capacity: type.includes('Motorcycle')
        ? '2 Seater'
        : type.includes('Bus')
          ? '36 Seater'
          : 'Seized Yard Hold',
      model: `Seized Asset ${2012 + (i % 12)}`,
      year: 2012 + (i % 12),
    },
    pathTrail24h: buildTrail(coordinates, i),
  };
};

let inMemoryVehicles: AutomobileAsset[] = STATION_VEHICLE_PLAN.map((plan, i) =>
  createSeedVehicle(i, plan.station, plan.slotIndex, plan.seed)
);

const inMemoryTrips: TripLog[] = inMemoryVehicles.flatMap((vehicle, i) => {
  const firstPath = vehicle.pathTrail24h.slice(0, 12);
  const secondPath = vehicle.pathTrail24h.slice(12);
  const firstDistance = Number((12 + (i % 11) * 1.7).toFixed(1));
  const secondDistance = Number((8 + (i % 9) * 1.3).toFixed(1));
  const firstStart = 32000 + i * 9;
  const secondStart = firstStart + Math.floor(firstDistance);
  return [
    {
      id: `trip-${vehicle.id}-1`,
      vehicleId: vehicle.id,
      driverName: vehicle.driverName,
      purpose: 'Scheduled field duty',
      status: 'COMPLETED',
      startedAt: toIsoDate(-1),
      endedAt: new Date(Date.now() - 8 * 3600000).toISOString(),
      startAddress: 'Lashkar Depot, Gwalior',
      endAddress: 'Morar Zone Office, Gwalior',
      distanceKm: firstDistance,
      durationMinutes: 32 + (i % 25),
      startOdometer: firstStart,
      endOdometer: firstStart + Math.floor(firstDistance),
      fuelLiters: Number((2.8 + (i % 6) * 0.7).toFixed(1)),
      routePath: firstPath,
    },
    {
      id: `trip-${vehicle.id}-2`,
      vehicleId: vehicle.id,
      driverName: vehicle.driverName,
      purpose: 'Inter-zone transfer',
      status: 'COMPLETED',
      startedAt: new Date(Date.now() - 6 * 3600000).toISOString(),
      endedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
      startAddress: 'Deen Dayal Nagar, Gwalior',
      endAddress: 'City Hospital Corridor, Gwalior',
      distanceKm: secondDistance,
      durationMinutes: 24 + (i % 16),
      startOdometer: secondStart,
      endOdometer: secondStart + Math.floor(secondDistance),
      fuelLiters: Number((1.8 + (i % 5) * 0.5).toFixed(1)),
      routePath: secondPath,
    },
  ];
});

const maintenanceEvents: MaintenanceEvent[] = inMemoryVehicles.slice(0, 30).map((vehicle, i) => ({
  id: `mnt-${vehicle.id}`,
  vehicleId: vehicle.id,
  title: i % 2 === 0 ? 'Brake System Inspection' : 'Engine Diagnostics',
  loggedAt: new Date(Date.now() - (i + 2) * 86400000).toISOString(),
  costInr: 1800 + i * 175,
  note: i % 2 === 0 ? 'Pads replaced and calibrated.' : 'Sensor calibration and oil line checks.',
}));

const daysToExpiry = (iso: string): number => {
  const expiry = new Date(iso).getTime();
  const now = Date.now();
  return Math.ceil((expiry - now) / 86400000);
};

const getStationById = (stationId: string): PoliceStationPoint | undefined =>
  GWALIOR_POLICE_STATIONS.find((station) => station.id === stationId);

const getZoneByCoordinates = (lat: number, lng: number): StationFleetSummary['zone'] => {
  const latDelta = lat - GWALIOR_CENTER.lat;
  const lngDelta = lng - GWALIOR_CENTER.lng;
  const absLat = Math.abs(latDelta);
  const absLng = Math.abs(lngDelta);

  if (absLat < 0.012 && absLng < 0.012) return 'Central';
  if (absLat >= absLng) return latDelta >= 0 ? 'North' : 'South';
  return lngDelta >= 0 ? 'East' : 'West';
};

const normalizePhoneSuffix = (vehicleId: string): string => {
  const numeric = vehicleId.replace(/\D/g, '').slice(-6).padStart(6, '0');
  return `98${numeric.slice(0, 4)}${numeric.slice(4)}`;
};

const buildVehicleMetadata = (vehicle: AutomobileAsset): VehicleMetadata => {
  const numericId = vehicle.id.replace(/\D/g, '').slice(-4).padStart(4, '0');
  const odometerBase = 25000 + (hashString(vehicle.id) % 55000);

  return {
    chassisNumber: `CHS-${vehicle.specs.year}-${numericId}-NT`,
    engineNumber: `ENG-${numericId}-${hashString(vehicle.registrationNumber).toString(16).slice(0, 6).toUpperCase()}`,
    vehicleType: vehicle.vehicleType,
    makeModel: vehicle.specs.model,
    yearOfManufacture: vehicle.specs.year,
    fuelType: vehicle.specs.fuelType,
    seatingCapacity: vehicle.vehicleType.toLowerCase().includes('motorcycle') ? 2 : 5,
    color: 'White',
    grossWeightKg: vehicle.vehicleType.toLowerCase().includes('truck') ? 5200 : 2500,
    odometerKm: odometerBase,
    gpsSource: vehicle.gpsSource,
    department: vehicle.departmentName,
    sector: vehicle.sector,
    assignedStation: vehicle.locationLabel,
    driverName: vehicle.driverName,
    driverContact: normalizePhoneSuffix(vehicle.id),
  };
};

const buildLegalRecords = (vehicle: AutomobileAsset): LegalRecord[] => {
  const seed = hashString(vehicle.id);
  const challanDate = new Date();
  challanDate.setDate(challanDate.getDate() - (seed % 40) - 5);
  const hearingDate = new Date();
  hearingDate.setDate(hearingDate.getDate() + (seed % 20) + 4);
  const accidentDate = new Date();
  accidentDate.setDate(accidentDate.getDate() - (seed % 180) - 20);

  return [
    {
      id: `legal-${vehicle.id}-challan`,
      vehicleId: vehicle.id,
      type: 'CHALLAN',
      referenceNumber: `CH-${seed.toString().slice(-6)}`,
      date: challanDate.toISOString(),
      description: 'Speed regulation non-compliance recorded on municipal corridor.',
      status: 'PENDING',
      amount: 1500 + (seed % 8) * 250,
      nextActionDate: hearingDate.toISOString(),
      authority: 'Gwalior Traffic Police',
    },
    {
      id: `legal-${vehicle.id}-court`,
      vehicleId: vehicle.id,
      type: 'COURT_CASE',
      referenceNumber: `CT-${seed.toString().slice(-5)}`,
      date: new Date(accidentDate.getTime() + 86400000 * 3).toISOString(),
      description: 'Pending hearing for traffic dispute and liability review.',
      status: 'ACTIVE',
      nextActionDate: hearingDate.toISOString(),
      authority: 'District Court Gwalior',
    },
    {
      id: `legal-${vehicle.id}-accident`,
      vehicleId: vehicle.id,
      type: 'ACCIDENT',
      referenceNumber: `FIR-${seed.toString().slice(-7)}`,
      date: accidentDate.toISOString(),
      description: 'Minor rear-bumper incident. No injuries reported.',
      status: 'RESOLVED',
      authority: vehicle.locationLabel,
    },
  ];
};

const buildMaintenanceHistory = (vehicle: AutomobileAsset): MaintenanceRecord[] => {
  const seed = hashString(vehicle.id);
  const firstServiceDate = new Date();
  firstServiceDate.setDate(firstServiceDate.getDate() - 120 - (seed % 40));
  const secondServiceDate = new Date();
  secondServiceDate.setDate(secondServiceDate.getDate() - 45 - (seed % 20));

  return [
    {
      id: `maint-${vehicle.id}-1`,
      vehicleId: vehicle.id,
      serviceType: 'Periodic Service',
      serviceDate: firstServiceDate.toISOString(),
      odometerKm: 18000 + (seed % 12000),
      costInr: 4200 + (seed % 1800),
      notes: 'Engine oil, filters, and suspension inspection completed.',
      status: 'COMPLETED',
    },
    {
      id: `maint-${vehicle.id}-2`,
      vehicleId: vehicle.id,
      serviceType: 'Brake and Tyre Check',
      serviceDate: secondServiceDate.toISOString(),
      odometerKm: 23000 + (seed % 12000),
      costInr: 3100 + (seed % 1200),
      notes: 'Brake pad wear observed. Tyre rotation completed.',
      status: 'COMPLETED',
    },
    {
      id: `maint-${vehicle.id}-3`,
      vehicleId: vehicle.id,
      serviceType: 'Next Scheduled Service',
      serviceDate: toIsoDate(25 + (seed % 25)),
      odometerKm: 28000 + (seed % 12000),
      costInr: 0,
      notes: 'Upcoming preventive maintenance slot reserved.',
      status: 'DUE',
    },
  ];
};

export const statusToColor: Record<VehicleOperationalStatus, string> = {
  MOVING: '#16a34a',
  IDLE: '#eab308',
  BREAKDOWN: '#dc2626',
  OFFLINE: '#6b7280',
};

export const statusLabel: Record<VehicleOperationalStatus, string> = {
  MOVING: 'Active/Moving',
  IDLE: 'Idle',
  BREAKDOWN: 'Breakdown/Maintenance',
  OFFLINE: 'Offline',
};

export const getMapCenter = () => GWALIOR_CENTER;

export const getVehicles = (): AutomobileAsset[] => inMemoryVehicles;

export const getStationFleetSummaries = (): StationFleetSummary[] => {
  return GWALIOR_POLICE_STATIONS.map((station) => {
    const stationVehicles = inMemoryVehicles.filter(
      (vehicle) => vehicle.locationLabel === station.name
    );

    const statusCounts: Record<VehicleOperationalStatus, number> = {
      MOVING: 0,
      IDLE: 0,
      BREAKDOWN: 0,
      OFFLINE: 0,
    };

    for (const vehicle of stationVehicles) {
      statusCounts[vehicle.status] += 1;
    }

    const vehicleTypeCounts = stationVehicles.reduce<Record<string, number>>(
      (acc, vehicle) => {
        const normalizedType = vehicle.vehicleType.toLowerCase();
        const bucket = normalizedType.includes('motorcycle')
          ? 'Motorcycles'
          : normalizedType.includes('van')
            ? 'Vans'
            : normalizedType.includes('truck') ||
                normalizedType.includes('bus') ||
                normalizedType.includes('tractor') ||
                normalizedType.includes('jcb')
              ? 'Heavy Vehicles'
              : 'Patrol Cars';
        acc[bucket] = (acc[bucket] ?? 0) + 1;
        return acc;
      },
      {
        'Patrol Cars': 0,
        Motorcycles: 0,
        Vans: 0,
        'Heavy Vehicles': 0,
      }
    );

    const complianceAlertCount = stationVehicles.filter((vehicle) => {
      const expiries = [
        vehicle.compliance.pucExpiry,
        vehicle.compliance.insuranceExpiry,
        vehicle.compliance.fitnessExpiry,
      ];
      return expiries.some((date) => {
        const remaining = daysToExpiry(date);
        return remaining >= 0 && remaining <= 30;
      });
    }).length;

    return {
      stationId: station.id,
      stationName: station.name,
      zone: getZoneByCoordinates(station.coordinates.lat, station.coordinates.lng),
      coordinates: station.coordinates,
      totalVehicles: stationVehicles.length,
      statusCounts,
      vehicleTypeCounts,
      complianceAlertCount,
    };
  }).filter((summary) => summary.totalVehicles > 0);
};

export const getVehiclesByStation = (stationId: string): AutomobileAsset[] => {
  const station = getStationById(stationId);
  if (!station) return [];
  return inMemoryVehicles.filter((vehicle) => vehicle.locationLabel === station.name);
};

export const getVehicleMetadata = (vehicleId: string): VehicleMetadata => {
  const vehicle = getVehicleById(vehicleId);
  if (!vehicle) {
    throw new Error('Vehicle not found');
  }
  return buildVehicleMetadata(vehicle);
};

export const getVehicleLegalRecords = (vehicleId: string): LegalRecord[] => {
  const vehicle = getVehicleById(vehicleId);
  if (!vehicle) return [];
  return buildLegalRecords(vehicle);
};

export const getVehicleMaintenanceHistory = (vehicleId: string): MaintenanceRecord[] => {
  const vehicle = getVehicleById(vehicleId);
  if (!vehicle) return [];
  return buildMaintenanceHistory(vehicle);
};

export const getTripsByVehicle = (vehicleId: string): TripLog[] =>
  inMemoryTrips
    .filter((trip) => trip.vehicleId === vehicleId)
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

export const getMaintenanceByVehicle = (vehicleId: string): MaintenanceEvent[] =>
  maintenanceEvents.filter((item) => item.vehicleId === vehicleId);

export const getComplianceAlerts = (): ComplianceAlert[] => {
  const alerts: ComplianceAlert[] = [];

  for (const vehicle of inMemoryVehicles) {
    const items = [
      { key: 'PUC' as const, date: vehicle.compliance.pucExpiry },
      { key: 'INSURANCE' as const, date: vehicle.compliance.insuranceExpiry },
      { key: 'FITNESS' as const, date: vehicle.compliance.fitnessExpiry },
    ];

    for (const item of items) {
      const remaining = daysToExpiry(item.date);
      alerts.push({
        id: `${vehicle.id}-${item.key}`,
        vehicleId: vehicle.id,
        registrationNumber: vehicle.registrationNumber,
        type: item.key,
        expiresOn: item.date,
        daysRemaining: remaining,
        severity: remaining <= 7 ? 'CRITICAL' : remaining <= 30 ? 'WARNING' : 'OK',
      });
    }
  }

  return alerts;
};

export const getIdleSuggestions = (): IdleReuseSuggestion[] => {
  return inMemoryVehicles
    .map((vehicle) => {
      const idleDays = Math.floor(vehicle.idleMinutes / 1440);
      if (idleDays < 180) return null;

      const suggestion =
        vehicle.sector === 'POLICE_PATROL'
          ? 'INTER_DEPARTMENT_TRANSFER'
          : vehicle.sector === 'ELECTION_REQUISITION'
            ? 'ELECTION_DEPLOYMENT'
            : 'GEM_AUCTION';

      return {
        id: `idle-${vehicle.id}`,
        vehicleId: vehicle.id,
        registrationNumber: vehicle.registrationNumber,
        idleDays,
        suggestedAction: suggestion,
        reasoning: 'Vehicle has remained non-operational beyond six months.',
        targetDepartment:
          suggestion === 'ELECTION_DEPLOYMENT'
            ? 'District Election Office'
            : 'Cross Department Pool',
      };
    })
    .filter((item): item is IdleReuseSuggestion => item !== null);
};

export const filterVehicles = (
  vehicles: AutomobileAsset[],
  filter: VehicleLayerFilter,
  query: string
): AutomobileAsset[] => {
  const search = query.trim().toLowerCase();

  return vehicles.filter((vehicle) => {
    const layerMatch =
      filter === 'ALL'
        ? true
        : filter === 'ACTIVE_ONLY'
          ? vehicle.status === 'MOVING'
          : filter === 'IDLE_ONLY'
            ? vehicle.status === 'IDLE'
            : filter === 'POLICE'
              ? vehicle.sector === 'POLICE_PATROL'
              : filter === 'AMBULANCES'
                ? vehicle.sector === 'AMBULANCE_108'
                : vehicle.sector === 'PWD_HEAVY';

    const textMatch =
      search.length === 0 ||
      vehicle.registrationNumber.toLowerCase().includes(search) ||
      vehicle.vehicleType.toLowerCase().includes(search) ||
      vehicle.locationLabel.toLowerCase().includes(search) ||
      vehicle.departmentName.toLowerCase().includes(search);

    return layerMatch && textMatch;
  });
};

export const generateLiveDelta = (): LiveVehicleDelta[] => {
  inMemoryVehicles = inMemoryVehicles.map((vehicle) => {
    const nextIdleMinutes = Math.min(280000, vehicle.idleMinutes + 1);

    return {
      ...vehicle,
      speedKmph: 0,
      isMoving: false,
      lastSeenAt: new Date().toISOString(),
      idleMinutes: nextIdleMinutes,
      status:
        vehicle.status === 'BREAKDOWN' || vehicle.status === 'OFFLINE' ? vehicle.status : 'IDLE',
      gpsSource: 'MANUAL_CSV',
    };
  });

  return inMemoryVehicles.map((vehicle) => ({
    vehicleId: vehicle.id,
    coordinates: vehicle.coordinates,
    speedKmph: vehicle.speedKmph,
    heading: vehicle.heading,
    status: vehicle.status,
    idleMinutes: vehicle.idleMinutes,
    lastSeenAt: vehicle.lastSeenAt,
    gpsSource: vehicle.gpsSource,
  }));
};

export const getDashboardPayload = (
  filter: VehicleLayerFilter,
  query: string
): DashboardResponse => {
  const vehicles = filterVehicles(getVehicles(), filter, query);
  return {
    vehicles,
    complianceAlerts: getComplianceAlerts(),
    idleSuggestions: getIdleSuggestions(),
    generatedAt: new Date().toISOString(),
  };
};

export const getVehicleById = (vehicleId: string): AutomobileAsset | undefined =>
  inMemoryVehicles.find((vehicle) => vehicle.id === vehicleId);

export const getDepartments = (): string[] =>
  Array.from(new Set(inMemoryVehicles.map((vehicle) => vehicle.departmentName))).sort();

export const getVehicleTypes = (): string[] =>
  Array.from(new Set(inMemoryVehicles.map((vehicle) => vehicle.vehicleType))).sort();

export const getFleetSummary = (): FleetSummaryRow[] => {
  const grouped = new Map<DepartmentSector, AutomobileAsset[]>();

  for (const vehicle of inMemoryVehicles) {
    if (!grouped.has(vehicle.sector)) grouped.set(vehicle.sector, []);
    grouped.get(vehicle.sector)?.push(vehicle);
  }

  return Array.from(grouped.entries()).map(([sector, items]) => {
    const moving = items.filter((item) => item.status === 'MOVING').length;
    const idle = items.filter((item) => item.status === 'IDLE').length;
    const maintenance = items.filter((item) => item.status === 'BREAKDOWN').length;
    const offline = items.filter((item) => item.status === 'OFFLINE').length;
    const utilizationPercent = Number(
      (
        items.reduce((sum, item) => sum + (100 - item.utilization.idlePercent), 0) / items.length
      ).toFixed(1)
    );

    return {
      sector,
      sectorLabel: sectorLabel[sector],
      total: items.length,
      moving,
      idle,
      maintenance,
      offline,
      utilizationPercent,
    };
  });
};

export const getUtilizationReport = (days = 30): UtilizationReportResponse => {
  const points: UtilizationPoint[] = Array.from({ length: Math.max(1, days) }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - index - 1));

    const dateSeed = Math.sin(index * 0.35) + 1;
    const activeKm = Math.round(180 + dateSeed * 70);
    const idleKm = Math.round(40 + (1 - Math.cos(index * 0.28)) * 25);
    const trips = Math.round(14 + dateSeed * 6);

    return {
      date: date.toISOString().slice(0, 10),
      activeKm,
      idleKm,
      trips,
    };
  });

  const totalKm = points.reduce((sum, point) => sum + point.activeKm, 0);
  const totalTrips = points.reduce((sum, point) => sum + point.trips, 0);

  return {
    points,
    summary: {
      totalKm,
      averageTripsPerVehiclePerWeek: Number(
        ((totalTrips / Math.max(1, inMemoryVehicles.length)) * (7 / Math.max(1, days))).toFixed(2)
      ),
      utilizationPercent: Number(
        (
          inMemoryVehicles.reduce(
            (sum, vehicle) => sum + (100 - vehicle.utilization.idlePercent),
            0
          ) / inMemoryVehicles.length
        ).toFixed(1)
      ),
    },
    fleetSummary: getFleetSummary(),
  };
};

export const startTrip = (payload: StartTripPayload): TripLog => {
  const vehicle = getVehicleById(payload.vehicleId);
  if (!vehicle) {
    throw new Error('Vehicle not found');
  }

  const ongoing = inMemoryTrips.find(
    (trip) => trip.vehicleId === payload.vehicleId && trip.status === 'ONGOING'
  );
  if (ongoing) {
    throw new Error('Trip already ongoing for this vehicle');
  }

  const trip: TripLog = {
    id: `trip-${payload.vehicleId}-${Date.now()}`,
    vehicleId: payload.vehicleId,
    driverName: payload.driverName,
    purpose: payload.purpose,
    status: 'ONGOING',
    startedAt: new Date().toISOString(),
    startAddress: payload.startAddress,
    startOdometer: payload.startOdometer,
    routePath: [vehicle.coordinates],
  };

  inMemoryTrips.unshift(trip);

  inMemoryVehicles = inMemoryVehicles.map((item) =>
    item.id === payload.vehicleId
      ? {
          ...item,
          status: 'MOVING',
          isMoving: true,
          idleMinutes: 0,
          idleSinceDate: undefined,
          lastSeenAt: new Date().toISOString(),
        }
      : item
  );

  return trip;
};

export const endTrip = (payload: EndTripPayload): TripLog => {
  const tripIndex = inMemoryTrips.findIndex(
    (trip) => trip.vehicleId === payload.vehicleId && trip.status === 'ONGOING'
  );

  if (tripIndex === -1) {
    throw new Error('No ongoing trip found for this vehicle');
  }

  const current = inMemoryTrips[tripIndex];
  if (payload.endOdometer < current.startOdometer) {
    throw new Error('End odometer cannot be less than start odometer');
  }

  const endedAt = new Date().toISOString();
  const durationMinutes = Math.max(
    1,
    Math.round((new Date(endedAt).getTime() - new Date(current.startedAt).getTime()) / 60000)
  );
  const distanceKm = Number((payload.endOdometer - current.startOdometer).toFixed(1));

  const completed: TripLog = {
    ...current,
    endedAt,
    endAddress: payload.endAddress,
    endOdometer: payload.endOdometer,
    durationMinutes,
    distanceKm,
    status: 'COMPLETED',
  };

  inMemoryTrips[tripIndex] = completed;
  inMemoryVehicles = inMemoryVehicles.map((item) =>
    item.id === payload.vehicleId
      ? {
          ...item,
          status: distanceKm > 0 ? 'MOVING' : 'IDLE',
          isMoving: distanceKm > 0,
          lastSeenAt: endedAt,
        }
      : item
  );

  return completed;
};

export interface GemExportRow {
  registrationNumber: string;
  makeModel: string;
  year: number;
  fuelType: string;
  department: string;
  idleDays: number;
  estimatedValue: number;
  contactOfficer: string;
}

export const getGemExportRows = (): GemExportRow[] => {
  const idleByVehicle = new Map(
    getIdleSuggestions().map((suggestion) => [suggestion.vehicleId, suggestion.idleDays])
  );

  return inMemoryVehicles
    .filter((vehicle) => idleByVehicle.has(vehicle.id))
    .map((vehicle, index) => ({
      registrationNumber: vehicle.registrationNumber,
      makeModel: vehicle.specs.model,
      year: vehicle.specs.year,
      fuelType: vehicle.specs.fuelType,
      department: vehicle.departmentName,
      idleDays: idleByVehicle.get(vehicle.id) ?? 0,
      estimatedValue: Math.max(85000, 450000 - index * 9500),
      contactOfficer: vehicle.driverName,
    }));
};

const sectorToAdminType: Record<DepartmentSector, string> = {
  GMC_WASTE: 'WASTE_TRUCK',
  AMBULANCE_108: 'AMBULANCE',
  POLICE_PATROL: 'PATROL',
  PWD_HEAVY: 'PWD_MACHINERY',
  HEALTH_VAN: 'HEALTH_VAN',
  ELECTION_REQUISITION: 'ELECTION',
};

const toEventSeverity = (status: VehicleOperationalStatus): AdminRecentEvent['severity'] => {
  if (status === 'BREAKDOWN') return 'URGENT';
  if (status === 'IDLE') return 'WARNING';
  return 'INFO';
};

export const getAutomobileRecentEvents = (
  limit = 10,
  type: string | 'ALL' = 'ALL'
): AdminRecentEvent[] => {
  const vehicleLookup = new Map(inMemoryVehicles.map((vehicle) => [vehicle.id, vehicle]));

  const tripEvents: AdminRecentEvent[] = inMemoryTrips
    .filter((trip) => {
      if (type === 'ALL') return true;
      const vehicle = vehicleLookup.get(trip.vehicleId);
      if (!vehicle) return false;
      return sectorToAdminType[vehicle.sector] === type;
    })
    .flatMap((trip) => {
      const vehicle = vehicleLookup.get(trip.vehicleId);
      if (!vehicle) return [];

      const base = {
        module: 'automobile' as const,
        assetId: vehicle.registrationNumber,
        assetName: vehicle.displayName,
        actorName: trip.driverName,
      };

      const events: AdminRecentEvent[] = [
        {
          id: `evt-trip-start-${trip.id}`,
          ...base,
          eventType: 'TRIP_START',
          severity: 'INFO',
          timestamp: trip.startedAt,
        },
      ];

      if (trip.endedAt) {
        events.push({
          id: `evt-trip-end-${trip.id}`,
          ...base,
          eventType: 'TRIP_END',
          severity: 'INFO',
          timestamp: trip.endedAt,
        });
      }

      return events;
    });

  const maintenanceDerivedEvents: AdminRecentEvent[] = maintenanceEvents
    .filter((event) => {
      if (type === 'ALL') return true;
      const vehicle = vehicleLookup.get(event.vehicleId);
      if (!vehicle) return false;
      return sectorToAdminType[vehicle.sector] === type;
    })
    .map((event) => {
      const vehicle = vehicleLookup.get(event.vehicleId);
      return {
        id: `evt-mnt-${event.id}`,
        module: 'automobile',
        assetId: vehicle?.registrationNumber ?? event.vehicleId,
        assetName: vehicle?.displayName ?? event.vehicleId,
        eventType: 'MAINTENANCE_RAISED',
        actorName: 'Workshop Desk',
        severity: 'WARNING',
        timestamp: event.loggedAt,
      };
    });

  const complianceEvents: AdminRecentEvent[] = getComplianceAlerts()
    .filter((alert) => alert.severity !== 'OK')
    .filter((alert) => {
      if (type === 'ALL') return true;
      const vehicle = inMemoryVehicles.find((item) => item.id === alert.vehicleId);
      if (!vehicle) return false;
      return sectorToAdminType[vehicle.sector] === type;
    })
    .map((alert) => {
      const vehicle = inMemoryVehicles.find((item) => item.id === alert.vehicleId);
      return {
        id: `evt-comp-${alert.id}`,
        module: 'automobile',
        assetId: alert.registrationNumber,
        assetName: vehicle?.displayName ?? alert.registrationNumber,
        eventType: 'COMPLIANCE_ALERT',
        actorName: 'Compliance Bot',
        severity: alert.severity === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
        timestamp: vehicle?.lastSeenAt ?? new Date().toISOString(),
      };
    });

  const statusEvents: AdminRecentEvent[] = inMemoryVehicles
    .filter((vehicle) => (type === 'ALL' ? true : sectorToAdminType[vehicle.sector] === type))
    .slice(0, 40)
    .map((vehicle) => ({
      id: `evt-status-${vehicle.id}`,
      module: 'automobile',
      assetId: vehicle.registrationNumber,
      assetName: vehicle.displayName,
      eventType: vehicle.status === 'IDLE' ? 'IDLE_FLAGGED' : 'STATUS_UPDATE',
      actorName: 'Telemetry Stream',
      severity: toEventSeverity(vehicle.status),
      timestamp: vehicle.lastSeenAt,
    }));

  return [...tripEvents, ...maintenanceDerivedEvents, ...complianceEvents, ...statusEvents]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
};

export const getAutomobilePendingActions = (
  limit = 5,
  type: string | 'ALL' = 'ALL'
): AdminPendingAction[] => {
  const scopedVehicles = inMemoryVehicles.filter((vehicle) =>
    type === 'ALL' ? true : sectorToAdminType[vehicle.sector] === type
  );

  const sosAction = scopedVehicles.length
    ? [
        {
          id: `pending-sos-${scopedVehicles[0].id}`,
          module: 'automobile' as const,
          category: 'SOS' as const,
          severity: 'CRITICAL' as const,
          title: `SOS Alert - ${scopedVehicles[0].registrationNumber}`,
          description: `${scopedVehicles[0].displayName} reported emergency signal`,
          assetId: scopedVehicles[0].registrationNumber,
          assetName: scopedVehicles[0].displayName,
          status: 'PENDING' as const,
          createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
        },
      ]
    : [];

  const complianceActions: AdminPendingAction[] = getComplianceAlerts()
    .filter((alert) => alert.severity !== 'OK')
    .filter((alert) => {
      if (type === 'ALL') return true;
      const vehicle = inMemoryVehicles.find((item) => item.id === alert.vehicleId);
      if (!vehicle) return false;
      return sectorToAdminType[vehicle.sector] === type;
    })
    .map((alert) => ({
      id: `pending-comp-${alert.id}`,
      module: 'automobile',
      category: 'COMPLIANCE',
      severity: alert.severity === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
      title: `${alert.type} Expiry - ${alert.registrationNumber}`,
      description: `${alert.type} expires in ${alert.daysRemaining} days`,
      assetId: alert.registrationNumber,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      metadata: {
        expiresOn: alert.expiresOn,
        daysRemaining: alert.daysRemaining,
      },
    }));

  const maintenanceActions: AdminPendingAction[] = maintenanceEvents
    .filter((event) => {
      if (type === 'ALL') return true;
      const vehicle = inMemoryVehicles.find((item) => item.id === event.vehicleId);
      if (!vehicle) return false;
      return sectorToAdminType[vehicle.sector] === type;
    })
    .map((event) => {
      const vehicle = inMemoryVehicles.find((item) => item.id === event.vehicleId);
      const severity: AdminPendingAction['severity'] =
        (vehicle?.maintenanceRiskScore ?? 0) > 80 ? 'URGENT' : 'WARNING';

      return {
        id: `pending-mnt-${event.id}`,
        module: 'automobile',
        category: 'MAINTENANCE',
        severity,
        title: event.title,
        description: event.note,
        assetId: vehicle?.registrationNumber,
        assetName: vehicle?.displayName,
        status: 'PENDING',
        createdAt: event.loggedAt,
      };
    });

  return [...sosAction, ...complianceActions, ...maintenanceActions]
    .sort((a, b) => {
      const rank = { CRITICAL: 4, URGENT: 3, WARNING: 2, INFO: 1 };
      const delta = rank[b.severity] - rank[a.severity];
      if (delta !== 0) return delta;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .slice(0, limit);
};

export const getAutomobilesAdminSummary = (type: string | 'ALL' = 'ALL'): AdminSummary => {
  const scopedVehicles = inMemoryVehicles.filter((vehicle) =>
    type === 'ALL' ? true : sectorToAdminType[vehicle.sector] === type
  );

  const byStatus = scopedVehicles.reduce<Record<string, number>>((acc, vehicle) => {
    acc[vehicle.status] = (acc[vehicle.status] ?? 0) + 1;
    return acc;
  }, {});

  const byType = scopedVehicles.reduce<Record<string, number>>((acc, vehicle) => {
    const typeKey = sectorToAdminType[vehicle.sector];
    acc[typeKey] = (acc[typeKey] ?? 0) + 1;
    return acc;
  }, {});

  const pendingActions = getAutomobilePendingActions(500, type);

  return {
    total: scopedVehicles.length,
    byStatus,
    byType,
    pendingApprovals: pendingActions.length,
    criticalAlerts: pendingActions.filter((item) => item.severity === 'CRITICAL').length,
    idleCount: scopedVehicles.filter((vehicle) => vehicle.status === 'IDLE').length,
    recentEvents: getAutomobileRecentEvents(5, type),
    lastUpdated: new Date().toISOString(),
  };
};

export const getAutomobileDashboardStats = () => {
  const pendingActions = getAutomobilePendingActions(500, 'ALL');
  return {
    activeCount: inMemoryVehicles.filter((vehicle) => vehicle.status === 'MOVING').length,
    idleCount: inMemoryVehicles.filter((vehicle) => vehicle.status === 'IDLE').length,
    pendingActionsCount: pendingActions.length,
    sosActiveCount: pendingActions.filter((item) => item.category === 'SOS').length,
  };
};

const adminBookingRequests: VehicleBookingRequest[] = [
  {
    id: 'admin-book-001',
    vehicleId: inMemoryVehicles[0]?.id ?? 'veh-001',
    requesterName: 'Rahul Singh',
    requesterDepartment: 'Traffic Control',
    requesterPhone: '9876543210',
    purpose: 'MAINTENANCE',
    startDate: toIsoDate(0),
    endDate: toIsoDate(2),
    estimatedDistance: 120,
    status: 'PENDING',
    createdAt: toIsoDate(-1),
    updatedAt: toIsoDate(-1),
  },
  {
    id: 'admin-book-002',
    vehicleId: inMemoryVehicles[1]?.id ?? 'veh-002',
    requesterName: 'Anita Verma',
    requesterDepartment: 'Health Department',
    requesterPhone: '9876500001',
    purpose: 'EMERGENCY',
    startDate: toIsoDate(1),
    endDate: toIsoDate(3),
    estimatedDistance: 80,
    status: 'PENDING',
    createdAt: toIsoDate(-2),
    updatedAt: toIsoDate(-2),
  },
];

const fuelCheckLogs: FuelCheckLog[] = [];

export const getAdminBookingRequests = (status?: VehicleBookingRequest['status']) => {
  if (!status || status === 'PENDING') {
    return adminBookingRequests;
  }

  return adminBookingRequests.filter((item) => item.status === status);
};

export const approveAdminBookingRequest = (
  bookingId: string,
  approverName: string,
  approvalComments: string
) => {
  const booking = adminBookingRequests.find((item) => item.id === bookingId);
  if (!booking) {
    return null;
  }

  booking.status = 'APPROVED';
  booking.approverName = approverName;
  booking.approvalComments = approvalComments;
  booking.updatedAt = new Date().toISOString();
  return booking;
};

export const rejectAdminBookingRequest = (bookingId: string, rejectionReason: string) => {
  const booking = adminBookingRequests.find((item) => item.id === bookingId);
  if (!booking) {
    return null;
  }

  booking.status = 'REJECTED';
  booking.rejectionReason = rejectionReason;
  booking.updatedAt = new Date().toISOString();
  return booking;
};

export const batchApproveAdminBookings = (
  bookingIds: string[],
  approverName: string,
  approvalComments: string
) => {
  return bookingIds
    .map((id) => approveAdminBookingRequest(id, approverName, approvalComments))
    .filter((item): item is VehicleBookingRequest => item !== null);
};

export const assignDriverToBooking = (
  bookingId: string,
  assignment: Omit<DriverAssignment, 'id' | 'bookingId' | 'assignedAt'>
) => {
  const booking = adminBookingRequests.find((item) => item.id === bookingId);
  if (!booking) {
    return null;
  }

  booking.driverAssigned = {
    name: assignment.driverName,
    phone: assignment.driverPhone,
    licenseNumber: assignment.licenseNumber,
  };
  booking.updatedAt = new Date().toISOString();
  return booking;
};

export const logFuelCheck = (payload: Omit<FuelCheckLog, 'id' | 'checkedAt'>) => {
  const log: FuelCheckLog = {
    ...payload,
    id: `fuel-${Date.now()}`,
    checkedAt: new Date().toISOString(),
  };
  fuelCheckLogs.unshift(log);
  return log;
};

export const getFuelCheckLogs = (vehicleId?: string) => {
  if (!vehicleId) {
    return fuelCheckLogs;
  }

  return fuelCheckLogs.filter((item) => item.vehicleId === vehicleId);
};
