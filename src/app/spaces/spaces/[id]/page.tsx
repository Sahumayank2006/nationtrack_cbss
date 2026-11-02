'use client';

import {
  ArrowLeft,
  Building2,
  CalendarClock,
  ClipboardList,
  ExternalLink,
  Layers3,
  MapPinned,
  Phone,
  PlusCircle,
  RefreshCcw,
  ShieldCheck,
  Star,
  Users,
  Wrench,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { use, useEffect, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Booking, MaintenanceTicket, Space, SpaceEvent } from '@/types/spaces';

interface Props {
  params: Promise<{ id: string }>;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export default function SpacePassportPage({ params }: Props) {
  const { id } = use(params);
  const [space, setSpace] = useState<Space | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceTicket[]>([]);
  const [events, setEvents] = useState<SpaceEvent[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [spaceRes, bookingsRes, maintenanceRes, eventsRes] = await Promise.all([
          fetch(`/api/spaces/${id}`, { cache: 'no-store' }),
          fetch(`/api/spaces/${id}/bookings`, { cache: 'no-store' }),
          fetch(`/api/spaces/${id}/maintenance`, { cache: 'no-store' }),
          fetch(`/api/spaces/${id}/events`, { cache: 'no-store' }),
        ]);

        const spacePayload = (await spaceRes.json()) as ApiResponse<Space>;
        const bookingsPayload = (await bookingsRes.json()) as ApiResponse<Booking[]>;
        const maintenancePayload = (await maintenanceRes.json()) as ApiResponse<
          MaintenanceTicket[]
        >;
        const eventsPayload = (await eventsRes.json()) as ApiResponse<SpaceEvent[]>;

        if (!spacePayload.success) {
          setError('Space passport not found.');
          return;
        }

        setSpace(spacePayload.data);
        setBookings(bookingsPayload.success ? bookingsPayload.data : []);
        setMaintenance(maintenancePayload.success ? maintenancePayload.data : []);
        setEvents(eventsPayload.success ? eventsPayload.data : []);
      } catch {
        setError('Unable to load space passport.');
      }
    };

    load();
  }, [id]);

  const averageRating = useMemo(() => {
    const rated = bookings.filter((booking) => typeof booking.postUsageRating === 'number');
    if (rated.length === 0) return 0;
    const total = rated.reduce((sum, booking) => sum + (booking.postUsageRating ?? 0), 0);
    return total / rated.length;
  }, [bookings]);

  const dayLabels = useMemo(() => {
    const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return space?.availableDays.map((day) => labels[day]).join(', ') ?? 'N/A';
  }, [space]);

  const typeLabel = useMemo(() => {
    if (!space) return '';
    return space.spaceType
      .toLowerCase()
      .split('_')
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' ');
  }, [space]);

  if (error) {
    return (
      <main className="container-wide py-10">
        <p className="text-sm text-destructive">{error}</p>
        <Link href="/spaces/spaces" className="mt-4 inline-block">
          <Button variant="outline">Back to spaces</Button>
        </Link>
      </main>
    );
  }

  if (!space) {
    return (
      <main className="container-wide py-10">
        <p className="text-sm text-muted-foreground">Loading space passport...</p>
      </main>
    );
  }

  return (
    <main id="maincontent" className="container-wide space-y-10 py-8">
      <Link
        href="/spaces/spaces"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to spaces
      </Link>

      <section className="card-elevated rounded-2xl p-6 md:p-8">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
          <div className="space-y-7 lg:col-span-8">
            <header className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {space.assetId}
              </p>
              <h1 className="text-3xl font-bold text-foreground md:text-4xl">{space.name}</h1>
              <p className="max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg">
                {space.department} space in {space.district}. This {typeLabel.toLowerCase()}{' '}
                supports day-to-day operations with managed access and traceable booking workflows.
              </p>
            </header>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <div className="flex min-h-24 flex-col justify-between rounded-xl border border-border/70 bg-background/80 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Category</p>
                <p className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Layers3 className="h-4 w-4 text-primary" /> {typeLabel}
                </p>
              </div>
              <div className="flex min-h-24 flex-col justify-between rounded-xl border border-border/70 bg-background/80 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">District</p>
                <p className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                  <MapPinned className="h-4 w-4 text-primary" /> {space.district}
                </p>
              </div>
              <div className="flex min-h-24 flex-col justify-between rounded-xl border border-border/70 bg-background/80 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Department</p>
                <p className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Building2 className="h-4 w-4 text-primary" /> {space.department}
                </p>
              </div>
              <div className="flex min-h-24 flex-col justify-between rounded-xl border border-border/70 bg-background/80 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Capacity</p>
                <p className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Users className="h-4 w-4 text-primary" /> {space.capacity} people
                </p>
              </div>
              <div className="flex min-h-24 flex-col justify-between rounded-xl border border-border/70 bg-background/80 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Status</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{space.status}</p>
              </div>
              <div className="flex min-h-24 flex-col justify-between rounded-xl border border-border/70 bg-background/80 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Area</p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {space.areaSqFt.toLocaleString('en-IN')} sq ft
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <Link
                href={`/submit?mode=booking&spaceId=${space.id}&spaceName=${encodeURIComponent(space.name)}`}
                className="w-full"
              >
                <Button className="w-full gap-2">
                  <CalendarClock className="h-4 w-4" /> Visit Application
                </Button>
              </Link>
              <Link
                href={`/submit?mode=update&spaceId=${space.id}&spaceName=${encodeURIComponent(space.name)}`}
                className="w-full"
              >
                <Button variant="outline" className="w-full gap-2">
                  <RefreshCcw className="h-4 w-4" /> Request Update
                </Button>
              </Link>
              <Link href="/spaces/map" className="w-full sm:col-span-2 xl:col-span-1">
                <Button variant="outline" className="w-full gap-2">
                  <ExternalLink className="h-4 w-4" /> View on Map
                </Button>
              </Link>
            </div>
          </div>

          <aside className="space-y-5 lg:col-span-4">
            <div className="relative aspect-video overflow-hidden rounded-2xl border border-border/70 bg-muted">
              <Image
                src={space.photos[0] || '/NationTrack-placeholder.jpg'}
                alt={`${space.name} preview`}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 36vw"
              />
            </div>

            <div className="rounded-xl border border-border/70 bg-background/90 p-5 text-center">
              <img
                src={space.qrCode}
                alt={`QR code for ${space.assetId}`}
                className="mx-auto h-28 w-28"
              />
              <p className="mt-2 text-xs text-muted-foreground">Door QR</p>
            </div>
          </aside>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-12">
        <article className="card-elevated rounded-2xl p-6 lg:col-span-8">
          <h2 className="text-xl font-semibold text-foreground">About This Space</h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground md:text-[15px]">
            Located at {space.address}, this facility is managed by {space.contactOfficer}. It is
            available between {space.availableFrom} and {space.availableTo} on {dayLabels}. Booking
            duration is configured from {space.minBookingHours} to {space.maxBookingHours} hours.
          </p>

          <div className="mt-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">
              Amenities
            </h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {space.amenities.map((amenity) => (
                <Badge key={amenity} variant="secondary">
                  {amenity}
                </Badge>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">
              Accessibility Features
            </h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {space.accessibilityFeatures.length > 0 ? (
                space.accessibilityFeatures.map((feature) => (
                  <Badge key={feature} variant="outline">
                    {feature}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No accessibility features listed.</p>
              )}
            </div>
          </div>
        </article>

        <article className="card-elevated rounded-2xl p-6 lg:col-span-4">
          <h2 className="text-xl font-semibold text-foreground">Operations Snapshot</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="rounded-lg border border-border/70 bg-background p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Current Rating
              </p>
              <p className="mt-1 text-lg font-semibold text-foreground">
                {space.avgRating.toFixed(1)} / 5
              </p>
            </div>
            <div className="rounded-lg border border-border/70 bg-background p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Total Bookings
              </p>
              <p className="mt-1 text-lg font-semibold text-foreground">
                {space.totalBookingsCount}
              </p>
            </div>
            <div className="rounded-lg border border-border/70 bg-background p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Maintenance</p>
              <p className="mt-1 text-lg font-semibold text-foreground">
                {space.maintenanceOpenCount} open
              </p>
            </div>
            <div className="rounded-lg border border-border/70 bg-background p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Contact Officer
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground">{space.contactOfficer}</p>
              <p className="mt-1 inline-flex items-center gap-2 text-xs text-muted-foreground">
                <Phone className="h-3.5 w-3.5" /> {space.contactPhone}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <Link href="/submit?mode=create">
              <Button variant="outline" className="w-full gap-2">
                <PlusCircle className="h-4 w-4" /> Propose New Space
              </Button>
            </Link>
          </div>
        </article>
      </section>

      <section className="card-elevated rounded-2xl p-6">
        <h2 className="inline-flex items-center gap-2 text-xl font-semibold text-foreground">
          <ClipboardList className="h-5 w-5" /> Booking History
        </h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="border-b text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="pb-2">Booking ID</th>
                <th className="pb-2">Booked By</th>
                <th className="pb-2">Purpose</th>
                <th className="pb-2">Date and Time</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Rating</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id} className="border-b last:border-0">
                  <td className="py-2">{booking.bookingId}</td>
                  <td className="py-2">{booking.bookedByName}</td>
                  <td className="py-2">{booking.purpose}</td>
                  <td className="py-2">
                    {new Date(booking.startDateTime).toLocaleString('en-IN')}
                  </td>
                  <td className="py-2">
                    <Badge variant="outline">{booking.status}</Badge>
                  </td>
                  <td className="py-2">{booking.postUsageRating ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="card-elevated h-full rounded-2xl p-6">
          <h2 className="inline-flex items-center gap-2 text-xl font-semibold text-foreground">
            <Wrench className="h-5 w-5" /> Maintenance Tickets
          </h2>
          {maintenance.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No maintenance tickets recorded.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {maintenance.map((ticket) => (
                <li key={ticket.id} className="rounded-lg border border-border/70 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-foreground">{ticket.description}</p>
                    <Badge variant="outline">{ticket.status}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Severity: {ticket.severity} | Created{' '}
                    {new Date(ticket.createdAt).toLocaleString('en-IN')}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="card-elevated h-full rounded-2xl p-6">
          <h2 className="inline-flex items-center gap-2 text-xl font-semibold text-foreground">
            <Star className="h-5 w-5" /> Reviews and Audit
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Average rating: {averageRating.toFixed(1)} / 5 (
            {bookings.filter((item) => item.postUsageRating).length} reviews)
          </p>

          <ul className="mt-3 space-y-3">
            {bookings
              .filter((booking) => booking.postUsageRating)
              .slice(0, 4)
              .map((booking) => (
                <li key={booking.id} className="rounded-lg border border-border/70 p-3">
                  <p className="font-medium text-foreground">{booking.bookedByName}</p>
                  <p className="text-xs text-muted-foreground">
                    Rating: {booking.postUsageRating} |{' '}
                    {booking.postUsageFeedback ?? 'No text feedback'}
                  </p>
                </li>
              ))}
          </ul>

          <div className="mt-4 border-t border-border/70 pt-3">
            <h3 className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-foreground">
              <ShieldCheck className="h-4 w-4" /> Recent Audit Events
            </h3>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
              {events.slice(0, 5).map((event) => (
                <li key={event.id} className="rounded-md border border-border/70 p-2">
                  <p className="font-medium text-foreground">{event.eventType}</p>
                  <p>
                    {new Date(event.timestamp).toLocaleString('en-IN')} | {event.actorName}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </article>
      </section>
    </main>
  );
}
