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
      <div className="flex h-full items-center justify-center">
        <div className="animate-pulse text-lg">Loading map...</div>
      </div>
    ),
  }
);

export default function AutomobilesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
