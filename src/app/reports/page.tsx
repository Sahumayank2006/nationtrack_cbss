'use client';

import { Activity, AlertTriangle, Car, ClipboardList, Wrench } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { nationTrackService } from '@/lib/nationtrack-service';
import type { DashboardMetrics } from '@/types/nationtrack';

export default function ReportsPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await nationTrackService.getDashboardMetrics();
        setMetrics(data);
      } catch (error) {
        console.error('Failed to load reports metrics', error);
        setMetrics(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const cards = [
    {
      title: 'Total Assets',
      value: metrics?.totalAssets ?? 0,
      icon: ClipboardList,
      tone: 'text-azure-700',
    },
    {
      title: 'Active Assets',
      value: metrics?.activeAssets ?? 0,
      icon: Car,
      tone: 'text-green-700',
    },
    {
      title: 'Idle Assets',
      value: metrics?.idleAssets ?? 0,
      icon: AlertTriangle,
      tone: 'text-amber-700',
    },
    {
      title: 'Maintenance',
      value: metrics?.maintenanceAssets ?? 0,
      icon: Wrench,
      tone: 'text-red-700',
    },
    {
      title: 'Active Bookings',
      value: metrics?.activeBookings ?? 0,
      icon: Activity,
      tone: 'text-indigo-700',
    },
  ];

  return (
    <section className="pb-16 pt-10 md:pb-24">
      <div className="container-wide">
        <div className="mb-8 text-center">
          <h1 className="mb-3 text-3xl font-bold text-foreground md:text-4xl">
            Reports & Insights
          </h1>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Operational intelligence snapshots for utilization, idle asset exposure, and booking
            throughput.
          </p>
        </div>

        {loading ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <Skeleton key={item} className="h-36 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => (
              <article key={card.title} className="card-elevated rounded-xl p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                  <card.icon className={`h-5 w-5 ${card.tone}`} />
                </div>
                <p className={`mt-4 text-3xl font-bold ${card.tone}`}>{card.value}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
