'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface UtilizationPoint {
  date: string;
  bookings: number;
  occupancyPercent: number;
  idlePercent: number;
}

interface SummaryRow {
  type: string;
  total: number;
  available: number;
  booked: number;
  idle: number;
  restricted: number;
}

const CHART_PRIMARY = 'hsl(var(--primary))';
const CHART_PRIMARY_FAINT = 'hsl(var(--primary) / 0.24)';
const CHART_SUCCESS = 'hsl(var(--status-live))';
const CHART_SUCCESS_FAINT = 'hsl(var(--status-live) / 0.24)';
const CHART_ACCENT = 'hsl(var(--accent-foreground))';

export default function SpacesReportsPage() {
  const [utilization, setUtilization] = useState<UtilizationPoint[]>([]);
  const [summary, setSummary] = useState<SummaryRow[]>([]);
  const [analytics, setAnalytics] = useState<{
    byType: Array<{ type: string; count: number }>;
    byPurpose: Array<{ category: string; count: number }>;
  }>({ byType: [], byPurpose: [] });

  useEffect(() => {
    const load = async () => {
      const [utilRes, summaryRes, analyticsRes] = await Promise.all([
        fetch('/api/spaces/reports/utilization'),
        fetch('/api/spaces/reports/space-summary'),
        fetch('/api/spaces/reports/analytics'),
      ]);

      const utilPayload = await utilRes.json();
      const summaryPayload = await summaryRes.json();
      const analyticsPayload = await analyticsRes.json();

      if (utilPayload.success) setUtilization(utilPayload.data);
      if (summaryPayload.success) setSummary(summaryPayload.data);
      if (analyticsPayload.success) setAnalytics(analyticsPayload.data);
    };

    load();
  }, []);

  const kpi = useMemo(() => {
    const thisMonth = utilization.slice(-30);
    const totalBookings = thisMonth.reduce((sum, item) => sum + item.bookings, 0);
    const avgOccupancy = thisMonth.length
      ? thisMonth.reduce((sum, item) => sum + item.occupancyPercent, 0) / thisMonth.length
      : 0;

    const mostBookedType = [...analytics.byType].sort((a, b) => b.count - a.count)[0]?.type ?? '-';
    const mostIdleType = [...summary].sort((a, b) => b.idle - a.idle)[0]?.type ?? '-';

    return {
      totalBookings,
      avgOccupancy: avgOccupancy.toFixed(1),
      mostBookedType,
      mostIdleType,
    };
  }, [analytics.byType, summary, utilization]);

  return (
    <main id="maincontent" className="container-wide space-y-6 py-8">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Space Reports</h1>
          <p className="text-sm text-muted-foreground">
            Utilization, booking analytics, idle summary, and exports.
          </p>
        </div>
        <a href="/api/spaces/reports/csv">
          <Button>Download CSV</Button>
        </a>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="card-elevated rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Total bookings (30d)</p>
          <p className="mt-2 text-2xl font-bold text-foreground">{kpi.totalBookings}</p>
        </article>
        <article className="card-elevated rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Avg occupancy</p>
          <p className="mt-2 text-2xl font-bold text-foreground">{kpi.avgOccupancy}%</p>
        </article>
        <article className="card-elevated rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Most booked type</p>
          <p className="mt-2 text-2xl font-bold text-foreground">{kpi.mostBookedType}</p>
        </article>
        <article className="card-elevated rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Most idle type</p>
          <p className="mt-2 text-2xl font-bold text-foreground">{kpi.mostIdleType}</p>
        </article>
      </section>

      <Tabs defaultValue="utilization" className="space-y-4">
        <TabsList className="h-auto flex-wrap justify-start gap-2 bg-transparent p-0">
          <TabsTrigger value="utilization">Utilization</TabsTrigger>
          <TabsTrigger value="analytics">Booking Analytics</TabsTrigger>
          <TabsTrigger value="idle">Idle Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="utilization" className="space-y-4">
          <article className="card-elevated rounded-xl p-5">
            <h2 className="text-lg font-semibold text-foreground">
              Bookings and Utilization Trend
            </h2>
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={utilization}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="bookings"
                    stroke={CHART_PRIMARY}
                    fill={CHART_PRIMARY_FAINT}
                    name="Bookings"
                  />
                  <Area
                    type="monotone"
                    dataKey="occupancyPercent"
                    stroke={CHART_SUCCESS}
                    fill={CHART_SUCCESS_FAINT}
                    name="Occupancy %"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </article>
        </TabsContent>

        <TabsContent value="analytics" className="grid gap-4 lg:grid-cols-2">
          <article className="card-elevated rounded-xl p-5">
            <h2 className="text-lg font-semibold text-foreground">Bookings by Space Type</h2>
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.byType}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill={CHART_PRIMARY} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className="card-elevated rounded-xl p-5">
            <h2 className="text-lg font-semibold text-foreground">Bookings by Purpose</h2>
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.byPurpose}
                    dataKey="count"
                    nameKey="category"
                    outerRadius={90}
                    fill={CHART_ACCENT}
                  />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </article>
        </TabsContent>

        <TabsContent value="idle" className="card-elevated rounded-xl p-5">
          <h2 className="text-lg font-semibold text-foreground">Per-space-type Summary</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="pb-2">Type</th>
                  <th className="pb-2">Total</th>
                  <th className="pb-2">Available</th>
                  <th className="pb-2">Booked</th>
                  <th className="pb-2">Idle</th>
                  <th className="pb-2">Restricted</th>
                </tr>
              </thead>
              <tbody>
                {summary.map((row) => (
                  <tr key={row.type} className="border-b last:border-0">
                    <td className="py-2">{row.type}</td>
                    <td className="py-2">{row.total}</td>
                    <td className="py-2">{row.available}</td>
                    <td className="py-2">{row.booked}</td>
                    <td className="py-2">{row.idle}</td>
                    <td className="py-2">{row.restricted}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
}
