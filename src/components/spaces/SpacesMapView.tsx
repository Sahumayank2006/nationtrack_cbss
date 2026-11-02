'use client';

import 'leaflet/dist/leaflet.css';

import L from 'leaflet';
import { Building2, LocateFixed, Maximize2, Minimize2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';

import { cn } from '@/lib/utils';
import type { Space } from '@/types/spaces';

interface SpacesMapViewProps {
  spaces: Space[];
  selectedSpaceId?: string | null;
  onSpaceSelect?: (space: Space) => void;
  showInternalFilters?: boolean;
  onFullscreenToggle?: () => void;
  isFullscreen?: boolean;
}

const DEFAULT_CENTER: [number, number] = [26.2183, 78.1828];
const DEFAULT_ZOOM = 12.8;

const LIGHT_TILE = {
  url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
  attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
};

const DARK_TILE = {
  url: 'https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png',
  attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
};

const SPACE_TYPE_META: Record<
  Space['spaceType'],
  {
    label: string;
    glyph: string;
    pinColor: string;
    iconColor: string;
  }
> = {
  HOSPITAL_ROOM: {
    label: 'Hospital',
    glyph:
      '<path d="M12 7v10M7 12h10" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" />',
    pinColor: '#dc2626',
    iconColor: '#dc2626',
  },
  CLASSROOM: {
    label: 'Classroom',
    glyph:
      '<path d="M6 10.5 12 8l6 2.5-6 2.5-6-2.5Z" fill="none" stroke="currentColor" stroke-width="1.9" /><path d="M8.2 12.6v2.6c0 .9 1.7 1.8 3.8 1.8s3.8-.9 3.8-1.8v-2.6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />',
    pinColor: '#2563eb',
    iconColor: '#2563eb',
  },
  COMMUNITY_HALL: {
    label: 'Community Hall',
    glyph:
      '<path d="M6 10h12M7.5 10v6M11 10v6M14.5 10v6M6 16h12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />',
    pinColor: '#d97706',
    iconColor: '#d97706',
  },
  PWD_OFFICE: {
    label: 'PWD Office',
    glyph:
      '<path d="M7 17V9.3c0-.4.2-.8.5-1.1l4.1-3.4c.3-.3.8-.3 1.2 0l4.2 3.4c.3.3.5.7.5 1.1V17" fill="none" stroke="currentColor" stroke-width="1.8" /><path d="M10.5 17v-3.3h3V17" fill="none" stroke="currentColor" stroke-width="1.7" />',
    pinColor: '#334155',
    iconColor: '#334155',
  },
  TRANSIT_ROOM: {
    label: 'Transit Room',
    glyph:
      '<path d="M6 12h12M14 8l4 4-4 4M10 8l-4 4 4 4" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" />',
    pinColor: '#7c3aed',
    iconColor: '#7c3aed',
  },
  TRAINING_HALL: {
    label: 'Training Hall',
    glyph:
      '<path d="M6.5 16.5h11M8.2 13.2h7.6M10 9.8h4" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" /><path d="M12 6.5 17.5 9v6.8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />',
    pinColor: '#059669',
    iconColor: '#059669',
  },
};

const escapeHtml = (value: string): string => {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
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

const markerIcon = (space: Space, selected = false) => {
  const typeMeta = SPACE_TYPE_META[space.spaceType];
  const pinColor = selected ? '#0f172a' : typeMeta.pinColor;
  const iconColor = selected ? '#0f172a' : typeMeta.iconColor;
  const ariaName = `${typeMeta.label} building: ${space.name}`;

  return L.divIcon({
    className: selected ? 'nt-space-building-marker selected' : 'nt-space-building-marker',
    html: `<span role="img" aria-label="${escapeHtml(ariaName)}" style="display:inline-flex;height:54px;width:42px;">
      <svg xmlns="http://www.w3.org/2000/svg" width="42" height="54" viewBox="0 0 42 54" aria-hidden="true" focusable="false">
        <path d="M21 2.5C11.4 2.5 3.6 10.3 3.6 19.9c0 10.9 17.4 31.6 17.4 31.6s17.4-20.7 17.4-31.6C38.4 10.3 30.6 2.5 21 2.5Z" fill="${pinColor}" stroke="#ffffff" stroke-width="1.8"/>
        <circle cx="21" cy="20" r="10.2" fill="#ffffff" stroke="${pinColor}" stroke-width="1.2"/>
        <g transform="translate(9 8)" style="color:${iconColor};">${typeMeta.glyph}</g>
      </svg>
    </span>`,
    iconSize: [42, 54],
    iconAnchor: [21, 52],
  });
};

export function SpacesMapView({
  spaces,
  selectedSpaceId,
  onSpaceSelect,
  showInternalFilters = true,
  onFullscreenToggle,
  isFullscreen,
}: SpacesMapViewProps) {
  const { theme, resolvedTheme } = useTheme();
  const [themeMounted, setThemeMounted] = useState(false);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [district, setDistrict] = useState<'ALL' | Space['district']>('ALL');
  const [spaceTypeFilter, setSpaceTypeFilter] = useState<'ALL' | Space['spaceType']>('ALL');
  const [gwaliorBoundary, setGwaliorBoundary] = useState<[number, number][]>([]);
  const [isLocating, setIsLocating] = useState(false);
  const [locateFeedback, setLocateFeedback] = useState<string | null>(null);

  const mapHostRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);
  const boundaryLayerRef = useRef<L.LayerGroup | null>(null);
  const myLocationMarkerRef = useRef<L.CircleMarker | null>(null);
  const locateFeedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isDarkTheme = (resolvedTheme ?? theme) === 'dark';

  useEffect(() => {
    setThemeMounted(true);
  }, []);

  useEffect(() => {
    return () => {
      if (locateFeedbackTimeoutRef.current) {
        clearTimeout(locateFeedbackTimeoutRef.current);
      }
    };
  }, []);

  const showLocateFeedback = (message: string) => {
    setLocateFeedback(message);

    if (locateFeedbackTimeoutRef.current) {
      clearTimeout(locateFeedbackTimeoutRef.current);
    }

    locateFeedbackTimeoutRef.current = setTimeout(() => {
      setLocateFeedback(null);
      locateFeedbackTimeoutRef.current = null;
    }, 2800);
  };

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
        // Fallback: map remains usable without boundary if KML loading fails.
      }
    };

    void loadBoundary();

    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    return spaces.filter((space) => {
      if (availableOnly && space.status !== 'AVAILABLE') return false;
      if (district !== 'ALL' && space.district !== district) return false;
      if (spaceTypeFilter !== 'ALL' && space.spaceType !== spaceTypeFilter) return false;

      const inBoundary =
        gwaliorBoundary.length < 3
          ? true
          : isPointInPolygon(space.coordinates[1], space.coordinates[0], gwaliorBoundary);
      if (!inBoundary) return false;

      return true;
    });
  }, [availableOnly, district, gwaliorBoundary, spaceTypeFilter, spaces]);

  useEffect(() => {
    const host = mapHostRef.current;
    if (!host) return;

    host.innerHTML = '';

    const hostWithLeaflet = host as HTMLDivElement & { _leaflet_id?: number };
    if (hostWithLeaflet._leaflet_id) {
      hostWithLeaflet._leaflet_id = undefined;
    }

    const map = L.map(host, {
      zoomControl: false,
      preferCanvas: true,
      minZoom: 8,
      maxZoom: 19,
    }).setView(DEFAULT_CENTER, DEFAULT_ZOOM);

    L.control.zoom({ position: 'bottomleft' }).addTo(map);

    const bootWithDark = document.documentElement.classList.contains('dark');
    const initialTile = bootWithDark ? DARK_TILE : LIGHT_TILE;

    const tileLayer = L.tileLayer(initialTile.url, {
      attribution: initialTile.attribution,
      maxZoom: 19,
    });
    tileLayer.addTo(map);

    const markerLayer = L.layerGroup().addTo(map);
    const boundaryLayer = L.layerGroup().addTo(map);

    mapRef.current = map;
    tileLayerRef.current = tileLayer;
    markerLayerRef.current = markerLayer;
    boundaryLayerRef.current = boundaryLayer;

    const invalidate = () => map.invalidateSize({ pan: false, animate: false });
    requestAnimationFrame(invalidate);
    const t1 = setTimeout(invalidate, 120);
    const t2 = setTimeout(invalidate, 450);

    const onResize = () => invalidate();
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      clearTimeout(t1);
      clearTimeout(t2);
      markerLayer.clearLayers();
      boundaryLayer.clearLayers();
      map.remove();
      mapRef.current = null;
      tileLayerRef.current = null;
      markerLayerRef.current = null;
      boundaryLayerRef.current = null;
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
    const boundaryLayer = boundaryLayerRef.current;
    if (!boundaryLayer) return;

    boundaryLayer.clearLayers();
    if (gwaliorBoundary.length < 3) return;

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
  }, [gwaliorBoundary]);

  useEffect(() => {
    const map = mapRef.current;
    const markerLayer = markerLayerRef.current;
    if (!map || !markerLayer) return;

    markerLayer.clearLayers();

    for (const space of filtered) {
      const isSelected = selectedSpaceId === space.id;
      const marker = L.marker([space.coordinates[1], space.coordinates[0]], {
        icon: markerIcon(space, isSelected),
      });

      marker.on('click', () => {
        onSpaceSelect?.(space);
      });

      marker.bindPopup(
        `<div style="min-width:180px;line-height:1.4;">
          <div style="font-weight:600;">${space.name}</div>
          <div style="font-size:12px;color:#475569;">${space.assetId}</div>
          <div style="font-size:12px;">${space.department}</div>
          <div style="font-size:12px;">Capacity: ${space.capacity}</div>
          <div style="font-size:12px;">Status: ${space.status}</div>
        </div>`
      );

      markerLayer.addLayer(marker);
    }

    if (filtered.length > 0) {
      const bounds = L.latLngBounds(
        filtered.map((space) => [space.coordinates[1], space.coordinates[0]] as [number, number])
      );
      map.fitBounds(bounds.pad(0.12), { animate: false });
    } else if (gwaliorBoundary.length >= 3) {
      map.fitBounds(L.latLngBounds(gwaliorBoundary).pad(0.08), { animate: false });
    }
  }, [filtered, gwaliorBoundary, onSpaceSelect, selectedSpaceId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedSpaceId) return;

    const selected = filtered.find((space) => space.id === selectedSpaceId);
    if (!selected) return;

    map.flyTo([selected.coordinates[1], selected.coordinates[0]], Math.max(map.getZoom(), 14), {
      duration: 0.6,
    });
  }, [filtered, selectedSpaceId]);

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
    <section className="relative h-full w-full overflow-hidden">
      <div
        ref={mapHostRef}
        className="nt-map-canvas h-full w-full"
        aria-label="Government spaces map"
      />

      <div className="absolute bottom-28 left-2 z-[640] flex flex-col items-start gap-2">
        <button
          type="button"
          onClick={handleLocateMe}
          disabled={isLocating}
          className={cn(
            'relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-800 shadow-md transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-600 dark:bg-slate-900/90 dark:text-slate-100 dark:hover:bg-slate-900',
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
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-800 shadow-md transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-900/90 dark:text-slate-100 dark:hover:bg-slate-900"
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
            className="max-w-[220px] rounded-md border border-border bg-card/95 px-2 py-1 text-left text-[11px] text-foreground shadow-md"
            role="status"
            aria-live="polite"
          >
            {locateFeedback}
          </p>
        ) : null}
      </div>

      {showInternalFilters ? (
        <div className="pointer-events-none absolute left-3 top-3 z-[500] space-y-2">
          <div className="pointer-events-auto rounded-lg border bg-white/95 p-3 shadow-md">
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Building2 className="h-4 w-4" />
              Space Map Filters
            </p>
            <div className="space-y-2 text-xs text-slate-700">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={availableOnly}
                  onChange={(event) => setAvailableOnly(event.target.checked)}
                />
                Available today
              </label>
              <label className="block">
                <span className="mb-1 block">District</span>
                <select
                  value={district}
                  onChange={(event) => setDistrict(event.target.value as 'ALL' | Space['district'])}
                  className="w-44 rounded border px-2 py-1"
                >
                  <option value="ALL">All districts</option>
                  <option value="Lashkar">Lashkar</option>
                  <option value="Morar">Morar</option>
                  <option value="Thatipur">Thatipur</option>
                  <option value="Gwalior East">Gwalior East</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block">Building type</span>
                <select
                  value={spaceTypeFilter}
                  onChange={(event) =>
                    setSpaceTypeFilter(event.target.value as 'ALL' | Space['spaceType'])
                  }
                  className="w-44 rounded border px-2 py-1"
                >
                  <option value="ALL">All categories</option>
                  <option value="HOSPITAL_ROOM">Hospital</option>
                  <option value="CLASSROOM">Classroom</option>
                  <option value="COMMUNITY_HALL">Community hall</option>
                  <option value="PWD_OFFICE">PWD office</option>
                  <option value="TRANSIT_ROOM">Transit room</option>
                  <option value="TRAINING_HALL">Training hall</option>
                </select>
              </label>
            </div>
          </div>

          <div className="pointer-events-auto rounded-lg border bg-white/95 p-3 shadow-md">
            <p className="mb-2 text-xs font-semibold text-slate-900">Building categories</p>
            <ul className="space-y-1 text-xs text-slate-700">
              <li>Hospital Room</li>
              <li>Classroom</li>
              <li>Community Hall</li>
              <li>PWD Office</li>
              <li>Transit Room</li>
              <li>Training Hall</li>
            </ul>
          </div>
        </div>
      ) : null}

      <div className="sr-only" aria-live="polite">
        <Link href="/spaces/spaces">Browse full space registry</Link>
      </div>
    </section>
  );
}
