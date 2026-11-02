'use client';

import { ArrowLeft, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { SpaceShowcaseCard } from '@/components/spaces/SpaceShowcaseCard';
import { cn } from '@/lib/utils';
import type { Space } from '@/types/spaces';

const SpacesMapView = dynamic(
  () => import('@/components/spaces/SpacesMapView').then((mod) => mod.SpacesMapView),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center">
        <div className="animate-pulse text-lg">Loading map...</div>
      </div>
    ),
  }
);

interface SpacesPayload {
  success: boolean;
  data: Space[];
  verifiedSpaceIds?: string[];
}

interface AuthMePayload {
  ok: boolean;
  authenticated?: boolean;
  session?: {
    openSpaceName?: string;
  };
}

export default function SpacesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [verifiedSpaceIds, setVerifiedSpaceIds] = useState<string[]>([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [sessionOpenSpaceName, setSessionOpenSpaceName] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      const response = await fetch('/api/spaces', { cache: 'no-store' });
      const payload = (await response.json()) as SpacesPayload;
      if (!payload.success) return;
      setSpaces(payload.data);
      setVerifiedSpaceIds(payload.verifiedSpaceIds ?? []);
    };

    load();
  }, []);

  useEffect(() => {
    const loadSession = async () => {
      const response = await fetch('/api/auth/me', { cache: 'no-store' });
      if (!response.ok) return;

      const payload = (await response.json()) as AuthMePayload;
      setSessionOpenSpaceName(payload.session?.openSpaceName ?? '');
    };

    loadSession();
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const filteredSpaces = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return spaces.filter((space) => {
      if (!normalizedQuery) return true;

      return (
        space.name.toLowerCase().includes(normalizedQuery) ||
        space.department.toLowerCase().includes(normalizedQuery) ||
        space.address.toLowerCase().includes(normalizedQuery) ||
        space.assetId.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [searchQuery, spaces]);

  useEffect(() => {
    if (!filteredSpaces.length) {
      setSelectedSpaceId(null);
      return;
    }

    if (!selectedSpaceId || !filteredSpaces.some((space) => space.id === selectedSpaceId)) {
      setSelectedSpaceId(filteredSpaces[0].id);
    }
  }, [filteredSpaces, selectedSpaceId]);

  const selectedSpace = filteredSpaces.find((space) => space.id === selectedSpaceId) ?? null;

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push('/');
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      const mapContainer = document.querySelector('.nt-map-canvas')?.parentElement;
      if (mapContainer) {
        await mapContainer.requestFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } else {
      await document.exitFullscreen();
    }
  };

  return (
    <div className="relative h-full min-h-0 overflow-hidden bg-background">
      <div className="relative flex h-full min-w-0 flex-1 overflow-hidden">
        <div className="min-h-[420px] flex-1">
          <div className="pointer-events-none absolute left-3 top-3 z-[640] md:left-6">
            <div className="pointer-events-auto flex items-center gap-2">
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex h-10 items-center gap-2 rounded-full border border-primary/70 bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm backdrop-blur transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Go back to the previous page"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden />
                Back
              </button>

              <div className="relative min-w-[220px] shrink-0 md:min-w-[280px]">
                <span className="pointer-events-none absolute left-2.5 top-1/2 inline-flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                  <Search className="h-3.5 w-3.5" aria-hidden />
                </span>
                <input
                  type="text"
                  placeholder="Search spaces"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="h-10 w-full rounded-full border border-border/90 bg-card/95 pl-9 pr-3.5 text-sm text-foreground shadow-sm backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-primary/70"
                  aria-label="Search government spaces"
                />
              </div>

              {sessionOpenSpaceName ? (
                <p className="inline-flex h-10 items-center rounded-full border border-border/90 bg-card/95 px-3.5 text-xs font-semibold text-foreground shadow-sm backdrop-blur-md">
                  Open Space: {sessionOpenSpaceName}
                </p>
              ) : null}
            </div>
          </div>

          <div className="h-full border-l border-r border-border">
            <SpacesMapView
              spaces={filteredSpaces}
              selectedSpaceId={selectedSpaceId}
              onSpaceSelect={(space) => setSelectedSpaceId(space.id)}
              showInternalFilters={false}
              onFullscreenToggle={toggleFullscreen}
              isFullscreen={isFullscreen}
            />
          </div>

          {!panelOpen ? (
            <>
              <div
                className="absolute right-0 top-0 z-[714] h-full w-4"
                onMouseEnter={() => setPanelOpen(true)}
                aria-hidden
              />
              <button
                type="button"
                onClick={() => setPanelOpen(true)}
                onMouseEnter={() => setPanelOpen(true)}
                className="absolute right-0 top-1/2 z-[715] flex h-16 w-5 -translate-y-1/2 items-center justify-center rounded-l-xl border border-border/80 bg-card/95 shadow-sm backdrop-blur transition hover:bg-muted"
                aria-controls="spaces-right-panel"
                aria-expanded={panelOpen}
                aria-label="Expand listed spaces panel"
              >
                <ChevronLeft className="h-3.5 w-3.5 text-foreground" aria-hidden />
              </button>
            </>
          ) : null}

          <aside
            id="spaces-right-panel"
            className={cn(
              'absolute right-0 top-0 z-[700] h-full w-[300px] bg-transparent shadow-none backdrop-blur-0 transition-transform duration-300 ease-in-out md:w-[320px]',
              panelOpen ? 'translate-x-0' : 'translate-x-full'
            )}
            aria-label="Available government spaces"
            onMouseLeave={() => setPanelOpen(false)}
          >
            <button
              type="button"
              onClick={() => setPanelOpen((current) => !current)}
              className="absolute left-0 top-1/2 z-[715] flex h-14 w-5 -translate-x-full -translate-y-1/2 items-center justify-center rounded-l-xl border border-border/80 bg-card/95 shadow-sm backdrop-blur transition hover:bg-muted"
              aria-controls="spaces-right-panel"
              aria-expanded={panelOpen}
              aria-label={panelOpen ? 'Collapse listed spaces panel' : 'Expand listed spaces panel'}
            >
              {panelOpen ? (
                <ChevronRight className="h-3.5 w-3.5 text-foreground" aria-hidden />
              ) : (
                <ChevronLeft className="h-3.5 w-3.5 text-foreground" aria-hidden />
              )}
            </button>

            <div className="h-full overflow-y-auto bg-transparent px-2.5 py-2.5 [scrollbar-color:rgba(148,163,184,0.65)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/50 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5">
              {filteredSpaces.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                  No spaces matched your search or filter.
                </p>
              ) : (
                <div className="space-y-3">
                  {filteredSpaces.map((space) => {
                    const isSelected = selectedSpace?.id === space.id;

                    return (
                      <SpaceShowcaseCard
                        key={space.id}
                        space={space}
                        compact
                        verified={verifiedSpaceIds.includes(space.id)}
                        selected={isSelected}
                        onSelect={setSelectedSpaceId}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
