'use client';

import 'leaflet/dist/leaflet.css';

import L, { type DivIcon } from 'leaflet';
import { LocateFixed, Maximize2, Minimize2, Search } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  PoliceStationPanel,
  type PoliceStationPanelData,
} from '@/components/automobiles/PoliceStationPanel';
import type { StationVehicleCounts } from '@/components/automobiles/VehicleTypeCounter';
import { getMapCenter } from '@/lib/automobiles-service';
import { cn } from '@/lib/utils';

interface StationFleetSummary {
  total: number;
  vehicleCounts: StationVehicleCounts;
}

interface PoliceStationMapPoint {
  id: string;
  name: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

interface StationMarkerEntry {
  stationId: string;
  marker: L.Marker;
}

const LIGHT_TILE = {
  url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
  attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
};

const DARK_TILE = {
  url: 'https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png',
  attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
};

const DEFAULT_MAP_ZOOM = 13.8;

const normalizeSearchText = (value: string): string => {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const getStationSearchTokens = (stationName: string, count: number): string[] => {
  const normalizedName = normalizeSearchText(stationName);
  const compactName = normalizeSearchText(
    stationName.replace(/police\s*station/gi, '').replace(/\bps\b/gi, '')
  );

  const tokens = [normalizedName, compactName, String(count), `${count} vehicles`]
    .map((token) => normalizeSearchText(token))
    .filter(Boolean);

  return [...new Set(tokens)];
};

const hashString = (value: string): number => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
};

const getStationFleetSummary = (stationId: string): StationFleetSummary => {
  const seed = hashString(stationId);
  const patrol = 2 + (seed % 6);
  const seized = 8 + ((seed >> 3) % 16);
  const pcr = 1 + ((seed >> 7) % 5);
  const motorcycle = 2 + ((seed >> 11) % 7);
  const truck = 1 + ((seed >> 15) % 6);
  const bus = (seed >> 19) % 4;

  const vehicleCounts: StationVehicleCounts = {
    PATROL: patrol,
    SEIZED: seized,
    PCR: pcr,
    MOTORCYCLE: motorcycle,
    TRUCK: truck,
    BUS: bus,
  };

  const total = Object.values(vehicleCounts).reduce((sum, value) => sum + value, 0);

  return {
    total,
    vehicleCounts,
  };
};

const parseKmlPolygonCoordinates = (kmlText: string): [number, number][] => {
  const matches = Array.from(kmlText.matchAll(/<coordinates>([\s\S]*?)<\/coordinates>/gi));
  const allPolygons = matches
    .map((match) => {
      const raw = match[1]?.trim() ?? '';
      if (!raw) return [];
      return raw
        .split(/\s+/)
        .map((entry) => {
          const [lngText, latText] = entry.split(',');
          const lng = Number(lngText);
          const lat = Number(latText);
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
          return [lat, lng] as [number, number];
        })
        .filter((point): point is [number, number] => point !== null);
    })
    .filter((polygon) => polygon.length >= 3);

  if (allPolygons.length === 0) return [];
  return allPolygons.reduce((largest, current) =>
    current.length > largest.length ? current : largest
  );
};

const parsePoliceStationPlacemarks = (kmlText: string): PoliceStationMapPoint[] => {
  const placemarkMatches = Array.from(kmlText.matchAll(/<Placemark>([\s\S]*?)<\/Placemark>/gi));

  return placemarkMatches
    .map((match, index) => {
      const block = match[1] ?? '';
      const nameMatch = block.match(/<name>([\s\S]*?)<\/name>/i);
      const coordinatesMatch = block.match(/<coordinates>([\s\S]*?)<\/coordinates>/i);

      if (!nameMatch || !coordinatesMatch) return null;

      const name = nameMatch[1].trim();
      const firstCoordinate = coordinatesMatch[1].trim().split(/\s+/)[0] ?? '';
      const [lngText, latText] = firstCoordinate.split(',');
      const lng = Number(lngText);
      const lat = Number(latText);

      if (!name || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;

      return {
        id: `ps-${index + 1}`,
        name,
        coordinates: { lat, lng },
      };
    })
    .filter((station): station is PoliceStationMapPoint => station !== null);
};

const isPointInPolygon = (
  lat: number,
  lng: number,
  polygon: readonly [number, number][]
): boolean => {
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

const buildPoliceStationIcon = (stationName: string, vehicleCount: number): DivIcon => {
  const compactName = stationName.replace(/ Police Station$/i, ' PS');
  const count = vehicleCount > 99 ? '99+' : String(vehicleCount);
  const countFontSize = count.length >= 3 ? 7 : count.length === 2 ? 9 : 10;
  const countY = count.length >= 3 ? 25 : 26;

  return L.divIcon({
    className: 'nt-police-station-icon-wrapper',
    html: `<span class="nt-police-station-marker" role="img" aria-label="${compactName}, ${vehicleCount} parked vehicles">
      <span class="nt-police-station-pin">
        <svg class="nt-police-station-svg" xmlns="http://www.w3.org/2000/svg" width="42" height="50" viewBox="0 0 48 58" aria-hidden="true" focusable="false">
          <defs>
            <filter id="ps-shadow" x="-30%" y="-20%" width="160%" height="160%">
              <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="rgba(0,0,0,0.35)" />
            </filter>
          </defs>
          <path
            d="M24 2 C12.954 2 4 10.954 4 22 C4 34.5 24 56 24 56 C24 56 44 34.5 44 22 C44 10.954 35.046 2 24 2 Z"
            fill="#dc2626"
            filter="url(#ps-shadow)"
          />
          <circle cx="24" cy="22" r="10" fill="#ffffff" />
          <text
            x="24"
            y="${countY}"
            text-anchor="middle"
            font-family="'Inter', 'SF Pro Display', -apple-system, sans-serif"
            font-size="${countFontSize}"
            font-weight="800"
            fill="#dc2626"
            letter-spacing="-0.3"
          >${count}</text>
        </svg>
      </span>
      <span class="nt-police-station-label">${compactName}</span>
    </span>`,
    iconSize: [154, 64],
    iconAnchor: [21, 48],
  });
};

interface AutomobileMapDashboardProps {
  searchQuery?: string;
  showSearchOverlay?: boolean;
  onFullscreenToggle?: () => void;
  isFullscreen?: boolean;
  onBookVehicle?: (stationId: string) => void;
}

export function AutomobileMapDashboard({
  searchQuery,
  showSearchOverlay = true,
  onFullscreenToggle,
  isFullscreen,
  onBookVehicle,
}: AutomobileMapDashboardProps = {}) {
  const { theme, resolvedTheme } = useTheme();
  const [themeMounted, setThemeMounted] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [gwaliorBoundary, setGwaliorBoundary] = useState<[number, number][]>([]);
  const [policeStations, setPoliceStations] = useState<PoliceStationMapPoint[]>([]);
  const [localSearch, setLocalSearch] = useState(searchQuery || '');
  const [selectedStation, setSelectedStation] = useState<PoliceStationPanelData | null>(null);
  const mapHostRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const stationLayerRef = useRef<L.LayerGroup | null>(null);
  const boundaryLayerRef = useRef<L.LayerGroup | null>(null);
  const stationMarkersRef = useRef<StationMarkerEntry[]>([]);
  const myLocationMarkerRef = useRef<L.CircleMarker | null>(null);
  const locateFeedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locateFeedback, setLocateFeedback] = useState<string | null>(null);

  const showLocateFeedback = useCallback((message: string) => {
    setLocateFeedback(message);

    if (locateFeedbackTimeoutRef.current) {
      clearTimeout(locateFeedbackTimeoutRef.current);
    }

    locateFeedbackTimeoutRef.current = setTimeout(() => {
      setLocateFeedback(null);
      locateFeedbackTimeoutRef.current = null;
    }, 2800);
  }, []);

  const updateStationLabelVisibility = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    const markers = stationMarkersRef.current;
    if (markers.length === 0) return;

    const minZoomForLabels = 14.5;
    const zoom = map.getZoom();

    for (const entry of markers) {
      const markerElement = entry.marker.getElement();
      const labelElement = markerElement?.querySelector<HTMLElement>('.nt-police-station-label');
      if (!labelElement) continue;
      labelElement.classList.remove('nt-police-station-label-hidden');
    }

    if (zoom < minZoomForLabels) {
      for (const entry of markers) {
        const markerElement = entry.marker.getElement();
        const labelElement = markerElement?.querySelector<HTMLElement>('.nt-police-station-label');
        if (!labelElement) continue;
        labelElement.classList.add('nt-police-station-label-hidden');
      }
      return;
    }

    const selectedStationId = selectedStation?.stationId ?? null;
    const prioritizedMarkers = [...markers].sort((a, b) => {
      if (a.stationId === selectedStationId) return -1;
      if (b.stationId === selectedStationId) return 1;
      return 0;
    });

    const occupiedRects: Array<{ left: number; right: number; top: number; bottom: number }> = [];

    for (const entry of prioritizedMarkers) {
      const markerElement = entry.marker.getElement();
      const labelElement = markerElement?.querySelector<HTMLElement>('.nt-police-station-label');
      if (!labelElement) continue;

      const point = map.latLngToContainerPoint(entry.marker.getLatLng());
      const width = Math.max(labelElement.offsetWidth, 64);
      const height = Math.max(labelElement.offsetHeight, 18);

      const left = point.x + 18;
      const top = point.y - 40;
      const rect = {
        left,
        right: left + width,
        top,
        bottom: top + height,
      };

      const overlaps = occupiedRects.some((occupied) => {
        return !(
          rect.right < occupied.left ||
          rect.left > occupied.right ||
          rect.bottom < occupied.top ||
          rect.top > occupied.bottom
        );
      });

      if (overlaps) {
        labelElement.classList.add('nt-police-station-label-hidden');
      } else {
        labelElement.classList.remove('nt-police-station-label-hidden');
        occupiedRects.push(rect);
      }
    }
  }, [selectedStation?.stationId]);

  const isDarkTheme = (resolvedTheme ?? theme) === 'dark';

  useEffect(() => {
    setThemeMounted(true);
  }, []);

  useEffect(() => {
    setLocalSearch(searchQuery || '');
  }, [searchQuery]);

  useEffect(() => {
    return () => {
      if (locateFeedbackTimeoutRef.current) {
        clearTimeout(locateFeedbackTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedStation(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    let active = true;

    const loadBoundary = async () => {
      try {
        const response = await fetch('/maps/gwalior/doc.kml');
        if (!response.ok) return;

        const text = await response.text();
        if (!active) return;
        setGwaliorBoundary(parseKmlPolygonCoordinates(text));
      } catch {
        // Fallback to showing all stations if boundary cannot be loaded.
      }
    };

    void loadBoundary();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadPoliceStations = async () => {
      try {
        const response = await fetch('/maps/gwalior/Police_Station_doc.kml');
        if (!response.ok) return;

        const text = await response.text();
        if (!active) return;
        setPoliceStations(parsePoliceStationPlacemarks(text));
      } catch {
        // If loading fails, station pins are simply not drawn.
      }
    };

    void loadPoliceStations();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const host = mapHostRef.current;
    if (!host) return;

    setMapError(null);

    // Ensure a clean host node before creating a new map instance.
    host.innerHTML = '';

    // Clear stale Leaflet container metadata from prior fast-refresh/strict remounts.
    const hostWithLeaflet = host as HTMLDivElement & { _leaflet_id?: number };
    if (hostWithLeaflet._leaflet_id) {
      hostWithLeaflet._leaflet_id = undefined;
    }

    let resizeObserver: ResizeObserver | null = null;
    let delayedInvalidate: ReturnType<typeof setTimeout> | null = null;
    let secondInvalidate: ReturnType<typeof setTimeout> | null = null;
    let isCancelled = false;
    let cleanup: (() => void) | null = null;

    const initializeMap = async () => {
      try {
        const map = L.map(host, {
          zoomControl: false,
          preferCanvas: true,
          minZoom: 11,
          maxZoom: 19,
        }).setView([getMapCenter().lat, getMapCenter().lng], DEFAULT_MAP_ZOOM);

        L.control.zoom({ position: 'bottomright' }).addTo(map);

        const bootWithDark = document.documentElement.classList.contains('dark');
        const initialTile = bootWithDark ? DARK_TILE : LIGHT_TILE;
        const tileLayer = L.tileLayer(initialTile.url, {
          attribution: initialTile.attribution,
          maxZoom: 19,
        });
        tileLayer.addTo(map);

        const stationLayer = L.layerGroup();
        const boundaryLayer = L.layerGroup();
        map.addLayer(boundaryLayer);
        map.addLayer(stationLayer);

        mapRef.current = map;
        tileLayerRef.current = tileLayer;
        stationLayerRef.current = stationLayer;
        boundaryLayerRef.current = boundaryLayer;
        setMapReady(true);

        const invalidate = () => map.invalidateSize({ pan: false, animate: false });
        requestAnimationFrame(invalidate);
        delayedInvalidate = setTimeout(invalidate, 120);
        secondInvalidate = setTimeout(invalidate, 450);

        const onWindowResize = () => invalidate();
        window.addEventListener('resize', onWindowResize);

        if ('ResizeObserver' in window) {
          resizeObserver = new ResizeObserver(() => invalidate());
          resizeObserver.observe(host);
        }

        cleanup = () => {
          window.removeEventListener('resize', onWindowResize);
          resizeObserver?.disconnect();
          if (delayedInvalidate) clearTimeout(delayedInvalidate);
          if (secondInvalidate) clearTimeout(secondInvalidate);
          setMapReady(false);
          boundaryLayer.clearLayers();
          stationLayer.clearLayers();
          stationMarkersRef.current = [];
          map.remove();
          mapRef.current = null;
          tileLayerRef.current = null;
          stationLayerRef.current = null;
          boundaryLayerRef.current = null;
        };
      } catch {
        setMapReady(false);
        setMapError('Map failed to initialize. Please refresh the page.');
      }
    };

    void initializeMap();

    return () => {
      isCancelled = true;
      cleanup?.();
      resizeObserver?.disconnect();
      if (delayedInvalidate) clearTimeout(delayedInvalidate);
      if (secondInvalidate) clearTimeout(secondInvalidate);
    };
  }, []);

  useEffect(() => {
    if (!themeMounted) return;

    const map = mapRef.current;
    const currentTileLayer = tileLayerRef.current;
    if (!map || !currentTileLayer) return;

    const nextTile = isDarkTheme ? DARK_TILE : LIGHT_TILE;
    map.removeLayer(currentTileLayer);

    const replacement = L.tileLayer(nextTile.url, {
      attribution: nextTile.attribution,
      maxZoom: 19,
    });
    replacement.addTo(map);
    tileLayerRef.current = replacement;
  }, [isDarkTheme, themeMounted]);

  useEffect(() => {
    if (!mapReady || gwaliorBoundary.length < 3) return;

    const boundaryLayer = boundaryLayerRef.current;
    if (!boundaryLayer) return;

    boundaryLayer.clearLayers();

    L.polygon(gwaliorBoundary, {
      stroke: true,
      color: '#3b82f6',
      weight: 5,
      opacity: 0.18,
      fill: false,
      interactive: false,
      className: 'nt-gwalior-boundary-glow',
    }).addTo(boundaryLayer);

    L.polygon(gwaliorBoundary, {
      stroke: true,
      color: '#2563eb',
      weight: 2,
      opacity: 0.75,
      fill: true,
      fillColor: '#3b82f6',
      fillOpacity: 0.02,
      interactive: false,
      className: 'nt-gwalior-boundary-outline',
      dashArray: '12 10',
      lineJoin: 'round',
    }).addTo(boundaryLayer);
  }, [gwaliorBoundary, mapReady]);

  const stationVehicleCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const station of policeStations) {
      const summary = getStationFleetSummary(station.id);
      counts.set(station.name, summary.total);
    }
    return counts;
  }, [policeStations]);

  const stationVehicleTypes = useMemo(() => {
    const typesMap = new Map<string, StationVehicleCounts>();
    for (const station of policeStations) {
      const summary = getStationFleetSummary(station.id);
      typesMap.set(station.name, summary.vehicleCounts);
    }
    return typesMap;
  }, [policeStations]);

  useEffect(() => {
    if (!mapReady) return;

    const map = mapRef.current;
    if (!map) return;

    const handleMapClick = () => {
      setSelectedStation(null);
    };

    map.on('click', handleMapClick);

    return () => {
      map.off('click', handleMapClick);
    };
  }, [mapReady]);

  useEffect(() => {
    if (!mapReady) return;

    const map = mapRef.current;
    if (!map) return;

    const refreshLabels = () => updateStationLabelVisibility();
    map.on('zoomend', refreshLabels);
    map.on('moveend', refreshLabels);

    requestAnimationFrame(refreshLabels);

    return () => {
      map.off('zoomend', refreshLabels);
      map.off('moveend', refreshLabels);
    };
  }, [mapReady, updateStationLabelVisibility]);

  const visibleStations = useMemo(() => {
    const normalizedSearch = normalizeSearchText(localSearch);
    const searchTerms = normalizedSearch ? normalizedSearch.split(' ') : [];

    return policeStations.filter((station) => {
      const inBoundary =
        gwaliorBoundary.length < 3
          ? true
          : isPointInPolygon(station.coordinates.lat, station.coordinates.lng, gwaliorBoundary);

      if (!inBoundary) return false;
      if (searchTerms.length === 0) return true;

      const count = stationVehicleCounts.get(station.name) ?? 0;
      const searchTokens = getStationSearchTokens(station.name, count);

      return searchTerms.every((term) => searchTokens.some((token) => token.includes(term)));
    });
  }, [gwaliorBoundary, localSearch, policeStations, stationVehicleCounts]);

  useEffect(() => {
    if (!mapReady) return;

    const stationLayer = stationLayerRef.current;
    const map = mapRef.current;
    if (!stationLayer || !map) return;

    stationLayer.clearLayers();
    const createdMarkers: StationMarkerEntry[] = [];

    for (const station of visibleStations) {
      const count = stationVehicleCounts.get(station.name) ?? 0;
      const types = stationVehicleTypes.get(station.name) ?? {
        PATROL: 0,
        SEIZED: 0,
        PCR: 0,
        MOTORCYCLE: 0,
        TRUCK: 0,
        BUS: 0,
      };
      const stationMarker = L.marker([station.coordinates.lat, station.coordinates.lng], {
        icon: buildPoliceStationIcon(station.name, count),
        keyboard: true,
        title: `${station.name}`,
      });

      stationMarker.on('click', (event) => {
        if ('originalEvent' in event && event.originalEvent) {
          L.DomEvent.stopPropagation(event.originalEvent as Event);
        }

        setSelectedStation({
          stationType: 'POLICE_STATION',
          stationId: station.id,
          stationName: station.name,
          district: 'Gwalior',
          address: `${station.name}, Gwalior`,
          totalVehicles: count,
          vehicleCounts: types,
          coordinates: [station.coordinates.lng, station.coordinates.lat],
        });

        const nextZoom = Math.min(map.getZoom() + 0.8, 17);
        map.flyTo([station.coordinates.lat, station.coordinates.lng], nextZoom, {
          animate: true,
          duration: 0.55,
          easeLinearity: 0.3,
        });
      });

      stationMarker.bindTooltip(`${station.name} | Parked: ${count}`, {
        direction: 'top',
        offset: [0, -44],
      });

      stationLayer.addLayer(stationMarker);
      createdMarkers.push({ stationId: station.id, marker: stationMarker });
    }

    stationMarkersRef.current = createdMarkers;
    requestAnimationFrame(() => updateStationLabelVisibility());

    if (localSearch.trim().length > 0 && visibleStations.length > 0) {
      if (visibleStations.length === 1) {
        const [station] = visibleStations;
        map.flyTo([station.coordinates.lat, station.coordinates.lng], Math.max(map.getZoom(), 15), {
          animate: true,
          duration: 0.45,
          easeLinearity: 0.3,
        });
      } else {
        const bounds = L.latLngBounds(
          visibleStations.map(
            (station) => [station.coordinates.lat, station.coordinates.lng] as const
          )
        );
        map.fitBounds(bounds.pad(0.12), { animate: true, duration: 0.45 });
      }
    }
  }, [
    localSearch,
    mapReady,
    stationVehicleCounts,
    stationVehicleTypes,
    updateStationLabelVisibility,
    visibleStations,
  ]);

  const handleLocateMe = () => {
    const map = mapRef.current;
    if (!map) return;

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      showLocateFeedback('Location is not supported in this browser.');
      return;
    }

    if (!window.isSecureContext) {
      showLocateFeedback('Location requires HTTPS or localhost.');
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const latLng = L.latLng(coords.latitude, coords.longitude);

        if (myLocationMarkerRef.current) {
          myLocationMarkerRef.current.remove();
        }

        myLocationMarkerRef.current = L.circleMarker(latLng, {
          radius: 7,
          color: '#1d4ed8',
          weight: 2,
          fillColor: '#2563eb',
          fillOpacity: 0.92,
        }).addTo(map);

        map.flyTo(latLng, Math.max(map.getZoom(), 14), {
          duration: 0.7,
        });

        const hasDesktopPanel = Boolean(selectedStation) && window.innerWidth >= 768;
        if (hasDesktopPanel) {
          const panelCompensationX = -190;
          map.once('moveend', () => {
            map.panBy([panelCompensationX, 0], {
              animate: true,
              duration: 0.35,
              easeLinearity: 0.3,
            });
          });
        }

        setIsLocating(false);
        showLocateFeedback('Centered on your location.');
      },
      (error) => {
        setIsLocating(false);

        if (error.code === error.PERMISSION_DENIED) {
          showLocateFeedback('Location permission denied. Allow location access and try again.');
          return;
        }

        if (error.code === error.TIMEOUT) {
          showLocateFeedback('Location timed out. Try again in an open-sky area.');
          return;
        }

        showLocateFeedback('Unable to detect location right now.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  };

  return (
    <div className="relative h-full w-full">
      {/* Map Overlay Controls */}
      <div className="absolute left-4 top-4 z-[600] flex flex-col gap-3">
        {showSearchOverlay ? (
          <div className="relative w-80 rounded-lg border border-gray-200 bg-white/95 shadow-lg backdrop-blur-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search police station..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full rounded-lg border-0 bg-transparent px-10 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              aria-label="Search police stations"
            />
          </div>
        ) : null}
      </div>

      {/* Map */}
      <div
        ref={mapHostRef}
        className="nt-map-canvas h-full w-full"
        role="region"
        aria-label="Automobile seized vehicles parking map"
      />

      <div className="absolute bottom-28 right-2 z-[640] flex flex-col items-end gap-2">
        <button
          type="button"
          onClick={handleLocateMe}
          disabled={isLocating}
          className={cn(
            'relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-800 shadow-md transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-70',
            isLocating && 'ring-2 ring-blue-400'
          )}
          aria-label={isLocating ? 'Finding my location' : 'Go to my location'}
          title={isLocating ? 'Finding location...' : 'My location'}
        >
          {isLocating ? (
            <span
              className="absolute inline-flex h-5 w-5 animate-ping rounded-full bg-blue-400/45"
              aria-hidden
            />
          ) : null}
          <LocateFixed
            className={cn('relative h-4 w-4', isLocating && 'animate-spin')}
            aria-hidden
          />
        </button>

        {onFullscreenToggle ? (
          <button
            type="button"
            onClick={onFullscreenToggle}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-800 shadow-md transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={isFullscreen ? 'Exit fullscreen map' : 'Enter fullscreen map'}
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" aria-hidden />
            ) : (
              <Maximize2 className="h-4 w-4" aria-hidden />
            )}
          </button>
        ) : null}

        {locateFeedback ? (
          <p
            className="max-w-[220px] rounded-md border border-border bg-card/95 px-2 py-1 text-right text-[11px] text-foreground shadow-md"
            role="status"
            aria-live="polite"
          >
            {locateFeedback}
          </p>
        ) : null}
      </div>

      {mapError ? (
        <div className="absolute inset-0 z-[650] flex items-center justify-center bg-background/90 p-4">
          <div className="card-elevated max-w-md rounded-lg p-4 text-center">
            <p className="text-sm font-semibold text-foreground">Map unavailable</p>
            <p className="mt-1 text-sm text-muted-foreground">{mapError}</p>
          </div>
        </div>
      ) : null}

      <PoliceStationPanel
        station={selectedStation}
        onClose={() => setSelectedStation(null)}
        onBookVehicle={(stationId) => {
          const selectedStationIdentifier = selectedStation?.stationName ?? stationId;

          if (onBookVehicle) {
            onBookVehicle(selectedStationIdentifier);
            return;
          }

          console.log('Book vehicle at station:', selectedStationIdentifier);
        }}
      />
    </div>
  );
}
