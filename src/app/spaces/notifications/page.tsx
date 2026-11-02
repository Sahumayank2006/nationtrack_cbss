import Link from 'next/link';

import { Button } from '../../../components/ui/button';

export default function SpacesNotificationsPage() {
  return (
    <main id="maincontent" className="container-wide space-y-6 py-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Spaces Notifications</h1>
        <p className="text-sm text-muted-foreground">
          Booking alerts, occupancy events, and space operation notifications.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="card-elevated rounded-xl p-4">
          <h2 className="text-base font-semibold text-foreground">Recent Space Events</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Retrieve latest events for maintenance, bookings, and utilization changes.
          </p>
          <a href="/api/spaces/events/recent?limit=25&type=ALL" className="mt-4 inline-flex">
            <Button size="sm">View Events API</Button>
          </a>
        </article>
        <article className="card-elevated rounded-xl p-4">
          <h2 className="text-base font-semibold text-foreground">Booking Decisions</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Move directly to approvals and status actions for pending bookings.
          </p>
          <Link href="/spaces/bookings" className="mt-4 inline-flex">
            <Button size="sm" variant="outline">
              Open Bookings
            </Button>
          </Link>
        </article>
      </section>
    </main>
  );
}
