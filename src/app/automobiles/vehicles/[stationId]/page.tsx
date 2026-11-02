'use client';

import { ArrowLeft, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { type ChangeEvent, useMemo, useState } from 'react';

import { VehicleDetailPanel } from '@/components/automobiles/VehicleDetailPanel';
import { VehicleListItem } from '@/components/automobiles/VehicleListItem';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  getStationFleetSummaries,
  getVehicleLegalRecords,
  getVehicleMaintenanceHistory,
  getVehicleMetadata,
  getVehiclesByStation,
} from '@/lib/automobiles-service';
import { cn } from '@/lib/utils';

import type {
  GpsSourceTier,
  LegalRecord,
  MaintenanceRecord,
  VehicleMetadata,
  VehicleOperationalStatus,
} from '@/types/automobiles';

type SortOption = 'NAME_ASC' | 'STATUS' | 'IDLE_ASC' | 'IDLE_DESC' | 'RISK_ASC' | 'RISK_DESC';

const PAGE_SIZE = 20;

const sortOptions: Array<{ value: SortOption; label: string }> = [
  { value: 'NAME_ASC', label: 'Name A-Z' },
  { value: 'STATUS', label: 'Status' },
  { value: 'IDLE_ASC', label: 'Idle Time ↑' },
  { value: 'IDLE_DESC', label: 'Idle Time ↓' },
  { value: 'RISK_ASC', label: 'Maintenance Risk ↑' },
  { value: 'RISK_DESC', label: 'Maintenance Risk ↓' },
];

const statusOptions: VehicleOperationalStatus[] = ['MOVING', 'IDLE', 'BREAKDOWN', 'OFFLINE'];
const gpsOptions: GpsSourceTier[] = ['AIS_140', 'QR_PWA', 'MANUAL_CSV'];

export default function StationFleetDetailPage() {
  const params = useParams<{ stationId: string }>();
  const stationId = params.stationId;

  const stationSummary = useMemo(
    () => getStationFleetSummaries().find((item) => item.stationId === stationId),
    [stationId]
  );

  const stationVehicles = useMemo(() => getVehiclesByStation(stationId), [stationId]);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeStatusFilters, setActiveStatusFilters] = useState<VehicleOperationalStatus[]>([]);
  const [activeGpsFilters, setActiveGpsFilters] = useState<GpsSourceTier[]>([]);
  const [activeTypeFilters, setActiveTypeFilters] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('NAME_ASC');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  const [selectedVehicleMetadata, setSelectedVehicleMetadata] = useState<VehicleMetadata | null>(
    null
  );
  const [selectedVehicleLegal, setSelectedVehicleLegal] = useState<LegalRecord[]>([]);
  const [selectedVehicleMaintenance, setSelectedVehicleMaintenance] = useState<MaintenanceRecord[]>(
    []
  );

  const isPanelOpen = selectedVehicleId !== null;

  const vehicleTypes = useMemo(
    () => Array.from(new Set(stationVehicles.map((vehicle) => vehicle.vehicleType))).sort(),
    [stationVehicles]
  );

  const filteredVehicles = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();

    const filtered = stationVehicles.filter((vehicle) => {
      const matchesSearch =
        needle.length === 0 ||
        vehicle.displayName.toLowerCase().includes(needle) ||
        vehicle.registrationNumber.toLowerCase().includes(needle);

      const matchesStatus =
        activeStatusFilters.length === 0 || activeStatusFilters.includes(vehicle.status);

      const matchesGps =
        activeGpsFilters.length === 0 || activeGpsFilters.includes(vehicle.gpsSource);

      const matchesType =
        activeTypeFilters.length === 0 || activeTypeFilters.includes(vehicle.vehicleType);

      return matchesSearch && matchesStatus && matchesGps && matchesType;
    });

    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'NAME_ASC') return a.displayName.localeCompare(b.displayName);
      if (sortBy === 'STATUS') return a.status.localeCompare(b.status);
      if (sortBy === 'IDLE_ASC') return a.idleMinutes - b.idleMinutes;
      if (sortBy === 'IDLE_DESC') return b.idleMinutes - a.idleMinutes;
      if (sortBy === 'RISK_ASC') return a.maintenanceRiskScore - b.maintenanceRiskScore;
      return b.maintenanceRiskScore - a.maintenanceRiskScore;
    });

    return sorted;
  }, [
    activeGpsFilters,
    activeStatusFilters,
    activeTypeFilters,
    searchTerm,
    sortBy,
    stationVehicles,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredVehicles.length / PAGE_SIZE));

  const pagedVehicles = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return filteredVehicles.slice(start, end);
  }, [currentPage, filteredVehicles]);

  const selectedVehicle = useMemo(() => {
    if (!selectedVehicleId || !selectedVehicleMetadata) return null;
    const vehicle = stationVehicles.find((item) => item.id === selectedVehicleId);
    if (!vehicle) return null;
    return {
      ...vehicle,
      metadata: selectedVehicleMetadata,
    };
  }, [selectedVehicleId, selectedVehicleMetadata, stationVehicles]);

  const statCounts = useMemo(() => {
    return stationVehicles.reduce(
      (acc, vehicle) => {
        acc.total += 1;
        acc[vehicle.status] += 1;
        return acc;
      },
      {
        total: 0,
        MOVING: 0,
        IDLE: 0,
        BREAKDOWN: 0,
        OFFLINE: 0,
      }
    );
  }, [stationVehicles]);

  const toggleStatusFilter = (status: VehicleOperationalStatus) => {
    setCurrentPage(1);
    setActiveStatusFilters((prev) =>
      prev.includes(status) ? prev.filter((item) => item !== status) : [...prev, status]
    );
  };

  const toggleGpsFilter = (source: GpsSourceTier) => {
    setCurrentPage(1);
    setActiveGpsFilters((prev) =>
      prev.includes(source) ? prev.filter((item) => item !== source) : [...prev, source]
    );
  };

  const onVehicleTypeSelect = (event: ChangeEvent<HTMLSelectElement>) => {
    setCurrentPage(1);
    const selected = Array.from(event.target.selectedOptions).map((option) => option.value);
    setActiveTypeFilters(selected);
  };

  const openVehicleDetails = (vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
    setSelectedVehicleMetadata(getVehicleMetadata(vehicleId));
    setSelectedVehicleLegal(getVehicleLegalRecords(vehicleId));
    setSelectedVehicleMaintenance(getVehicleMaintenanceHistory(vehicleId));
  };

  const closePanel = () => {
    setSelectedVehicleId(null);
    setSelectedVehicleMetadata(null);
    setSelectedVehicleLegal([]);
    setSelectedVehicleMaintenance([]);
  };

  if (!stationSummary) {
    return (
      <section className="container-wide py-8">
        <div className="card-elevated rounded-xl border border-destructive/30 bg-destructive/10 p-6">
          <h1 className="text-xl font-bold">Station not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The selected station has no mapped fleet.
          </p>
          <Link href="/automobiles/vehicles" className="mt-4 inline-block">
            <Button variant="outline">Back to Available Fleet</Button>
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="container-wide space-y-5 py-8">
      <header className="card-elevated space-y-4 rounded-3xl border border-border bg-gradient-to-br from-accent/20 via-background to-primary/5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/automobiles/vehicles">
            <Button variant="outline" className="rounded-full border-border bg-background">
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Back
            </Button>
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="rounded-full">
              {stationSummary.zone} Zone
            </Badge>
            <Badge variant="secondary">
              Lat {stationSummary.coordinates.lat.toFixed(4)} · Lng{' '}
              {stationSummary.coordinates.lng.toFixed(4)}
            </Badge>
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            {stationSummary.stationName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Station fleet roster and compliance view
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
          <Badge variant="outline" className="justify-center rounded-full py-1">
            Total: {statCounts.total}
          </Badge>
          <Badge className="justify-center rounded-full border border-emerald-300/40 bg-emerald-500/10 py-1 text-emerald-700">
            Moving: {statCounts.MOVING}
          </Badge>
          <Badge className="justify-center rounded-full border border-amber-300/40 bg-amber-500/10 py-1 text-amber-700">
            Idle: {statCounts.IDLE}
          </Badge>
          <Badge className="justify-center rounded-full border border-red-300/40 bg-red-500/10 py-1 text-red-700">
            Breakdown: {statCounts.BREAKDOWN}
          </Badge>
          <Badge className="justify-center rounded-full border border-slate-300/40 bg-slate-500/10 py-1 text-slate-700 dark:text-slate-300">
            Offline: {statCounts.OFFLINE}
          </Badge>
        </div>
      </header>

      <div className="card-elevated sticky top-0 z-20 space-y-3 rounded-2xl border border-border bg-background/95 p-4 backdrop-blur">
        <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr]">
          <label className="relative block">
            <Search
              className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={searchTerm}
              onChange={(event) => {
                setCurrentPage(1);
                setSearchTerm(event.target.value);
              }}
              className="h-11 rounded-xl border-border bg-background pl-9"
              placeholder="Search by display name or registration number"
              aria-label="Search vehicles"
            />
          </label>
          <select
            className="h-11 rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as SortOption)}
            aria-label="Sort vehicles"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Status
          </p>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((status) => {
              const active = activeStatusFilters.includes(status);
              return (
                <button
                  key={status}
                  type="button"
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                    active
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                  onClick={() => toggleStatusFilter(status)}
                  aria-pressed={active}
                >
                  {status}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            GPS Source
          </p>
          <div className="flex flex-wrap gap-2">
            {gpsOptions.map((source) => {
              const active = activeGpsFilters.includes(source);
              return (
                <button
                  key={source}
                  type="button"
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                    active
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                  onClick={() => toggleGpsFilter(source)}
                  aria-pressed={active}
                >
                  {source}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="vehicleTypeFilter"
            className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
          >
            Vehicle Type (multi-select)
          </label>
          <select
            id="vehicleTypeFilter"
            multiple
            value={activeTypeFilters}
            onChange={onVehicleTypeSelect}
            className="min-h-24 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
            aria-label="Filter by vehicle type"
          >
            {vehicleTypes.map((typeName) => (
              <option key={typeName} value={typeName}>
                {typeName}
              </option>
            ))}
          </select>
        </div>

        <p className="text-sm text-muted-foreground">
          Showing {pagedVehicles.length} of {filteredVehicles.length} vehicles
        </p>
      </div>

      <ul className="space-y-2" aria-label="Station vehicle list">
        {pagedVehicles.map((vehicle) => (
          <VehicleListItem
            key={vehicle.id}
            vehicle={vehicle}
            isSelected={vehicle.id === selectedVehicleId}
            onOpenDetails={openVehicleDetails}
          />
        ))}
      </ul>

      {filteredVehicles.length === 0 ? (
        <article className="card-elevated rounded-xl border border-border p-8 text-center">
          <p className="font-semibold">No vehicles matched your filters</p>
          <p className="text-sm text-muted-foreground">Adjust filters to widen your result set.</p>
        </article>
      ) : null}

      {filteredVehicles.length > 50 ? (
        <nav
          className="flex items-center justify-center gap-3"
          aria-label="Vehicle list pagination"
        >
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            Previous
          </Button>
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Button>
        </nav>
      ) : null}

      <VehicleDetailPanel
        vehicle={selectedVehicle}
        legalRecords={selectedVehicleLegal}
        maintenanceHistory={selectedVehicleMaintenance}
        isOpen={isPanelOpen}
        onClose={closePanel}
      />
    </section>
  );
}
