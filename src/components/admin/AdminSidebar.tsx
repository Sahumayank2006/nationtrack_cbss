'use client';

import {
  AlertCircle,
  Archive,
  Calendar,
  Car,
  DollarSign,
  FileText,
  Hammer,
  Inbox,
  LayoutDashboard,
  LogOut,
  Settings,
  Shield,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useAdminContext } from '@/app/admin/AdminContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const AUTOMOBILE_NAV_ITEMS = [
  { label: 'Dashboard', href: '/admin/automobiles', icon: LayoutDashboard },
  { label: 'My Fleet', href: '/admin/automobiles/my-fleet', icon: Car },
  { label: 'Requests Inbox', href: '/admin/automobiles/requests-inbox', icon: Inbox },
  { label: 'Bookings Calendar', href: '/admin/automobiles/bookings-calendar', icon: Calendar },
  { label: 'Idle Pool', href: '/admin/automobiles/idle-pool', icon: Archive },
  { label: 'Seized Vehicles AI', href: '/automobiles/seized', icon: Shield },
  { label: 'Auction Queue', href: '/admin/automobiles/auction-queue', icon: TrendingUp },
  { label: 'Maintenance', href: '/admin/automobiles/maintenance', icon: Hammer },
  { label: 'Compliance', href: '/admin/automobiles/compliance', icon: AlertCircle },
  { label: 'Revenue', href: '/admin/automobiles/revenue', icon: DollarSign },
];

const SPACES_NAV_ITEMS = [
  { label: 'Dashboard', href: '/admin/spaces', icon: LayoutDashboard },
  { label: 'My Spaces', href: '/admin/spaces/my-spaces', icon: Car },
  { label: 'Requests Inbox', href: '/admin/spaces/requests-inbox', icon: Inbox },
  { label: 'Maintenance Log', href: '/admin/spaces/maintenance-log', icon: Hammer },
  { label: 'Idle Alerts', href: '/admin/spaces/idle-alerts', icon: Archive },
  { label: 'Utilization Reports', href: '/admin/spaces/utilization-reports', icon: FileText },
  { label: 'Settings', href: '/admin/spaces/settings', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const { activeModule } = useAdminContext();

  const navItems = activeModule === 'automobile' ? AUTOMOBILE_NAV_ITEMS : SPACES_NAV_ITEMS;
  const activeModuleInt = pathname.startsWith('/admin/spaces') ? 'spaces' : 'automobile';
  const dashboardHref = activeModuleInt === 'spaces' ? '/admin/spaces' : '/admin/automobiles';
  const moreHref = activeModuleInt === 'spaces' ? '/admin/spaces/settings' : '/admin/settings';

  const linkWithModule = (href: string) => (href === '/admin/automobiles' ? dashboardHref : href);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const isActive = (href: string) => {
    const normalizedHref = href.split('?')[0];
    if (normalizedHref === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(normalizedHref);
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin');
  };

  if (isMobile) {
    return (
      <nav
        className="fixed inset-x-0 bottom-0 z-50 grid h-16 grid-cols-5 border-t border-slate-200 bg-white px-2"
        aria-label="Admin mobile tabs"
      >
        {navItems.slice(0, 4).map((item) => (
          <Link
            key={item.href}
            href={linkWithModule(item.href)}
            className={cn(
              'inline-flex flex-col items-center justify-center gap-1 text-xs text-slate-500',
              isActive(item.href) && 'text-slate-900'
            )}
          >
            <item.icon className="h-4 w-4" aria-hidden />
            <span>{item.label.split(' ')[0]}</span>
          </Link>
        ))}
        <Link
          href={moreHref}
          className={cn(
            'inline-flex flex-col items-center justify-center gap-1 text-xs text-slate-500',
            isActive(moreHref) && 'text-slate-900'
          )}
        >
          <Settings className="h-4 w-4" aria-hidden />
          <span>More</span>
        </Link>
      </nav>
    );
  }

  return (
    <aside
      className="fixed left-0 top-16 z-40 hidden h-[calc(100vh-4rem)] w-44 border-r border-slate-200 bg-white md:flex md:flex-col"
      aria-label="Admin sidebar"
    >
      <ul className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-1.5 py-2">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <li key={item.href}>
              <Link
                href={linkWithModule(item.href)}
                className={cn(
                  'flex h-9 items-center gap-1.5 rounded-md px-2 text-[13px] transition',
                  active ? 'bg-[#2b66d9] text-white' : 'hover:bg-slate-100 hover:text-slate-900'
                )}
              >
                <item.icon className="h-3.5 w-3.5" aria-hidden />
                <span className="truncate font-medium">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="border-t border-slate-200 p-2.5">
        <div className="mb-1.5 flex items-center gap-2">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="bg-slate-100 text-xs text-slate-800">AD</AvatarFallback>
          </Avatar>
          <span className="text-xs text-slate-600">Admin User</span>
        </div>
        <button
          type="button"
          onClick={logout}
          className={cn(
            'flex h-8 w-full items-center gap-1.5 rounded-md px-2 text-xs text-slate-600 transition hover:bg-slate-100 hover:text-slate-900'
          )}
          aria-label="Logout"
        >
          <LogOut className="h-3.5 w-3.5" aria-hidden />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
