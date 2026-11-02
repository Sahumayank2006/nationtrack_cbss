'use client';

import {
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FileCheck2,
  FileText,
  Gavel,
  Info,
  Loader2,
  Lock,
  MapPin,
  Scale,
  ShieldAlert,
  Sparkles,
  Unlock,
} from 'lucide-react';
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { generateSeizedVehiclePdf } from '@/lib/agent/pdf-generator';
import type { FullInvestigationResult } from '@/types/seized-agent';

interface CaseSummaryCardProps {
  result: FullInvestigationResult;
}

export const CaseSummaryCard: React.FC<CaseSummaryCardProps> = ({ result }) => {
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [copiedAction, setCopiedAction] = useState(false);

  const { record, legal_map, custody, disposal_route, status, reasoning } = result;

  const handleDownloadPdf = async () => {
    try {
      setDownloadingPdf(true);
      const pdfBytes = await generateSeizedVehiclePdf(result);
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Legal_Report_${record.vehicle_no}_${record.fir_no.replace('/', '-')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleCopyAction = () => {
    const text = `ACTION: ${reasoning.next_action}\nAUTHORITY: ${reasoning.action_authority}\nCASE: ${record.vehicle_no} (${record.fir_no})\nSTEPS:\n${reasoning.action_steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;
    navigator.clipboard.writeText(text);
    setCopiedAction(true);
    setTimeout(() => setCopiedAction(false), 2500);
  };

  const getStatusBadge = () => {
    if (status.status === 'Fully Usable (Rajyasaat)') {
      return (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
          <Unlock className="h-4 w-4" />
          <span>FULLY USABLE (RAJYASAAT)</span>
        </div>
      );
    }
    if (status.status === 'Conditionally Usable') {
      return (
        <div className="flex items-center gap-2 rounded-xl border border-blue-500/40 bg-blue-500/10 px-3.5 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400">
          <Scale className="h-4 w-4" />
          <span>CONDITIONALLY USABLE</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3.5 py-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
        <Lock className="h-4 w-4" />
        <span>LEGALLY LOCKED</span>
      </div>
    );
  };

  const sunderbhaiPercentage = Math.min(
    100,
    Math.round((custody.days_since_production / 182) * 100)
  );

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-mono text-2xl font-extrabold tracking-tight text-foreground">
                {record.vehicle_no}
              </span>
              {getStatusBadge()}
              {record.special_law !== 'None' && (
                <span className="rounded-lg border border-purple-500/20 bg-purple-500/10 px-2.5 py-1 text-xs font-semibold text-purple-600 dark:text-purple-400">
                  Special Law: {record.special_law}
                </span>
              )}
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              {record.make_model} &bull;{' '}
              <span className="font-semibold text-foreground/80">{record.type}</span> &bull;
              Estimated Value: ₹{record.est_value.toLocaleString('en-IN')}
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1 font-mono">
                <FileText className="h-3.5 w-3.5 text-primary" /> {record.fir_no}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-primary" /> {record.police_station},{' '}
                {record.district} ({record.state})
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-primary" /> Seized: {record.seizure_date}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="gap-2 bg-primary font-medium text-primary-foreground hover:bg-primary/90"
            >
              {downloadingPdf ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Download Case PDF
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Grid: 2 Columns */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Legal Mapper & Custody (2 cols wide on large) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Statutory Mapping Box */}
          <div className="space-y-4 rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div className="flex items-center gap-2.5">
                <Scale className="h-5 w-5 text-primary" />
                <h3 className="text-base font-bold text-foreground">
                  BNS & BNSS Statutory Provisions
                </h3>
              </div>
              <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
                Master Table Scenario #{legal_map.master_table_row}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1 rounded-xl border border-border/60 bg-muted/30 p-3.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  BNS 2023 Offence Section
                </span>
                <div className="text-sm font-bold text-foreground">{legal_map.bns_section}</div>
                <p className="text-xs text-muted-foreground">{legal_map.offence_brief}</p>
              </div>

              <div className="space-y-1 rounded-xl border border-border/60 bg-muted/30 p-3.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Seizure & Disposal Law
                </span>
                <div className="text-sm font-bold text-foreground">
                  {legal_map.seizure_disposal_law}
                </div>
                <p className="text-xs text-muted-foreground">
                  Governing procedural code and special enactments
                </p>
              </div>
            </div>

            {/* Plain explanation */}
            <div className="space-y-1.5 rounded-xl border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-primary">
                <BookOpen className="h-4 w-4" />
                <span>Plain Language Legal Explanation</span>
              </div>
              <p className="font-sans text-xs leading-relaxed text-foreground/90">
                {legal_map.plain_explanation}
              </p>
            </div>

            {/* Government Use Rule */}
            <div className="space-y-1.5 rounded-xl border border-border/60 bg-muted/20 p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                <Info className="h-4 w-4 text-primary" />
                <span>Government Requisition & Reuse Rule (PDF Section 8)</span>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {legal_map.government_use_rule}
              </p>
              <p className="pt-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                Important: {status.elapsed_time_disclaimer}
              </p>
            </div>
          </div>

          {/* Procedural Alerts */}
          {reasoning.alerts.length > 0 && (
            <div className="space-y-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-6 shadow-sm">
              <div className="flex items-center gap-2.5 text-base font-bold text-destructive">
                <AlertOctagon className="h-5 w-5" />
                <span>Statutory Defaults & Regulatory Alerts ({reasoning.alerts.length})</span>
              </div>

              <div className="space-y-3">
                {reasoning.alerts.map((alert, idx) => (
                  <div
                    key={idx}
                    className="shadow-xs space-y-1.5 rounded-xl border border-destructive/20 bg-card p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                            alert.level === 'critical'
                              ? 'bg-destructive text-destructive-foreground'
                              : 'bg-amber-500 text-white'
                          }`}
                        >
                          {alert.level}
                        </span>
                        <h4 className="text-xs font-bold text-foreground">{alert.title}</h4>
                      </div>
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {alert.statutory_ref}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {alert.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Custody Metrics, Disposal Route & Next Action */}
        <div className="space-y-6">
          {/* Custody Meter */}
          <div className="space-y-4 rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <h3 className="text-sm font-bold text-foreground">Custody & Detention Duration</h3>
              </div>
              <span className="text-xs text-muted-foreground">Ref: 02 Nov 2026</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="rounded-xl border border-border/40 bg-muted/40 p-3">
                <div className="text-2xl font-black text-foreground">
                  {custody.days_since_seizure}
                </div>
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Days in Custody
                </div>
                <div className="pt-0.5 text-xs font-semibold text-primary">
                  {custody.months_since_seizure} months
                </div>
              </div>

              <div className="rounded-xl border border-border/40 bg-muted/40 p-3">
                <div className="text-2xl font-black text-foreground">
                  {custody.days_since_production}
                </div>
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Since Court Production
                </div>
                <div className="pt-0.5 text-xs font-semibold text-primary">
                  {custody.months_since_production} months
                </div>
              </div>
            </div>

            {/* Supreme Court Sunderbhai Progress Meter */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground">
                  SC Sunderbhai Outer Limit (6 Months)
                </span>
                <span
                  className={`font-mono font-bold ${
                    sunderbhaiPercentage >= 100 ? 'text-destructive' : 'text-primary'
                  }`}
                >
                  {sunderbhaiPercentage}%
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all ${
                    sunderbhaiPercentage >= 100
                      ? 'bg-destructive'
                      : sunderbhaiPercentage >= 75
                        ? 'bg-amber-500'
                        : 'bg-primary'
                  }`}
                  style={{ width: `${sunderbhaiPercentage}%` }}
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                {custody.days_since_production >= 182
                  ? `Breached by ${custody.days_since_production - 182} days! Mandatory disposal required.`
                  : `${182 - custody.days_since_production} days remaining before 6-month constitutional outer limit.`}
              </p>
            </div>
          </div>

          {/* Disposal Route & Auction Stage */}
          <div className="space-y-3.5 rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
            <div className="flex items-center gap-2 border-b border-border/50 pb-3">
              <Gavel className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-bold text-foreground">
                Statutory Disposal Route (Sec 6)
              </h3>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-bold text-foreground">
                {disposal_route.applicable_route}
              </div>
              <div className="inline-block rounded bg-primary/10 px-2 py-0.5 font-mono text-[11px] text-primary">
                {disposal_route.statutory_basis}
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {disposal_route.reasoning}
              </p>
            </div>

            <div className="space-y-1.5 rounded-xl border border-border/60 bg-muted/30 p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-muted-foreground">Auction Readiness:</span>
                <span
                  className={`font-bold ${
                    disposal_route.auction_eligible
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {disposal_route.auction_eligible ? 'ELIGIBLE' : 'INELIGIBLE'}
                </span>
              </div>
              <div className="text-xs font-medium text-foreground">
                {disposal_route.auction_stage}
              </div>
              <div className="text-[11px] text-muted-foreground">
                Timeline:{' '}
                <span className="font-semibold">{disposal_route.time_left_for_auction}</span>
              </div>
            </div>
          </div>

          {/* Next Action Box */}
          <div className="space-y-4 rounded-2xl border-2 border-primary/30 bg-primary/5 p-6 shadow-sm">
            <div className="flex items-center gap-2 text-base font-bold text-primary">
              <Sparkles className="h-5 w-5" />
              <span>Recommended Next Legal Action</span>
            </div>

            <div className="space-y-1.5">
              <h4 className="text-sm font-extrabold leading-snug text-foreground">
                {reasoning.next_action}
              </h4>
              <p className="text-xs text-muted-foreground">
                Competent Authority:{' '}
                <span className="font-semibold text-foreground">{reasoning.action_authority}</span>
              </p>
            </div>

            <div className="space-y-2 border-t border-primary/20 pt-3">
              <div className="text-xs font-bold text-foreground">Procedural Execution Steps:</div>
              <div className="space-y-1.5">
                {reasoning.action_steps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-foreground/80">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>

            <Button
              onClick={handleCopyAction}
              variant="outline"
              size="sm"
              className="w-full gap-2 border-primary/40 text-primary hover:bg-primary/10"
            >
              <FileCheck2 className="h-4 w-4" />
              {copiedAction ? 'Copied to Clipboard!' : 'Copy Action Plan for IO/Court'}
            </Button>
          </div>
        </div>
      </div>

      {/* Mandatory Statutory Disclaimer Footer */}
      <div className="rounded-xl border border-border/60 bg-muted/30 p-4 text-center">
        <p className="text-xs text-muted-foreground">
          <span className="font-bold text-foreground">Disclaimer:</span> Study tool, not legal
          advice. Verify with official Gazette and an advocate. Indian law recognizes no automated
          property forfeiture by passage of detention time.
        </p>
      </div>
    </div>
  );
};
