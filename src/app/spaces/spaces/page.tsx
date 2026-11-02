'use client';

import { Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { SpaceShowcaseCard } from '@/components/spaces/SpaceShowcaseCard';
import { Input } from '@/components/ui/input';
import type { Space } from '@/types/spaces';

interface SpaceResponse {
  success: boolean;
  data: Space[];
}

export default function SpacesRegistryPage() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | Space['spaceType']>('ALL');
  const [districtFilter, setDistrictFilter] = useState<'ALL' | Space['district']>('ALL');
  const [minCapacity, setMinCapacity] = useState(0);

  useEffect(() => {
    const load = async () => {
      const response = await fetch('/api/spaces', { cache: 'no-store' });
      const payload = (await response.json()) as SpaceResponse;
      if (payload.success) {
        setSpaces(payload.data);
      }
    };

    load();
  }, []);

  const filtered = useMemo(() => {
    return spaces.filter((space) => {
      if (typeFilter !== 'ALL' && space.spaceType !== typeFilter) return false;
      if (districtFilter !== 'ALL' && space.district !== districtFilter) return false;
      if (space.capacity < minCapacity) return false;
      if (!search.trim()) return true;

      const query = search.toLowerCase();
      return (
        space.name.toLowerCase().includes(query) ||
        space.address.toLowerCase().includes(query) ||
        space.assetId.toLowerCase().includes(query)
      );
    });
  }, [districtFilter, minCapacity, search, spaces, typeFilter]);

  return (
    <main id="maincontent" className="container-wide space-y-6 py-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">All Spaces</h1>
        <p className="text-sm text-muted-foreground">
          Filter and discover spaces by type, district, availability, and capacity.
        </p>
      </header>

      <section className="grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-4">
        <label className="md:col-span-2">
          <span className="mb-1 block text-xs font-semibold text-muted-foreground">
            Search spaces
          </span>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, address, asset ID"
              className="pl-9"
            />
          </div>
        </label>

        <label>
          <span className="mb-1 block text-xs font-semibold text-muted-foreground">Type</span>
          <select
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value as 'ALL' | Space['spaceType'])}
          >
            <option value="ALL">All types</option>
            <option value="HOSPITAL_ROOM">Hospital Room</option>
            <option value="CLASSROOM">Classroom</option>
            <option value="COMMUNITY_HALL">Community Hall</option>
            <option value="PWD_OFFICE">PWD Office</option>
            <option value="TRANSIT_ROOM">Transit Room</option>
            <option value="TRAINING_HALL">Training Hall</option>
          </select>
        </label>

        <label>
          <span className="mb-1 block text-xs font-semibold text-muted-foreground">District</span>
          <select
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={districtFilter}
            onChange={(event) => setDistrictFilter(event.target.value as 'ALL' | Space['district'])}
          >
            <option value="ALL">All districts</option>
            <option value="Lashkar">Lashkar</option>
            <option value="Morar">Morar</option>
            <option value="Thatipur">Thatipur</option>
            <option value="Gwalior East">Gwalior East</option>
          </select>
        </label>

        <label>
          <span className="mb-1 block text-xs font-semibold text-muted-foreground">
            Min capacity
          </span>
          <select
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={minCapacity}
            onChange={(event) => setMinCapacity(Number(event.target.value))}
          >
            <option value={0}>Any</option>
            <option value={10}>Fits 10+</option>
            <option value={50}>Fits 50+</option>
            <option value={100}>Fits 100+</option>
          </select>
        </label>
      </section>

      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((space) => (
          <SpaceShowcaseCard key={space.id} space={space} />
        ))}
      </section>

      {filtered.length === 0 && (
        <section className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No spaces matched your filters.
        </section>
      )}
    </main>
  );
}
