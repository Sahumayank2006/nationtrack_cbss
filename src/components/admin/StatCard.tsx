import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

export function StatCard({
  label,
  value,
  icon: Icon,
  colorClass,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  colorClass: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-4 flex items-center justify-between">
        <div className={cn('rounded-lg p-2', colorClass)}>
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        <span className="text-xs font-medium text-slate-500">Fleet</span>
      </div>
      <p className="text-3xl font-black text-slate-900 md:text-4xl">
        {value.toLocaleString('en-IN')}
      </p>
      <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
    </article>
  );
}
