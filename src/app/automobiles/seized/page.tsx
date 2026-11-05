'use client';

import {
  AlertCircle,
  ArrowLeft,
  Bot,
  Car,
  CheckCircle2,
  Clock,
  Database,
  FileSearch,
  Gavel,
  Layers,
  MessageSquare,
  Search,
  Shield,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
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
  { no: 'MP07-CA-1024', label: 'Theft Recovered (BNS 303)', tag: 'Locked' },
  { no: 'MP07-EX-2010', label: 'MP Excise 47-A/47-D', tag: 'Rajyasaat' },
  { no: 'MP07-ND-3011', label: 'NDPS Act Narcotics', tag: 'Locked' },
  { no: 'MP07-AB-4008', label: 'Abandoned (Proclaimed)', tag: 'Auction Ripe' },
  { no: 'MP07-RU-5009', label: 'Rusted (< ₹10k BNSS 505)', tag: 'Early Sale' },
  { no: 'MP07-CV-6012', label: 'Trial Conviction', tag: 'Rajyasaat' },
  { no: 'MP07-HG-5532', label: 'Accident Death (106(1))', tag: 'Overdue' },
  { no: 'MP07-XY-3301', label: 'Fake Chassis / Forgery', tag: 'Evidence' },
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
    <div className="min-h-screen bg-background pb-20 text-foreground">
      {/* Top Banner: Synthetic CCTNS Demo Indicator */}
      <div className="border-b border-amber-500/20 bg-amber-500/10 px-4 py-2 text-center text-xs font-semibold text-amber-700 dark:text-amber-400">
        Demo - Synthetic Data, simulated CCTNS repository (Madhya Pradesh / Gwalior Commission)
      </div>

      <div className="container-wide space-y-8 py-8">
        {/* Navigation & Title Header */}
        <div className="flex flex-col gap-4 border-b border-border/60 pb-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Link
                href="/automobiles"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/80 bg-card text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div className="flex items-center gap-2.5">
                <div className="shadow-xs flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                    Seized Vehicles Legal AI Agent
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    BharatTrack Intelligence Layer &bull; BNSS 2023, BNS 2023 & Special Laws
                    Compliance
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Key Metric Highlights */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="shadow-xs flex items-center gap-2 rounded-xl border border-border/80 bg-card px-3 py-1.5">
              <Database className="h-4 w-4 text-primary" />
              <div className="text-left text-xs">
                <span className="text-muted-foreground">Indexed Fleet: </span>
                <span className="font-bold text-foreground">{allVehicles.length} Vehicles</span>
              </div>
            </div>

            <div className="shadow-xs flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 px-3 py-1.5">
              <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <div className="text-left text-xs">
                <span className="text-muted-foreground">BNSS 497 Overdue: </span>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  {overdue497Count}
                </span>
              </div>
            </div>

            <div className="shadow-xs flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-3 py-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <div className="text-left text-xs">
                <span className="text-muted-foreground">Rajyasaat Vested: </span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {rajyasaatCount}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar & Preset Quick Chips */}
        <div className="space-y-4 rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
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
                placeholder="Enter Registration (e.g. MP07-CA-1024, MP07-EX-2010, MP07-ND-3011)..."
                className="shadow-xs w-full rounded-xl border border-border/80 bg-background py-3 pl-11 pr-4 font-mono text-sm uppercase tracking-wider text-foreground placeholder:normal-case placeholder:tracking-normal placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <Button
              onClick={() => startInvestigation(vehicleInput)}
              disabled={isInvestigating || !vehicleInput.trim()}
              size="lg"
              className="gap-2 bg-primary px-6 font-semibold text-primary-foreground"
            >
              <Bot className="h-4 w-4" />
              {isInvestigating ? 'Investigating...' : 'Investigate Vehicle'}
            </Button>
          </div>

          {/* Quick preset scenario chips */}
          <div className="space-y-2 pt-1">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Master Table Demo Scenarios (Click to test):
            </span>
            <div className="flex flex-wrap gap-2">
              {QUICK_PRESETS.map((preset) => {
                const isSelected = vehicleInput.toUpperCase() === preset.no;
                return (
                  <button
                    key={preset.no}
                    onClick={() => {
                      setVehicleInput(preset.no);
                      startInvestigation(preset.no);
                    }}
                    className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all ${
                      isSelected
                        ? 'shadow-xs border-primary bg-primary/10 font-bold text-primary'
                        : 'border-border/80 bg-muted/40 text-foreground hover:border-primary/50 hover:bg-muted/70'
                    }`}
                  >
                    <span className="font-mono">{preset.no}</span>
                    <span className="text-[11px] text-muted-foreground">&bull; {preset.label}</span>
                    <span className="py-0.2 rounded bg-background/80 px-1.5 text-[10px] font-semibold text-primary">
                      {preset.tag}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center justify-between border-b border-border/60">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('single')}
              className={`flex cursor-pointer items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
                activeTab === 'single'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileSearch className="h-4 w-4" />
              Autonomous Case Investigation
            </button>

            <button
              onClick={() => setActiveTab('batch')}
              className={`flex cursor-pointer items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
                activeTab === 'batch'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Layers className="h-4 w-4" />
              Batch Priority Queue (5–10)
            </button>

            <button
              onClick={() => setActiveTab('chat')}
              className={`flex cursor-pointer items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
                activeTab === 'chat'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              AI Legal Chat Assistant
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

            {/* Live Agent Trace */}
            {traces.length > 0 && (
              <AgentLiveTrace traces={traces} isInvestigating={isInvestigating} />
            )}

            {/* Final Case Summary & Detailed Findings */}
            {currentResult && !isInvestigating && (
              <>
                <VisualTimeline result={currentResult} />
                <CaseSummaryCard result={currentResult} />
              </>
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
    </div>
  );
}
