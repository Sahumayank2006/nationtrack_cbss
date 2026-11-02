'use client';

import { Bell, Building2, CarFront } from 'lucide-react';
import { usePathname } from 'next/navigation';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const titleByPathPrefix: Array<{ prefix: string; title: string }> = [
  { prefix: '/admin/automobiles', title: 'Automobiles Dashboard' },
  { prefix: '/admin/spaces', title: 'Spaces Dashboard' },
  { prefix: '/admin/apps', title: 'Registry' },
  { prefix: '/admin/approvals', title: 'Approval Desk' },
  { prefix: '/admin/entries', title: 'Action Entries' },
  { prefix: '/admin/reports', title: 'Reports' },
  { prefix: '/admin/notifications', title: 'Notifications' },
  { prefix: '/admin/audit', title: 'Audit Trail' },
  { prefix: '/admin/settings', title: 'Admin Settings' },
  { prefix: '/admin', title: 'Dashboard' },
];

export function AdminTopBar() {
  const pathname = usePathname();
  const activeModule = pathname.startsWith('/admin/spaces') ? 'spaces' : 'automobile';
  const title =
    titleByPathPrefix.find((entry) => pathname.startsWith(entry.prefix))?.title ?? 'Admin';

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur md:px-6">
      <div className="min-w-0">
        <h1 className="truncate text-lg font-semibold text-slate-900">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        <span className="hidden items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 md:inline-flex">
          {activeModule === 'spaces' ? (
            <Building2 className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <CarFront className="h-3.5 w-3.5" aria-hidden />
          )}
          {activeModule === 'spaces' ? 'Office Spaces' : 'Automobile Ops'}
        </span>
        <button
          type="button"
          className="relative inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700"
          aria-label="View notifications"
        >
          <Bell className="h-4 w-4" aria-hidden />
          <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            3
          </span>
        </button>
        <Avatar className="h-9 w-9 border border-slate-200">
          <AvatarFallback className="bg-slate-100 text-xs text-slate-800">AD</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
