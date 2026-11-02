'use client';

import { AppWindow, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { nationTrackService } from '@/lib/nationtrack-service';
import type { AssetPassport, AssetType } from '@/types/nationtrack';
import type { Space } from '@/types/spaces';

export default function AdminAssetsPage() {
  const searchParams = useSearchParams();
  const activeModule = searchParams.get('module') === 'spaces' ? 'spaces' : 'automobile';
  const [assets, setAssets] = useState<AssetPassport[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [assetType, setAssetType] = useState<'ALL' | AssetType>('ALL');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        if (activeModule === 'spaces') {
          const response = await fetch('/api/spaces?type=ALL', { cache: 'no-store' });
          const payload = (await response.json()) as { success: boolean; data?: Space[] };
          setSpaces(payload.success && payload.data ? payload.data : []);
          setAssets([]);
        } else {
          const data = await nationTrackService.getAssets();
          setAssets(data);
          setSpaces([]);
        }
      } catch (error) {
        console.error('Failed to load admin module controls', error);
        setAssets([]);
        setSpaces([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [activeModule]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return assets.filter((asset) => {
      const typeMatch = assetType === 'ALL' || asset.type === assetType;
      const queryMatch =
        !normalizedQuery ||
        asset.name.toLowerCase().includes(normalizedQuery) ||
        asset.assetId.toLowerCase().includes(normalizedQuery) ||
        asset.department.toLowerCase().includes(normalizedQuery);
      return typeMatch && queryMatch;
    });
  }, [assets, assetType, query]);

  const filteredSpaces = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return spaces.filter((space) => {
      if (!normalizedQuery) return true;
      return (
        space.name.toLowerCase().includes(normalizedQuery) ||
        space.assetId.toLowerCase().includes(normalizedQuery) ||
        space.department.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [spaces, query]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-foreground">
          {activeModule === 'spaces' ? 'Office Spaces Registry' : 'Fleet Command Registry'}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {activeModule === 'spaces'
            ? 'Central control page for space records, departments, and utilization readiness.'
            : 'Central control page for automobile operations and live registry review.'}
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-1">
        <Link
          href={activeModule === 'spaces' ? '/spaces' : '/automobiles'}
          className="card-elevated rounded-xl p-4 transition hover:border-primary/40"
        >
          <div className="flex items-center gap-2 text-blue-700">
            <AppWindow className="h-4 w-4" />
            <h2 className="font-semibold text-foreground">
              {activeModule === 'spaces' ? 'Office Spaces' : 'Automobiles'}
            </h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {activeModule === 'spaces'
              ? 'Bookings, room status, utilization, maintenance and secure transit workflows.'
              : 'Fleet registry, trips, rentals, seizure, and auction workflows.'}
          </p>
          <p className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">
            Open module <ArrowRight className="h-4 w-4" />
          </p>
        </Link>
      </section>

      <section className="card-elevated space-y-4 rounded-xl p-4">
        <h2 className="text-lg font-semibold text-foreground">Registry Snapshot</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by asset, id, or department"
            aria-label="Search registry snapshot"
            className="md:col-span-2"
          />
          {activeModule === 'automobile' ? (
            <label className="flex items-center gap-2 text-sm text-foreground">
              <span>Type</span>
              <select
                value={assetType}
                onChange={(event) => setAssetType(event.target.value as 'ALL' | AssetType)}
                className="h-10 w-full rounded-md border bg-background px-3"
                aria-label="Filter registry by type"
              >
                <option value="ALL">All</option>
                <option value="VEHICLE">Vehicle</option>
              </select>
            </label>
          ) : (
            <p className="inline-flex items-center rounded-md border bg-muted/40 px-3 text-sm text-muted-foreground">
              Live total spaces: {spaces.length}
            </p>
          )}
        </div>
      </section>

      <section className="space-y-3">
        {loading ? (
          [1, 2, 3].map((item) => <Skeleton key={item} className="h-20 w-full rounded-xl" />)
        ) : activeModule === 'spaces' ? (
          filteredSpaces.length > 0 ? (
            filteredSpaces.slice(0, 12).map((space) => (
              <article key={space.id} className="card-elevated rounded-xl p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{space.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {space.assetId} · {space.department} · {space.district}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border px-2 py-1 text-xs font-semibold text-foreground">
                      {space.spaceType}
                    </span>
                    <span className="rounded-full border px-2 py-1 text-xs font-semibold text-foreground">
                      {space.status}
                    </span>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="card-elevated rounded-xl p-10 text-center text-sm text-muted-foreground">
              No spaces match current filters or search.
            </div>
          )
        ) : filtered.length > 0 ? (
          filtered.slice(0, 12).map((asset) => (
            <article key={asset.id} className="card-elevated rounded-xl p-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold text-foreground">{asset.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {asset.assetId} · {asset.department} · {asset.district}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full border px-2 py-1 text-xs font-semibold text-foreground">
                    {asset.type}
                  </span>
                  <span className="rounded-full border px-2 py-1 text-xs font-semibold text-foreground">
                    {asset.status}
                  </span>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="card-elevated rounded-xl p-10 text-center text-sm text-muted-foreground">
            No assets match current filters.
          </div>
        )}
      </section>
    </div>
  );
}
