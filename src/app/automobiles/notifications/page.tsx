import Link from 'next/link';

import { Button } from '../../../components/ui/button';

export default function AutomobileNotificationsPage() {
  return (
    <main id="maincontent" className="container-wide space-y-6 py-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Automobile Notifications</h1>
        <p className="text-sm text-muted-foreground">
          Alerts and recent fleet events for command monitoring and rapid response.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="card-elevated rounded-xl p-4">
          <h2 className="text-base font-semibold text-foreground">Recent Events Feed</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Pull event updates from the automobile event stream endpoint.
          </p>
          <a href="/api/automobiles/events/recent?limit=25&type=ALL" className="mt-4 inline-flex">
            <Button size="sm">View Events API</Button>
          </a>
        </article>
        <article className="card-elevated rounded-xl p-4">
          <h2 className="text-base font-semibold text-foreground">Escalation Queue</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Check incidents requiring immediate operator acknowledgement.
          </p>
          <Link href="/automobiles/approvals" className="mt-4 inline-flex">
            <Button size="sm" variant="outline">
              Open Approvals
            </Button>
          </Link>
        </article>
      </section>
    </main>
  );
}
