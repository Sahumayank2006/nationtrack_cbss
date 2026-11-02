'use client';

import { useEffect, useState } from 'react';

import type { SpaceEvent } from '@/types/spaces';

interface EventsPayload {
  success: boolean;
  data: SpaceEvent[];
}

export default function AdminSpacesMaintenanceLogPage() {
  const [events, setEvents] = useState<SpaceEvent[]>([]);

  useEffect(() => {
    const load = async () => {
      const response = await fetch('/api/spaces/events/recent?limit=40&type=ALL', {
        cache: 'no-store',
      });
      const payload = (await response.json()) as EventsPayload;
      if (payload.success) {
        setEvents(
          payload.data.filter(
            (event) =>
              event.eventType === 'MAINTENANCE_RAISED' || event.eventType === 'MAINTENANCE_RESOLVED'
          )
        );
      }
    };

    void load();
  }, []);

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">Maintenance Log</h1>
        <p className="text-sm text-muted-foreground">
          Track maintenance raised/resolved activity across managed spaces.
        </p>
      </header>

      <section className="space-y-3">
        {events.length === 0 ? (
          <p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
            No maintenance logs available.
          </p>
        ) : null}

        {events.map((event) => (
          <article key={event.id} className="card-elevated rounded-xl p-4">
            <p className="text-sm font-semibold text-foreground">
              {event.eventType.replace(/_/g, ' ')}
            </p>
            <p className="text-sm text-muted-foreground">Actor: {event.actorName}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(event.timestamp).toLocaleString('en-IN')}
            </p>
          </article>
        ))}
      </section>
    </div>
  );
}
