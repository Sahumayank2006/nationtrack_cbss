'use client';

import { Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { nationTrackService } from '@/lib/nationtrack-service';
import type { AuditLog } from '@/types/nationtrack';

export default function ApprovalEntriesPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await nationTrackService.getAuditLogs(200);
        setLogs(data);
      } catch (error) {
        console.error('Failed to load audit monitor entries', error);
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return logs;
    return logs.filter(
      (entry) =>
        entry.assetId.toLowerCase().includes(q) ||
        entry.action.toLowerCase().includes(q) ||
        entry.performedBy.toLowerCase().includes(q)
    );
  }, [logs, search]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-foreground">Audit Monitor</h1>
        <p className="mt-2 text-muted-foreground">
          Dedicated compliance ledger for action traceability and incident review.
        </p>
      </header>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by asset, action, or actor"
          aria-label="Search audit entries"
          className="pl-9"
        />
      </div>

      <section className="space-y-2">
        {loading ? (
          [1, 2, 3].map((item) => <Skeleton key={item} className="h-20 w-full rounded-xl" />)
        ) : filtered.length > 0 ? (
          filtered.map((entry) => (
            <article key={entry.id} className="card-elevated rounded-xl p-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold text-foreground">{entry.assetId}</p>
                  <p className="text-sm text-muted-foreground">
                    {entry.action} by {entry.performedBy} ({entry.performedByRole})
                  </p>
                </div>
                <p className="max-w-sm truncate rounded-md border bg-muted/50 px-2 py-1 text-xs text-muted-foreground">
                  {entry.hash}
                </p>
              </div>
            </article>
          ))
        ) : (
          <div className="card-elevated rounded-xl p-10 text-center text-sm text-muted-foreground">
            No audit records found for this query.
          </div>
        )}
      </section>
    </div>
  );
}
