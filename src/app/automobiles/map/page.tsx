'use client';

import dynamic from 'next/dynamic';

const AutomobileMapDashboard = dynamic(
  () =>
    import('@/components/automobiles/AutomobileMapDashboard').then(
      (mod) => mod.AutomobileMapDashboard
    ),
  {
    ssr: false,
    loading: () => (
      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="h-[75vh] animate-pulse rounded-xl border bg-muted" />
      </section>
    ),
  }
);

export default function AutomobileMapPage() {
  return <AutomobileMapDashboard />;
}
