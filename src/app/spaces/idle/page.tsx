'use client';

import { Download, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Space } from '@/types/spaces';

interface IdleResponse {
  success: boolean;
  data: Array<{ spaceId: string; idleDays: number; suggestions: string[] }>;
}

interface SpacesResponse {
  success: boolean;
  data: Space[];
}

export default function SpacesIdlePage() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [idleRows, setIdleRows] = useState<IdleResponse['data']>([]);

  const load = async () => {
    const [spacesRes, idleRes] = await Promise.all([
      fetch('/api/spaces', { cache: 'no-store' }),
      fetch('/api/spaces/idle', { cache: 'no-store' }),
    ]);

    const spacesPayload = (await spacesRes.json()) as SpacesResponse;
    const idlePayload = (await idleRes.json()) as IdleResponse;

    if (spacesPayload.success) setSpaces(spacesPayload.data);
    if (idlePayload.success) setIdleRows(idlePayload.data);
  };

  useEffect(() => {
    load();
  }, []);

  const items = useMemo(
    () =>
      idleRows
        .map((row) => {
          const space = spaces.find((item) => item.id === row.spaceId);
          if (!space) return null;
          return { row, space };
        })
        .filter((item): item is { row: IdleResponse['data'][number]; space: Space } =>
          Boolean(item)
        ),
    [idleRows, spaces]
  );

  const activate = async (spaceId: string) => {
    await fetch(`/api/spaces/${spaceId}/idle/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actorName: 'Department Officer' }),
    });
    load();
  };

  return (
    <main id="maincontent" className="container-wide space-y-6 py-8">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Idle Spaces - Action Required</h1>
          <p className="text-sm text-muted-foreground">
            Activate underutilized spaces and apply reuse suggestions.
          </p>
        </div>
        <a href="/api/spaces/idle/pam-export">
          <Button className="gap-2">
            <Download className="h-4 w-4" /> Export to PAM Portal
          </Button>
        </a>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="card-elevated rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Total Idle</p>
          <p className="mt-2 text-2xl font-bold text-status-dev">{items.length}</p>
        </article>
        <article className="card-elevated rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Avg Idle Days</p>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {items.length > 0
              ? Math.round(items.reduce((sum, item) => sum + item.row.idleDays, 0) / items.length)
              : 0}
          </p>
        </article>
        <article className="card-elevated rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Ready for Immediate Listing</p>
          <p className="mt-2 text-2xl font-bold text-status-live">{items.length}</p>
        </article>
      </section>

      <section className="space-y-4">
        {items.map(({ row, space }) => (
          <article key={space.id} className="card-elevated rounded-xl p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {space.assetId}
                </p>
                <h2 className="mt-1 text-lg font-semibold text-foreground">{space.name}</h2>
                <p className="text-sm text-muted-foreground">{space.department}</p>
              </div>
              <Badge className="border-status-dev/40 bg-status-dev-bg text-status-dev">IDLE</Badge>
            </div>

            <p className="mt-3 text-sm text-muted-foreground">
              Idle for {row.idleDays} days | Last activity{' '}
              {space.lastActivityAt
                ? new Date(space.lastActivityAt).toLocaleDateString('en-IN')
                : '-'}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {row.suggestions.map((suggestion) => (
                <span
                  key={suggestion}
                  className="inline-flex items-center gap-1 rounded-full border border-status-live/20 bg-status-live-bg px-3 py-1 text-xs text-status-live"
                >
                  <Sparkles className="h-3 w-3" /> {suggestion}
                </span>
              ))}
            </div>

            <div className="mt-4 flex gap-2">
              <Button variant="outline">View Passport</Button>
              <Button onClick={() => activate(space.id)}>Activate for Booking</Button>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
