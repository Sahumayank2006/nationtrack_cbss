'use client';

import { useQuery } from '@tanstack/react-query';
import { AlertCircle, BarChart3, TrendingUp } from 'lucide-react';

import { useAdminContext } from '@/app/admin/AdminContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { RevenueDashboard } from '@/types/admin-automobiles';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const CHART_PRIMARY = 'hsl(var(--primary))';
const CHART_SUCCESS = 'hsl(var(--status-live))';

export default function RevenuePage() {
  const { activeSubType } = useAdminContext();

  const {
    data: revenue,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['admin', 'automobiles', 'revenue', activeSubType],
    queryFn: async () => {
      const res = await fetch(`/api/automobiles/revenue-dashboard?subtype=${activeSubType}`);
      if (!res.ok) throw new Error('Failed to fetch revenue data');
      const json = (await res.json()) as {
        success: boolean;
        data: RevenueDashboard;
      };
      return json.data;
    },
  });

  const stats = [
    {
      label: 'Total Revenue',
      value: `Rs ${(revenue?.totalRevenue || 0) / 100000}L`,
      subtext: 'from vehicle auctions',
    },
    {
      label: 'Vehicles Sold',
      value: revenue?.soldCount || 0,
      subtext: 'through GeM portal',
    },
    {
      label: 'Average Price',
      value: `Rs ${(revenue?.averagePrice || 0) / 100000}L`,
      subtext: 'per vehicle',
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Revenue Dashboard</h1>
        <p className="mt-2 text-muted-foreground">Track auction revenue and performance metrics</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="mt-2 text-2xl font-bold">{stat.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{stat.subtext}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Monthly Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Monthly Revenue Trend
          </CardTitle>
          <CardDescription>Sales count and revenue by month</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-80 w-full" />
          ) : isError ? (
            <div className="flex items-center gap-2 rounded border border-destructive/20 bg-destructive/10 p-4 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <p>Failed to load revenue data</p>
            </div>
          ) : revenue?.yearlyBreakdown && revenue.yearlyBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenue.yearlyBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value: any) => {
                    if (typeof value === 'number' && value > 1000) {
                      return `Rs ${(value / 100000).toFixed(1)}L`;
                    }
                    return value;
                  }}
                />
                <Legend />
                <Bar dataKey="count" name="Count" fill={CHART_PRIMARY} />
                <Bar dataKey="revenue" name="Revenue (Rs)" fill={CHART_SUCCESS} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-80 items-center justify-center text-muted-foreground">
              No revenue data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Vehicle Types */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Best Performing Vehicle Types
          </CardTitle>
          <CardDescription>Revenue and sales by vehicle type</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : revenue?.topVehicleTypes && revenue.topVehicleTypes.length > 0 ? (
            <div className="space-y-3">
              {revenue.topVehicleTypes.map((type) => (
                <div key={type.type} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{type.type}</p>
                    <div className="flex gap-4">
                      <span className="text-sm text-muted-foreground">{type.count} sold</span>
                      <span className="font-semibold">
                        Rs {(type.revenue / 100000).toFixed(1)}L
                      </span>
                    </div>
                  </div>
                  <div className="h-2 overflow-hidden rounded bg-muted">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-status-live"
                      style={{
                        width: `${(type.revenue / (revenue.topVehicleTypes[0]?.revenue || 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-40 items-center justify-center text-muted-foreground">
              No vehicle type data
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
