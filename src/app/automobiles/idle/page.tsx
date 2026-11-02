'use client';

import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import type { AutomobileAsset, IdleReuseSuggestion } from '@/types/automobiles';

interface IdlePayload {
  suggestions: IdleReuseSuggestion[];
}

interface VehiclesPayload {
  vehicles: AutomobileAsset[];
}

type VehiclesApiPayload = VehiclesPayload | { success?: boolean; data?: AutomobileAsset[] };
type IdleApiPayload =
  | IdlePayload
  | { success?: boolean; suggestions?: IdleReuseSuggestion[]; data?: unknown[] };

type IdleAction = 'TRANSFER' | 'GEM_EXPORT' | 'DECOMMISSION';

export default function AutomobileIdlePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [vehicles, setVehicles] = useState<AutomobileAsset[]>([]);
  const [suggestions, setSuggestions] = useState<IdleReuseSuggestion[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<AutomobileAsset | null>(null);
  const [actionType, setActionType] = useState<IdleAction>('TRANSFER');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    const run = async () => {
      try {
        const [idleResponse, vehiclesResponse] = await Promise.all([
          fetch('/api/automobiles/idle'),
          fetch('/api/automobiles/vehicles'),
        ]);

        const idleData = (await idleResponse.json()) as IdleApiPayload;
        const vehicleData = (await vehiclesResponse.json()) as VehiclesApiPayload;

        const suggestionItems = Array.isArray((idleData as IdlePayload).suggestions)
          ? (idleData as IdlePayload).suggestions
          : Array.isArray((idleData as { suggestions?: IdleReuseSuggestion[] }).suggestions)
            ? ((idleData as { suggestions?: IdleReuseSuggestion[] }).suggestions ?? [])
            : [];

        const vehicleItems = Array.isArray((vehicleData as VehiclesPayload).vehicles)
          ? (vehicleData as VehiclesPayload).vehicles
          : Array.isArray((vehicleData as { data?: AutomobileAsset[] }).data)
            ? ((vehicleData as { data?: AutomobileAsset[] }).data ?? [])
            : [];

        if (!active) return;
        setSuggestions(suggestionItems);
        setVehicles(vehicleItems);
      } catch {
        if (!active) return;
        setError('Unable to load idle fleet actions.');
      } finally {
        if (!active) return;
        setLoading(false);
      }
    };

    run();

    return () => {
      active = false;
    };
  }, []);

  const idleVehicles = useMemo(() => {
    const byId = new Map(vehicles.map((vehicle) => [vehicle.id, vehicle]));
    return suggestions
      .map((suggestion) => ({
        suggestion,
        vehicle: byId.get(suggestion.vehicleId),
      }))
      .filter((item): item is { suggestion: IdleReuseSuggestion; vehicle: AutomobileAsset } =>
        Boolean(item.vehicle)
      );
  }, [suggestions, vehicles]);

  const averageIdleDays = useMemo(() => {
    if (idleVehicles.length === 0) return 0;
    return Math.round(
      idleVehicles.reduce((sum, item) => sum + item.suggestion.idleDays, 0) / idleVehicles.length
    );
  }, [idleVehicles]);

  const estimatedReuseValue = useMemo(() => idleVehicles.length * 380000, [idleVehicles.length]);

  const downloadGemExport = async () => {
    const response = await fetch('/api/automobiles/idle/gem-export');
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `nationtrack-gem-export-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const submitAction = async () => {
    if (!selectedVehicle) return;

    try {
      setSubmitting(true);
      await fetch('/api/automobiles/idle/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId: selectedVehicle.id,
          action: actionType,
          notes,
        }),
      });
      setSelectedVehicle(null);
      setNotes('');
      setActionType('TRANSFER');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <section className="container-wide space-y-4 py-8">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-44 rounded-xl" />
        <Skeleton className="h-52 rounded-xl" />
      </section>
    );
  }

  if (error) {
    return (
      <section className="container-wide py-8">
        <article className="rounded-xl border border-destructive/30 bg-destructive/10 p-6">
          <p className="font-semibold text-foreground">Idle workflow unavailable</p>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
        </article>
      </section>
    );
  }

  return (
    <section className="container-wide space-y-6 py-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">
            Idle Fleet - Action Required
          </h1>
          <p className="text-sm text-muted-foreground">
            {idleVehicles.length} vehicles idle over 180 days
          </p>
        </div>
        <Button onClick={downloadGemExport}>Export to GeM CSV</Button>
      </header>

      <div className="grid gap-3 md:grid-cols-3">
        <article className="rounded-xl border bg-card p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Total Idle</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{idleVehicles.length}</p>
        </article>
        <article className="rounded-xl border bg-card p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Avg Idle Days</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{averageIdleDays}</p>
        </article>
        <article className="rounded-xl border bg-card p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Estimated Reuse Value
          </p>
          <p className="mt-2 text-3xl font-bold text-foreground">
            INR {estimatedReuseValue.toLocaleString('en-IN')}
          </p>
        </article>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {idleVehicles.map(({ vehicle, suggestion }) => (
          <article key={suggestion.id} className="card-elevated rounded-xl p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  {vehicle.id.toUpperCase()}
                </p>
                <h2 className="mt-1 text-lg font-semibold text-foreground">
                  {vehicle.displayName}
                </h2>
                <p className="text-sm text-muted-foreground">{vehicle.departmentName}</p>
              </div>
              <Badge className="bg-status-dev-bg text-status-dev">IDLE</Badge>
            </div>

            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
              <p>Idle for: {suggestion.idleDays} days</p>
              <p>Last seen: {new Date(vehicle.lastSeenAt).toLocaleDateString('en-IN')}</p>
              <p>Base: {vehicle.locationLabel}</p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs text-primary">
                {suggestion.suggestedAction.replace(/_/g, ' ')}
              </span>
              <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs text-primary">
                Internal transfer
              </span>
              <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs text-primary">
                GeM auction
              </span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <Link href={`/automobiles/${vehicle.id}`}>
                <Button variant="outline" className="w-full">
                  View Passport
                </Button>
              </Link>
              <Button className="w-full" onClick={() => setSelectedVehicle(vehicle)}>
                Take Action
              </Button>
            </div>
          </article>
        ))}
      </div>

      <Dialog
        open={Boolean(selectedVehicle)}
        onOpenChange={(open) => !open && setSelectedVehicle(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Idle Vehicle Action</DialogTitle>
            <DialogDescription>
              {selectedVehicle
                ? `Choose next action for ${selectedVehicle.displayName}.`
                : 'Choose next action.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <label
              className="block text-sm font-medium text-foreground"
              htmlFor="idle-action-select"
            >
              Action type
            </label>
            <select
              id="idle-action-select"
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={actionType}
              onChange={(event) => setActionType(event.target.value as IdleAction)}
            >
              <option value="TRANSFER">Transfer</option>
              <option value="GEM_EXPORT">GeM Export</option>
              <option value="DECOMMISSION">Decommission</option>
            </select>

            <label
              className="block text-sm font-medium text-foreground"
              htmlFor="idle-action-notes"
            >
              Notes
            </label>
            <Input
              id="idle-action-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Add transfer order reference or remarks"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedVehicle(null)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={submitAction} disabled={submitting}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirm Action
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
