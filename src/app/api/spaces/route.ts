import { NextRequest, NextResponse } from 'next/server';

import { getAdminDb, isFirebaseAdminConfigured } from '@/lib/firebase-admin';
import { getLookupData, listSpaces } from '@/lib/spaces-service';
import type { SpaceListFilters } from '@/types/spaces';

const parseBoolean = (value: string | null): boolean | undefined => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
};

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const filters: SpaceListFilters = {
    status: (params.get('status') as SpaceListFilters['status']) ?? 'ALL',
    type: (params.get('type') as SpaceListFilters['type']) ?? 'ALL',
    district: (params.get('district') as SpaceListFilters['district']) ?? 'ALL',
    search: params.get('search') ?? '',
    minCapacity: params.has('minCapacity') ? Number(params.get('minCapacity')) : undefined,
    isIdle: parseBoolean(params.get('isIdle')),
    date: params.get('date') ?? undefined,
    startTime: params.get('startTime') ?? undefined,
    endTime: params.get('endTime') ?? undefined,
    amenities: params.getAll('amenities'),
  };

  const data = listSpaces(filters);
  let verifiedSpaceIds: string[] = [];

  if (isFirebaseAdminConfigured) {
    try {
      const snapshot = await getAdminDb().collection('space_users').get();
      const uniqueIds = new Set<string>();

      snapshot.forEach((doc) => {
        const openSpaceId = doc.get('openSpaceId');
        if (typeof openSpaceId === 'string' && openSpaceId.length > 0) {
          uniqueIds.add(openSpaceId);
        }
      });

      verifiedSpaceIds = Array.from(uniqueIds);
    } catch {
      verifiedSpaceIds = [];
    }
  }

  return NextResponse.json({
    success: true,
    data,
    meta: { total: data.length },
    lookup: getLookupData(),
    verifiedSpaceIds,
  });
}

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      message:
        'Space creation endpoint is reserved for admin workflow and not enabled in demo mode.',
    },
    { status: 501 }
  );
}
