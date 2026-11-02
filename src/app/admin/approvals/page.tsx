'use client';

import { CheckCircle2, Clock3, Search, XCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import type { AdminPendingAction } from '@/types/admin';

export default function AdminApprovalsPage() {
  const searchParams = useSearchParams();
  const activeModule = searchParams.get('module') === 'spaces' ? 'spaces' : 'automobile';
  const [actions, setActions] = useState<AdminPendingAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const endpoint =
          activeModule === 'spaces'
            ? '/api/spaces/pending-actions?limit=200&type=ALL'
            : '/api/automobiles/pending-actions?limit=200&type=ALL';

        const response = await fetch(endpoint, { cache: 'no-store' });
        const payload = (await response.json()) as {
          success: boolean;
          data?: AdminPendingAction[];
        };

        if (!response.ok || !payload.success || !payload.data) {
          throw new Error('Unable to fetch pending actions');
        }

        setActions(payload.data);
      } catch (error) {
        console.error('Failed to load approval queue', error);
        setActions([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [activeModule]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return actions.filter((action) => {
      const textMatch =
        !q ||
        action.title.toLowerCase().includes(q) ||
        action.description.toLowerCase().includes(q) ||
        action.assetName?.toLowerCase().includes(q) ||
        action.assetId?.toLowerCase().includes(q);

      return textMatch;
    });
  }, [actions, query]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-foreground">Approval Desk</h1>
        <p className="mt-2 text-muted-foreground">
          {activeModule === 'spaces'
            ? 'Focused queue for space booking approvals and occupancy escalations.'
            : 'Focused queue for automobile incidents, escalation requests, and compliance approvals.'}
        </p>
      </header>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by title, asset, id, or incident details"
          aria-label="Search approval queue"
          className="pl-9"
        />
      </div>

      <section className="space-y-3">
        {loading ? (
          [1, 2, 3].map((item) => <Skeleton key={item} className="h-24 w-full rounded-xl" />)
        ) : filtered.length > 0 ? (
          filtered.map((action) => {
            const statusIcon =
              action.severity === 'CRITICAL' || action.severity === 'URGENT' ? (
                <XCircle className="h-4 w-4 text-red-600" />
              ) : action.severity === 'WARNING' ? (
                <Clock3 className="h-4 w-4 text-amber-600" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              );

            return (
              <article key={action.id} className="card-elevated rounded-xl p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{action.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {(action.assetName ?? 'Unassigned Asset').trim()} ·{' '}
                      {action.assetId ?? 'No ID'}
                    </p>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold text-foreground">
                    {statusIcon}
                    {action.severity}
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <div className="card-elevated rounded-xl p-10 text-center text-sm text-muted-foreground">
            No approval records match your search.
          </div>
        )}
      </section>
    </div>
  );
}
