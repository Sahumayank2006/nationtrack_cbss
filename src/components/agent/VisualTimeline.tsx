'use client';

import {
  AlertCircle,
  Building,
  CheckCircle2,
  Clock3,
  FileCheck,
  Gavel,
  Megaphone,
  ShieldAlert,
  Truck,
} from 'lucide-react';
import React from 'react';

import type { FullInvestigationResult } from '@/types/seized-agent';

interface VisualTimelineProps {
  result: FullInvestigationResult;
}

export const VisualTimeline: React.FC<VisualTimelineProps> = ({ result }) => {
  const { record, deadlines, status } = result;
  const statement = deadlines.items.find((item) => item.id === 'BNSS_497_2');
  const order = deadlines.items.find((item) => item.id === 'BNSS_497_5');
  const steps = [
    {
      title: 'Seizure',
      date: record.seizure_date,
      state: 'done',
      icon: ShieldAlert,
      note: 'Vehicle seized and FIR opened.',
    },
    {
      title: 'Report to Magistrate',
      date: record.reported_to_magistrate_date,
      state: 'done',
      icon: Building,
      note: 'Seizure report forwarded to court.',
    },
    {
      title: 'Production in Court',
      date: record.production_in_court_date,
      state: 'done',
      icon: Gavel,
      note: 'Vehicle and panchnama produced.',
    },
    {
      title: 'Property Statement',
      date: record.statement_497_date ?? 'Pending',
      state:
        statement?.status === 'overdue'
          ? 'overdue'
          : record.statement_497_date
            ? 'done'
            : 'pending',
      icon: FileCheck,
      note: record.statement_497_date ? 'Statement recorded.' : '14-day statement is pending.',
    },
    {
      title: 'Court Order',
      date: record.court_order_date ?? 'Pending',
      state: order?.status === 'overdue' ? 'overdue' : record.court_order_date ? 'done' : 'pending',
      icon: Gavel,
      note: record.court_order_date ? 'Court order recorded.' : 'Disposal order is pending.',
    },
    {
      title: 'Public Proclamation',
      date: record.owner_known === 'yes' ? 'Not needed' : (record.proclamation_date ?? 'Pending'),
      state: record.owner_known === 'yes' ? 'na' : record.proclamation_date ? 'done' : 'overdue',
      icon: Megaphone,
      note: record.owner_known === 'yes' ? 'Owner is known.' : 'Six-month notice process.',
    },
    {
      title: 'Final Disposal',
      date: record.released === 'yes' ? 'Released' : status.status,
      state:
        record.released === 'yes' || status.status === 'Fully Usable (Rajyasaat)'
          ? 'done'
          : 'pending',
      icon: Truck,
      note: record.released === 'yes' ? 'Released to claimant.' : 'Awaiting final legal outcome.',
    },
  ] as const;

  return (
    <section className="wooden-tile p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl font-semibold text-ink">Where this case stands</h2>
          <p className="mt-1 text-sm text-ink-muted">
            A short view of the custody and disposal process.
          </p>
        </div>
        <div className="hidden items-center gap-3 text-xs text-ink-muted sm:flex">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-forest" aria-label="Done" /> Done
          </span>
          <span className="flex items-center gap-1">
            <Clock3 className="h-3.5 w-3.5 text-brass-ink" aria-label="Pending" /> Pending
          </span>
          <span className="flex items-center gap-1">
            <AlertCircle className="h-3.5 w-3.5 text-brick" aria-label="Overdue" /> Overdue
          </span>
        </div>
      </div>
      <div className="mt-6 grid gap-5 md:grid-cols-7">
        {steps.map((step) => {
          const Icon = step.icon;
          const color =
            step.state === 'done'
              ? 'border-forest bg-forest/10 text-forest'
              : step.state === 'overdue'
                ? 'border-brick bg-brick/10 text-brick'
                : step.state === 'pending'
                  ? 'border-brass bg-brass/10 text-brass-ink'
                  : 'border-oak bg-oak/10 text-ink-muted';
          return (
            <div key={step.title} className="group relative flex gap-3 md:block md:text-center">
              <div
                className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 ${color} md:mx-auto`}
              >
                <Icon className="h-4 w-4" aria-label={step.title} />
              </div>
              <div className="min-w-0 md:mt-3">
                <h3 className="text-sm font-bold text-ink">{step.title}</h3>
                <p className="mt-1 font-mono text-xs text-ink-muted">{step.date}</p>
                <p className="mt-1 text-xs text-ink-muted">{step.note}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
