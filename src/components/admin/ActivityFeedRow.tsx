import Link from 'next/link';
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Wrench,
  XCircle,
} from 'lucide-react';

import type { AdminRecentEvent } from '@/types/admin';

const iconForEvent = (eventType: string) => {
  if (
    eventType.includes('START') ||
    eventType.includes('CHECKIN') ||
    eventType.includes('RECEIVED')
  ) {
    return { Icon: ArrowUpRight, className: 'text-emerald-300' };
  }
  if (
    eventType.includes('END') ||
    eventType.includes('CHECKOUT') ||
    eventType.includes('DISPATCHED')
  ) {
    return { Icon: ArrowDownLeft, className: 'text-blue-300' };
  }
  if (eventType.includes('REJECTED')) {
    return { Icon: XCircle, className: 'text-red-300' };
  }
  if (eventType.includes('APPROVED') || eventType.includes('COMPLETED')) {
    return { Icon: CheckCircle2, className: 'text-emerald-300' };
  }
  if (eventType.includes('MAINTENANCE')) {
    return { Icon: Wrench, className: 'text-amber-300' };
  }
  return { Icon: AlertTriangle, className: 'text-amber-300' };
};

export function ActivityFeedRow({ event }: { event: AdminRecentEvent }) {
  const { Icon, className } = iconForEvent(event.eventType);
  const timeLabel = new Date(event.timestamp).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="group flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 transition hover:bg-accent/60">
      <div className="flex min-w-0 items-center gap-3">
        <Icon className={`h-4 w-4 shrink-0 ${className}`} aria-hidden />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">
            {event.assetId} - {event.assetName}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {event.eventType} by {event.actorName}
          </p>
        </div>
      </div>
      <div className="ml-3 flex shrink-0 items-center gap-3">
        <span className="text-xs text-muted-foreground">{timeLabel}</span>
        <Link
          href="/admin/audit"
          className="hidden text-xs font-medium text-primary group-hover:inline-flex"
        >
          View Asset
        </Link>
      </div>
    </div>
  );
}
