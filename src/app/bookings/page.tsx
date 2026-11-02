'use client';

import { useEffect, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/date-utils';
import { nationTrackService } from '@/lib/nationtrack-service';
import type { Booking } from '@/types/nationtrack';

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await nationTrackService.getBookings();
        setBookings(data);
      } catch (error) {
        console.error('Failed to load bookings', error);
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return bookings;
    const q = search.toLowerCase();
    return bookings.filter(
      (booking) =>
        booking.spaceName.toLowerCase().includes(q) ||
        booking.bookedByName.toLowerCase().includes(q) ||
        booking.status.toLowerCase().includes(q)
    );
  }, [bookings, search]);

  return (
    <section className="pb-16 pt-10 md:pb-24">
      <div className="container-wide">
        <div className="mb-8 text-center">
          <h1 className="mb-3 text-3xl font-bold text-foreground md:text-4xl">
            Booking Management
          </h1>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Track space reservations, approvals, and occupancy transitions across departments.
          </p>
        </div>

        <div className="mb-8 flex justify-center">
          <Input
            type="search"
            placeholder="Search by space, user, or status..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="max-w-md"
            aria-label="Search bookings"
          />
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((index) => (
              <Skeleton key={index} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="space-y-3">
            {filtered.map((booking) => (
              <article key={booking.id} className="card-elevated rounded-xl p-4">
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">{booking.spaceName}</h2>
                    <p className="text-sm text-muted-foreground">
                      Booked by {booking.bookedByName} for {booking.expectedAttendees} attendees
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDate(booking.startTime)} to {formatDate(booking.endTime)}
                    </p>
                  </div>
                  <Badge variant="outline" className="w-fit font-semibold">
                    {booking.status}
                  </Badge>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="card-elevated mx-auto max-w-md p-16 text-center">
            <h2 className="text-lg font-semibold text-foreground">No bookings found</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Create bookings in Firestore collection bookings to see live records here.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
