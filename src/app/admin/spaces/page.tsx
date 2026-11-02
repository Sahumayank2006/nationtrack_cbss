'use client';

import { useQuery } from '@tanstack/react-query';
import type { LucideIcon } from 'lucide-react';
import { Activity, Bell, Building2, CalendarCheck2, Clock3, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { useAdminContext } from '@/app/admin/AdminContext';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { AdminSummary } from '@/types/admin';

type DashboardCard = {
  label: string;
  value: number;
  description: string;
  icon: LucideIcon;
};

const fetchJson = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return (await response.json()) as T;
};

export default function SpacesAdminDashboardPage() {
  const router = useRouter();
  const { activeSubType } = useAdminContext();

  const summaryQuery = useQuery({
    queryKey: ['admin', 'spaces', 'summary', activeSubType],
    queryFn: async () => {
      const json = await fetchJson<{ success: boolean; data: AdminSummary }>(
        `/api/spaces/admin-summary?type=${encodeURIComponent(activeSubType)}`
      );
      return json.data;
    },
    refetchInterval: 30_000,
  });

  const cards: DashboardCard[] = [
    {
      label: 'Total Spaces',
      value: summaryQuery.data?.total ?? 0,
      description: 'All tracked government spaces',
      icon: Building2,
    },
    {
      label: 'Available',
      value: summaryQuery.data?.byStatus.AVAILABLE ?? 0,
      description: 'Ready for booking now',
      icon: CalendarCheck2,
    },
    {
      label: 'Booked',
      value: summaryQuery.data?.byStatus.BOOKED ?? 0,
      description: 'Currently reserved spaces',
      icon: Activity,
    },
    {
      label: 'Idle Spaces',
      value: summaryQuery.data?.idleCount ?? 0,
      description: 'Need utilization attention',
      icon: Clock3,
    },
    {
      label: 'Pending Approvals',
      value: summaryQuery.data?.pendingApprovals ?? 0,
      description: 'Booking requests awaiting action',
      icon: Bell,
    },
  ];

  const loading = summaryQuery.isLoading;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-[30px]">
            Office Spaces Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Bookings, utilization, and facilities command activity.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="institutional" size="sm" className="gap-2">
            <Plus className="h-4 w-4" aria-hidden />
            Add Card
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' });
              router.push('/admin');
            }}
          >
            Sign out
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      ) : (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {cards.map((card) => (
            <article key={card.label} className="card-elevated rounded-xl px-4 py-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-muted">
                  <card.icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="text-xs font-semibold">{card.label}</span>
              </div>
              <p className="mt-2 text-3xl font-bold text-foreground">{card.value}</p>
              <p className="text-xs text-muted-foreground">{card.description}</p>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
