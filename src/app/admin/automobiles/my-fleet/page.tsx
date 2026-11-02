'use client';

import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Edit2, List, MapPin, RefreshCw, Zap } from 'lucide-react';
import { useState } from 'react';

import { useAdminContext } from '@/app/admin/AdminContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import type { AutomobileAsset } from '@/types/automobiles';

export default function MyFleetPage() {
  const { activeSubType } = useAdminContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const {
    data: vehicles,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['admin', 'automobiles', 'my-fleet', activeSubType, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        subtype: activeSubType,
        status: statusFilter,
      });
      const res = await fetch(`/api/automobiles/vehicles?${params}`);
      if (!res.ok) throw new Error('Failed to fetch vehicles');
      const json = (await res.json()) as { success: boolean; data: AutomobileAsset[] };
      return json.data;
    },
  });

  const filtered = vehicles?.filter(
    (v) =>
      v.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'MOVING':
        return 'bg-status-live-bg text-status-live';
      case 'IDLE':
        return 'bg-status-dev-bg text-status-dev';
      case 'BREAKDOWN':
        return 'bg-destructive/10 text-destructive';
      case 'OFFLINE':
        return 'bg-muted text-foreground';
      default:
        return 'bg-muted text-foreground';
    }
  };

  const getHealthColor = (riskScore: number) => {
    if (riskScore > 75) return 'text-destructive';
    if (riskScore > 50) return 'text-status-dev';
    return 'text-status-live';
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Fleet</h1>
        <p className="mt-2 text-muted-foreground">Manage and monitor all vehicles in your fleet</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1">
              <label className="mb-2 block text-sm font-medium">Search</label>
              <Input
                placeholder="Registration number or vehicle name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full md:w-48">
              <label className="mb-2 block text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="MOVING">Moving</SelectItem>
                  <SelectItem value="IDLE">Idle</SelectItem>
                  <SelectItem value="BREAKDOWN">Breakdown</SelectItem>
                  <SelectItem value="OFFLINE">Offline</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="icon">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Total', count: vehicles?.length || 0 },
          {
            label: 'Active',
            count:
              vehicles?.filter((v) => v.status !== 'IDLE' && v.status !== 'BREAKDOWN').length || 0,
          },
          { label: 'Idle', count: vehicles?.filter((v) => v.status === 'IDLE').length || 0 },
          {
            label: 'Issues',
            count: vehicles?.filter((v) => v.maintenanceRiskScore > 50).length || 0,
          },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="mt-2 text-2xl font-bold">{stat.count}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Vehicles Table */}
      <Card>
        <CardHeader>
          <CardTitle>Fleet Vehicles ({filtered?.length || 0})</CardTitle>
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
              <p>Failed to load vehicles</p>
            </div>
          ) : filtered && filtered.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Registration</TableHead>
                    <TableHead>Vehicle Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Health</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell className="font-mono text-sm font-semibold">
                        {vehicle.registrationNumber}
                      </TableCell>
                      <TableCell className="font-medium">{vehicle.displayName}</TableCell>
                      <TableCell className="text-sm">{vehicle.vehicleType}</TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                            getStatusColor(vehicle.status)
                          )}
                        >
                          {vehicle.status}
                        </span>
                      </TableCell>
                      <TableCell className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3.5 w-3.5" />
                        {vehicle.locationLabel}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Zap
                            className={cn('h-4 w-4', getHealthColor(vehicle.maintenanceRiskScore))}
                          />
                          <span className="text-sm">{vehicle.maintenanceRiskScore}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{vehicle.driverName || '-'}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="gap-2">
                          <Edit2 className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <List className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-muted-foreground">No vehicles found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
