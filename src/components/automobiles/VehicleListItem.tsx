import { ArrowRight, Bike, Bus, Car, Truck } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import type { AutomobileAsset } from '@/types/automobiles';

interface VehicleListItemProps {
  vehicle: AutomobileAsset;
  isSelected: boolean;
  onOpenDetails: (vehicleId: string) => void;
}

const statusBadgeClass: Record<AutomobileAsset['status'], string> = {
  MOVING:
    'bg-emerald-500/15 text-emerald-800 border-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40',
  IDLE: 'bg-amber-500/15 text-amber-800 border-amber-500/30 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40',
  BREAKDOWN:
    'bg-red-500/15 text-red-800 border-red-500/30 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/40',
  OFFLINE:
    'bg-slate-500/15 text-slate-800 border-slate-500/30 dark:bg-slate-500/20 dark:text-slate-300 dark:border-slate-500/40',
};

const gpsBadgeClass: Record<AutomobileAsset['gpsSource'], string> = {
  AIS_140:
    'bg-blue-500/15 text-blue-800 border-blue-500/30 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/40',
  QR_PWA:
    'bg-violet-500/15 text-violet-800 border-violet-500/30 dark:bg-violet-500/20 dark:text-violet-300 dark:border-violet-500/40',
  MANUAL_CSV:
    'bg-orange-500/15 text-orange-800 border-orange-500/30 dark:bg-orange-500/20 dark:text-orange-300 dark:border-orange-500/40',
};

const complianceTone = (vehicle: AutomobileAsset) => {
  const days = [
    vehicle.compliance.pucExpiry,
    vehicle.compliance.insuranceExpiry,
    vehicle.compliance.fitnessExpiry,
  ].map((iso) => Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000));

  if (days.some((value) => value < 0)) return 'expired';
  if (days.some((value) => value <= 30)) return 'warning';
  return 'ok';
};

const vehicleTypeIcon = (vehicleType: string) => {
  const normalized = vehicleType.toLowerCase();
  if (normalized.includes('motorcycle')) return Bike;
  if (
    normalized.includes('truck') ||
    normalized.includes('bus') ||
    normalized.includes('tractor') ||
    normalized.includes('jcb')
  )
    return Truck;
  if (normalized.includes('van')) return Bus;
  return Car;
};

export function VehicleListItem({ vehicle, isSelected, onOpenDetails }: VehicleListItemProps) {
  const compliance = complianceTone(vehicle);
  const TypeIcon = vehicleTypeIcon(vehicle.vehicleType);

  return (
    <li>
      <article
        className={cn(
          'card-elevated group relative grid items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3 transition-all hover:bg-accent/40',
          'grid-cols-1 lg:grid-cols-[48px_minmax(220px,1.4fr)_minmax(160px,1fr)_minmax(180px,1fr)_auto]',
          isSelected && 'border-l-4 border-l-primary ring-1 ring-primary/30'
        )}
      >
        <div className="flex items-center gap-2">
          {compliance === 'warning' ? (
            <span
              className="inline-flex h-2.5 w-2.5 rounded-full bg-amber-500"
              aria-label="Compliance expiring soon"
            />
          ) : compliance === 'expired' ? (
            <span
              className="inline-flex h-2.5 w-2.5 rounded-full bg-red-500"
              aria-label="Compliance expired"
            />
          ) : (
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-transparent" aria-hidden />
          )}
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-foreground">
            <TypeIcon className="h-4 w-4" aria-hidden />
          </span>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {vehicle.displayName}
          </h3>
          <p className="text-xs text-muted-foreground">
            {vehicle.departmentName} · {vehicle.vehicleType}
          </p>
        </div>

        <div>
          <p className="font-mono text-xs text-slate-900 dark:text-slate-100">
            {vehicle.registrationNumber}
          </p>
          <p className="text-xs text-muted-foreground">{vehicle.driverName}</p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Badge className={statusBadgeClass[vehicle.status]}>{vehicle.status}</Badge>
          <Badge className={gpsBadgeClass[vehicle.gpsSource]}>{vehicle.gpsSource}</Badge>
        </div>

        <div className="flex items-center justify-end gap-3">
          <p className="min-w-16 text-right text-xs text-muted-foreground">
            Idle {vehicle.idleMinutes}m
          </p>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full border-border bg-background"
            onClick={() => onOpenDetails(vehicle.id)}
            aria-label={`Open details for ${vehicle.displayName}`}
          >
            Details
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
        </div>

        {compliance === 'warning' ? (
          <span className="sr-only">Compliance expiring soon</span>
        ) : null}
        {compliance === 'expired' ? <span className="sr-only">Compliance expired</span> : null}
      </article>
    </li>
  );
}
