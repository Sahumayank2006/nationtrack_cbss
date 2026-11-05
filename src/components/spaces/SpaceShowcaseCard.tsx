'use client';

import { ArrowRight, BadgeCheck, ExternalLink, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Space } from '@/types/spaces';

interface SpaceShowcaseCardProps {
  space: Space;
  compact?: boolean;
  selected?: boolean;
  verified?: boolean;
  onSelect?: (spaceId: string) => void;
}

const badgeClass: Record<Space['status'], string> = {
  AVAILABLE:
    'bg-emerald-500/20 text-emerald-800 border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-400/35',
  BOOKED:
    'bg-blue-500/20 text-blue-800 border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-400/35',
  IDLE: 'bg-amber-500/20 text-amber-800 border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-400/35',
  MAINTENANCE:
    'bg-red-500/20 text-red-800 border-red-500/30 dark:bg-red-500/15 dark:text-red-300 dark:border-red-400/35',
  RESTRICTED:
    'bg-slate-500/20 text-slate-800 border-slate-500/30 dark:bg-slate-500/15 dark:text-slate-300 dark:border-slate-400/35',
};

export function SpaceShowcaseCard({
  space,
  compact = false,
  selected = false,
  verified = false,
  onSelect,
}: SpaceShowcaseCardProps) {
  const isFeatured = space.avgRating >= 4.5 || space.totalBookingsCount >= 40;
  const detailsHref = `/spaces/spaces/${space.id}`;
  const bookingHref = `/submit?mode=booking&spaceId=${space.id}&spaceName=${encodeURIComponent(space.name)}`;

  return (
    <article
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-3xl border border-azure-200/70 bg-gradient-to-br from-azure-100/80 via-accent-foreground/5 to-azure-200/60 backdrop-blur-md transition-all duration-300 hover:shadow-2xl hover:shadow-azure-300/55 dark:border-slate-700/80 dark:from-slate-900/90 dark:via-slate-800/80 dark:to-slate-900/90 dark:hover:shadow-slate-950/60',
        selected && 'border-primary/70 ring-2 ring-primary/25'
      )}
    >
      <div className="pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full bg-azure-300/20 transition-colors duration-300 group-hover:bg-azure-300/35 dark:bg-slate-700/25 dark:group-hover:bg-slate-600/30" />
      <div className="pointer-events-none absolute -bottom-12 -left-12 h-28 w-28 rounded-full bg-accent/20 dark:bg-slate-700/20" />

      <button
        type="button"
        onClick={() => onSelect?.(space.id)}
        className="w-full text-left"
        aria-label={onSelect ? `Select ${space.name} on map` : undefined}
      >
        <div
          className={cn(
            'relative mx-4 mt-4 overflow-hidden rounded-2xl border border-azure-300/40 bg-gradient-to-br from-azure-200 to-accent/40 shadow-md dark:border-slate-600/60 dark:from-slate-800 dark:to-slate-700/80',
            compact ? 'h-28' : 'aspect-video'
          )}
        >
          <Image
            src={space.photos[0] || '/BharatTrack-placeholder.jpg'}
            alt={`${space.name} preview`}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes={compact ? '(max-width: 768px) 100vw, 320px' : '(max-width: 1024px) 100vw, 50vw'}
          />
        </div>
      </button>

      <div className={cn('relative flex flex-1 flex-col px-5 pb-0', compact ? 'pt-3' : 'pt-5')}>
        <div className="mb-2 flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {space.assetId}
            </p>
            <h3
              className={cn(
                'mt-1 font-semibold text-azure-900 transition-colors duration-300 group-hover:text-azure-700 dark:text-slate-100 dark:group-hover:text-blue-300',
                compact ? 'line-clamp-2 text-base' : 'text-lg'
              )}
            >
              {space.name}
            </h3>
          </div>
          {isFeatured ? (
            <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-amber-400/90 px-2.5 py-1 text-[10px] font-bold text-amber-900">
              <Star className="h-3 w-3 fill-current" aria-hidden />
              Featured
            </span>
          ) : null}
        </div>

        <p
          className={cn(
            'mb-3 leading-relaxed text-slate-700 dark:text-slate-300',
            compact ? 'text-xs' : 'text-sm'
          )}
        >
          {space.department} in {space.district}. Capacity {space.capacity} with{' '}
          {space.areaSqFt.toLocaleString('en-IN')} sq ft.
        </p>

        <div className={cn('mb-4 flex flex-wrap items-center gap-2', compact && 'mb-3')}>
          <Badge className={badgeClass[space.status]}>{space.status}</Badge>
          <Badge variant="secondary">Rating {space.avgRating.toFixed(1)}</Badge>
          {verified ? (
            <Badge className="border-sky-500/40 bg-sky-500/15 text-sky-800 dark:text-sky-300">
              <BadgeCheck className="mr-1 h-3.5 w-3.5" aria-hidden /> Verified
            </Badge>
          ) : null}
          {!compact ? (
            <Badge variant="secondary">{space.spaceType.replace(/_/g, ' ')}</Badge>
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 border-t border-azure-200/50 px-5 py-4 dark:border-slate-700/70">
        <Link href={detailsHref} className="flex-1">
          <Button
            variant="outline"
            size={compact ? 'sm' : 'default'}
            className="w-full gap-1.5 rounded-full border-azure-300/80 bg-white/85 text-azure-900 transition-all hover:border-azure-400 hover:bg-white hover:text-azure-700 dark:border-slate-600 dark:bg-slate-900/70 dark:text-slate-100 dark:hover:border-slate-500 dark:hover:bg-slate-800 dark:hover:text-blue-200"
          >
            View Details
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
        </Link>
        <Link href={bookingHref} className="flex-1">
          <Button
            size={compact ? 'sm' : 'default'}
            className="w-full gap-1.5 rounded-full border-0 bg-blue-500 text-white shadow-md transition-all hover:bg-blue-600"
            disabled={space.status !== 'AVAILABLE' || space.spaceType === 'TRANSIT_ROOM'}
          >
            {space.spaceType === 'TRANSIT_ROOM' ? 'Restricted' : 'Book Now'}
            <ExternalLink className="h-4 w-4" aria-hidden />
          </Button>
        </Link>
      </div>
    </article>
  );
}
