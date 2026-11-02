'use client';

import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Clock, Plus, Wrench } from 'lucide-react';

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
import type { MaintenanceTicket } from '@/types/admin-automobiles';

export default function MaintenancePage() {
  const { activeSubType } = useAdminContext();

  const {
    data: tickets,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['admin', 'automobiles', 'maintenance', activeSubType],
    queryFn: async () => {
      const res = await fetch(`/api/automobiles/maintenance?subtype=${activeSubType}`);
      if (!res.ok) throw new Error('Failed to fetch maintenance tickets');
      const json = (await res.json()) as {
        success: boolean;
        data: MaintenanceTicket[];
      };
      return json.data;
    },
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-destructive/10 text-destructive';
      case 'HIGH':
        return 'bg-status-dev-bg text-status-dev';
      case 'MEDIUM':
        return 'bg-status-dev-bg text-status-dev';
      case 'LOW':
        return 'bg-accent text-accent-foreground';
      default:
        return 'bg-muted text-foreground';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'REPORTED':
        return 'bg-muted text-foreground';
      case 'ASSIGNED':
        return 'bg-accent text-accent-foreground';
      case 'IN_PROGRESS':
        return 'bg-status-dev-bg text-status-dev';
      case 'RESOLVED':
        return 'bg-status-live-bg text-status-live';
      default:
        return 'bg-muted text-foreground';
    }
  };

  const stats = [
    {
      label: 'Open Tickets',
      count: tickets?.filter((t) => t.status !== 'RESOLVED').length || 0,
    },
    {
      label: 'Critical',
      count: tickets?.filter((t) => t.severity === 'CRITICAL').length || 0,
    },
    {
      label: 'Total Cost',
      value: `Rs ${(tickets?.reduce((sum, t) => sum + (t.estimatedCost || 0), 0) || 0) / 100000}L`,
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Maintenance Tickets</h1>
          <p className="mt-2 text-muted-foreground">Track field breakdowns and service requests</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Ticket
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="mt-2 text-2xl font-bold">{'value' in stat ? stat.value : stat.count}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Maintenance Tickets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Service Requests
          </CardTitle>
          <CardDescription>Field breakdowns and maintenance requests</CardDescription>
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
              <p>Failed to load tickets</p>
            </div>
          ) : tickets && tickets.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Issue</TableHead>
                    <TableHead>Reported</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Est. Cost</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell className="font-mono font-semibold">
                        {ticket.registrationNumber}
                      </TableCell>
                      <TableCell className="font-medium">{ticket.title}</TableCell>
                      <TableCell className="text-sm">
                        {new Date(ticket.reportedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                            getSeverityColor(ticket.severity)
                          )}
                        >
                          {ticket.severity}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                            getStatusColor(ticket.status)
                          )}
                        >
                          {ticket.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">{ticket.assignedTo || '-'}</TableCell>
                      <TableCell className="text-sm">
                        Rs {(ticket.estimatedCost || 0) / 1000}k
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm">
                          <Clock className="mr-2 h-3.5 w-3.5" />
                          Manage
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-muted-foreground">No maintenance tickets</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
