'use client';

import { AlertTriangle, Bot, CheckCircle2, Cpu, Loader2, Terminal } from 'lucide-react';
import React from 'react';

import type { AgentStepTrace } from '@/types/seized-agent';

interface AgentLiveTraceProps {
  traces: AgentStepTrace[];
  isInvestigating: boolean;
}

export const AgentLiveTrace: React.FC<AgentLiveTraceProps> = ({ traces, isInvestigating }) => {
  return (
    <div className="rounded-xl border border-border/80 bg-card/90 shadow-sm backdrop-blur">
      <div className="flex items-center justify-between border-b border-border/60 bg-muted/30 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Cpu className="h-4 w-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">
                AI Legal Investigation Trace
              </h3>
              <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                Live Pipeline
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Autonomous legal reasoning per BNSS 2023 & SC guidelines
            </p>
          </div>
        </div>

        {isInvestigating && (
          <div className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>Executing Tools...</span>
          </div>
        )}
      </div>

      <div className="divide-y divide-border/40 p-2 sm:p-4">
        {traces.map((trace) => {
          const isPending = trace.status === 'pending';
          const isRunning = trace.status === 'running';
          const isCompleted = trace.status === 'completed';
          const isError = trace.status === 'error';

          return (
            <div
              key={trace.step}
              className={`group flex items-start gap-3.5 rounded-lg p-3 transition-colors ${
                isRunning ? 'border border-primary/20 bg-primary/5' : 'hover:bg-muted/40'
              }`}
            >
              {/* Status Indicator Icon */}
              <div className="mt-0.5 shrink-0">
                {isPending && (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full border border-muted-foreground/30 text-xs font-semibold text-muted-foreground">
                    {trace.step}
                  </div>
                )}
                {isRunning && (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  </div>
                )}
                {isCompleted && (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                )}
                {isError && (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                )}
              </div>

              {/* Step Content */}
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-xs font-semibold text-primary">
                    tool::{trace.tool_name}()
                  </span>
                  <span className="text-xs text-muted-foreground">Step {trace.step} of 8</span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-foreground/80">
                  <Bot className="h-3 w-3 shrink-0 text-muted-foreground" />
                  <span className="italic">{trace.thinking}</span>
                </div>

                {trace.summary_result && (
                  <div
                    className={`mt-1.5 flex items-start gap-2 rounded-md px-3 py-1.5 font-mono text-xs ${
                      isError
                        ? 'border border-destructive/20 bg-destructive/10 text-destructive'
                        : 'border border-border/50 bg-muted/50 text-foreground'
                    }`}
                  >
                    <Terminal className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-70" />
                    <span className="break-words leading-relaxed">{trace.summary_result}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
