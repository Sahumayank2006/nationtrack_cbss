import Link from 'next/link';

import { useAdminContext } from '@/app/admin/AdminContext';
import { ActivityFeedRow } from '@/components/admin/ActivityFeedRow';
import { ModuleBadge } from '@/components/admin/ModuleBadge';
import type { AdminRecentEvent } from '@/types/admin';

export function ActivityFeed({ events }: { events: AdminRecentEvent[] }) {
  const { activeModule } = useAdminContext();

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
          <ModuleBadge module={activeModule} />
        </div>
        <Link href="/admin/audit" className="text-sm font-medium text-blue-700 hover:text-blue-800">
          View Full Audit
        </Link>
      </div>
      <div className="space-y-2">
        {events.length > 0 ? (
          events.slice(0, 10).map((event) => <ActivityFeedRow key={event.id} event={event} />)
        ) : (
          <p className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
            No recent activity available for this filter.
          </p>
        )}
      </div>
    </section>
  );
}
