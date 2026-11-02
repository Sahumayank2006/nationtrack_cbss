'use client';

import Link from 'next/link';
import { useState } from 'react';

import { PendingApprovalCard } from '@/components/admin/PendingApprovalCard';
import type { AdminPendingAction } from '@/types/admin';

export function PendingApprovalsList({ items }: { items: AdminPendingAction[] }) {
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);

  const visibleItems = items.filter((item) => !hiddenIds.includes(item.id)).slice(0, 5);

  const handleDone = (id: string) => {
    setHiddenIds((current) => [...current, id]);
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Pending Actions</h2>
        <Link
          href="/admin/approvals"
          className="text-sm font-medium text-blue-700 hover:text-blue-800"
        >
          View All
        </Link>
      </div>

      <div className="space-y-3">
        {visibleItems.length > 0 ? (
          visibleItems.map((item) => (
            <PendingApprovalCard
              key={item.id}
              item={item}
              onApprove={handleDone}
              onReject={handleDone}
            />
          ))
        ) : (
          <p className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
            No pending records for this module and type.
          </p>
        )}
      </div>
    </section>
  );
}
