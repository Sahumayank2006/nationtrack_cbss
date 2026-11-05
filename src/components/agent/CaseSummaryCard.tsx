'use client';

import {
  AlertTriangle,
  CalendarDays,
  ClipboardCheck,
  Clock3,
  Download,
  FileText,
  Gavel,
  Info,
  LockKeyhole,
  MapPin,
  Scale,
  UnlockKeyhole,
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
  const [showReuseRule, setShowReuseRule] = useState(false);
  const { record, legal_map, custody, disposal_route, status, reasoning } = result;
  const criticalAlert = reasoning.alerts.find((alert) => alert.level === 'critical');
  const custodyLimit = 182;
  const custodyProgress = Math.min(
    100,
    Math.round((custody.days_since_production / custodyLimit) * 100)
  );

  const handleDownloadPdf = async () => {
    try {
      setDownloadingPdf(true);
      const pdfBytes = await generateSeizedVehiclePdf(result);
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `BharatTrack_${record.vehicle_no}_${record.fir_no.replace('/', '-')}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleCopyAction = async () => {
    const text = `${reasoning.next_action}\nAuthority: ${reasoning.action_authority}\n${reasoning.action_steps
      .map((step, index) => `${index + 1}. ${step}`)
      .join('\n')}`;
    await navigator.clipboard.writeText(text);
    setCopiedAction(true);
    window.setTimeout(() => setCopiedAction(false), 2200);
  };

  const statusLocked = status.status === 'Legally Locked';

  return (
    <div className="space-y-6">
      <section className="wooden-tile sticky top-4 z-20 p-5 sm:p-6" aria-label="Case summary">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                {record.vehicle_no}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${
                  statusLocked
                    ? 'border-brick/30 bg-brick/10 text-brick'
                    : status.status === 'Fully Usable (Rajyasaat)'
                      ? 'border-forest/30 bg-forest/10 text-forest'
                      : 'border-brass/30 bg-brass/10 text-brass-ink'
                }`}
              >
                {statusLocked ? (
                  <LockKeyhole className="h-3.5 w-3.5" aria-label="Locked status" />
                ) : status.status === 'Fully Usable (Rajyasaat)' ? (
                  <UnlockKeyhole className="h-3.5 w-3.5" aria-label="Usable status" />
                ) : (
                  <Scale className="h-3.5 w-3.5" aria-label="Conditional status" />
                )}
                {statusLocked ? 'Legally locked' : status.status}
              </span>
            </div>
            <p className="mt-2 text-sm font-medium text-ink">
              {record.make_model} <span className="text-ink-muted">·</span> {record.type}{' '}
              <span className="text-ink-muted">·</span> ₹{record.est_value.toLocaleString('en-IN')}
            </p>
            <div className="mt-4 grid gap-3 text-sm text-ink-muted sm:grid-cols-3">
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-brass-ink" aria-label="FIR number" />
                <span className="font-mono">{record.fir_no}</span>
              </span>
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-brass-ink" aria-label="Police station" />
                {record.police_station}
              </span>
              <span className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-brass-ink" aria-label="Seizure date" />
                Seized {record.seizure_date}
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="shrink-0 gap-2 border-brass bg-paper text-brass-ink hover:bg-brass/10"
          >
            <Download className="h-4 w-4" aria-label="Download PDF" />
            {downloadingPdf ? 'Preparing PDF…' : 'Download PDF'}
          </Button>
        </div>
      </section>

      <section className="wooden-tile relative overflow-hidden p-5 sm:p-6">
        {criticalAlert && (
          <div className="-mx-5 -mt-5 mb-5 flex items-center gap-2 bg-brick px-5 py-2.5 text-sm font-bold text-white sm:-mx-6 sm:-mt-6 sm:px-6">
            <AlertTriangle className="h-4 w-4" aria-label="Critical alert" />
            {criticalAlert.title}
          </div>
        )}
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-sm font-bold text-brass-ink">
              <ClipboardCheck className="h-5 w-5" aria-label="Action plan" />
              What to do now
            </div>
            <h2 className="mt-3 font-serif text-2xl font-semibold leading-tight text-ink">
              {reasoning.next_action}
            </h2>
            <p className="mt-2 text-sm text-ink-muted">
              Authority:{' '}
              <span className="font-semibold text-ink">{reasoning.action_authority}</span>
            </p>
            <ol className="mt-5 grid gap-3 sm:grid-cols-3">
              {reasoning.action_steps.slice(0, 3).map((step, index) => (
                <li
                  key={`${record.vehicle_no}-action-${index}`}
                  className="flex gap-2 text-sm text-ink"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brass text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
          <Button
            onClick={handleCopyAction}
            className="shrink-0 gap-2 bg-brass text-white hover:bg-brass-ink"
          >
            <ClipboardCheck className="h-4 w-4" aria-label="Copy action plan" />
            {copiedAction ? 'Copied' : 'Copy action plan'}
          </Button>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <div className="space-y-6">
          <section className="wooden-tile p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-brass-ink" aria-label="Legal basis" />
              <h2 className="font-serif text-xl font-semibold text-ink">Legal basis</h2>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="paper-inset p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  Offence
                </p>
                <p className="mt-1 font-mono text-sm font-bold text-ink">{legal_map.bns_section}</p>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                  {legal_map.offence_brief}
                </p>
              </div>
              <div className="paper-inset p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  Governing law
                </p>
                <p className="mt-1 font-mono text-sm font-bold text-ink">
                  {legal_map.seizure_disposal_law}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                  Custody and disposal must follow the court-led procedure.
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-ink">{legal_map.plain_explanation}</p>
            <button
              type="button"
              onClick={() => setShowReuseRule((open) => !open)}
              className="mt-4 flex w-full items-center justify-between border-t border-oak pt-4 text-left text-sm font-semibold text-ink"
              aria-expanded={showReuseRule}
            >
              <span className="flex items-center gap-2">
                <Info className="h-4 w-4 text-brass-ink" aria-label="Information" />
                Can the government use this vehicle?
              </span>
              <span className="text-brass-ink">{showReuseRule ? 'Hide' : 'View'}</span>
            </button>
            {showReuseRule && (
              <p className="mt-3 rounded-xl bg-brass/10 p-3 text-sm text-ink">
                {legal_map.government_use_rule}
              </p>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="wooden-tile p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <Clock3 className="h-5 w-5 text-brass-ink" aria-label="Custody time" />
              <h2 className="font-serif text-xl font-semibold text-ink">Custody time</h2>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="paper-inset p-4">
                <strong className="block text-3xl font-bold text-ink">
                  {custody.days_since_seizure}
                </strong>
                <span className="text-sm text-ink-muted">days in custody</span>
              </div>
              <div className="paper-inset p-4">
                <strong className="block text-3xl font-bold text-ink">
                  {custody.days_since_production}
                </strong>
                <span className="text-sm text-ink-muted">since court production</span>
              </div>
            </div>
            <div className="mt-5">
              <div className="flex justify-between text-sm font-semibold text-ink">
                <span>6-month outer limit</span>
                <span>{custodyProgress}%</span>
              </div>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-oak/30">
                <div
                  className="h-full rounded-full bg-brass"
                  style={{ width: `${custodyProgress}%` }}
                />
              </div>
              <p className="mt-2 text-sm text-ink-muted">
                {Math.max(0, custodyLimit - custody.days_since_production)} days remaining
              </p>
            </div>
          </section>

          <section className="wooden-tile p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <Gavel className="h-5 w-5 text-brass-ink" aria-label="Disposal route" />
              <h2 className="font-serif text-xl font-semibold text-ink">Disposal route</h2>
            </div>
            <p className="mt-4 text-base font-semibold leading-relaxed text-ink">
              {disposal_route.applicable_route}
            </p>
            <span
              className={`mt-4 inline-flex rounded-full px-3 py-1 text-sm font-bold ${
                disposal_route.auction_eligible
                  ? 'bg-forest/10 text-forest'
                  : 'bg-brick/10 text-brick'
              }`}
            >
              Auction: {disposal_route.auction_eligible ? 'Eligible' : 'Not eligible'}
            </span>
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">
              {disposal_route.reasoning}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
