'use client';

import { Bell, CheckCheck } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const seededNotifications = [
  {
    id: 'n-001',
    module: 'Automobile',
    severity: 'CRITICAL',
    title: 'SOS triggered by Ambulance MP07-2045',
    timestamp: '3 mins ago',
    unread: true,
  },
  {
    id: 'n-002',
    module: 'Automobile',
    severity: 'WARNING',
    title: 'Idle threshold crossed for waste truck MP07-8872',
    timestamp: '12 mins ago',
    unread: true,
  },
  {
    id: 'n-003',
    module: 'Automobile',
    severity: 'CRITICAL',
    title: 'Maintenance escalation for patrol unit MP07-9912',
    timestamp: '28 mins ago',
    unread: true,
  },
];

export default function AdminNotificationsPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Fleet Notifications</h1>
            <p className="mt-1 text-sm text-slate-600">
              Alerts, escalations, and approvals for the automobile command desk.
            </p>
          </div>
          <Button variant="outline" className="gap-2">
            <CheckCheck className="h-4 w-4" aria-hidden /> Mark all read
          </Button>
        </div>
      </section>

      <section className="space-y-3">
        {seededNotifications.map((item) => (
          <article
            key={item.id}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 gap-3">
                <span className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100">
                  <Bell className="h-4 w-4 text-slate-700" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-xs text-slate-600">
                    {item.module} · {item.timestamp}
                  </p>
                </div>
              </div>
              <Badge
                className={
                  item.severity === 'CRITICAL'
                    ? 'border-red-400/40 bg-red-500/10 text-red-700 dark:text-red-300'
                    : 'border-amber-400/40 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                }
                variant="outline"
              >
                {item.severity}
              </Badge>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
