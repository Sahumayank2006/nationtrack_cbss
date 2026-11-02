import Link from 'next/link';

import { Button } from '../../../components/ui/button';

export default function SpacesAuditPage() {
  return (
    <main id="maincontent" className="container-wide space-y-6 py-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Spaces Audit</h1>
        <p className="text-sm text-muted-foreground">
          Audit booking lifecycle, idle transitions, and governance traceability for spaces.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="card-elevated rounded-xl p-4">
          <h2 className="text-base font-semibold text-foreground">Bookings Audit</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Review all booking actions and outcomes through the booking desk.
          </p>
          <Link href="/spaces/bookings" className="mt-4 inline-flex">
            <Button size="sm">Open Bookings</Button>
          </Link>
        </article>
        <article className="card-elevated rounded-xl p-4">
          <h2 className="text-base font-semibold text-foreground">Idle Actions</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Inspect idle-space activation and transfer operations.
          </p>
          <Link href="/spaces/idle" className="mt-4 inline-flex">
            <Button size="sm" variant="outline">
              Open Idle Desk
            </Button>
          </Link>
        </article>
        <article className="card-elevated rounded-xl p-4">
          <h2 className="text-base font-semibold text-foreground">Reports</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Correlate audit findings with utilization and demand trends.
          </p>
          <Link href="/spaces/reports" className="mt-4 inline-flex">
            <Button size="sm" variant="outline">
              Open Reports
            </Button>
          </Link>
        </article>
      </section>
    </main>
  );
}
