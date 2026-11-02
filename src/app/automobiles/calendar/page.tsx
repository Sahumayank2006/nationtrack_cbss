'use client';

import { useEffect, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import type { BookingCalendarEntry } from '@/types/admin-automobiles';

interface BookingCalendarResponse {
  success: boolean;
  data: BookingCalendarEntry[];
}

export default function AutomobilesCalendarPage() {
  const [entries, setEntries] = useState<BookingCalendarEntry[]>([]);
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    const load = async () => {
      const response = await fetch('/api/automobiles/bookings/calendar', { cache: 'no-store' });
      const payload = (await response.json()) as BookingCalendarResponse;
      if (payload.success) {
        setEntries(payload.data);
      }
    };

    void load();
  }, []);

  const filteredEntries = useMemo(() => {
    if (!dateFilter) return entries;
    return entries.filter((entry) => entry.startDate.startsWith(dateFilter));
  }, [dateFilter, entries]);

  return (
    <main id="maincontent" className="container-wide space-y-5 py-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Vehicle Booking Calendar</h1>
        <p className="text-sm text-muted-foreground">
          Day-wise allocation view for collision checks and planning.
        </p>
      </header>

      <section className="max-w-sm">
        <label className="space-y-1">
          <span className="text-sm font-medium text-foreground">Filter by date</span>
          <Input
            type="date"
            value={dateFilter}
            onChange={(event) => setDateFilter(event.target.value)}
          />
        </label>
      </section>

      <section className="space-y-3">
        {filteredEntries.length === 0 ? (
          <p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
            No calendar entries for selected date.
          </p>
        ) : null}

        {filteredEntries.map((entry) => (
          <article key={entry.id} className="card-elevated rounded-xl p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-foreground">{entry.registrationNumber}</p>
                <p className="text-sm text-muted-foreground">
                  {entry.requesterName} | {entry.purpose}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(entry.startDate).toLocaleString('en-IN')} -{' '}
                  {new Date(entry.endDate).toLocaleString('en-IN')}
                </p>
              </div>
              <Badge variant="outline">{entry.status}</Badge>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
