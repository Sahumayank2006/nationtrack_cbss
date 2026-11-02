import { Activity, Bell, Car, Clock, Wrench } from 'lucide-react';

import { StatCard } from '@/components/admin/StatCard';

const automobileCards = [
  { label: 'Total Vehicles', icon: Car, colorClass: 'bg-blue-500/15 text-blue-300' },
  { label: 'Active Now', icon: Activity, colorClass: 'bg-emerald-500/15 text-emerald-300' },
  { label: 'Idle Fleet', icon: Clock, colorClass: 'bg-amber-500/15 text-amber-300' },
  { label: 'In Maintenance', icon: Wrench, colorClass: 'bg-red-500/15 text-red-300' },
  { label: 'Pending Approvals', icon: Bell, colorClass: 'bg-violet-500/15 text-violet-300' },
] as const;

export function StatCardGrid({
  summary,
}: {
  summary: {
    total: number;
    byStatus: Record<string, number>;
    pendingApprovals: number;
    idleCount: number;
  } | null;
}) {
  const values = [
    summary?.total ?? 0,
    summary?.byStatus.MOVING ?? 0,
    summary?.idleCount ?? 0,
    summary?.byStatus.BREAKDOWN ?? 0,
    summary?.pendingApprovals ?? 0,
  ];

  return (
    <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      {automobileCards.map((card, index) => (
        <StatCard
          key={card.label}
          label={card.label}
          value={values[index] ?? 0}
          icon={card.icon}
          colorClass={card.colorClass}
        />
      ))}
    </section>
  );
}
