import { AlertTriangle, ArrowRight, Bike, Bus, Car, MapPin, Truck } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import type { StationFleetSummary } from '@/types/automobiles';

interface StationFleetCardProps {
  summary: StationFleetSummary;
}

const statusChipClass = {
  MOVING:
    'bg-emerald-500/15 text-emerald-800 border-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40',
  IDLE: 'bg-amber-500/15 text-amber-800 border-amber-500/30 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40',
  BREAKDOWN:
    'bg-red-500/15 text-red-800 border-red-500/30 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/40',
  OFFLINE:
    'bg-slate-500/15 text-slate-800 border-slate-500/30 dark:bg-slate-500/20 dark:text-slate-300 dark:border-slate-500/40',
} as const;

const zoneClassMap: Record<StationFleetSummary['zone'], string> = {
  Central: 'bg-blue-500/15 text-blue-800 border-blue-500/30 dark:text-blue-300',
  North: 'bg-indigo-500/15 text-indigo-800 border-indigo-500/30 dark:text-indigo-300',
  South: 'bg-orange-500/15 text-orange-800 border-orange-500/30 dark:text-orange-300',
  East: 'bg-cyan-500/15 text-cyan-800 border-cyan-500/30 dark:text-cyan-300',
  West: 'bg-violet-500/15 text-violet-800 border-violet-500/30 dark:text-violet-300',
};

export function StationFleetCard({ summary }: StationFleetCardProps) {
  return (
    <article className="card-elevated group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-accent/20 via-background to-primary/5 p-5 transition-all duration-300 hover:shadow-xl">
      <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-primary/10" />

      <header className="relative flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            {summary.stationName}
          </h2>
          <Badge variant="outline" className={zoneClassMap[summary.zone]}>
            {summary.zone} Zone
          </Badge>
        </div>
        <div
          className="rounded-full border border-border bg-background p-2 text-foreground shadow-sm"
          title={`Lat ${summary.coordinates.lat.toFixed(4)}, Lng ${summary.coordinates.lng.toFixed(4)}`}
        >
          <MapPin className="h-4 w-4" aria-hidden />
        </div>
      </header>

      <div className="mt-4 flex flex-wrap gap-2" aria-label="Fleet status counts">
        <Badge className={statusChipClass.MOVING}>Moving: {summary.statusCounts.MOVING}</Badge>
        <Badge className={statusChipClass.IDLE}>Idle: {summary.statusCounts.IDLE}</Badge>
        <Badge className={statusChipClass.BREAKDOWN}>
          Breakdown: {summary.statusCounts.BREAKDOWN}
        </Badge>
        <Badge className={statusChipClass.OFFLINE}>Offline: {summary.statusCounts.OFFLINE}</Badge>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1.5">
          <Car className="h-3.5 w-3.5" aria-hidden />
          Patrol Cars: {summary.vehicleTypeCounts['Patrol Cars'] ?? 0}
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1.5">
          <Bike className="h-3.5 w-3.5" aria-hidden />
          Motorcycles: {summary.vehicleTypeCounts.Motorcycles ?? 0}
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1.5">
          <Bus className="h-3.5 w-3.5" aria-hidden />
          Vans: {summary.vehicleTypeCounts.Vans ?? 0}
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1.5">
          <Truck className="h-3.5 w-3.5" aria-hidden />
          Heavy: {summary.vehicleTypeCounts['Heavy Vehicles'] ?? 0}
        </div>
      </div>

      {summary.complianceAlertCount > 0 ? (
        <div className="mt-4 rounded-xl border border-amber-400/40 bg-amber-500/15 px-3 py-2 text-sm text-amber-900 dark:text-amber-200">
          <p className="inline-flex items-center gap-2 font-medium">
            <AlertTriangle className="h-4 w-4" aria-hidden />
            {summary.complianceAlertCount} vehicles need compliance attention
          </p>
        </div>
      ) : null}

      <footer className="mt-5 flex items-center justify-between border-t border-border pt-4">
        <p className="text-sm font-medium text-muted-foreground">
          Total Fleet: {summary.totalVehicles}
        </p>
        <Link href={`/automobiles/vehicles/${encodeURIComponent(summary.stationId)}`}>
          <Button variant="outline" className="rounded-full border-border bg-background">
            View Fleet
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
        </Link>
      </footer>
    </article>
  );
}
