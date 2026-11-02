'use client';

import { ArrowRight, BadgeCheck, Building2, CarFront, MapPin } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import type { AssetPassport } from '@/types/nationtrack';

interface AssetPassportCardProps {
  asset: AssetPassport;
  href: string;
}

const statusClassMap: Record<AssetPassport['status'], string> = {
  ACTIVE: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300',
  IDLE: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300',
  MAINTENANCE: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300',
  BOOKED: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300',
  DECOMMISSIONED:
    'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-900/30 dark:text-slate-300',
};

export function AssetPassportCard({ asset, href }: AssetPassportCardProps) {
  const isVehicle = asset.type === 'VEHICLE';

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-azure-200/70 bg-gradient-to-br from-azure-100/80 via-accent-foreground/5 to-azure-200/60 backdrop-blur-md transition-all duration-300 hover:shadow-2xl hover:shadow-azure-300/60 dark:from-azure-900/40 dark:to-accent/30 dark:hover:shadow-azure-800/50">
      <div className="pointer-events-none absolute right-0 top-0 -mr-16 -mt-16 h-32 w-32 rounded-full bg-azure-300/20 transition-colors duration-300 group-hover:bg-azure-300/30" />
      <div className="pointer-events-none absolute bottom-0 left-0 -mb-14 -ml-14 h-28 w-28 rounded-full bg-accent/20" />

      <div className="relative flex flex-1 flex-col px-5 pb-0 pt-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {asset.assetId}
            </p>
            <h3 className="truncate text-lg font-semibold text-azure-900 transition-colors duration-300 group-hover:text-azure-700 dark:text-azure-100 dark:group-hover:text-azure-200">
              {asset.name}
            </h3>
          </div>
          <span
            className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClassMap[asset.status]}`}
          >
            {asset.status}
          </span>
        </div>

        <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
          <div className="flex items-center gap-2">
            {isVehicle ? <CarFront className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
            <span>{asset.subType.replace(/_/g, ' ')}</span>
          </div>
          <div className="flex items-center gap-2">
            <BadgeCheck className="h-4 w-4" />
            <span>{asset.department}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span className="truncate">{asset.district}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-shrink-0 items-center justify-center gap-3 border-t border-azure-200/50 px-5 py-4 dark:border-azure-700/30">
        <Link href={href} className="w-full">
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-1.5 rounded-full border-azure-300/80 bg-white/80 font-medium text-azure-900 transition-all hover:border-azure-400 hover:bg-white hover:text-azure-700"
          >
            View Passport
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>
    </article>
  );
}
