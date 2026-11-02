import { Check, X } from 'lucide-react';

import type { AdminPendingAction } from '@/types/admin';

export function PendingApprovalCard({
  item,
  onApprove,
  onReject,
}: {
  item: AdminPendingAction;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const urgencyClass =
    item.severity === 'CRITICAL'
      ? 'border-l-red-500 bg-red-500/10'
      : item.severity === 'URGENT'
        ? 'border-l-amber-400 bg-amber-500/10'
        : 'border-l-border bg-background';

  return (
    <article className={`rounded-xl border border-l-4 border-border p-4 ${urgencyClass}`}>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {item.severity}
      </p>
      <h3 className="mt-1 text-sm font-semibold text-foreground">{item.title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => onApprove(item.id)}
          className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500"
        >
          <Check className="h-3.5 w-3.5" aria-hidden /> Approve
        </button>
        <button
          type="button"
          onClick={() => onReject(item.id)}
          className="inline-flex items-center gap-1 rounded-md bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-500"
        >
          <X className="h-3.5 w-3.5" aria-hidden /> Reject
        </button>
      </div>
    </article>
  );
}
