'use client';

import { useQuery } from '@tanstack/react-query';
import { AlertCircle, DollarSign, ExternalLink, Gavel, TrendingUp } from 'lucide-react';

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
import type { AuctionQueueItem } from '@/types/admin-automobiles';

export default function AuctionQueuePage() {
  const { activeSubType } = useAdminContext();

  const {
    data: auctionItems,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['admin', 'automobiles', 'auction-queue', activeSubType],
    queryFn: async () => {
      const res = await fetch(`/api/automobiles/auction-queue?subtype=${activeSubType}`);
      if (!res.ok) throw new Error('Failed to fetch auction queue');
      const json = (await res.json()) as {
        success: boolean;
        data: AuctionQueueItem[];
      };
      return json.data;
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ELIGIBLE':
        return 'bg-status-dev-bg text-status-dev';
      case 'LISTED':
        return 'bg-accent text-accent-foreground';
      case 'ACTIVE':
        return 'bg-status-live-bg text-status-live';
      case 'SOLD':
        return 'bg-muted text-foreground';
      default:
        return 'bg-muted text-foreground';
    }
  };

  const stats = [
    {
      label: 'Eligible for Auction',
      count: auctionItems?.filter((a) => a.auctionStatus === 'ELIGIBLE').length || 0,
    },
    {
      label: 'On GeM Portal',
      count: auctionItems?.filter((a) => a.gemLoadNumber).length || 0,
    },
    {
      label: 'Estimated Revenue',
      value: `Rs ${(auctionItems?.reduce((sum, a) => sum + (a.estimatedRevenue || 0), 0) || 0) / 100000}L`,
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Auction Queue</h1>
        <p className="mt-2 text-muted-foreground">
          Vehicles idle for 12+ months eligible for GeM auction
        </p>
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

      {/* Auction Items Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gavel className="h-5 w-5" />
            Auction Items
          </CardTitle>
          <CardDescription>Vehicles awaiting or in active GeM auction</CardDescription>
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
              <p>Failed to load auction queue</p>
            </div>
          ) : auctionItems && auctionItems.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Registration</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Idle Since</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Estimated Value</TableHead>
                    <TableHead>GeM Reference</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auctionItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono font-semibold">
                        {item.registrationNumber}
                      </TableCell>
                      <TableCell className="text-sm">{item.vehicleType}</TableCell>
                      <TableCell className="text-sm">
                        {new Date(item.idleSinceDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                            getStatusColor(item.auctionStatus)
                          )}
                        >
                          {item.auctionStatus}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-status-live" />
                          Rs
                          {(item.estimatedValue / 100000).toFixed(1)}L
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.gemLoadNumber ? (
                          <span className="font-mono text-xs text-accent-foreground">
                            {item.gemLoadNumber}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.gemPortalLink ? (
                          <Button variant="outline" size="sm" asChild>
                            <a href={item.gemPortalLink} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="mr-2 h-3.5 w-3.5" />
                              View on GeM
                            </a>
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm">
                            <TrendingUp className="mr-2 h-3.5 w-3.5" />
                            Post to GeM
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
              <p className="text-muted-foreground">No vehicles eligible for auction</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
