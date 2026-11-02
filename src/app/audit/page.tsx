'use client';

import { ShieldCheck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/date-utils';
import { nationTrackService } from '@/lib/nationtrack-service';
import type { AuditLog } from '@/types/nationtrack';

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await nationTrackService.getAuditLogs();
        setLogs(data);
      } catch (error) {
        console.error('Failed to load audit logs', error);
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return logs;
    const q = search.toLowerCase();
    return logs.filter(
      (log) =>
        log.assetId.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.performedBy.toLowerCase().includes(q)
    );
  }, [logs, search]);

  return (
    <section className="pb-16 pt-10 md:pb-24">
      <div className="container-wide">
        <div className="mb-8 text-center">
          <h1 className="mb-3 text-3xl font-bold text-foreground md:text-4xl">Audit Ledger</h1>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Immutable action history for asset state changes and workflow verification.
          </p>
        </div>

        <div className="mb-8 flex justify-center">
          <Input
            type="search"
            placeholder="Search by asset ID, action, or actor..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="max-w-md"
            aria-label="Search audit logs"
          />
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <Skeleton key={item} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="space-y-3">
            {filtered.map((log) => (
              <article key={log.id} className="card-elevated rounded-xl p-4">
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">{log.assetId}</h2>
                    <p className="text-sm text-muted-foreground">
                      {log.action} by {log.performedBy} ({log.performedByRole})
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDate(log.timestamp)}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                    <p className="font-semibold text-foreground">Hash</p>
                    <p className="truncate md:max-w-[320px]">{log.hash}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="card-elevated mx-auto max-w-md p-16 text-center">
            <ShieldCheck className="mx-auto h-12 w-12 text-muted-foreground" />
            <h2 className="mt-4 text-lg font-semibold text-foreground">No audit logs found</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Start emitting audit records to the audit_logs collection to populate ledger entries.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
