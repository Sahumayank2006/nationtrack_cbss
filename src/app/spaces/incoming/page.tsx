'use client';

import {
  collection,
  doc,
  query as firestoreQuery,
  onSnapshot,
  updateDoc,
  where,
} from 'firebase/firestore';
import { Check, Search, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { db, isFirebaseReady } from '@/lib/firebase';

import type { BookingStatus } from '@/types/spaces';

interface IncomingBooking {
  id: string;
  bookingId: string;
  spaceName: string;
  bookedByName: string;
  bookedBy: string;
  organizationName?: string;
  purpose: string;
  expectedAttendees: number;
  status: BookingStatus | string;
  startDateTime: string;
  endDateTime: string;
  approvedBy?: string;
  rejectedReason?: string;
}

const formatBookingDateTime = (value: string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-IN');
};

export default function SpacesIncomingRequestsPage() {
  const [bookings, setBookings] = useState<IncomingBooking[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
  const [sessionSpaceName, setSessionSpaceName] = useState('');
  const [loadMessage, setLoadMessage] = useState('');

  useEffect(() => {
    if (!isFirebaseReady) {
      setLoadMessage('Firebase is not configured for live incoming requests.');
      return;
    }

    let unsubscribe: (() => void) | undefined;

    const attach = async () => {
      const authResponse = await fetch('/api/auth/me', { cache: 'no-store' });
      if (!authResponse.ok) {
        setLoadMessage('Login required to view incoming bookings.');
        return;
      }

      const authPayload = (await authResponse.json()) as {
        ok: boolean;
        session?: { openSpaceName?: string };
      };

      const openSpaceName = authPayload.session?.openSpaceName?.trim() ?? '';
      if (!openSpaceName) {
        setLoadMessage('Open space name missing in session.');
        return;
      }

      setSessionSpaceName(openSpaceName);
      const incomingQuery = firestoreQuery(
        collection(db, 'bookings'),
        where('spaceName', '==', openSpaceName)
      );

      unsubscribe = onSnapshot(incomingQuery, (snapshot) => {
        const next = snapshot.docs
          .map((docSnap) => {
            const data = docSnap.data() as Record<string, unknown>;
            const startRaw = (data.startTime ?? data.startDateTime ?? '') as string;
            const endRaw = (data.endTime ?? data.endDateTime ?? '') as string;

            return {
              id: docSnap.id,
              bookingId: (data.bookingId as string) ?? `BK-${docSnap.id.slice(0, 8).toUpperCase()}`,
              spaceName: (data.spaceName as string) ?? openSpaceName,
              bookedByName: (data.bookedByName as string) ?? '-',
              bookedBy: (data.bookedBy as string) ?? '-',
              organizationName: (data.organizationName as string) ?? undefined,
              purpose: (data.purpose as string) ?? '-',
              expectedAttendees: Number(data.expectedAttendees ?? 0),
              status: ((data.status as string) ?? 'PENDING').toUpperCase(),
              startDateTime: startRaw,
              endDateTime: endRaw,
              approvedBy: (data.approvedBy as string) ?? undefined,
              rejectedReason: (data.rejectedReason as string) ?? undefined,
            } satisfies IncomingBooking;
          })
          .sort((a, b) => a.bookingId.localeCompare(b.bookingId));

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
    if (!searchQuery.trim()) return bookings;
    const text = searchQuery.toLowerCase();
    return bookings.filter(
      (booking) =>
        booking.bookingId.toLowerCase().includes(text) ||
        booking.bookedByName.toLowerCase().includes(text) ||
        booking.purpose.toLowerCase().includes(text)
    );
  }, [bookings, searchQuery]);

  const approve = async (bookingId: string) => {
    await updateDoc(doc(db, 'bookings', bookingId), {
      status: 'APPROVED',
      approvedBy: sessionSpaceName || 'Space Administrator',
      approvedAt: new Date().toISOString(),
      rejectedReason: null,
    });
  };

  const reject = async (bookingId: string) => {
    const reason = rejectReason[bookingId] ?? '';
    if (!reason.trim()) return;

    await updateDoc(doc(db, 'bookings', bookingId), {
      status: 'REJECTED',
      rejectedReason: reason,
      approvedBy: null,
      rejectedAt: new Date().toISOString(),
    });
  };

  return (
    <main id="maincontent" className="container-wide space-y-5 py-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Booked Requests</h1>
        <p className="text-sm text-muted-foreground">
          View all requests booked on your space and approve or reject pending requests.
        </p>
      </header>

      <section>
        <label className="relative block max-w-lg">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search booking ID, requester, purpose"
            className="pl-9"
          />
        </label>
      </section>

      <section className="space-y-3">
        {filtered.map((booking) => (
          <article key={booking.id} className="card-elevated rounded-xl p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-foreground">{booking.bookingId}</p>
                <p className="text-sm text-muted-foreground">Space: {booking.spaceName}</p>
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

            {booking.status === 'PENDING' ? (
              <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto_auto]">
                <Input
                  value={rejectReason[booking.id] ?? ''}
                  onChange={(event) =>
                    setRejectReason((prev) => ({
                      ...prev,
                      [booking.id]: event.target.value,
                    }))
                  }
                  placeholder="Rejection reason"
                />
                <Button size="sm" className="gap-2" onClick={() => approve(booking.id)}>
                  <Check className="h-4 w-4" /> Approve
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="gap-2"
                  onClick={() => reject(booking.id)}
                >
                  <X className="h-4 w-4" /> Reject
                </Button>
              </div>
            ) : (
              <div className="mt-3 grid gap-1 text-xs text-muted-foreground md:grid-cols-2">
                <p>Approved By: {booking.approvedBy ?? '-'}</p>
                <p>Rejected Reason: {booking.rejectedReason ?? '-'}</p>
                <p>Organization: {booking.organizationName ?? '-'}</p>
              </div>
            )}
          </article>
        ))}

        {filtered.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            {loadMessage || 'No incoming booking requests found.'}
          </p>
        ) : null}
      </section>
    </main>
  );
}
