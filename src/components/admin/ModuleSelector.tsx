'use client';

import { CarFront, ShieldCheck } from 'lucide-react';

import { useAdminContext } from '@/app/admin/AdminContext';
import { MODULE_CARDS } from '@/components/admin/admin-config';
import { SubTypeSelector } from '@/components/admin/SubTypeSelector';
import { cn } from '@/lib/utils';

export function ModuleSelector() {
  const { activeModule, setActiveModule, activeSubType, setActiveSubType, dashboardStats } =
    useAdminContext();

  const activeCount =
    activeModule === 'spaces'
      ? (dashboardStats?.globalAlerts.unreadNotifications ?? 0)
      : (dashboardStats?.automobile.activeCount ?? 0);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
      <div className="grid gap-2 sm:grid-cols-2">
        {MODULE_CARDS.map((moduleCard) => {
          const active = moduleCard.id === activeModule;
          const Icon = moduleCard.icon;

          return (
            <button
              key={moduleCard.id}
              type="button"
              onClick={() => setActiveModule(moduleCard.id)}
              className={cn(
                'rounded-xl border px-4 py-3 text-left transition',
                active
                  ? 'border-blue-400 bg-blue-50 ring-1 ring-blue-200'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              )}
              aria-pressed={active}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={cn(
                    'inline-flex h-8 w-8 items-center justify-center rounded-md',
                    active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  {moduleCard.badgeLabel}
                </span>
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-900">{moduleCard.label}</p>
              <p className="mt-1 text-xs text-slate-600">{moduleCard.description}</p>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/75 px-3 py-2.5">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            {activeModule === 'spaces'
              ? 'Office Spaces Command Center'
              : 'Automobile Command Center'}
          </h2>
          <p className="text-xs text-slate-600">
            {activeModule === 'spaces'
              ? 'Bookings, utilization and operations routing by space category.'
              : 'Fleet controls, approvals, and operations by vehicle category.'}
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
          {activeCount} {activeModule === 'spaces' ? 'Attention Items' : 'Active Vehicles'}
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
        <div className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          <CarFront className="h-3.5 w-3.5" aria-hidden />
          {activeModule === 'spaces' ? 'Space Categories' : 'Vehicle Segments'}
        </div>
        <SubTypeSelector
          module={activeModule}
          activeSubType={activeSubType}
          onChange={setActiveSubType}
        />
      </div>
    </section>
  );
}
