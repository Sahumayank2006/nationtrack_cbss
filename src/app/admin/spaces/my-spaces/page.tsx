'use client';

import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import type { Space } from '@/types/spaces';

interface SpacesPayload {
  success: boolean;
  data: Space[];
}

export default function AdminMySpacesPage() {
  const [spaces, setSpaces] = useState<Space[]>([]);

  useEffect(() => {
    const load = async () => {
      const response = await fetch('/api/spaces', { cache: 'no-store' });
      const payload = (await response.json()) as SpacesPayload;
      if (payload.success) {
        setSpaces(payload.data);
      }
    };

    void load();
  }, []);

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">My Spaces</h1>
        <p className="text-sm text-muted-foreground">
          Catalog of managed office spaces and current states.
        </p>
      </header>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {spaces.map((space) => (
          <article key={space.id} className="card-elevated rounded-xl p-4">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-base font-semibold text-foreground">{space.name}</h2>
              <Badge variant="outline">{space.status}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{space.department}</p>
            <p className="text-sm text-muted-foreground">{space.address}</p>
            <p className="mt-2 text-xs text-muted-foreground">Capacity: {space.capacity}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
