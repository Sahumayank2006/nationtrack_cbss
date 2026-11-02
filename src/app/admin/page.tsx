'use client';

import { ArrowRight, Building2, Car, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function AdminModuleSelectionPage() {
  return (
    <div className="relative mx-auto flex min-h-[calc(100svh-4rem)] max-w-6xl items-center overflow-hidden px-4 py-2 sm:px-6 md:py-3">
      <div
        className="absolute inset-x-0 top-0 -z-10 h-64 bg-gradient-to-b from-violet-100/75 via-fuchsia-50/55 to-transparent"
        aria-hidden
      />

      <section className="w-full overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 shadow-xl shadow-slate-300/20 backdrop-blur-sm">
        <div className="grid md:grid-cols-[1fr_1.3fr]">
          <aside className="relative overflow-hidden bg-[#6f63e9] p-7 text-white sm:p-8">
            <div
              className="absolute -left-10 -top-10 h-36 w-36 rounded-full bg-white/15 blur-2xl"
              aria-hidden
            />
            <div
              className="absolute -bottom-16 -right-16 h-48 w-48 rounded-full bg-violet-200/25 blur-3xl"
              aria-hidden
            />

            <div className="relative flex h-full flex-col justify-between gap-6">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/30 bg-white/15 px-4 py-1.5 text-xs font-semibold tracking-wide">
                <ShieldCheck className="h-4 w-4" aria-hidden />
                ADMIN CONTROL CENTER
              </div>

              <div>
                <h1 className="text-4xl font-bold leading-tight sm:text-5xl">Welcome, Admin</h1>
                <p className="mt-3 max-w-sm text-sm text-violet-50/95 sm:text-base">
                  Pick a module and continue.
                </p>
              </div>

              <div className="rounded-2xl border border-white/30 bg-white/10 p-4 text-sm text-violet-50/90">
                2 modules available
              </div>
            </div>
          </aside>

          <div className="flex h-full items-center p-5 sm:p-6 md:p-7">
            <div className="grid w-full gap-4 lg:grid-cols-2">
              <Link
                href="/admin/automobiles"
                className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                  <Car className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-3 text-xl font-semibold text-slate-900">Automobiles Admin</h3>
                <p className="mt-1 text-sm text-slate-600">Fleet operations and approvals.</p>
                <span className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-violet-700">
                  Open Dashboard
                  <ArrowRight
                    className="h-4 w-4 transition group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </span>
              </Link>

              <Link
                href="/admin/spaces"
                className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                  <Building2 className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-3 text-xl font-semibold text-slate-900">Spaces Admin</h3>
                <p className="mt-1 text-sm text-slate-600">Bookings, utilization, and oversight.</p>
                <span className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-violet-700">
                  Open Dashboard
                  <ArrowRight
                    className="h-4 w-4 transition group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
