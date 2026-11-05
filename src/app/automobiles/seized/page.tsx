'use client';

import {
  AlertCircle,
  Car,
  CheckCircle2,
  ChevronRight,
  Clock,
  Database,
  FileSearch,
  Gavel,
  Layers,
  MessageSquare,
  Search,
  Shield,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { AgentChatAssistant } from '@/components/agent/AgentChatAssistant';
import { AgentLiveTrace } from '@/components/agent/AgentLiveTrace';
import { BatchInvestigationPanel } from '@/components/agent/BatchInvestigationPanel';
import { CaseSummaryCard } from '@/components/agent/CaseSummaryCard';
import { VisualTimeline } from '@/components/agent/VisualTimeline';
import { Button } from '@/components/ui/button';
import { runAgentInvestigation } from '@/lib/agent/orchestrator';
import { getAllSyntheticVehicles } from '@/lib/agent/tools';

import type { AgentStepTrace, FullInvestigationResult } from '@/types/seized-agent';

const QUICK_PRESETS = [
  { no: 'MP07-CA-1024', label: 'Theft recovered', tag: 'BNS 303', icon: Shield },
  { no: 'MP07-EX-2010', label: 'Excise case', tag: '47-A / 47-D', icon: Gavel },
  { no: 'MP07-ND-3011', label: 'Narcotics seizure', tag: 'NDPS Act', icon: FileSearch },
  { no: 'MP07-AB-4008', label: 'Abandoned vehicle', tag: 'Auction review', icon: Car },
  { no: 'MP07-RU-5009', label: 'Low-value vehicle', tag: 'BNSS 505', icon: Clock },
  { no: 'MP07-CV-6012', label: 'Trial conviction', tag: 'Confiscation', icon: CheckCircle2 },
  { no: 'MP07-HG-5532', label: 'Fatal accident', tag: 'Overdue review', icon: AlertCircle },
  { no: 'MP07-XY-3301', label: 'Chassis concern', tag: 'Evidence check', icon: Search },
];

export default function SeizedVehiclesAgentPage() {
  const [vehicleInput, setVehicleInput] = useState('MP07-CA-1024');
  const [isInvestigating, setIsInvestigating] = useState(false);
  const [activeTab, setActiveTab] = useState<'single' | 'batch' | 'chat'>('single');
  const [currentResult, setCurrentResult] = useState<FullInvestigationResult | null>(null);
  const [traces, setTraces] = useState<AgentStepTrace[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const startInvestigation = async (vNo: string) => {
    const trimmed = vNo.trim();
    if (!trimmed) return;

    setActiveTab('single');
    setIsInvestigating(true);
    setErrorMessage(null);
    setCurrentResult(null);

    try {
      const result = await runAgentInvestigation(trimmed, (updatedTraces) => {
        setTraces(updatedTraces);
      });
      setCurrentResult(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Investigation failed';
      setErrorMessage(msg);
    } finally {
      setIsInvestigating(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const paramVehicle = params.get('vehicle');
      if (paramVehicle) {
        setVehicleInput(paramVehicle);
        startInvestigation(paramVehicle);
        return;
      }
    }
    // Automatically run initial investigation for demo showcase
    startInvestigation('MP07-CA-1024');
  }, []);

  const allVehicles = getAllSyntheticVehicles();
  const rajyasaatCount = allVehicles.filter(
    (v) => v.court_order_type === 'confiscation' && v.appeal_period_expired
  ).length;
  const overdue497Count = allVehicles.filter(
    (v) => !v.statement_497_date && v.special_law === 'None'
  ).length;

  return (
    <div className="wooden-desk min-h-screen pb-16 text-ink">
      <div className="wooden-topbar">
        <div className="container-wide flex items-center justify-between gap-4 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-paper">
            <Shield className="h-4 w-4" aria-label="Shield logo" />
            Seized Vehicle Review
          </div>
          <span className="rounded-full border border-brass/60 bg-black/10 px-3 py-1 text-xs font-medium text-paper">
            Demo data · Gwalior, MP
          </span>
        </div>
      </div>

      <div className="container-wide space-y-6 py-6 sm:py-8">
        {/* Navigation & Title Header */}
        <div className="wooden-tile flex flex-col gap-5 p-5 md:flex-row md:items-center md:justify-between md:p-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brass text-white">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="font-serif text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                    Seized Vehicle Review
                  </h1>
                  <p className="text-sm text-ink-muted">
                    Check custody, deadlines and next legal step.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Key Metric Highlights */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-background px-3 py-2">
              <Database className="h-4 w-4 text-brass-ink" aria-label="Indexed fleet" />
              <div className="text-left">
                <p className="text-[11px] text-ink-muted">Indexed fleet</p>
                <p className="text-sm font-bold text-ink">{allVehicles.length} vehicles</p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-burnt/30 bg-burnt/10 px-3 py-2">
              <Clock className="h-4 w-4 text-burnt" aria-label="Overdue cases" />
              <div className="text-left">
                <p className="text-[11px] text-ink-muted">BNSS 497 overdue</p>
                <p className="text-sm font-bold text-burnt">{overdue497Count} cases</p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-forest/30 bg-forest/10 px-3 py-2">
              <CheckCircle2 className="h-4 w-4 text-forest" aria-label="Confiscated cases" />
              <div className="text-left">
                <p className="text-[11px] text-ink-muted">Confiscation vested</p>
                <p className="text-sm font-bold text-forest">{rajyasaatCount} cases</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar & Preset Quick Chips */}
        <div className="wooden-tile space-y-5 p-5 sm:p-6">
          <div>
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-brass-ink" aria-label="Search" />
              <h2 className="text-sm font-bold text-ink">Find a seized vehicle</h2>
            </div>
            <p className="mt-1 text-sm text-ink-muted">
              Enter a registration number or choose a quick example.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={vehicleInput}
                onChange={(e) => setVehicleInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    startInvestigation(vehicleInput);
                  }
                }}
                placeholder="Enter registration number, e.g. MP07-CA-1024"
                className="w-full rounded-xl border border-oak bg-paper py-3 pl-11 pr-4 font-mono text-sm uppercase tracking-wider text-ink placeholder:normal-case placeholder:tracking-normal placeholder:text-ink-muted focus:border-brass focus:outline-none focus:ring-2 focus:ring-brass/30"
              />
            </div>

            <Button
              onClick={() => startInvestigation(vehicleInput)}
              disabled={isInvestigating || !vehicleInput.trim()}
              size="lg"
              className="gap-2 bg-brass px-6 font-semibold text-white hover:bg-brass-ink"
            >
              {isInvestigating ? (
                <Clock className="h-4 w-4 animate-pulse" />
              ) : (
                <FileSearch className="h-4 w-4" />
              )}
              {isInvestigating ? 'Reviewing case...' : 'Start case review'}
            </Button>
          </div>

          {/* Quick preset scenario chips */}
          <div className="space-y-3 border-t border-border/60 pt-4">
            <span className="text-sm font-semibold text-ink">Quick examples</span>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {QUICK_PRESETS.map((preset) => {
                const isSelected = vehicleInput.toUpperCase() === preset.no;
                const PresetIcon = preset.icon;
                return (
                  <button
                    key={preset.no}
                    onClick={() => {
                      setVehicleInput(preset.no);
                      startInvestigation(preset.no);
                    }}
                    className={`group flex min-w-0 items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition-all ${
                      isSelected
                        ? 'border-brass bg-brass/10 text-brass-ink shadow-sm'
                        : 'border-oak bg-paper text-ink hover:border-brass/50 hover:bg-brass/5'
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        isSelected ? 'bg-brass text-white' : 'bg-oak/20 text-ink-muted'
                      }`}
                    >
                      <PresetIcon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-mono text-[11px] font-bold">
                        {preset.no}
                      </span>
                      <span className="block truncate text-[11px] text-ink-muted">
                        {preset.label}
                      </span>
                    </span>
                    <ChevronRight
                      className="h-3.5 w-3.5 shrink-0 text-ink-muted transition-transform group-hover:translate-x-0.5"
                      aria-label="Open example"
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="overflow-x-auto">
          <div className="flex min-w-max items-center gap-1">
            <button
              onClick={() => setActiveTab('single')}
              className={`flex cursor-pointer items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
                activeTab === 'single'
                  ? 'rounded-t-xl bg-brass text-white'
                  : 'rounded-t-xl text-paper hover:bg-black/10'
              }`}
            >
              <FileSearch className="h-4 w-4" />
              Case review
            </button>

            <button
              onClick={() => setActiveTab('batch')}
              className={`flex cursor-pointer items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
                activeTab === 'batch'
                  ? 'rounded-t-xl bg-brass text-white'
                  : 'rounded-t-xl text-paper hover:bg-black/10'
              }`}
            >
              <Layers className="h-4 w-4" />
              Batch review
            </button>

            <button
              onClick={() => setActiveTab('chat')}
              className={`flex cursor-pointer items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
                activeTab === 'chat'
                  ? 'rounded-t-xl bg-brass text-white'
                  : 'rounded-t-xl text-paper hover:bg-black/10'
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              Ask the assistant
            </button>
          </div>
        </div>

        {/* Tab 1: Single Autonomous Investigation */}
        {activeTab === 'single' && (
          <div className="space-y-8">
            {/* Friendly Not Found Message */}
            {errorMessage && (
              <div className="space-y-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-destructive">
                <div className="flex items-center gap-2.5 text-base font-bold">
                  <AlertCircle className="h-5 w-5" />
                  <span>Vehicle Not Found in CCTNS Simulated Registry</span>
                </div>
                <p className="text-xs leading-relaxed">{errorMessage}</p>
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <span className="text-xs font-semibold text-foreground">
                    Try registered demo vehicles:
                  </span>
                  {QUICK_PRESETS.slice(0, 4).map((p) => (
                    <Button
                      key={p.no}
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setVehicleInput(p.no);
                        startInvestigation(p.no);
                      }}
                      className="h-7 font-mono text-xs"
                    >
                      {p.no}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {currentResult && !isInvestigating && (
              <>
                <CaseSummaryCard result={currentResult} />
                <VisualTimeline result={currentResult} />
              </>
            )}

            {isInvestigating && (
              <div className="wooden-tile space-y-4 p-5 sm:p-6" aria-label="Loading case review">
                <div className="h-6 w-48 animate-pulse rounded bg-oak/20" />
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="h-20 animate-pulse rounded-xl bg-oak/10" />
                  <div className="h-20 animate-pulse rounded-xl bg-oak/10" />
                  <div className="h-20 animate-pulse rounded-xl bg-oak/10" />
                </div>
                <div className="h-16 animate-pulse rounded-xl bg-oak/10" />
              </div>
            )}

            {!isInvestigating && !currentResult && !errorMessage && (
              <div className="wooden-tile flex flex-col items-center justify-center p-12 text-center">
                <FileSearch className="h-10 w-10 text-brass-ink" aria-label="Empty case search" />
                <h2 className="mt-4 font-serif text-xl font-semibold text-ink">
                  Search a registration number to begin
                </h2>
                <p className="mt-2 text-sm text-ink-muted">
                  Choose a quick example above or enter a registration number.
                </p>
              </div>
            )}

            {traces.length > 0 && (
              <AgentLiveTrace traces={traces} isInvestigating={isInvestigating} />
            )}
          </div>
        )}

        {/* Tab 2: Batch Priority Queue */}
        {activeTab === 'batch' && (
          <BatchInvestigationPanel
            onSelectVehicle={(vNo) => {
              setVehicleInput(vNo);
              startInvestigation(vNo);
            }}
          />
        )}

        {/* Tab 3: Interactive Chat Assistant */}
        {activeTab === 'chat' && (
          <AgentChatAssistant
            onSelectVehicle={(vNo) => {
              setVehicleInput(vNo);
              startInvestigation(vNo);
            }}
          />
        )}
      </div>
      <footer className="container-wide pt-4 text-center text-xs text-paper/80">
        Study tool, not legal advice. Verify with the official Gazette and an advocate.
      </footer>
    </div>
  );
}
