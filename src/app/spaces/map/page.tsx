'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

import type { Space } from '@/types/spaces';

const SpacesMapView = dynamic(
  () => import('@/components/spaces/SpacesMapView').then((mod) => mod.SpacesMapView),
  {
    ssr: false,
    loading: () => (
      <section className="container-wide py-8">
        <div className="h-[70vh] animate-pulse rounded-xl border bg-muted" />
      </section>
    ),
  }
);

interface SpacesResponse {
  success: boolean;
  data: Space[];
}

export default function SpacesMapPage() {
  const [spaces, setSpaces] = useState<Space[]>([]);

  useEffect(() => {
    const load = async () => {
      const response = await fetch('/api/spaces', { cache: 'no-store' });
      const payload = (await response.json()) as SpacesResponse;
      if (payload.success) {
        setSpaces(payload.data);
      }
    };

    load();
  }, []);

  return <SpacesMapView spaces={spaces} />;
}
