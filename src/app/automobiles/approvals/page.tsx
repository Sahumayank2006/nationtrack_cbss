import Link from 'next/link';

import { Button } from '../../../components/ui/button';

export default function AutomobileApprovalsPage() {
  return (
    <main id="maincontent" className="container-wide space-y-6 py-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Automobile Approvals</h1>
        <p className="text-sm text-muted-foreground">
          Review pending fleet actions, critical approvals, and escalation queues.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="card-elevated rounded-xl p-4">
          <h2 className="text-base font-semibold text-foreground">Pending Actions</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Check approvals generated from compliance and idle workflows.
          </p>
          <a href="/api/automobiles/pending-actions?limit=50&type=ALL" className="mt-4 inline-flex">
            <Button size="sm">Open Queue API</Button>
          </a>
        </article>
        <article className="card-elevated rounded-xl p-4">
          <h2 className="text-base font-semibold text-foreground">Idle Escalations</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Vehicles crossing idle thresholds that need reuse decisions.
          </p>
          <Link href="/automobiles/idle" className="mt-4 inline-flex">
            <Button size="sm" variant="outline">
              View Idle Desk
            </Button>
          </Link>
        </article>
        <article className="card-elevated rounded-xl p-4">
          <h2 className="text-base font-semibold text-foreground">Compliance Overview</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Review summary analytics before taking approval actions.
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
