'use client';

import {
  AlertTriangle,
  CalendarClock,
  CarFront,
  Clock3,
  FileDown,
  Fuel,
  Gauge,
  MapPin,
  Route,
  ShieldCheck,
  Siren,
  Timer,
  UserRound,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIsMobile } from '@/hooks/use-mobile';
import { statusLabel } from '@/lib/automobiles-service';
import type {
  AutomobileAsset,
  ComplianceAlert,
  IdleReuseSuggestion,
  MaintenanceEvent,
  TripLog,
} from '@/types/automobiles';

interface VehicleBottomSheetProps {
  open: boolean;
  vehicle: AutomobileAsset | null;
  trips: TripLog[];
  maintenance: MaintenanceEvent[];
  complianceAlerts: ComplianceAlert[];
  idleSuggestion?: IdleReuseSuggestion;
  onOpenChange: (open: boolean) => void;
}

const formatDuration = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
};

const countdown = (iso: string) => {
  const days = Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
  if (days <= 0) return 'Expired';
  return `${days} days`;
};

const relativeSeenTime = (iso: string) => {
  const deltaMinutes = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (deltaMinutes < 60) return `${deltaMinutes} min ago`;
  const deltaHours = Math.round(deltaMinutes / 60);
  if (deltaHours < 24) return `${deltaHours} hr ago`;
  return `${Math.round(deltaHours / 24)} day ago`;
};

const severityTone = (severity: ComplianceAlert['severity']) => {
  if (severity === 'CRITICAL') return 'text-red-600';
  if (severity === 'WARNING') return 'text-amber-600';
  return 'text-emerald-600';
};

export function VehicleBottomSheet({
  open,
  vehicle,
  trips,
  maintenance,
  complianceAlerts,
  idleSuggestion,
  onOpenChange,
}: VehicleBottomSheetProps) {
  const isMobile = useIsMobile();
  const [isExporting, setIsExporting] = useState(false);

  const vehicleAlerts = useMemo(
    () => complianceAlerts.filter((item) => item.vehicleId === vehicle?.id),
    [complianceAlerts, vehicle?.id]
  );

  const onDownloadPdf = async () => {
    try {
      setIsExporting(true);
      const response = await fetch('/api/automobiles/reports/utilization');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `nationtrack-${vehicle?.registrationNumber ?? 'report'}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  if (!vehicle) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? 'bottom' : 'left'}
        className={
          isMobile
            ? 'z-[1000] h-[85vh] w-full overflow-y-auto p-0'
            : '!bottom-auto !left-4 !top-[84px] z-[1000] !h-[clamp(520px,calc(100vh-160px),820px)] !w-[min(430px,calc(100vw-2rem))] !max-w-none overflow-y-auto !rounded-2xl border border-border/80 p-0 shadow-2xl'
        }
      >
        <div className="border-b bg-background p-4">
          <SheetHeader>
            <SheetTitle className="flex flex-wrap items-center gap-2 text-2xl leading-tight">
              <span>{vehicle.registrationNumber}</span>
              <Badge variant="outline" className="font-medium">
                {statusLabel[vehicle.status]}
              </Badge>
              <Badge variant="outline" className="font-medium">
                GPS Source: {vehicle.gpsSource}
              </Badge>
            </SheetTitle>
            <SheetDescription>
              {vehicle.displayName} | {vehicle.departmentName} | Driver: {vehicle.driverName}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <Button size="sm" variant="outline" className="justify-start gap-2">
              <Route className="h-4 w-4" />
              Route
            </Button>
            <Button size="sm" variant="outline" className="justify-start gap-2">
              <MapPin className="h-4 w-4" />
              Focus
            </Button>
            <Button size="sm" className="justify-start gap-2">
              <Siren className="h-4 w-4" />
              SOS
            </Button>
          </div>
        </div>

        <div className="p-4">
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid h-auto w-full grid-cols-5 gap-2 bg-transparent p-0">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="logs">Logs</TabsTrigger>
              <TabsTrigger value="compliance">Compliance</TabsTrigger>
              <TabsTrigger value="idle">Idle</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <article className="card-elevated rounded-lg p-3">
                  <p className="text-xs uppercase text-muted-foreground">Vehicle</p>
                  <p className="mt-1 flex items-center gap-2 font-semibold text-foreground">
                    <CarFront className="h-4 w-4" />
                    {vehicle.vehicleType}
                  </p>
                </article>
                <article className="card-elevated rounded-lg p-3">
                  <p className="text-xs uppercase text-muted-foreground">Current Area</p>
                  <p className="mt-1 flex items-center gap-2 font-semibold text-foreground">
                    <MapPin className="h-4 w-4" />
                    {vehicle.locationLabel}
                  </p>
                </article>
                <article className="card-elevated rounded-lg p-3">
                  <p className="text-xs uppercase text-muted-foreground">Driver</p>
                  <p className="mt-1 flex items-center gap-2 font-semibold text-foreground">
                    <UserRound className="h-4 w-4" />
                    {vehicle.driverName}
                  </p>
                </article>
                <article className="card-elevated rounded-lg p-3">
                  <p className="text-xs uppercase text-muted-foreground">Fuel/Model</p>
                  <p className="mt-1 flex items-center gap-2 font-semibold text-foreground">
                    <Fuel className="h-4 w-4" />
                    {vehicle.specs.fuelType} | {vehicle.specs.model}
                  </p>
                </article>
              </div>

              <div className="card-elevated space-y-2 rounded-lg p-3">
                <p className="text-sm font-semibold">Movement Snapshot</p>
                <p className="text-sm text-muted-foreground">
                  Speed {vehicle.speedKmph} km/h | Last seen {relativeSeenTime(vehicle.lastSeenAt)}
                </p>
                <Progress value={100 - vehicle.utilization.idlePercent} />
                <p className="text-xs text-muted-foreground">
                  Idle {vehicle.utilization.idlePercent}% | Maintenance risk{' '}
                  {vehicle.maintenanceRiskScore}/100
                </p>
              </div>

              <div className="card-elevated space-y-2 rounded-lg p-3">
                <p className="text-sm font-semibold">Upcoming Compliance</p>
                <p className="text-sm text-muted-foreground">
                  PUC: {countdown(vehicle.compliance.pucExpiry)} | Insurance:{' '}
                  {countdown(vehicle.compliance.insuranceExpiry)} | Fitness:{' '}
                  {countdown(vehicle.compliance.fitnessExpiry)}
                </p>
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CalendarClock className="h-3.5 w-3.5" />
                  Keep records updated to avoid service interruption.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="logs" className="space-y-3">
              {trips.length === 0 ? (
                <p className="text-sm text-muted-foreground">No trip logs found.</p>
              ) : (
                trips.map((trip) => (
                  <article key={trip.id} className="card-elevated rounded-lg p-3">
                    <p className="font-semibold">
                      {trip.startAddress} to {trip.endAddress ?? 'In progress'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {trip.distanceKm ?? 0} km | {formatDuration(trip.durationMinutes ?? 0)} | Fuel{' '}
                      {trip.fuelLiters ?? 'N/A'} L
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(trip.startedAt).toLocaleString('en-IN')} to{' '}
                      {trip.endedAt ? new Date(trip.endedAt).toLocaleString('en-IN') : 'Ongoing'}
                    </p>
                  </article>
                ))
              )}
              <div className="card-elevated rounded-lg p-3">
                <p className="mb-2 text-sm font-semibold">Maintenance Timeline</p>
                <ul className="space-y-2">
                  {maintenance.slice(0, 4).map((event) => (
                    <li key={event.id} className="text-sm text-muted-foreground">
                      {new Date(event.loggedAt).toLocaleDateString('en-IN')} - {event.title} (INR{' '}
                      {event.costInr})
                    </li>
                  ))}
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="compliance" className="space-y-3">
              {vehicleAlerts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No compliance alerts.</p>
              ) : (
                vehicleAlerts.map((alert) => (
                  <article key={alert.id} className="card-elevated rounded-lg p-3">
                    <p className="flex items-center gap-2 text-lg font-semibold">
                      <ShieldCheck className="h-4 w-4" />
                      {alert.type} expires in {alert.daysRemaining} days
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Severity: {alert.severity} | Expiry:{' '}
                      {new Date(alert.expiresOn).toDateString()}
                    </p>
                    <p className={`mt-1 text-xs font-semibold ${severityTone(alert.severity)}`}>
                      {alert.severity === 'CRITICAL'
                        ? 'Immediate attention required'
                        : alert.severity === 'WARNING'
                          ? 'Schedule renewal soon'
                          : 'Within compliance window'}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button size="sm" variant="secondary">
                        Send WhatsApp Alert
                      </Button>
                      <Button size="sm" variant="outline">
                        Send SMS Alert
                      </Button>
                    </div>
                  </article>
                ))
              )}
            </TabsContent>

            <TabsContent value="idle" className="space-y-3">
              <article className="card-elevated rounded-lg p-3">
                <p className="flex items-center gap-2 font-semibold">
                  <Clock3 className="h-4 w-4" />
                  Idle time: {formatDuration(vehicle.idleMinutes)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Vehicle is auto-flagged if idle for more than 6 months.
                </p>
              </article>
              {idleSuggestion ? (
                <article className="card-elevated space-y-2 rounded-lg p-3">
                  <p className="flex items-center gap-2 font-semibold">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    Re-use Suggestion
                  </p>
                  <p className="text-sm text-muted-foreground">{idleSuggestion.reasoning}</p>
                  <p className="text-sm text-muted-foreground">
                    Action: {idleSuggestion.suggestedAction.replace(/_/g, ' ')}
                  </p>
                  <Button size="sm">Apply Suggestion</Button>
                </article>
              ) : (
                <p className="text-sm text-muted-foreground">No long idle flag for this vehicle.</p>
              )}
            </TabsContent>

            <TabsContent value="reports" className="space-y-3">
              <article className="card-elevated space-y-2 rounded-lg p-3">
                <p className="font-semibold">Exports</p>
                <p className="text-sm text-muted-foreground">
                  Daily and weekly utilization summary with map-style overview.
                </p>
                <Button className="w-full" onClick={onDownloadPdf} disabled={isExporting}>
                  <FileDown className="mr-2 h-4 w-4" />
                  {isExporting ? 'Generating PDF...' : 'Download Utilization PDF'}
                </Button>
              </article>
              <div className="grid gap-3 sm:grid-cols-2">
                <article className="card-elevated rounded-lg p-3">
                  <p className="mb-1 flex items-center gap-2 text-sm font-semibold">
                    <Gauge className="h-4 w-4" />
                    Idle Heatmap
                  </p>
                  <p className="text-xs text-muted-foreground">Overlay enabled on map layers.</p>
                </article>
                <article className="card-elevated rounded-lg p-3">
                  <p className="mb-1 flex items-center gap-2 text-sm font-semibold">
                    <Timer className="h-4 w-4" />
                    GeM Export
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Ready to export flagged idle assets.
                  </p>
                </article>
              </div>
              <article className="card-elevated rounded-lg p-3">
                <p className="mb-1 flex items-center gap-2 text-sm font-semibold">
                  <Siren className="h-4 w-4" />
                  SOS Integration
                </p>
                <p className="text-xs text-muted-foreground">
                  Ambulance SOS events are prioritized and forwarded in the alert stream.
                </p>
              </article>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
