'use client';

import { AlertTriangle, CheckCircle2, ChevronDown, Clock3, Loader2 } from 'lucide-react';
import React, { useState } from 'react';

import type { AgentStepTrace } from '@/types/seized-agent';

interface AgentLiveTraceProps {
  traces: AgentStepTrace[];
  isInvestigating: boolean;
}

const HUMAN_TITLES = [
  'Fetched FIR record',
  'Matched legal sections',
  'Calculated custody days',
  'Checked statutory deadlines',
  'Selected disposal route',
  'Classified legal status',
  'Verified physical custody',
  'Prepared next action',
];

export const AgentLiveTrace: React.FC<AgentLiveTraceProps> = ({ traces, isInvestigating }) => {
  const [open, setOpen] = useState(false);

  return (
    <section className="wooden-tile overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-4 p-5 text-left sm:p-6"
        aria-expanded={open}
      >
        <span>
          <span className="block font-serif text-xl font-semibold text-ink">
            How this result was reached
          </span>
          <span className="mt-1 block text-sm text-ink-muted">
            {isInvestigating
              ? 'Review in progress…'
              : 'Open the review trail when you need more detail.'}
          </span>
        </span>
        <span className="flex items-center gap-3 text-brass-ink">
          {isInvestigating && (
            <Loader2 className="h-4 w-4 animate-spin" aria-label="Review in progress" />
          )}
          <ChevronDown
            className={`h-5 w-5 transition-transform ${open ? 'rotate-180' : ''}`}
            aria-label="Toggle review trail"
          />
        </span>
      </button>
      {open && (
        <div className="border-t border-oak px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
          <div className="space-y-1">
            {traces.map((trace, index) => {
              const isError = trace.status === 'error';
              const isDone = trace.status === 'completed';
              return (
                <div key={`${trace.step}-${trace.tool_name}`} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full ${
                        isError
                          ? 'bg-brick/10 text-brick'
                          : isDone
                            ? 'bg-forest/10 text-forest'
                            : 'bg-brass/10 text-brass-ink'
                      }`}
                    >
                      {isError ? (
                        <AlertTriangle className="h-3.5 w-3.5" aria-label="Step failed" />
                      ) : isDone ? (
                        <CheckCircle2 className="h-3.5 w-3.5" aria-label="Step complete" />
                      ) : (
                        <Clock3 className="h-3.5 w-3.5" aria-label="Step pending" />
                      )}
                    </span>
                    {index < traces.length - 1 && <span className="h-full min-h-5 w-px bg-oak" />}
                  </div>
                  <div className="pb-4">
                    <h3 className="text-sm font-semibold text-ink">
                      {HUMAN_TITLES[index] ?? 'Review step'}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                      {trace.summary_result ?? trace.thinking}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};
