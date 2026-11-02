'use client';

import { Download } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

export default function AdminReportsPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Automobile Reports</h1>
            <p className="mt-1 text-sm text-slate-600">
              Fleet analytics, utilization summaries, and compliance exports.
            </p>
          </div>
          <Button className="gap-2" variant="institutional">
            <Download className="h-4 w-4" aria-hidden /> Export Fleet PDF
          </Button>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-widest text-slate-500">Total Vehicles</p>
          <p className="mt-2 text-3xl font-black text-slate-900">412</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-widest text-slate-500">In Movement</p>
          <p className="mt-2 text-3xl font-black text-slate-900">286</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-widest text-slate-500">Utilization</p>
          <p className="mt-2 text-3xl font-black text-slate-900">74%</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-widest text-slate-500">Pending Actions</p>
          <p className="mt-2 text-3xl font-black text-slate-900">18</p>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-600">
          Detailed route, idle-time, maintenance, and compliance reports are available in the
          automobiles reporting workspace.
        </p>
        <div className="mt-3">
          <Link
            href="/automobiles/reports"
            className="font-semibold text-blue-700 hover:text-blue-800"
          >
            Open Automobile Reports
          </Link>
        </div>
      </section>
    </div>
  );
}
