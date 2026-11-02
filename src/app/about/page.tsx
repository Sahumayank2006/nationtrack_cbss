import { ArrowRight, Building2, CarFront, FileLock2, MapPinned, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

export default function AboutPage() {
  return (
    <>
      <section className="section-padding border-b border-border">
        <div className="container-narrow">
          <h1 className="mb-6 text-3xl font-bold text-foreground md:text-4xl">About NationTrack</h1>
          <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
            NationTrack is a public asset intelligence platform designed for district operations. It
            helps teams manage vehicles, civic spaces, bookings, and auditable activity from one
            operational layer.
          </p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-wide">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div>
              <h2 className="mb-4 text-2xl font-bold text-foreground md:text-3xl">Our Mission</h2>
              <p className="mb-4 leading-relaxed text-muted-foreground">
                Improve service delivery by ensuring public assets are visible, schedulable,
                accountable, and measurable in real time.
              </p>
              <p className="leading-relaxed text-muted-foreground">
                NationTrack combines operations dashboards, booking workflows, and audit trails so
                decisions are grounded in trusted records instead of fragmented spreadsheets.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="card-elevated p-6">
                <MapPinned className="mb-3 h-8 w-8 text-primary" />
                <h3 className="mb-1 font-semibold text-foreground">Live Visibility</h3>
                <p className="text-sm text-muted-foreground">Map and status awareness for assets</p>
              </div>
              <div className="card-elevated p-6">
                <CarFront className="mb-3 h-8 w-8 text-primary" />
                <h3 className="mb-1 font-semibold text-foreground">Fleet Control</h3>
                <p className="text-sm text-muted-foreground">Track automobiles and utilization</p>
              </div>
              <div className="card-elevated p-6">
                <Building2 className="mb-3 h-8 w-8 text-primary" />
                <h3 className="mb-1 font-semibold text-foreground">Space Booking</h3>
                <p className="text-sm text-muted-foreground">
                  Approval-aware reservation lifecycle
                </p>
              </div>
              <div className="card-elevated p-6">
                <FileLock2 className="mb-3 h-8 w-8 text-primary" />
                <h3 className="mb-1 font-semibold text-foreground">Audit Integrity</h3>
                <p className="text-sm text-muted-foreground">Action traceability by default</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding border-b border-t border-border bg-muted/30">
        <div className="container-narrow">
          <h2 className="mb-4 text-center text-2xl font-bold text-foreground md:text-3xl">
            Operational Outcomes
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-center leading-relaxed text-muted-foreground">
            NationTrack focuses on operational reliability, transparent workflows, and faster
            response loops for district administration teams.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold text-primary">24/7</div>
              <p className="text-sm text-muted-foreground">Operational awareness</p>
            </div>
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold text-primary">1</div>
              <p className="text-sm text-muted-foreground">Unified asset ledger</p>
            </div>
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold text-primary">100%</div>
              <p className="text-sm text-muted-foreground">Traceable booking decisions</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-narrow text-center">
          <h2 className="mb-4 text-2xl font-bold text-foreground md:text-3xl">Start Operating</h2>
          <p className="mx-auto mb-8 max-w-xl leading-relaxed text-muted-foreground">
            Open NationTrack modules to manage passports, approve bookings, and monitor asset
            compliance from a single workflow.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/admin">
              <Button variant="institutional" size="lg" className="gap-2">
                Open Admin Modules
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/bookings" aria-label="Open booking management">
              <Button
                size="lg"
                className="gap-2 bg-astronaut-600 text-white hover:bg-astronaut-500"
              >
                <ShieldCheck className="h-4 w-4" />
                Manage Bookings
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
