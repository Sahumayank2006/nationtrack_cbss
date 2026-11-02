import { NextRequest, NextResponse } from 'next/server';

import { getIdleSuggestions, getVehicles } from '@/lib/automobiles-service';
import type { AuctionQueueItem } from '@/types/admin-automobiles';

const priceByType = (vehicleType: string) => {
  if (vehicleType.toLowerCase().includes('ambulance')) return 350000;
  if (vehicleType.toLowerCase().includes('truck')) return 420000;
  if (vehicleType.toLowerCase().includes('patrol')) return 280000;
  return 200000;
};

export async function GET(request: NextRequest) {
  const subtype = request.nextUrl.searchParams.get('subtype') ?? 'ALL';
  const vehicles = getVehicles();
  const byId = new Map(vehicles.map((v) => [v.id, v]));

  let items: AuctionQueueItem[] = getIdleSuggestions()
    .filter((s) => s.idleDays >= 365)
    .map((s, idx) => {
      const vehicle = byId.get(s.vehicleId);
      const estimatedValue = priceByType(vehicle?.vehicleType ?? 'vehicle');
      const statuses: AuctionQueueItem['auctionStatus'][] = [
        'ELIGIBLE',
        'LISTED',
        'ACTIVE',
        'SOLD',
      ];
      const auctionStatus = statuses[idx % statuses.length];
      const hasGem = auctionStatus !== 'ELIGIBLE';

      return {
        id: `auction-${s.vehicleId}`,
        vehicleId: s.vehicleId,
        registrationNumber: s.registrationNumber,
        vehicleType: vehicle?.vehicleType ?? 'Vehicle',
        idleSinceDate:
          vehicle?.idleSinceDate ?? new Date(Date.now() - s.idleDays * 86400000).toISOString(),
        idleDays: s.idleDays,
        estimatedValue,
        auctionStatus,
        gemPortalLink: hasGem ? `https://gem.gov.in/auction/${s.vehicleId}` : undefined,
        gemLoadNumber: hasGem ? `GEM-${String(idx + 1001)}` : undefined,
        estimatedRevenue:
          auctionStatus === 'SOLD' ? Math.round(estimatedValue * 1.1) : estimatedValue,
        addedToAuctionDate: hasGem ? new Date(Date.now() - 20 * 86400000).toISOString() : undefined,
        winningBid: auctionStatus === 'SOLD' ? Math.round(estimatedValue * 1.1) : undefined,
      };
    });

  if (subtype !== 'ALL') {
    items = items.filter((item) => item.vehicleType.toUpperCase().includes(subtype.split('_')[0]));
  }

  return NextResponse.json({ success: true, data: items });
}
