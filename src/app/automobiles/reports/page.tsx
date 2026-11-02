'use client';

import { Download, FileText, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ComplianceAlert, UtilizationReportResponse } from '@/types/automobiles';

interface AnalyticsPayload {
  report: UtilizationReportResponse;
}

interface CompliancePayload {
  alerts: ComplianceAlert[];
}

const CHART_PRIMARY = 'hsl(var(--primary))';
const CHART_PRIMARY_FAINT = 'hsl(var(--primary) / 0.24)';
const CHART_WARNING = 'hsl(var(--status-dev))';
const CHART_WARNING_FAINT = 'hsl(var(--status-dev) / 0.24)';
const PIE_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--status-live))',
  'hsl(var(--status-dev))',
  'hsl(var(--destructive))',
  'hsl(var(--muted-foreground))',
  'hsl(var(--accent-foreground))',
];

export default function AutomobileReportsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [days, setDays] = useState<7 | 30>(30);
  const [report, setReport] = useState<UtilizationReportResponse | null>(null);
  const [alerts, setAlerts] = useState<ComplianceAlert[]>([]);
  const [downloadingCsv, setDownloadingCsv] = useState(false);

  useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        const [analyticsResponse, complianceResponse] = await Promise.all([
          fetch(`/api/automobiles/reports/analytics?days=${days}`),
          fetch('/api/automobiles/compliance'),
        ]);

        const analytics = (await analyticsResponse.json()) as AnalyticsPayload;
        const compliance = (await complianceResponse.json()) as CompliancePayload;

        if (!active) return;
        setReport(analytics.report);
        setAlerts(compliance.alerts);
      } catch {
        if (!active) return;
        setError('Unable to load automobile reports right now.');
      } finally {
        if (!active) return;
        setLoading(false);
      }
    };

    run();
    return () => {
      active = false;
    };
  }, [days]);

  const complianceRows = useMemo(
    () =>
      alerts
        .filter((item) => item.severity !== 'OK')
        .sort((a, b) => a.daysRemaining - b.daysRemaining),
    [alerts]
  );

  const downloadCsv = async () => {
    try {
      setDownloadingCsv(true);
      const response = await fetch('/api/automobiles/reports/csv');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'nationtrack-utilization.csv';
      anchor.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloadingCsv(false);
    }
  };

  if (loading) {
    return (
      <section className="container-wide space-y-4 py-8">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-80 rounded-xl" />
      </section>
    );
  }

  if (error || !report) {
    return (
      <section className="container-wide py-8">
        <article className="rounded-xl border border-destructive/20 bg-destructive/10 p-6">
          <p className="font-semibold text-foreground">Reports unavailable</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {error || 'No data returned by report service.'}
          </p>
        </article>
      </section>
    );
  }

  return (
    <section className="container-wide space-y-6 py-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">Automobile Reports</h1>
          <p className="text-sm text-muted-foreground">
            Utilization, compliance, and fleet summary insights
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant={days === 7 ? 'default' : 'outline'} onClick={() => setDays(7)}>
            Last 7 days
          </Button>
          <Button variant={days === 30 ? 'default' : 'outline'} onClick={() => setDays(30)}>
            Last 30 days
          </Button>
          <Button variant="outline" onClick={downloadCsv} disabled={downloadingCsv}>
            {downloadingCsv ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Export CSV
          </Button>
          <a href="/api/automobiles/reports/utilization" download>
            <Button>
              <FileText className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </a>
        </div>
      </header>

      <div className="grid gap-3 md:grid-cols-3">
        <article className="rounded-xl border bg-card p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Total KM</p>
          <p className="mt-2 text-3xl font-bold text-foreground">
            {report.summary.totalKm.toLocaleString('en-IN')}
          </p>
        </article>
        <article className="rounded-xl border bg-card p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Trips/Vehicle/Week
          </p>
          <p className="mt-2 text-3xl font-bold text-foreground">
            {report.summary.averageTripsPerVehiclePerWeek}
          </p>
        </article>
        <article className="rounded-xl border bg-card p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Utilization %</p>
          <p className="mt-2 text-3xl font-bold text-foreground">
            {report.summary.utilizationPercent}%
          </p>
        </article>
      </div>

      <Tabs defaultValue="utilization" className="space-y-4">
        <TabsList>
          <TabsTrigger value="utilization">Utilization</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="fleet">Fleet Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="utilization" className="space-y-4">
          <article className="rounded-xl border bg-card p-4">
            <h2 className="text-lg font-semibold text-foreground">Daily Fleet Distance</h2>
            <div className="mt-4 h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={report.points}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="activeKm"
                    stroke={CHART_PRIMARY}
                    fill={CHART_PRIMARY_FAINT}
                    name="Active KM"
                  />
                  <Area
                    type="monotone"
                    dataKey="idleKm"
                    stroke={CHART_WARNING}
                    fill={CHART_WARNING_FAINT}
                    name="Idle KM"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </article>
        </TabsContent>

        <TabsContent value="compliance">
          <article className="rounded-xl border bg-card p-4">
            <h2 className="text-lg font-semibold text-foreground">Expiring Documents</h2>
            <div className="mt-4 overflow-auto">
              <table className="w-full min-w-[720px] border-collapse text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2">Vehicle</th>
                    <th className="pb-2">Type</th>
                    <th className="pb-2">Expiry</th>
                    <th className="pb-2">Days Remaining</th>
                    <th className="pb-2">Severity</th>
                  </tr>
                </thead>
                <tbody>
                  {complianceRows.map((row) => (
                    <tr key={row.id} className="border-b last:border-0">
                      <td className="py-2">{row.registrationNumber}</td>
                      <td className="py-2">{row.type}</td>
                      <td className="py-2">
                        {new Date(row.expiresOn).toLocaleDateString('en-IN')}
                      </td>
                      <td className="py-2">{row.daysRemaining}</td>
                      <td className="py-2">
                        <span
                          className={
                            row.severity === 'CRITICAL' ? 'text-destructive' : 'text-status-dev'
                          }
                        >
                          {row.severity}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </TabsContent>

        <TabsContent value="fleet" className="space-y-4">
          <article className="rounded-xl border bg-card p-4">
            <h2 className="text-lg font-semibold text-foreground">Fleet Type Distribution</h2>
            <div className="mt-4 h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={report.fleetSummary}
                    dataKey="total"
                    nameKey="sectorLabel"
                    outerRadius={110}
                    label
                  >
                    {report.fleetSummary.map((item, index) => (
                      <Cell key={item.sector} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className="rounded-xl border bg-card p-4">
            <h2 className="text-lg font-semibold text-foreground">Department Breakdown</h2>
            <div className="mt-4 overflow-auto">
              <table className="w-full min-w-[760px] border-collapse text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2">Department</th>
                    <th className="pb-2">Total</th>
                    <th className="pb-2">Active</th>
                    <th className="pb-2">Idle</th>
                    <th className="pb-2">Maintenance</th>
                    <th className="pb-2">Offline</th>
                    <th className="pb-2">Utilization %</th>
                  </tr>
                </thead>
                <tbody>
                  {report.fleetSummary.map((row) => (
                    <tr key={row.sector} className="border-b last:border-0">
                      <td className="py-2">{row.sectorLabel}</td>
                      <td className="py-2">{row.total}</td>
                      <td className="py-2">{row.moving}</td>
                      <td className="py-2">{row.idle}</td>
                      <td className="py-2">{row.maintenance}</td>
                      <td className="py-2">{row.offline}</td>
                      <td className="py-2">{row.utilizationPercent}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </TabsContent>
      </Tabs>
    </section>
  );
}
