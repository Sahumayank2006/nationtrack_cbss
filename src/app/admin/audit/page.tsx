'use client';

import { ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';

const sampleRows = [
  {
    timestamp: '24 Mar 2026, 10:57',
    assetId: 'NT-GWL-VH-0044',
    module: 'Automobile',
    eventType: 'ROUTE_REASSIGNED',
    actor: 'Raj Kumar',
    role: 'ADMIN',
    hash: '7A11B7FF',
  },
  {
    timestamp: '24 Mar 2026, 10:42',
    assetId: 'NT-GWL-VH-0012',
    module: 'Automobile',
    eventType: 'SOS_TRIGGERED',
    actor: 'Ramesh Kumar',
    role: 'FIELD_OFFICER',
    hash: 'A81C00E2',
  },
];

export default function AdminAuditPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Automobile Audit Trail</h1>
            <p className="mt-1 text-sm text-slate-600">
              Immutable fleet events and integrity checks for compliance and investigations.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">Export CSV</Button>
            <Button className="gap-2" variant="institutional">
              <ShieldCheck className="h-4 w-4" aria-hidden /> Verify All Hashes
            </Button>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-widest text-slate-500">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Asset ID</th>
                <th className="px-4 py-3">Module</th>
                <th className="px-4 py-3">Event Type</th>
                <th className="px-4 py-3">Performed By</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-900">
              {sampleRows.map((row) => (
                <tr key={`${row.hash}-${row.assetId}`} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-4 py-3">{row.timestamp}</td>
                  <td className="whitespace-nowrap px-4 py-3">{row.assetId}</td>
                  <td className="whitespace-nowrap px-4 py-3">{row.module}</td>
                  <td className="whitespace-nowrap px-4 py-3">{row.eventType}</td>
                  <td className="whitespace-nowrap px-4 py-3">{row.actor}</td>
                  <td className="whitespace-nowrap px-4 py-3">{row.role}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-emerald-700 dark:text-emerald-300">
                    {row.hash}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
