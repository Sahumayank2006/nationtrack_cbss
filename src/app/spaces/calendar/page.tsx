'use client';

import { useEffect, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import type { Space } from '@/types/spaces';

interface SpacesResponse {
  success: boolean;
  data: Space[];
}

export default function SpacesCalendarPage() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      const response = await fetch('/api/spaces/map-pins/available', { cache: 'no-store' });
      const payload = (await response.json()) as SpacesResponse;
      if (payload.success) {
        setSpaces(payload.data);
      }
    };

    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return spaces;
    return spaces.filter((space) => {
      return (
        space.name.toLowerCase().includes(q) ||
        space.department.toLowerCase().includes(q) ||
        space.address.toLowerCase().includes(q)
      );
    });
  }, [search, spaces]);

  return (
    <main id="maincontent" className="container-wide space-y-6 py-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Office Space Availability Calendar</h1>
        <p className="text-sm text-muted-foreground">
          Quickly inspect currently available spaces with department and capacity context.
        </p>
      </header>

      <section className="max-w-md">
        <Input
          placeholder="Search space, department, or address"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((space) => (
          <article key={space.id} className="card-elevated rounded-xl p-4">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-base font-semibold text-foreground">{space.name}</h2>
              <Badge variant={space.isIdle ? 'destructive' : 'outline'}>
                {space.isIdle ? 'Idle' : space.status}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{space.department}</p>
            <p className="text-sm text-muted-foreground">{space.address}</p>
            <p className="mt-2 text-xs text-muted-foreground">Capacity: {space.capacity}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
