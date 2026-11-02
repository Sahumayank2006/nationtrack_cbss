'use client';

import {
  AlertTriangle,
  Car,
  CheckCircle2,
  ClipboardList,
  FileText,
  Gavel,
  Shield,
  Wrench,
  X,
  XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

import type { VehicleDetailPanelProps } from '@/types/automobiles';

const getDaysRemaining = (iso: string) => {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
};

const complianceState = (iso: string) => {
  const days = getDaysRemaining(iso);
  if (days < 0) return { tone: 'expired', label: `Expired ${Math.abs(days)} days ago` };
  if (days <= 60) return { tone: 'warning', label: `${days} days left` };
  return { tone: 'valid', label: `${days} days left` };
};

const widthClassFromPercent = (value: number): string => {
  if (value >= 95) return 'w-[95%]';
  if (value >= 90) return 'w-[90%]';
  if (value >= 85) return 'w-[85%]';
  if (value >= 80) return 'w-[80%]';
  if (value >= 75) return 'w-[75%]';
  if (value >= 70) return 'w-[70%]';
  if (value >= 65) return 'w-[65%]';
  if (value >= 60) return 'w-[60%]';
  if (value >= 55) return 'w-[55%]';
  if (value >= 50) return 'w-1/2';
  if (value >= 45) return 'w-[45%]';
  if (value >= 40) return 'w-[40%]';
  if (value >= 35) return 'w-[35%]';
  if (value >= 30) return 'w-[30%]';
  if (value >= 25) return 'w-1/4';
  if (value >= 20) return 'w-1/5';
  if (value >= 10) return 'w-[10%]';
  return 'w-[5%]';
};

export function VehicleDetailPanel({
  vehicle,
  legalRecords,
  maintenanceHistory,
  isOpen,
  onClose,
}: VehicleDetailPanelProps) {
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) setActiveTab('overview');
  }, [isOpen, vehicle?.id]);

  const complianceCards = useMemo(() => {
    if (!vehicle) return [];
    return [
      { title: 'PUC Certificate', expiry: vehicle.compliance.pucExpiry },
      { title: 'Insurance', expiry: vehicle.compliance.insuranceExpiry },
      { title: 'Fitness Certificate', expiry: vehicle.compliance.fitnessExpiry },
    ].map((entry) => ({ ...entry, state: complianceState(entry.expiry) }));
  }, [vehicle]);

  if (!vehicle) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        aria-label="Close details panel"
        className={cn(
          'fixed inset-0 z-40 bg-slate-950/30 transition-opacity',
          isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={onClose}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="vehicle-panel-title"
        className={cn(
          'fixed z-50 flex flex-col border-l border-border bg-background shadow-2xl transition-transform duration-300 ease-out',
          'inset-y-0 right-0 w-full md:w-[480px]',
          'max-md:bottom-0 max-md:left-0 max-md:right-0 max-md:top-auto max-md:h-[90vh] max-md:rounded-t-2xl max-md:border-l-0 max-md:border-t',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-border md:hidden" aria-hidden />

        <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <h2
              id="vehicle-panel-title"
              className="text-xl font-bold tracking-tight text-foreground"
            >
              {vehicle.displayName}
            </h2>
            <p className="font-mono text-xs text-muted-foreground">{vehicle.registrationNumber}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="outline" className="rounded-full">
                {vehicle.status}
              </Badge>
              <Badge variant="outline" className="rounded-full">
                {vehicle.metadata.assignedStation}
              </Badge>
            </div>
          </div>
          <Button variant="ghost" size="icon" aria-label="Close panel" onClick={onClose}>
            <X className="h-5 w-5" aria-hidden />
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid h-auto w-full grid-cols-3 gap-1 rounded-2xl bg-muted p-1">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="metadata">Metadata</TabsTrigger>
              <TabsTrigger value="compliance">Compliance</TabsTrigger>
              <TabsTrigger value="legal">Legal</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
              <TabsTrigger value="utilization">Trips</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-3">
              <article className="card-elevated rounded-2xl border border-border bg-gradient-to-br from-accent/20 via-background to-primary/5 p-4">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-border bg-background">
                    <Car className="h-6 w-6" aria-hidden />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{vehicle.vehicleType}</p>
                    <p className="text-xs text-muted-foreground">{vehicle.departmentName}</p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <p>Driver: {vehicle.driverName}</p>
                  <p>Idle Minutes: {vehicle.idleMinutes}</p>
                  <p>Hours Today: {vehicle.utilization.hoursToday.toFixed(1)}</p>
                  <p>Hours Week: {vehicle.utilization.hoursWeek.toFixed(1)}</p>
                </div>
              </article>
            </TabsContent>

            <TabsContent value="metadata">
              <article className="card-elevated rounded-2xl border border-border p-4">
                <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-muted-foreground">Chassis Number</dt>
                    <dd className="font-medium">{vehicle.metadata.chassisNumber}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Engine Number</dt>
                    <dd className="font-medium">{vehicle.metadata.engineNumber}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Vehicle Type</dt>
                    <dd className="font-medium">{vehicle.metadata.vehicleType}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Make & Model</dt>
                    <dd className="font-medium">{vehicle.metadata.makeModel}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Year of Manufacture</dt>
                    <dd className="font-medium">{vehicle.metadata.yearOfManufacture}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Fuel Type</dt>
                    <dd className="font-medium">{vehicle.metadata.fuelType}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Seating Capacity</dt>
                    <dd className="font-medium">{vehicle.metadata.seatingCapacity}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Color</dt>
                    <dd className="font-medium">{vehicle.metadata.color}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Gross Weight</dt>
                    <dd className="font-medium">{vehicle.metadata.grossWeightKg} kg</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Odometer</dt>
                    <dd className="font-medium">
                      {vehicle.metadata.odometerKm.toLocaleString('en-IN')} km
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">GPS Source</dt>
                    <dd className="font-medium">{vehicle.metadata.gpsSource}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Department</dt>
                    <dd className="font-medium">{vehicle.metadata.department}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Sector</dt>
                    <dd className="font-medium">{vehicle.metadata.sector}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Assigned Station</dt>
                    <dd className="font-medium">{vehicle.metadata.assignedStation}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Driver Name</dt>
                    <dd className="font-medium">{vehicle.metadata.driverName}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Driver Contact</dt>
                    <dd className="font-medium">{vehicle.metadata.driverContact}</dd>
                  </div>
                </dl>
              </article>
            </TabsContent>

            <TabsContent value="compliance" className="space-y-3">
              {complianceCards.map((item) => (
                <article
                  key={item.title}
                  className="card-elevated rounded-xl border border-border p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="inline-flex items-center gap-2 font-medium">
                      <FileText className="h-4 w-4" aria-hidden />
                      {item.title}
                    </p>
                    {item.state.tone === 'valid' ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600">
                        <CheckCircle2 className="h-4 w-4" aria-hidden />
                        Valid
                      </span>
                    ) : item.state.tone === 'warning' ? (
                      <span className="inline-flex items-center gap-1 text-amber-600">
                        <AlertTriangle className="h-4 w-4" aria-hidden />
                        Expiring Soon
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-600">
                        <XCircle className="h-4 w-4" aria-hidden />
                        Expired
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Expires: {new Date(item.expiry).toLocaleDateString('en-IN')} ({item.state.label}
                    )
                  </p>
                </article>
              ))}
            </TabsContent>

            <TabsContent value="legal" className="space-y-3">
              {legalRecords.length === 0 ? (
                <p className="text-sm text-muted-foreground">No legal records available.</p>
              ) : (
                legalRecords.map((record) => (
                  <article
                    key={record.id}
                    className="card-elevated rounded-xl border border-border p-3 text-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="inline-flex items-center gap-2 font-medium">
                        <Gavel className="h-4 w-4" aria-hidden />
                        {record.type.replace(/_/g, ' ')}
                      </p>
                      <Badge variant="outline">{record.status}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Ref: {record.referenceNumber}
                    </p>
                    <p className="mt-1">{record.description}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Authority: {record.authority}
                    </p>
                    {record.amount ? (
                      <p className="mt-1 text-xs">
                        Amount: INR {record.amount.toLocaleString('en-IN')}
                      </p>
                    ) : null}
                  </article>
                ))
              )}
            </TabsContent>

            <TabsContent value="maintenance" className="space-y-3">
              <article className="card-elevated rounded-xl border border-border p-3">
                <p className="inline-flex items-center gap-2 font-medium">
                  <Shield className="h-4 w-4" aria-hidden />
                  Maintenance Risk Score
                </p>
                <div className="mt-2 h-2 w-full rounded-full bg-muted">
                  <div
                    className={cn(
                      'h-2 rounded-full',
                      widthClassFromPercent(vehicle.maintenanceRiskScore),
                      vehicle.maintenanceRiskScore >= 75
                        ? 'bg-red-500'
                        : vehicle.maintenanceRiskScore >= 45
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                    )}
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {vehicle.maintenanceRiskScore}/100
                </p>
              </article>

              {maintenanceHistory.map((record) => (
                <article
                  key={record.id}
                  className="card-elevated rounded-xl border border-border p-3 text-sm"
                >
                  <p className="inline-flex items-center gap-2 font-medium">
                    <Wrench className="h-4 w-4" aria-hidden />
                    {record.serviceType}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(record.serviceDate).toLocaleDateString('en-IN')}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Odometer: {record.odometerKm.toLocaleString('en-IN')} km
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Cost: INR {record.costInr.toLocaleString('en-IN')}
                  </p>
                  <p className="mt-1">{record.notes}</p>
                </article>
              ))}
            </TabsContent>

            <TabsContent value="utilization" className="space-y-3">
              <article className="card-elevated rounded-xl border border-border p-3 text-sm">
                <p className="inline-flex items-center gap-2 font-medium">
                  <ClipboardList className="h-4 w-4" aria-hidden />
                  Utilization Snapshot
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <p>Today: {vehicle.utilization.hoursToday.toFixed(1)} hours</p>
                  <p>Week: {vehicle.utilization.hoursWeek.toFixed(1)} hours</p>
                  <p>Idle: {vehicle.utilization.idlePercent.toFixed(0)}%</p>
                  <p>Idle Minutes: {vehicle.idleMinutes}</p>
                </div>
              </article>
            </TabsContent>
          </Tabs>
        </div>
      </aside>
    </>
  );
}
