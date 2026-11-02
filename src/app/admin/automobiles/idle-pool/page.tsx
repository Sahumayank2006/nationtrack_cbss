'use client';

import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Badge, Clock, RefreshCw } from 'lucide-react';

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
import type { IdleVehicleRedeployment } from '@/types/admin-automobiles';

export default function IdlePoolPage() {
  const { activeSubType } = useAdminContext();

  const {
    data: idleVehicles,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['admin', 'automobiles', 'idle-pool', activeSubType],
    queryFn: async () => {
      const res = await fetch(`/api/automobiles/idle?minDays=180&subtype=${activeSubType}`);
      if (!res.ok) throw new Error('Failed to fetch idle vehicles');
      const json = (await res.json()) as {
        success: boolean;
        data: IdleVehicleRedeployment[];
      };
      return json.data;
    },
  });

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'GOOD':
        return 'bg-status-live-bg text-status-live';
      case 'FAIR':
        return 'bg-status-dev-bg text-status-dev';
      case 'POOR':
        return 'bg-destructive/10 text-destructive';
      default:
        return 'bg-muted text-foreground';
    }
  };

  const stats = [
    {
      label: 'Total Idle',
      count: idleVehicles?.length || 0,
    },
    {
      label: '6-12 Months',
      count: idleVehicles?.filter((v) => v.idleDays >= 180 && v.idleDays < 365).length || 0,
    },
    {
      label: '12+ Months',
      count: idleVehicles?.filter((v) => v.idleDays >= 365).length || 0,
    },
    {
      label: 'Ready for Reuse',
      count: idleVehicles?.filter((v) => v.readyForReuse).length || 0,
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Idle & Seized Pool</h1>
        <p className="mt-2 text-muted-foreground">
          Vehicles idle for 6+ months - candidates for redeployment or auction
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((stat) => (
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
          <CardTitle>Idle Vehicles</CardTitle>
          <CardDescription>
            Vehicles idle for 6+ months with redeployment suggestions
          </CardDescription>
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
              <p>Failed to load idle vehicles</p>
            </div>
          ) : idleVehicles && idleVehicles.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Registration</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Idle Since</TableHead>
                    <TableHead>Days Idle</TableHead>
                    <TableHead>Condition</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Suggestion</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {idleVehicles.map((vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell className="font-mono font-semibold">
                        {vehicle.registrationNumber}
                      </TableCell>
                      <TableCell className="text-sm">{vehicle.vehicleType}</TableCell>
                      <TableCell className="text-sm">
                        {new Date(vehicle.idleSinceDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-status-dev" />
                          {vehicle.idleDays} days
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                            getConditionColor(vehicle.estimatedCondition)
                          )}
                        >
                          {vehicle.estimatedCondition}
                        </span>
                      </TableCell>
                      <TableCell>
                        {vehicle.readyForReuse && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-status-live-bg px-2.5 py-0.5 text-xs font-medium text-status-live">
                            <Badge className="h-2 w-2" />
                            Ready for Reuse
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{vehicle.suggestedAction}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm">
                          <RefreshCw className="mr-2 h-3.5 w-3.5" />
                          Deploy
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-muted-foreground">No idle vehicles found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
