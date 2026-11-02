'use client';

import { useQuery } from '@tanstack/react-query';
import { AlertCircle, AlertTriangle, Bell, CheckCircle2 } from 'lucide-react';

import { useAdminContext } from '@/app/admin/AdminContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { AdminComplianceAlert } from '@/types/admin-automobiles';

export default function CompliancePage() {
  const { activeSubType } = useAdminContext();

  const {
    data: alerts,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['admin', 'automobiles', 'compliance', activeSubType],
    queryFn: async () => {
      const res = await fetch(`/api/automobiles/compliance-alerts?subtype=${activeSubType}`);
      if (!res.ok) throw new Error('Failed to fetch compliance alerts');
      const json = (await res.json()) as {
        success: boolean;
        data: AdminComplianceAlert[];
      };
      return json.data;
    },
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-destructive/10 text-destructive';
      case 'WARNING':
        return 'bg-status-dev-bg text-status-dev';
      case 'OK':
        return 'bg-status-live-bg text-status-live';
      default:
        return 'bg-muted text-foreground';
    }
  };

  const stats = [
    {
      label: 'Critical Alerts',
      count: alerts?.filter((a) => a.severity === 'CRITICAL').length || 0,
      icon: AlertTriangle,
    },
    {
      label: 'Warnings',
      count: alerts?.filter((a) => a.severity === 'WARNING').length || 0,
      icon: AlertCircle,
    },
    {
      label: 'Compliant',
      count: alerts?.filter((a) => a.severity === 'OK').length || 0,
      icon: CheckCircle2,
    },
  ];

  const getAlertTypeMarker = (type: string) => {
    switch (type) {
      case 'PUC':
        return 'PUC';
      case 'INSURANCE':
        return 'INS';
      case 'FITNESS':
        return 'FIT';
      case 'EMISSION':
        return 'EMI';
      default:
        return 'ALT';
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Compliance Alerts</h1>
        <p className="mt-2 text-muted-foreground">
          PUC, Insurance, Fitness, and Emission certificate tracking
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="mt-2 text-2xl font-bold">{stat.count}</p>
                </div>
                <stat.icon className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Compliance Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Document Expiry Calendar
          </CardTitle>
          <CardDescription>Track certificate renewal and send SMS alerts</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : isError ? (
            <div className="flex items-center gap-2 rounded border border-destructive/20 bg-destructive/10 p-4 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <p>Failed to load compliance alerts</p>
            </div>
          ) : alerts && alerts.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Document Type</TableHead>
                    <TableHead>Expires On</TableHead>
                    <TableHead>Days Remaining</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Renewal Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alerts.map((alert) => (
                    <TableRow key={alert.id}>
                      <TableCell className="font-mono font-semibold">
                        {alert.registrationNumber}
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-2">
                          {getAlertTypeMarker(alert.alertType)} {alert.alertType}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(alert.expiresOn).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-medium">{alert.daysRemaining} days</TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                            getSeverityColor(alert.severity)
                          )}
                        >
                          {alert.severity}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">{alert.renewalStatus}</TableCell>
                      <TableCell className="text-right">
                        {alert.severity === 'CRITICAL' && (
                          <Button variant="destructive" size="sm">
                            Send SMS Alert
                          </Button>
                        )}
                        {alert.renewalStatus === 'PENDING' && (
                          <Button variant="outline" size="sm">
                            Mark Renewed
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-muted-foreground">All vehicles are compliant</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
