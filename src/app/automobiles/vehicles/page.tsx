'use client';

import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import { StationFleetCard } from '@/components/automobiles/StationFleetCard';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { getStationFleetSummaries } from '@/lib/automobiles-service';
import { cn } from '@/lib/utils';

import type { StationFleetSummary } from '@/types/automobiles';

type ZoneFilter = 'ALL' | StationFleetSummary['zone'];

const zoneFilters: ZoneFilter[] = ['ALL', 'Central', 'North', 'South', 'East', 'West'];

export default function AutomobileVehiclesPage() {
  const [search, setSearch] = useState('');
  const [zoneFilter, setZoneFilter] = useState<ZoneFilter>('ALL');

  const summaries = useMemo(() => getStationFleetSummaries(), []);

  const filteredSummaries = useMemo(() => {
    const needle = search.trim().toLowerCase();

    return summaries.filter((summary) => {
      const matchesSearch =
        needle.length === 0 || summary.stationName.toLowerCase().includes(needle);
      const matchesZone = zoneFilter === 'ALL' ? true : summary.zone === zoneFilter;
      return matchesSearch && matchesZone;
    });
  }, [search, summaries, zoneFilter]);

  const summaryStats = useMemo(() => {
    return filteredSummaries.reduce(
      (acc, station) => {
        acc.totalFleet += station.totalVehicles;
        acc.moving += station.statusCounts.MOVING;
        acc.idle += station.statusCounts.IDLE;
        acc.breakdown += station.statusCounts.BREAKDOWN;
        return acc;
      },
      {
        totalFleet: 0,
        moving: 0,
        idle: 0,
        breakdown: 0,
      }
    );
  }, [filteredSummaries]);

  return (
    <section className="container-wide space-y-6 py-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Available Fleet
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse fleet station by station across Gwalior
          </p>
        </div>
        <Badge variant="secondary" className="rounded-full px-4 py-1 text-sm font-semibold">
          Total Vehicles: {summaries.reduce((sum, item) => sum + item.totalVehicles, 0)}
        </Badge>
      </header>

      <div className="card-elevated rounded-3xl border border-border p-4">
        <label className="relative block">
          <Search
            className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-11 rounded-xl border-border bg-background pl-9"
            placeholder="Search station name"
            aria-label="Search station"
          />
        </label>

        <div className="mt-3 flex flex-wrap gap-2" role="tablist" aria-label="Filter by zone">
          {zoneFilters.map((zone) => {
            const isActive = zoneFilter === zone;
            return (
              <button
                key={zone}
                type="button"
                className={cn(
                  'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground'
                )}
                onClick={() => setZoneFilter(zone)}
                aria-pressed={isActive}
              >
                {zone === 'ALL' ? 'All' : zone}
              </button>
            );
          })}
        </div>
      </div>

      <div className="card-elevated sticky top-0 z-20 rounded-2xl border border-border bg-background/95 p-3 backdrop-blur">
        <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
          <p className="rounded-full border border-border bg-background px-3 py-2">
            Fleet: <span className="font-semibold">{summaryStats.totalFleet}</span>
          </p>
          <p className="rounded-full border border-emerald-300/40 bg-emerald-500/10 px-3 py-2 text-emerald-700 dark:text-emerald-300">
            Moving: <span className="font-semibold">{summaryStats.moving}</span>
          </p>
          <p className="rounded-full border border-amber-300/40 bg-amber-500/10 px-3 py-2 text-amber-700 dark:text-amber-300">
            Idle: <span className="font-semibold">{summaryStats.idle}</span>
          </p>
          <p className="rounded-full border border-red-300/40 bg-red-500/10 px-3 py-2 text-red-700 dark:text-red-300">
            Breakdown: <span className="font-semibold">{summaryStats.breakdown}</span>
          </p>
        </div>
      </div>

      {filteredSummaries.length === 0 ? (
        <article className="card-elevated rounded-2xl border border-border p-8 text-center">
          <p className="font-semibold text-foreground">No stations found</p>
          <p className="text-sm text-muted-foreground">
            Try changing the search text or zone filter.
          </p>
        </article>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSummaries.map((summary) => (
            <StationFleetCard key={summary.stationId} summary={summary} />
          ))}
        </div>
      )}
    </section>
  );
}
