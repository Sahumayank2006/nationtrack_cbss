'use client';

import { PackageOpen } from 'lucide-react';
import { useMemo, useState } from 'react';

import { useAdminContext } from '@/app/admin/AdminContext';
import { statusLabelByModule } from '@/components/admin/admin-config';
import { Input } from '@/components/ui/input';

type AdminAssetCard = {
  id: string;
  name: string;
  subtitle: string;
  status: string;
  type: string;
};

export function AssetStatusGrid({ assets }: { assets: AdminAssetCard[] }) {
  const { activeSubType, activeModule } = useAdminContext();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [visibleCount, setVisibleCount] = useState(9);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return assets.filter((asset) => {
      const searchMatch =
        !q ||
        asset.name.toLowerCase().includes(q) ||
        asset.subtitle.toLowerCase().includes(q) ||
        asset.id.toLowerCase().includes(q);
      const statusMatch =
        statusFilter === 'All' || asset.status.toLowerCase().includes(statusFilter.toLowerCase());
      return searchMatch && statusMatch;
    });
  }, [assets, search, statusFilter]);

  const visible = filtered.slice(0, visibleCount);
  const subtypeLabel = activeSubType.replace(/_/g, ' ');

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{subtypeLabel}</h2>
          <p className="text-sm text-slate-600">{filtered.length} fleet assets</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search assets"
            aria-label="Search assets"
            className="w-56 border-slate-300 bg-white text-slate-900"
          />
          {statusLabelByModule[activeModule].map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => setStatusFilter(label)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                statusFilter === label
                  ? 'border-blue-300 bg-blue-50 text-blue-700'
                  : 'border-slate-300 bg-white text-slate-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {visible.length > 0 ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((asset) => (
              <article
                key={asset.id}
                className="rounded-xl border border-slate-200 bg-slate-50/40 p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="line-clamp-1 text-sm font-semibold text-slate-900">
                    {asset.name}
                  </h3>
                  <span className="rounded-full border border-slate-300 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                    {asset.type}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-600">{asset.subtitle}</p>
                <p className="mt-3 inline-flex rounded-full bg-slate-200 px-2 py-1 text-xs font-semibold text-slate-700">
                  {asset.status}
                </p>
              </article>
            ))}
          </div>
          {visible.length < filtered.length ? (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setVisibleCount((current) => current + 9)}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                Load More
              </button>
            </div>
          ) : null}
        </>
      ) : (
        <div className="flex flex-col items-center py-16 text-slate-500">
          <PackageOpen className="mb-4 h-14 w-14 opacity-40" aria-hidden />
          <p className="text-lg font-medium">No {subtypeLabel} assets found</p>
          <p className="text-sm">Try changing the filter or sync fleet records.</p>
        </div>
      )}
    </section>
  );
}
