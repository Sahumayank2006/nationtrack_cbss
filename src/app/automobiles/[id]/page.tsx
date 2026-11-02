'use client';

import { ArrowLeft, Gauge, MapPin, ShieldCheck, Truck } from 'lucide-react';
import Link from 'next/link';
import { use, useEffect, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/date-utils';
import { nationTrackService } from '@/lib/nationtrack-service';
import type { AssetPassport } from '@/types/nationtrack';

interface Props {
  params: Promise<{ id: string }>;
}

export default function AutomobilePassportPage({ params }: Props) {
  const { id } = use(params);
  const [asset, setAsset] = useState<AssetPassport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const vehicles = await nationTrackService.getAssets('VEHICLE');
        const found = vehicles.find((vehicle) => vehicle.id === id) ?? null;
        setAsset(found);
      } catch (error) {
        console.error('Failed to load vehicle passport', error);
        setAsset(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const metaRows = useMemo(() => {
    if (!asset || !asset.metadata || !('registrationNumber' in asset.metadata)) return [];

    return [
      { label: 'Registration', value: asset.metadata.registrationNumber },
      { label: 'Fuel', value: asset.metadata.fuelType },
      { label: 'Model', value: `${asset.metadata.make} ${asset.metadata.model}`.trim() },
      { label: 'Odometer', value: `${asset.metadata.odometer ?? 0} km` },
      {
        label: 'Compliance',
        value: asset.metadata.insuranceExpiry
          ? `Insurance till ${formatDate(asset.metadata.insuranceExpiry)}`
          : 'Not set',
      },
    ];
  }, [asset]);

  if (loading) {
    return (
      <section className="py-10">
        <div className="container-wide space-y-6">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </section>
    );
  }

  if (!asset) {
    return (
      <section className="py-20">
        <div className="container-wide text-center">
          <h1 className="text-2xl font-semibold text-foreground">Vehicle not found</h1>
          <p className="mt-2 text-muted-foreground">
            This vehicle passport may not exist yet in your current data source.
          </p>
          <Link href="/automobiles" className="mt-6 inline-block">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Fleet
            </Button>
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="py-10">
      <div className="container-wide space-y-8">
        <Link
          href="/automobiles"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Fleet
        </Link>

        <article className="card-elevated rounded-2xl border-2 border-azure-300 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {asset.assetId}
              </p>
              <h1 className="mt-1 text-3xl font-bold text-foreground">{asset.name}</h1>
              <p className="mt-2 max-w-2xl text-muted-foreground">
                NationTrack digital passport for operational and compliance tracking.
              </p>
            </div>
            <Badge className="bg-azure-600 text-white">{asset.status}</Badge>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border bg-background p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Type</p>
              <p className="mt-2 flex items-center gap-2 font-medium text-foreground">
                <Truck className="h-4 w-4" />
                {asset.subType.replace(/_/g, ' ')}
              </p>
            </div>
            <div className="rounded-xl border bg-background p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">District</p>
              <p className="mt-2 flex items-center gap-2 font-medium text-foreground">
                <MapPin className="h-4 w-4" />
                {asset.district}
              </p>
            </div>
            <div className="rounded-xl border bg-background p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Department</p>
              <p className="mt-2 flex items-center gap-2 font-medium text-foreground">
                <ShieldCheck className="h-4 w-4" />
                {asset.department}
              </p>
            </div>
            <div className="rounded-xl border bg-background p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Last Activity</p>
              <p className="mt-2 flex items-center gap-2 font-medium text-foreground">
                <Gauge className="h-4 w-4" />
                {formatDate(asset.lastActivityAt)}
              </p>
            </div>
          </div>

          {metaRows.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-foreground">Vehicle Metadata</h2>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {metaRows.map((row) => (
                  <div key={row.label} className="rounded-lg border bg-background px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {row.label}
                    </p>
                    <p className="mt-1 text-sm font-medium text-foreground">{row.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </article>
      </div>
    </section>
  );
}
