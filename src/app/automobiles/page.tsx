'use client';

import {
  ArrowLeft,
  Bell,
  CalendarDays,
  Car,
  FileText,
  LayoutDashboard,
  MapPin,
  Menu,
  Search,
  Settings,
  X,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';

import { ThemeToggle } from '@/components/ui/theme-toggle';
import { cn } from '@/lib/utils';

const AutomobileMapDashboard = dynamic(
  () =>
    import('@/components/automobiles/AutomobileMapDashboard').then(
      (mod) => mod.AutomobileMapDashboard
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center">
        <div className="animate-pulse text-lg">Loading map...</div>
      </div>
    ),
  }
);

const navItems = [
  { label: 'Dashboard', href: '/automobiles', icon: LayoutDashboard },
  { label: 'Available Fleet', href: '/automobiles/vehicles', icon: Car },
  { label: 'My Bookings', href: '/automobiles/bookings', icon: CalendarDays },
  { label: 'Calendar', href: '/automobiles/calendar', icon: MapPin },
  { label: 'Notifications', href: '/automobiles/notifications', icon: Bell },
  { label: 'Reports', href: '/automobiles/reports', icon: FileText },
  { label: 'Settings', href: '/automobiles/settings', icon: Settings },
];

const normalizeText = (value: string): string => {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const parseStationNamesFromKml = (kmlText: string): string[] => {
  const placemarkMatches = Array.from(kmlText.matchAll(/<Placemark>([\s\S]*?)<\/Placemark>/gi));
  const names = placemarkMatches
    .map((match) => {
      const block = match[1] ?? '';
      const nameMatch = block.match(/<name>([\s\S]*?)<\/name>/i);
      return nameMatch?.[1]?.trim() ?? '';
    })
    .filter(Boolean);

  return [...new Set(names)];
};

const loadStationHintsFromSources = async (): Promise<string[]> => {
  const sources = [
    '/maps/gwalior/Police_Station_doc.kml',
    '/maps/gwalior/Gwalior_Police_Stations.kml',
  ];

  for (const source of sources) {
    try {
      const response = await fetch(source);
      if (!response.ok) continue;

      const text = await response.text();
      const names = parseStationNamesFromKml(text);
      if (names.length > 0) {
        return names;
      }
    } catch {
      // Try next source.
    }
  }

  return [];
};

export default function AutomobilesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [stationHints, setStationHints] = useState<string[]>([]);
  const [showHints, setShowHints] = useState(false);
  const [activeHintIndex, setActiveHintIndex] = useState(-1);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);

  const filteredHints = useMemo(() => {
    const normalizedQuery = normalizeText(searchQuery);
    if (!normalizedQuery) {
      return [];
    }

    const terms = normalizedQuery.split(' ');
    return stationHints
      .filter((name) => {
        const normalizedName = normalizeText(name);
        return terms.every((term) => normalizedName.includes(term));
      })
      .slice(0, 8);
  }, [searchQuery, stationHints]);

  const hasSearchText = normalizeText(searchQuery).length > 0;
  const shouldShowHintsPanel = showHints && hasSearchText;

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    let active = true;

    const loadStationHints = async () => {
      const names = await loadStationHintsFromSources();
      if (!active) return;
      setStationHints(names);
    };

    void loadStationHints();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!searchContainerRef.current?.contains(target)) {
        setShowHints(false);
      }
    };

    window.addEventListener('mousedown', handleOutsideClick);
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleHintSelect = (hint: string) => {
    setSearchQuery(hint);
    setShowHints(false);
    setActiveHintIndex(-1);
  };

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!hasSearchText) {
      setShowHints(false);
      setActiveHintIndex(-1);
      return;
    }

    if (!showHints || filteredHints.length === 0) {
      if (event.key === 'ArrowDown' && filteredHints.length > 0) {
        event.preventDefault();
        setShowHints(true);
        setActiveHintIndex(0);
      }
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveHintIndex((current) => (current + 1) % filteredHints.length);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveHintIndex((current) => (current <= 0 ? filteredHints.length - 1 : current - 1));
      return;
    }

    if (event.key === 'Enter' && activeHintIndex >= 0) {
      event.preventDefault();
      handleHintSelect(filteredHints[activeHintIndex]);
      return;
    }

    if (event.key === 'Escape') {
      setShowHints(false);
      setActiveHintIndex(-1);
    }
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      // Enter fullscreen mode
      const mapContainer = document.querySelector('.nt-map-canvas')?.parentElement;
      if (mapContainer) {
        await mapContainer.requestFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } else {
      // Exit fullscreen mode
      await document.exitFullscreen();
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push('/');
  };

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      {/* Sidebar - Gmail inspired, NationTrack branded */}
      <aside
        className={cn(
          'hidden h-full shrink-0 border-r border-border bg-muted/40 transition-[width] duration-300 md:flex md:flex-col',
          sidebarCollapsed ? 'md:w-[4.5rem]' : 'md:w-[14rem]'
        )}
        aria-label="Automobiles sidebar"
      >
        <div
          className={cn(
            'flex items-center px-2.5 pb-2 pt-3',
            sidebarCollapsed ? 'justify-center' : 'justify-start gap-2'
          )}
        >
          <button
            type="button"
            onClick={() => setSidebarCollapsed((current) => !current)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <Menu className="h-5 w-5" aria-hidden />
          </button>

          {!sidebarCollapsed ? (
            <Link
              href="/"
              className="inline-flex min-w-0 items-center gap-1.5"
              aria-label="Go to NationTrack home"
            >
              <Image src="/NationTrack.png" alt="NationTrack" width={20} height={20} priority />
              <span className="truncate text-[0.9rem] font-semibold text-foreground">
                Nation Track
              </span>
            </Link>
          ) : null}
        </div>

        <ul className="flex flex-1 flex-col gap-1 px-2 pb-2">
          {navItems.map((item) => {
            const active =
              pathname.startsWith(item.href) ||
              (pathname === '/automobiles' && item.href === '/automobiles');
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'group flex h-10 items-center rounded-full px-2.5 text-sm font-medium text-foreground transition',
                    sidebarCollapsed ? 'justify-center' : 'justify-start gap-2',
                    active
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-muted hover:text-foreground'
                  )}
                  aria-label={item.label}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <item.icon className="h-4 w-4 shrink-0" aria-hidden />
                  {!sidebarCollapsed ? <span className="truncate">{item.label}</span> : null}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center justify-center border-t border-border px-2 py-2">
          <div className="bg-card/92 rounded-full border border-border/85 p-0.5 shadow-sm backdrop-blur dark:[&>button:hover]:bg-muted [&>button]:h-9 [&>button]:w-9 [&>button]:rounded-full [&>button]:text-foreground">
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* Main Content Area - Map focused */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="relative flex-1 overflow-hidden bg-muted">
          <AutomobileMapDashboard
            searchQuery={searchQuery}
            onFullscreenToggle={toggleFullscreen}
            isFullscreen={isFullscreen}
            showSearchOverlay={false}
            onBookVehicle={(stationId) => {
              router.push(`/automobiles/request?station=${encodeURIComponent(stationId)}`);
            }}
          />
          {/* Back Button - Floating top-right */}
          <div className="pointer-events-none absolute right-3 top-3 z-[640] md:right-6">
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
            </div>
          </div>
          {/* Search Bar - Floating on map */}{' '}
          <div
            className={cn(
              'pointer-events-none absolute inset-x-0 left-0 top-3 z-[620] flex items-start justify-center px-3 md:left-auto md:px-6'
            )}
          >
            <div className="pointer-events-auto w-full max-w-sm">
              <div ref={searchContainerRef} className="relative w-full">
                <Search
                  className="pointer-events-none absolute left-3.5 top-1/2 z-[1] h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <input
                  type="text"
                  role="combobox"
                  aria-expanded={showHints}
                  aria-controls="police-station-hints"
                  aria-activedescendant={
                    activeHintIndex >= 0 ? `police-station-hint-${activeHintIndex}` : undefined
                  }
                  placeholder="Search police stations, area, or vehicle count"
                  value={searchQuery}
                  onFocus={() => setShowHints(hasSearchText)}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    setSearchQuery(nextValue);
                    setShowHints(normalizeText(nextValue).length > 0);
                    setActiveHintIndex(-1);
                  }}
                  onKeyDown={handleSearchKeyDown}
                  className={cn(
                    'h-9 w-full rounded-full border border-border/90 bg-card/95 px-9 pr-9 text-sm text-foreground shadow-sm backdrop-blur-md transition focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary/70'
                  )}
                  aria-label="Search police stations"
                  autoComplete="off"
                />

                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setShowHints(false);
                      setActiveHintIndex(-1);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                ) : null}

                {shouldShowHintsPanel ? (
                  <div className="absolute inset-x-0 top-[calc(100%+0.35rem)] z-[700] overflow-hidden rounded-2xl border border-border/90 bg-card/95 shadow-lg backdrop-blur-md">
                    {filteredHints.length > 0 ? (
                      <ul
                        id="police-station-hints"
                        role="listbox"
                        className="max-h-64 overflow-auto p-1.5"
                        aria-label="Police station suggestions"
                      >
                        {filteredHints.map((hint, index) => {
                          const isActive = index === activeHintIndex;
                          return (
                            <li
                              key={hint}
                              id={`police-station-hint-${index}`}
                              role="option"
                              aria-selected={isActive}
                            >
                              <button
                                type="button"
                                onClick={() => handleHintSelect(hint)}
                                className={cn(
                                  'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition',
                                  isActive
                                    ? 'bg-primary/12 text-primary'
                                    : 'text-foreground hover:bg-muted'
                                )}
                              >
                                <MapPin
                                  className="h-4 w-4 shrink-0 text-muted-foreground"
                                  aria-hidden
                                />
                                <span className="truncate">{hint}</span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    ) : searchQuery.trim() ? (
                      <div className="px-4 py-3 text-sm text-muted-foreground">
                        No matching police station found.
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
