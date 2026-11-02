'use client';

import {
  AlertCircle,
  Building,
  CheckCircle2,
  Clock,
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

  const d14Item = deadlines.items.find((i) => i.id === 'BNSS_497_2');
  const d45Item = deadlines.items.find((i) => i.id === 'BNSS_497_5');

  const steps = [
    {
      id: 'seizure',
      title: 'Seizure & FIR',
      section: 'BNSS Sec 106',
      date: record.seizure_date,
      status: 'completed',
      icon: ShieldAlert,
      desc: `Seized under ${record.bns_section} by ${record.police_station}.`,
    },
    {
      id: 'report_magistrate',
      title: 'Report to Magistrate',
      section: 'BNSS Sec 106(2)',
      date: record.reported_to_magistrate_date,
      status: 'completed',
      icon: Building,
      desc: 'Seizure report forwarded forthwith to territorial Judicial Magistrate.',
    },
    {
      id: 'production',
      title: 'Production in Court',
      section: 'Day 0 Milestone',
      date: record.production_in_court_date,
      status: 'completed',
      icon: Gavel,
      desc: 'Vehicle & panchnama produced before magistrate. Day 0 clock starts.',
    },
    {
      id: 'statement_497',
      title: 'Property Statement',
      section: 'BNSS 497(2) (Day 14)',
      date: record.statement_497_date || 'Not Filed',
      status: d14Item ? d14Item.status : record.statement_497_date ? 'completed' : 'pending',
      icon: FileCheck,
      desc: record.statement_497_date
        ? `Photos, videography & statement recorded on ${record.statement_497_date}.`
        : d14Item?.status === 'not-applicable'
          ? 'Special law overrides general BNSS statement timeline.'
          : 'Mandatory 14-day property statement pending from I.O.',
    },
    {
      id: 'court_order',
      title: 'Court Order',
      section: 'BNSS 497(5) (Day 45)',
      date: record.court_order_date || 'Pending',
      status: d45Item ? d45Item.status : record.court_order_date ? 'completed' : 'pending',
      icon: Gavel,
      desc: record.court_order_date
        ? `Order: ${record.court_order_type.toUpperCase()} entered on ${record.court_order_date}.`
        : d45Item?.status === 'not-applicable'
          ? 'Special law procedure underway before Collector/Special Court.'
          : '30-day disposal order from statement (~45 days from production) pending.',
    },
    {
      id: 'proclamation',
      title: 'Public Proclamation',
      section: 'BNSS 503(2) (6 Months)',
      date:
        record.proclamation_date ||
        (record.owner_known === 'yes' ? 'N/A (Owner Known)' : 'Not Issued'),
      status:
        record.owner_known === 'yes'
          ? 'not-applicable'
          : record.proclamation_date
            ? 'completed'
            : 'overdue',
      icon: Megaphone,
      desc:
        record.owner_known === 'yes'
          ? 'Private registered owner known; proclamation not required.'
          : record.proclamation_date
            ? `6-month public notice issued on ${record.proclamation_date}.`
            : 'Owner unknown! Mandatory 6-month proclamation has NOT been published.',
    },
    {
      id: 'disposal',
      title: 'Final Disposal / Vesting',
      section:
        status.status === 'Fully Usable (Rajyasaat)' ? 'Rajyasaat Vested' : 'BNSS 504 / Release',
      date: record.released === 'yes' ? 'Released to Owner' : status.status,
      status:
        record.released === 'yes' || status.status === 'Fully Usable (Rajyasaat)'
          ? 'completed'
          : 'pending',
      icon: Truck,
      desc:
        record.released === 'yes'
          ? 'Vehicle delivered on supurdagi bond to claimant.'
          : status.status === 'Fully Usable (Rajyasaat)'
            ? 'Property vests in State (Rajyasaat). Eligible for department booking or auction.'
            : 'Vehicle impounded under active legal lock pending final judicial decree.',
    },
  ];

  return (
    <div className="rounded-xl border border-border/80 bg-card p-5 shadow-sm">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">Procedural Legal Timeline</h3>
          <p className="text-xs text-muted-foreground">
            Complete flow from Police Seizure to Final Disposal / Rajyasaat
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" /> Compliant / Done
          </span>
          <span className="flex items-center gap-1.5 font-medium text-destructive">
            <AlertCircle className="h-3.5 w-3.5" /> Overdue
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="h-3.5 w-3.5" /> Pending
          </span>
        </div>
      </div>

      <div className="relative">
        {/* Horizontal connector line on medium/large screens */}
        <div className="absolute left-6 right-6 top-7 z-0 hidden h-0.5 bg-border/80 lg:block" />

        <div className="relative z-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-7">
          {steps.map((s, index) => {
            const isCompleted = s.status === 'completed';
            const isOverdue = s.status === 'overdue';
            const isPending = s.status === 'pending';
            const isNa = s.status === 'not-applicable';

            return (
              <div
                key={s.id}
                className="group flex flex-col items-start text-left lg:items-center lg:text-center"
              >
                {/* Node circle */}
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl border-2 shadow-sm transition-all ${
                    isCompleted
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : isOverdue
                        ? 'animate-pulse border-destructive bg-destructive/10 text-destructive'
                        : isNa
                          ? 'border-muted-foreground/30 bg-muted text-muted-foreground'
                          : 'border-border bg-card text-muted-foreground'
                  }`}
                >
                  <s.icon className="h-6 w-6" />
                </div>

                {/* Step info */}
                <div className="mt-3 space-y-1">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                    Step {index + 1}
                  </div>
                  <h4 className="text-xs font-bold leading-snug text-foreground">{s.title}</h4>
                  <div className="font-mono text-[11px] text-muted-foreground">{s.section}</div>
                  <div
                    className={`inline-block rounded px-2 py-0.5 text-[10px] font-semibold ${
                      isCompleted
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                        : isOverdue
                          ? 'bg-destructive/15 font-bold text-destructive'
                          : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {s.date}
                  </div>
                  <p className="hidden pt-1 text-[11px] leading-tight text-muted-foreground/90 sm:block">
                    {s.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
