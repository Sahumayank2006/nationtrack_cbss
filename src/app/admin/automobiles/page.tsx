'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { LucideIcon } from 'lucide-react';
import { Activity, Bell, Car, Clock3, FileDown, Gavel, MapPin, Wrench } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { useAdminContext } from '@/app/admin/AdminContext';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { AdminSummary } from '@/types/admin';
import type { IdleVehicleRedeployment, VehicleBookingRequest } from '@/types/admin-automobiles';
import type { AutomobileAsset } from '@/types/automobiles';

const AutomobileMapDashboard = dynamic(
  () =>
    import('@/components/automobiles/AutomobileMapDashboard').then(
      (mod) => mod.AutomobileMapDashboard
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[360px] items-center justify-center rounded-xl border border-border bg-card">
        <p className="text-sm text-muted-foreground">Loading live map...</p>
      </div>
    ),
  }
);

type DashboardCard = {
  label: string;
  value: number;
  description: string;
  icon: LucideIcon;
};

const toSubtypeForAutomobile = (subType: string): string | null => {
  const map: Record<string, string | null> = {
    ALL: null,
    AMBULANCE: 'AMBULANCE_108',
    PATROL: 'POLICE_PATROL',
    WASTE_TRUCK: 'GMC_WASTE',
    PWD_MACHINERY: 'PWD_HEAVY',
    HEALTH_VAN: 'HEALTH_VAN',
    ELECTION: 'ELECTION_REQUISITION',
    SEIZED: null,
  };

  return map[subType] ?? null;
};

const fetchJson = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return (await response.json()) as T;
};

export default function AutomobileAdminDashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { activeSubType } = useAdminContext();

  const summaryQuery = useQuery({
    queryKey: ['admin', 'automobile', 'summary', activeSubType],
    queryFn: async () => {
      const json = await fetchJson<{ success: boolean; data: AdminSummary }>(
        `/api/automobiles/admin-summary?type=${encodeURIComponent(activeSubType)}`
      );
      return json.data;
    },
    refetchInterval: 30_000,
  });

  const pendingBookingsQuery = useQuery({
    queryKey: ['admin', 'automobile', 'pending-bookings', activeSubType],
    queryFn: async () => {
      const json = await fetchJson<{ success: boolean; data: VehicleBookingRequest[] }>(
        `/api/automobiles/bookings?status=PENDING&subtype=${encodeURIComponent(activeSubType)}`
      );
      return json.data;
    },
    refetchInterval: 30_000,
  });

  const vehiclesQuery = useQuery({
    queryKey: ['admin', 'automobile', 'vehicles', activeSubType],
    queryFn: async () => {
      const json = await fetchJson<{ success: boolean; data: AutomobileAsset[] }>(
        `/api/automobiles/vehicles?subtype=${encodeURIComponent(activeSubType)}&status=ALL`
      );
      return json.data;
    },
    refetchInterval: 30_000,
  });

  const idleQueueQuery = useQuery({
    queryKey: ['admin', 'automobile', 'idle-queue', activeSubType],
    queryFn: async () => {
      const json = await fetchJson<{ success: boolean; data: IdleVehicleRedeployment[] }>(
        `/api/automobiles/idle?subtype=${encodeURIComponent(activeSubType)}&minDays=365`
      );
      return json.data;
    },
    refetchInterval: 30_000,
  });

  const batchApproveMutation = useMutation({
    mutationFn: async () => {
      const pendingIds = (pendingBookingsQuery.data ?? []).map((item) => item.id);
      if (pendingIds.length === 0) {
        return { approvedCount: 0 };
      }

      const response = await fetch('/api/automobiles/bookings/batch-approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingIds: pendingIds,
          approverName: 'Admin',
          approvalComments: 'Approved from dashboard quick action',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to batch approve pending bookings');
      }

      const json = (await response.json()) as {
        success: boolean;
        data: { approvedCount: number };
      };

      return json.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'automobile', 'pending-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'automobiles', 'booking-requests'] });
      toast.success(
        data.approvedCount > 0
          ? `${data.approvedCount} pending requests approved`
          : 'No pending requests to approve'
      );
    },
    onError: () => {
      toast.error('Unable to approve pending requests');
    },
  });

  const idleOver12Months = (idleQueueQuery.data ?? []).filter(
    (item) => item.idleDays >= 365
  ).length;
  const bookedVehicles = new Set(
    (pendingBookingsQuery.data ?? [])
      .filter((item) => item.status !== 'REJECTED')
      .map((item) => item.vehicleId)
  ).size;

  const cards: DashboardCard[] = [
    {
      label: 'Total Vehicles',
      value: summaryQuery.data?.total ?? 0,
      description: 'All registered fleet units',
      icon: Car,
    },
    {
      label: 'Active Now',
      value: summaryQuery.data?.byStatus.MOVING ?? 0,
      description: 'Vehicles currently moving',
      icon: Activity,
    },
    {
      label: 'Idle Fleet',
      value: summaryQuery.data?.idleCount ?? 0,
      description: 'Units beyond idle threshold',
      icon: Clock3,
    },
    {
      label: 'Maintenance',
      value: summaryQuery.data?.byStatus.BREAKDOWN ?? 0,
      description: 'Fleet in breakdown or maintenance',
      icon: Wrench,
    },
    {
      label: 'Pending Approvals',
      value: pendingBookingsQuery.data?.length ?? summaryQuery.data?.pendingApprovals ?? 0,
      description: 'Actions waiting for command desk',
      icon: Bell,
    },
    {
      label: 'Booked Vehicles',
      value: bookedVehicles,
      description: 'Vehicles reserved in active workflow',
      icon: Activity,
    },
    {
      label: 'Idle > 12 Months',
      value: idleOver12Months,
      description: 'Vehicles eligible for auction queue',
      icon: Clock3,
    },
  ];

  const loading =
    summaryQuery.isLoading || pendingBookingsQuery.isLoading || idleQueueQuery.isLoading;
  const quickVehicles = (vehiclesQuery.data ?? []).slice(0, 6);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-[30px]">
            Automobiles Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Fleet operations and transport command activity.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="institutional"
            size="sm"
            className="gap-2"
            onClick={() => batchApproveMutation.mutate()}
            disabled={batchApproveMutation.isPending}
          >
            <Bell className="h-4 w-4" aria-hidden />
            {batchApproveMutation.isPending ? 'Approving...' : 'Approve All Pending'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => router.push('/admin/automobiles/auction-queue')}
          >
            <Gavel className="h-4 w-4" aria-hidden />
            Flag for Auction
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() =>
              window.open('/api/automobiles/reports/csv', '_blank', 'noopener,noreferrer')
            }
          >
            <FileDown className="h-4 w-4" aria-hidden />
            Export Report
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' });
              router.push('/admin');
            }}
          >
            Sign out
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      ) : (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <article
              key={card.label}
              className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm"
            >
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-muted">
                  <card.icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="text-xs font-semibold">{card.label}</span>
              </div>
              <p className="mt-2 text-3xl font-bold text-foreground">{card.value}</p>
              <p className="text-xs text-muted-foreground">{card.description}</p>
            </article>
          ))}
        </section>
      )}

      <section className="grid gap-4 xl:grid-cols-[1.8fr_1fr]">
        <article className="rounded-xl border border-border bg-card p-3 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Live Operations Map</h2>
            <span className="text-xs text-muted-foreground">Vehicle pins and station markers</span>
          </div>
          <AutomobileMapDashboard showSearchOverlay={false} />
        </article>

        <article className="rounded-xl border border-border bg-card p-3 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Live Vehicle Snapshot</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/admin/automobiles/my-fleet')}
            >
              Open Fleet
            </Button>
          </div>

          <div className="space-y-2">
            {vehiclesQuery.isLoading ? (
              <>
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </>
            ) : quickVehicles.length === 0 ? (
              <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
                No vehicle data available.
              </p>
            ) : (
              quickVehicles.map((vehicle) => (
                <div
                  key={vehicle.id}
                  className="flex items-center justify-between rounded-md border border-border px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {vehicle.registrationNumber}
                    </p>
                    <p className="text-xs text-muted-foreground">{vehicle.vehicleType}</p>
                  </div>
                  <div className="text-right">
                    <p className="inline-flex items-center gap-1 text-xs font-medium text-foreground">
                      <MapPin className="h-3 w-3" aria-hidden />
                      {vehicle.locationLabel}
                    </p>
                    <p className="text-xs text-muted-foreground">{vehicle.status}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
