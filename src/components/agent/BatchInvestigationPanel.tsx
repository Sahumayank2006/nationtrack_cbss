'use client';

import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Layers,
  Loader2,
  Play,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { runBatchInvestigation } from '@/lib/agent/orchestrator';
import type { FullInvestigationResult } from '@/types/seized-agent';

interface BatchInvestigationPanelProps {
  onSelectVehicle: (vehicleNo: string) => void;
}

const SAMPLE_BATCH = [
  'MP07-CA-1024', // Theft Padav
  'MP07-EX-2010', // MP Excise University
  'MP07-ND-3011', // NDPS Thatipur
  'MP07-AB-4008', // Abandoned Madhavganj
  'MP07-RU-5009', // Low-value Rusted <10k Padav
  'MP07-CV-6012', // Conviction Rajyasaat Padav
  'MP07-HG-5532', // Fatal accident Bahodapur
  'MP07-XY-3301', // Fake chassis Gwalior Fort
];

export const BatchInvestigationPanel: React.FC<BatchInvestigationPanelProps> = ({
  onSelectVehicle,
}) => {
  const [inputText, setInputText] = useState(SAMPLE_BATCH.join(', '));
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0, current: '' });
  const [results, setResults] = useState<FullInvestigationResult[] | null>(null);

  const handleStartBatch = async () => {
    const numbers = inputText
      .split(/[\n,;\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (numbers.length === 0) return;

    setIsRunning(true);
    setResults(null);
    try {
      const batchResults = await runBatchInvestigation(numbers, (completed, total, current) => {
        setProgress({ completed, total, current });
      });
      setResults(batchResults);
    } catch (err) {
      console.error('Batch error:', err);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6 rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
      <div className="flex flex-col gap-2 border-b border-border/50 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            <h3 className="text-base font-bold text-foreground">
              Batch Multi-Vehicle Legal Assessment
            </h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Enter 5 to 10 vehicle numbers to assess statutory compliance and rank into a Priority
            Action Queue.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setInputText(SAMPLE_BATCH.join(', '))}
          className="gap-1.5 self-start text-xs sm:self-auto"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Load Sample Batch (8)
        </Button>
      </div>

      <div className="space-y-3">
        <label className="text-xs font-semibold text-foreground">
          Vehicle Registration Numbers (separated by commas or new lines):
        </label>
        <textarea
          rows={3}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="MP07-CA-1024, MP07-EX-2010, MP07-ND-3011, MP07-AB-4008..."
          className="w-full rounded-xl border border-border/80 bg-background px-3.5 py-2.5 font-mono text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />

        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">
            Detected: {inputText.split(/[\n,;\s]+/).filter(Boolean).length} vehicle(s)
          </span>

          <Button
            onClick={handleStartBatch}
            disabled={isRunning || !inputText.trim()}
            className="gap-2 bg-primary font-semibold text-primary-foreground"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing ({progress.completed}/{progress.total})...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Run Batch Legal Agent
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Progress Bar during execution */}
      {isRunning && (
        <div className="space-y-2 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-primary">
            <span>Investigating: {progress.current}</span>
            <span>{Math.round((progress.completed / (progress.total || 1)) * 100)}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-primary/20">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${(progress.completed / (progress.total || 1)) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Results Table (Priority List) */}
      {results && results.length > 0 && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-bold text-foreground">
                Priority Action Queue (Ranked by Critical Overdue Defaults)
              </h4>
            </div>
            <span className="font-mono text-xs text-muted-foreground">
              {results.length} vehicle(s) evaluated
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border/80">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border/60 bg-muted/50 font-semibold text-muted-foreground">
                <tr>
                  <th className="px-3.5 py-3">Priority</th>
                  <th className="px-3.5 py-3">Vehicle No</th>
                  <th className="px-3.5 py-3">Make / Station</th>
                  <th className="px-3.5 py-3">Custody</th>
                  <th className="px-3.5 py-3">Legal Status</th>
                  <th className="px-3.5 py-3">Defaults</th>
                  <th className="px-3.5 py-3">Next Action</th>
                  <th className="px-3.5 py-3 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-medium">
                {results.map((res, index) => {
                  const critAlerts = res.reasoning.alerts.filter((a) => a.level === 'critical');
                  const isHighPriority = critAlerts.length > 0;

                  return (
                    <tr
                      key={res.vehicle_no}
                      className="cursor-pointer transition-colors hover:bg-muted/40"
                      onClick={() => onSelectVehicle(res.vehicle_no)}
                    >
                      <td className="px-3.5 py-3">
                        <span
                          className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                            index === 0
                              ? 'bg-destructive text-destructive-foreground'
                              : index < 3
                                ? 'bg-amber-500 text-white'
                                : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          #{index + 1}
                        </span>
                      </td>

                      <td className="px-3.5 py-3 font-mono font-bold text-foreground">
                        {res.vehicle_no}
                      </td>

                      <td className="px-3.5 py-3">
                        <div className="text-foreground">{res.record.make_model}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {res.record.police_station}
                        </div>
                      </td>

                      <td className="px-3.5 py-3">
                        <span className="font-mono">{res.custody.days_since_seizure}d</span>{' '}
                        <span className="text-[11px] text-muted-foreground">
                          ({res.custody.months_since_seizure}m)
                        </span>
                      </td>

                      <td className="px-3.5 py-3">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                            res.status.status === 'Fully Usable (Rajyasaat)'
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                              : res.status.status === 'Conditionally Usable'
                                ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300'
                                : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                          }`}
                        >
                          {res.status.status}
                        </span>
                      </td>

                      <td className="px-3.5 py-3">
                        {isHighPriority ? (
                          <span className="flex items-center gap-1 font-bold text-destructive">
                            <AlertCircle className="h-3.5 w-3.5" />
                            {critAlerts.length} Critical
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Compliant
                          </span>
                        )}
                      </td>

                      <td className="max-w-[200px] truncate px-3.5 py-3 text-muted-foreground">
                        {res.reasoning.next_action}
                      </td>

                      <td className="px-3.5 py-3 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 gap-1 text-xs text-primary hover:bg-primary/10 hover:text-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectVehicle(res.vehicle_no);
                          }}
                        >
                          View
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
