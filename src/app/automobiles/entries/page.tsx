import Link from 'next/link';

import { Button } from '../../../components/ui/button';

export default function AutomobileEntriesPage() {
  return (
    <main id="maincontent" className="container-wide space-y-6 py-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Automobile Entries</h1>
        <p className="text-sm text-muted-foreground">
          Operational entry points for fleet monitoring, map actions, and asset logs.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="card-elevated rounded-xl p-4">
          <h2 className="text-sm font-semibold text-foreground">Live Dashboard</h2>
          <p className="mt-1 text-xs text-muted-foreground">Map-first automobile operations.</p>
          <Link href="/automobiles" className="mt-3 inline-flex">
            <Button size="sm">Open</Button>
          </Link>
        </article>
        <article className="card-elevated rounded-xl p-4">
          <h2 className="text-sm font-semibold text-foreground">Vehicle Registry</h2>
          <p className="mt-1 text-xs text-muted-foreground">Search and inspect vehicle records.</p>
          <Link href="/automobiles/vehicles" className="mt-3 inline-flex">
            <Button size="sm" variant="outline">
              Open
            </Button>
          </Link>
        </article>
        <article className="card-elevated rounded-xl p-4">
          <h2 className="text-sm font-semibold text-foreground">Idle Reuse Desk</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Review idle actions and reuse suggestions.
          </p>
          <Link href="/automobiles/idle" className="mt-3 inline-flex">
            <Button size="sm" variant="outline">
              Open
            </Button>
          </Link>
        </article>
        <article className="card-elevated rounded-xl p-4">
          <h2 className="text-sm font-semibold text-foreground">Reports</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Export analytics and utilization trends.
          </p>
          <Link href="/automobiles/reports" className="mt-3 inline-flex">
            <Button size="sm" variant="outline">
              Open
            </Button>
          </Link>
        </article>
      </section>
    </main>
  );
}
