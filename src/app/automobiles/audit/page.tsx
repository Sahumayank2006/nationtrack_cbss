import Link from 'next/link';

import { Button } from '../../../components/ui/button';

export default function AutomobileAuditPage() {
  return (
    <main id="maincontent" className="container-wide space-y-6 py-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Automobile Audit</h1>
        <p className="text-sm text-muted-foreground">
          Compliance-first audit controls for fleet activities, logs, and exported traces.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="card-elevated rounded-xl p-4">
          <h2 className="text-base font-semibold text-foreground">Audit Monitor</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Inspect action trails and operator activity records.
          </p>
          <Link href="/admin/entries" className="mt-4 inline-flex">
            <Button size="sm">Open Monitor</Button>
          </Link>
        </article>
        <article className="card-elevated rounded-xl p-4">
          <h2 className="text-base font-semibold text-foreground">System Audit Board</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Review enterprise-level audit workflows and evidence chain.
          </p>
          <Link href="/audit" className="mt-4 inline-flex">
            <Button size="sm" variant="outline">
              Open Board
            </Button>
          </Link>
        </article>
        <article className="card-elevated rounded-xl p-4">
          <h2 className="text-base font-semibold text-foreground">Reports</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Pair audit outcomes with utilization and compliance analytics.
          </p>
          <Link href="/automobiles/reports" className="mt-4 inline-flex">
            <Button size="sm" variant="outline">
              Open Reports
            </Button>
          </Link>
        </article>
      </section>
    </main>
  );
}
