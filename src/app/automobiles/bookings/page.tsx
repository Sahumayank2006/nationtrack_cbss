'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { VehicleBookingRequest } from '@/types/admin-automobiles';

interface BookingResponse {
  success: boolean;
  data: VehicleBookingRequest[];
}

export default function AutomobileMyBookingsPage() {
  const [bookings, setBookings] = useState<VehicleBookingRequest[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadBookings = async () => {
    setLoading(true);
    const response = await fetch('/api/automobiles/bookings?status=ALL', { cache: 'no-store' });
    const payload = (await response.json()) as BookingResponse;
    if (payload.success) {
      setBookings(payload.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    void loadBookings();
  }, []);

  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase();
    if (!text) return bookings;

    return bookings.filter((booking) => {
      return (
        booking.id.toLowerCase().includes(text) ||
        booking.requesterName.toLowerCase().includes(text) ||
        booking.requesterDepartment.toLowerCase().includes(text)
      );
    });
  }, [bookings, query]);

  const markReturned = async (bookingId: string) => {
    setActionMessage('Updating booking...');

    const response = await fetch(`/api/automobiles/bookings/${bookingId}/return`, {
      method: 'PATCH',
    });

    if (response.ok) {
      setActionMessage('Vehicle return marked successfully.');
      await loadBookings();
      return;
    }

    setActionMessage('Unable to update booking status.');
  };

  return (
    <main id="maincontent" className="container-wide space-y-5 py-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">My Vehicle Bookings</h1>
        <p className="text-sm text-muted-foreground">
          Track booking lifecycle, approved slot windows, and submit return updates.
        </p>
      </header>

      <section className="flex flex-wrap items-center gap-2">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search request id, requester, or department"
          className="max-w-md"
        />
        <Link href="/automobiles/request">
          <Button>New Booking</Button>
        </Link>
      </section>

      {actionMessage ? (
        <p className="text-sm font-medium text-accent-foreground" role="status" aria-live="polite">
          {actionMessage}
        </p>
      ) : null}

      <section className="space-y-3">
        {loading ? <p className="text-sm text-muted-foreground">Loading bookings...</p> : null}

        {!loading && filtered.length === 0 ? (
          <p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
            No bookings found.
          </p>
        ) : null}

        {filtered.map((booking) => (
          <article key={booking.id} className="card-elevated rounded-xl p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-base font-semibold text-foreground">{booking.id}</p>
                <p className="text-sm text-muted-foreground">
                  {booking.requesterName} | {booking.requesterDepartment}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(booking.startDate).toLocaleString('en-IN')} -{' '}
                  {new Date(booking.endDate).toLocaleString('en-IN')}
                </p>
              </div>
              <Badge variant="outline">{booking.status}</Badge>
            </div>

            {(booking.status === 'APPROVED' || booking.status === 'ACTIVE') && (
              <div className="mt-3">
                <Button size="sm" onClick={() => markReturned(booking.id)}>
                  Mark as Returned
                </Button>
              </div>
            )}
          </article>
        ))}
      </section>
    </main>
  );
}
