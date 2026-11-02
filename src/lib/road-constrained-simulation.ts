import type {
  AutomobileAsset,
  GpsSourceTier,
  LiveVehicleDelta,
  VehicleOperationalStatus,
} from '@/types/automobiles';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { GWALIOR_ROAD_PATHS } from '@/lib/gwalior-road-paths.generated';

type PathPoint = readonly [number, number];

interface RoadAnchor {
  pathIndex: number;
  pointIndex: number;
  lat: number;
  lng: number;
}

interface VehicleRouteState {
  pathIndex: number;
  segmentStartIndex: number;
  direction: 1 | -1;
  t: number;
  baseSpeedKmph: number;
  hash: number;
}

interface BoundaryEnvelope {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

const vehicleState = new Map<string, VehicleRouteState>();

const ROAD_ANCHORS: RoadAnchor[] = GWALIOR_ROAD_PATHS.flatMap((path, pathIndex) =>
  path.map((point, pointIndex) => ({
    pathIndex,
    pointIndex,
    lat: point[0],
    lng: point[1],
  }))
);

const parseKmlCoordinateBlocks = (kmlText: string): PathPoint[][] => {
  const blocks = Array.from(kmlText.matchAll(/<coordinates>([\s\S]*?)<\/coordinates>/gi));
  return blocks
    .map((match) => {
      const raw = match[1]?.trim() ?? '';
      if (!raw) return [];
      return raw
        .split(/\s+/)
        .map((entry) => {
          const [lngText, latText] = entry.split(',');
          const lat = Number(latText);
          const lng = Number(lngText);
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
          return [lat, lng] as const;
        })
        .filter((point): point is PathPoint => point !== null);
    })
    .filter((pathPoints) => pathPoints.length >= 3);
};

const loadBoundaryPolygon = (): readonly PathPoint[] => {
  try {
    const boundaryPath = path.join(process.cwd(), 'public', 'maps', 'gwalior', 'doc.kml');
    const raw = readFileSync(boundaryPath, 'utf8');
    const polygons = parseKmlCoordinateBlocks(raw);
    if (polygons.length === 0) return [];
    return polygons.reduce(
      (largest, current) => (current.length > largest.length ? current : largest),
      polygons[0]
    );
  } catch {
    return [];
  }
};

const GWALIOR_BOUNDARY = loadBoundaryPolygon();

const getEnvelope = (points: readonly PathPoint[]): BoundaryEnvelope | null => {
  if (points.length === 0) return null;
  let minLat = Number.POSITIVE_INFINITY;
  let maxLat = Number.NEGATIVE_INFINITY;
  let minLng = Number.POSITIVE_INFINITY;
  let maxLng = Number.NEGATIVE_INFINITY;

  for (const [lat, lng] of points) {
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
  }

  return { minLat, maxLat, minLng, maxLng };
};

const isPointInPolygon = (lat: number, lng: number, polygon: readonly PathPoint[]): boolean => {
  if (polygon.length < 3) return true;

  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const xi = polygon[i][1];
    const yi = polygon[i][0];
    const xj = polygon[j][1];
    const yj = polygon[j][0];

    const intersects =
      yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi + 1e-12) + xi;
    if (intersects) inside = !inside;
  }

  return inside;
};

const sortAnchorsByGridScatter = (anchors: readonly RoadAnchor[]): RoadAnchor[] => {
  if (anchors.length < 2) return [...anchors];

  const envelope = getEnvelope(anchors.map((a) => [a.lat, a.lng] as const));
  if (!envelope) return [...anchors];

  const cols = 18;
  const rows = 18;
  const latSpan = Math.max(1e-9, envelope.maxLat - envelope.minLat);
  const lngSpan = Math.max(1e-9, envelope.maxLng - envelope.minLng);
  const buckets = new Map<string, RoadAnchor[]>();

  for (const anchor of anchors) {
    const row = Math.min(
      rows - 1,
      Math.max(0, Math.floor(((anchor.lat - envelope.minLat) / latSpan) * rows))
    );
    const col = Math.min(
      cols - 1,
      Math.max(0, Math.floor(((anchor.lng - envelope.minLng) / lngSpan) * cols))
    );
    const key = `${row}:${col}`;
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.push(anchor);
    } else {
      buckets.set(key, [anchor]);
    }
  }

  const orderedBucketKeys = Array.from(buckets.keys()).sort();
  const firstPass: RoadAnchor[] = [];
  const leftovers = new Map<string, RoadAnchor[]>();

  for (const key of orderedBucketKeys) {
    const group = buckets.get(key) ?? [];
    if (group.length === 0) continue;
    const pivot = hashString(`${key}:${group.length}`) % group.length;
    firstPass.push(group[pivot]);
    leftovers.set(
      key,
      group.filter((_, index) => index !== pivot)
    );
  }

  const scatter: RoadAnchor[] = [...firstPass];
  let appended = true;
  while (appended) {
    appended = false;
    for (const key of orderedBucketKeys) {
      const remaining = leftovers.get(key);
      if (!remaining || remaining.length === 0) continue;
      scatter.push(remaining.shift() as RoadAnchor);
      appended = true;
    }
  }

  return scatter;
};

const CITYWIDE_SCATTER_ANCHORS: RoadAnchor[] = (() => {
  const boundaryFiltered = ROAD_ANCHORS.filter((anchor) =>
    isPointInPolygon(anchor.lat, anchor.lng, GWALIOR_BOUNDARY)
  );

  const source = boundaryFiltered.length > 1000 ? boundaryFiltered : ROAD_ANCHORS;
  return sortAnchorsByGridScatter(source);
})();

const CITYWIDE_ENVELOPE = getEnvelope(
  CITYWIDE_SCATTER_ANCHORS.map((anchor) => [anchor.lat, anchor.lng] as const)
);

const NORTH_SCATTER_ANCHORS: RoadAnchor[] = (() => {
  if (!CITYWIDE_ENVELOPE) return CITYWIDE_SCATTER_ANCHORS;
  const northThreshold =
    CITYWIDE_ENVELOPE.minLat + (CITYWIDE_ENVELOPE.maxLat - CITYWIDE_ENVELOPE.minLat) * 0.66;
  const northern = CITYWIDE_SCATTER_ANCHORS.filter((anchor) => anchor.lat >= northThreshold);
  return northern.length > 50 ? northern : CITYWIDE_SCATTER_ANCHORS;
})();

const SOUTH_SCATTER_ANCHORS: RoadAnchor[] = (() => {
  if (!CITYWIDE_ENVELOPE) return CITYWIDE_SCATTER_ANCHORS;
  const southThreshold =
    CITYWIDE_ENVELOPE.minLat + (CITYWIDE_ENVELOPE.maxLat - CITYWIDE_ENVELOPE.minLat) * 0.34;
  const southern = CITYWIDE_SCATTER_ANCHORS.filter((anchor) => anchor.lat <= southThreshold);
  return southern.length > 50 ? southern : CITYWIDE_SCATTER_ANCHORS;
})();

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

const toRadians = (value: number) => (value * Math.PI) / 180;

const distanceMeters = (a: PathPoint, b: PathPoint): number => {
  const avgLat = toRadians((a[0] + b[0]) / 2);
  const metersPerLat = 111320;
  const metersPerLng = 111320 * Math.cos(avgLat);
  const dLat = (b[0] - a[0]) * metersPerLat;
  const dLng = (b[1] - a[1]) * metersPerLng;
  return Math.hypot(dLat, dLng);
};

const bearingDegrees = (a: PathPoint, b: PathPoint): number => {
  const lat1 = toRadians(a[0]);
  const lat2 = toRadians(b[0]);
  const dLng = toRadians(b[1] - a[1]);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
};

const pickDistributedAnchor = (vehicleId: string): RoadAnchor => {
  const fallback = CITYWIDE_SCATTER_ANCHORS.length > 0 ? CITYWIDE_SCATTER_ANCHORS : ROAD_ANCHORS;
  const hash = hashString(vehicleId);
  const mixed = (hash ^ (hash >>> 16) ^ (hash << 5)) >>> 0;

  // Heavily bias fleet placement toward north and south while preserving deterministic spread.
  const bandSelector = mixed % 10;
  const anchors =
    bandSelector <= 4
      ? NORTH_SCATTER_ANCHORS
      : bandSelector <= 8
        ? SOUTH_SCATTER_ANCHORS
        : fallback;

  const index = mixed % anchors.length;
  return anchors[index];
};

const getPathPoint = (path: readonly PathPoint[], index: number): PathPoint => {
  const safeIndex = Math.min(path.length - 1, Math.max(0, index));
  return path[safeIndex];
};

const getStateSegment = (
  state: VehicleRouteState
): { path: readonly PathPoint[]; a: PathPoint; b: PathPoint } => {
  const path = GWALIOR_ROAD_PATHS[state.pathIndex] ?? GWALIOR_ROAD_PATHS[0];
  if (!path || path.length < 2) {
    const fallback = [26.2183, 78.1828] as const satisfies PathPoint;
    return { path: [fallback, fallback], a: fallback, b: fallback };
  }

  const a = getPathPoint(path, state.segmentStartIndex);
  const b =
    state.direction === 1
      ? getPathPoint(path, state.segmentStartIndex + 1)
      : getPathPoint(path, state.segmentStartIndex - 1);

  return { path, a, b };
};

const getInterpolatedPosition = (state: VehicleRouteState): PathPoint => {
  const { a, b } = getStateSegment(state);
  const lat = a[0] + (b[0] - a[0]) * state.t;
  const lng = a[1] + (b[1] - a[1]) * state.t;
  return [lat, lng];
};

const ensureState = (vehicle: AutomobileAsset): VehicleRouteState => {
  const existing = vehicleState.get(vehicle.id);
  if (existing) return existing;

  const hash = hashString(vehicle.id);
  const distributed = pickDistributedAnchor(vehicle.id);
  const path = GWALIOR_ROAD_PATHS[distributed.pathIndex];
  const direction: 1 | -1 = hash % 2 === 0 ? 1 : -1;

  let segmentStartIndex = distributed.pointIndex;
  if (direction === 1 && segmentStartIndex >= path.length - 1) {
    segmentStartIndex = Math.max(0, path.length - 2);
  }
  if (direction === -1 && segmentStartIndex <= 0) {
    segmentStartIndex = Math.min(path.length - 1, 1);
  }

  const seededSpeed = 24 + (hash % 28);

  const state: VehicleRouteState = {
    pathIndex: distributed.pathIndex,
    segmentStartIndex,
    direction,
    t: (hash % 100) / 100,
    baseSpeedKmph: seededSpeed,
    hash,
  };

  vehicleState.set(vehicle.id, state);
  return state;
};

const toGpsSource = (hash: number): GpsSourceTier => {
  if (hash % 5 === 0) return 'AIS_140';
  if (hash % 5 <= 2) return 'QR_PWA';
  return 'MANUAL_CSV';
};

const advanceState = (state: VehicleRouteState, distanceToTravelMeters: number) => {
  let remaining = Math.max(0, distanceToTravelMeters);

  while (remaining > 0.05) {
    const { path, a, b } = getStateSegment(state);
    const segmentLength = Math.max(0.001, distanceMeters(a, b));
    const segmentRemaining = (1 - state.t) * segmentLength;

    if (remaining < segmentRemaining) {
      state.t += remaining / segmentLength;
      break;
    }

    remaining -= segmentRemaining;
    state.t = 0;
    state.segmentStartIndex += state.direction;

    if (state.direction === 1 && state.segmentStartIndex >= path.length - 1) {
      state.segmentStartIndex = path.length - 1;
      state.direction = -1;
    } else if (state.direction === -1 && state.segmentStartIndex <= 0) {
      state.segmentStartIndex = 0;
      state.direction = 1;
    }
  }
};

const nextStatus = (
  seedStatus: VehicleOperationalStatus,
  speedKmph: number
): VehicleOperationalStatus => {
  if (seedStatus === 'BREAKDOWN' || seedStatus === 'OFFLINE') return seedStatus;
  return speedKmph > 0 ? 'MOVING' : 'IDLE';
};

const buildDelta = (
  vehicle: AutomobileAsset,
  state: VehicleRouteState,
  speedKmph: number,
  status: VehicleOperationalStatus,
  idleMinutes: number
): LiveVehicleDelta => {
  const [lat, lng] = getInterpolatedPosition(state);
  const { a, b } = getStateSegment(state);
  return {
    vehicleId: vehicle.id,
    coordinates: { lat, lng },
    speedKmph,
    heading: bearingDegrees(a, b),
    status,
    idleMinutes,
    lastSeenAt: new Date().toISOString(),
    gpsSource: toGpsSource(state.hash),
  };
};

export const getRoadAnchoredSnapshot = (vehicles: AutomobileAsset[]): LiveVehicleDelta[] => {
  return vehicles.map((vehicle) => {
    const state = ensureState(vehicle);
    const isStationary =
      vehicle.status === 'BREAKDOWN' || vehicle.status === 'OFFLINE' || vehicle.status === 'IDLE';
    const speedKmph = isStationary ? 0 : Math.max(18, Math.round(state.baseSpeedKmph * 0.8));
    const status = nextStatus(vehicle.status, speedKmph);
    const idleMinutes = speedKmph > 0 ? 0 : vehicle.idleMinutes;
    return buildDelta(vehicle, state, speedKmph, status, idleMinutes);
  });
};

export const getRoadConstrainedLiveDelta = (vehicles: AutomobileAsset[]): LiveVehicleDelta[] => {
  const now = Date.now();

  return vehicles.map((vehicle, index) => {
    const state = ensureState(vehicle);
    const wave = Math.sin(now / 22000 + index + state.hash * 0.0001);
    const canMove = vehicle.status !== 'BREAKDOWN' && vehicle.status !== 'OFFLINE';
    const idleDrift = vehicle.status === 'IDLE' && wave > 0.93;
    const moving = canMove && (vehicle.status === 'MOVING' || idleDrift);
    const speedKmph = moving ? Math.max(10, Math.round(state.baseSpeedKmph + wave * 7)) : 0;

    if (speedKmph > 0) {
      // 6s tick to match SSE cadence.
      const distanceMetersToTravel = (speedKmph * 1000 * 6) / 3600;
      advanceState(state, distanceMetersToTravel);
    }

    const status = nextStatus(vehicle.status, speedKmph);
    const idleMinutes = speedKmph > 0 ? 0 : Math.min(280000, vehicle.idleMinutes + 1);
    return buildDelta(vehicle, state, speedKmph, status, idleMinutes);
  });
};
