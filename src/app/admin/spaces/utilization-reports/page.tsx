'use client';

import { useEffect, useState } from 'react';

import type { SpaceSummaryRow } from '@/types/spaces';

interface ReportPayload {
  success: boolean;
  data: SpaceSummaryRow[];
}

export default function AdminSpacesUtilizationReportsPage() {
  const [rows, setRows] = useState<SpaceSummaryRow[]>([]);

  useEffect(() => {
    const load = async () => {
      const response = await fetch('/api/spaces/reports/space-summary', { cache: 'no-store' });
      const payload = (await response.json()) as ReportPayload;
      if (payload.success) {
        setRows(payload.data);
      }
    };

    void load();
  }, []);

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">Utilization Reports</h1>
        <p className="text-sm text-muted-foreground">
          Type-wise occupancy and idle distribution summary.
        </p>
      </header>

      <section className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="min-w-full text-sm">
          <thead className="bg-muted text-left text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Total</th>
              <th className="px-3 py-2">Available</th>
              <th className="px-3 py-2">Booked</th>
              <th className="px-3 py-2">Idle</th>
              <th className="px-3 py-2">Restricted</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.type} className="border-t border-border text-foreground">
                <th scope="row" className="px-3 py-2 font-medium">
                  {row.type}
                </th>
                <td className="px-3 py-2">{row.total}</td>
                <td className="px-3 py-2">{row.available}</td>
                <td className="px-3 py-2">{row.booked}</td>
                <td className="px-3 py-2">{row.idle}</td>
                <td className="px-3 py-2">{row.restricted}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
