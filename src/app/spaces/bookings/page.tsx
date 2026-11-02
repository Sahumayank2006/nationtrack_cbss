'use client';

import { collection, query as firestoreQuery, onSnapshot, where } from 'firebase/firestore';
import { Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { db, isFirebaseReady } from '@/lib/firebase';
import type { BookingStatus } from '@/types/spaces';

interface FirebaseBooking {
  id: string;
  bookingId: string;
  spaceId: string;
  spaceName: string;
  bookedByName: string;
  bookedBy: string;
  bookedByPhone?: string;
  bookedByRole?: string;
  purpose: string;
  expectedAttendees: number;
  assetId?: string;
  status: BookingStatus | string;
  startDateTime: string;
  endDateTime: string;
  createdAt?: string;
  approvedBy?: string;
  rejectedReason?: string;
  organizationName?: string;
}

const formatBookingDateTime = (value: string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-IN');
};

const tabStatuses: Record<string, BookingStatus[]> = {
  pending: ['PENDING'],
  approved: ['APPROVED', 'ACTIVE'],
  completed: ['COMPLETED'],
  rejected: ['REJECTED', 'CANCELLED'],
};

export default function SpacesBookingsPage() {
  const [bookings, setBookings] = useState<FirebaseBooking[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [tab, setTab] = useState<keyof typeof tabStatuses>('pending');
  const [loadMessage, setLoadMessage] = useState('');

  useEffect(() => {
    if (!isFirebaseReady) {
      setLoadMessage('Firebase is not configured for live bookings.');
      return;
    }

    let unsubscribe: (() => void) | undefined;

    const attach = async () => {
      const authResponse = await fetch('/api/auth/me', { cache: 'no-store' });
      if (!authResponse.ok) {
        setLoadMessage('Login required to view My Bookings.');
        return;
      }

      const authPayload = (await authResponse.json()) as {
        ok: boolean;
        session?: { uid?: string };
      };

      const uid = authPayload.session?.uid;
      if (!uid) {
        setLoadMessage('Open space session not found.');
        return;
      }

      const bookingsQuery = firestoreQuery(
        collection(db, 'bookings'),
        where('bookedBy', '==', uid)
      );
      unsubscribe = onSnapshot(bookingsQuery, (snapshot) => {
        const next = snapshot.docs
          .map((docSnap) => {
            const data = docSnap.data() as Record<string, unknown>;
            const startRaw = (data.startTime ?? data.startDateTime ?? '') as string;
            const endRaw = (data.endTime ?? data.endDateTime ?? '') as string;

            return {
              id: docSnap.id,
              bookingId: (data.bookingId as string) ?? `BK-${docSnap.id.slice(0, 8).toUpperCase()}`,
              spaceId: (data.spaceId as string) ?? '',
              spaceName: (data.spaceName as string) ?? '-',
              bookedByName: (data.bookedByName as string) ?? '-',
              bookedBy: (data.bookedBy as string) ?? '-',
              bookedByPhone: (data.bookedByPhone as string) ?? undefined,
              bookedByRole: (data.bookedByRole as string) ?? undefined,
              purpose: (data.purpose as string) ?? '-',
              expectedAttendees: Number(data.expectedAttendees ?? 0),
              assetId: (data.assetId as string) ?? undefined,
              status: ((data.status as string) ?? 'PENDING').toUpperCase(),
              startDateTime: startRaw,
              endDateTime: endRaw,
              createdAt:
                typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString(),
              approvedBy: (data.approvedBy as string) ?? undefined,
              rejectedReason: (data.rejectedReason as string) ?? undefined,
              organizationName: (data.organizationName as string) ?? undefined,
            } satisfies FirebaseBooking;
          })
          .sort((a, b) =>
            a.createdAt && b.createdAt ? b.createdAt.localeCompare(a.createdAt) : 0
          );

        setBookings(next);
        setLoadMessage('');
      });
    };

    void attach();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const filtered = useMemo(() => {
    return bookings.filter((booking) => {
      const statusMatch = tabStatuses[tab].includes(booking.status as BookingStatus);
      if (!statusMatch) return false;
      if (!searchQuery.trim()) return true;
      const text = searchQuery.toLowerCase();
      return (
        booking.bookingId.toLowerCase().includes(text) ||
        booking.purpose.toLowerCase().includes(text) ||
        (booking.assetId ?? '').toLowerCase().includes(text)
      );
    });
  }, [bookings, searchQuery, tab]);

  return (
    <main id="maincontent" className="container-wide space-y-5 py-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">My Bookings</h1>
        <p className="text-sm text-muted-foreground">
          Track all bookings made by your open space account with complete status updates.
        </p>
      </header>

      <section className="flex flex-wrap items-center gap-2">
        {(Object.keys(tabStatuses) as Array<keyof typeof tabStatuses>).map((item) => (
          <Button
            key={item}
            variant={item === tab ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab(item)}
          >
            {item[0].toUpperCase() + item.slice(1)}
          </Button>
        ))}
      </section>

      <section>
        <label className="relative block max-w-lg">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search booking ID, purpose, or asset ID"
            className="pl-9"
          />
        </label>
      </section>

      <section className="space-y-3">
        {filtered.map((booking) => (
          <article key={booking.id} className="card-elevated rounded-xl p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="font-semibold text-foreground">{booking.bookingId}</p>
                <p className="text-sm text-muted-foreground">
                  Space: {booking.spaceName} ({booking.spaceId || 'NA'})
                </p>
                <p className="text-sm text-muted-foreground">
                  Requester: {booking.bookedByName} ({booking.bookedBy})
                </p>
                <p className="text-sm text-muted-foreground">Purpose: {booking.purpose}</p>
                <p className="text-sm text-muted-foreground">
                  Attendees: {booking.expectedAttendees}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatBookingDateTime(booking.startDateTime)} -{' '}
                  {formatBookingDateTime(booking.endDateTime)}
                </p>
              </div>
              <Badge variant="outline">{booking.status}</Badge>
            </div>

            <div className="mt-3 grid gap-2 text-xs text-muted-foreground md:grid-cols-2">
              <p>Approved By: {booking.approvedBy ?? '-'}</p>
              <p>Rejected Reason: {booking.rejectedReason ?? '-'}</p>
              <p>Created: {booking.createdAt ? formatBookingDateTime(booking.createdAt) : '-'}</p>
              <p>Organization: {booking.organizationName ?? '-'}</p>
              <p>Requester Phone: {booking.bookedByPhone ?? '-'}</p>
              <p>Requester Role: {booking.bookedByRole ?? '-'}</p>
            </div>
          </article>
        ))}

        {filtered.length === 0 && (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            {loadMessage || 'No bookings found in this tab.'}
          </p>
        )}
      </section>
    </main>
  );
}
