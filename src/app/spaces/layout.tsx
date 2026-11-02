'use client';

import {
    Bell,
    CalendarClock,
    CalendarDays,
    ClipboardList,
    FileText,
    Home,
    LayoutDashboard,
    Settings,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { ThemeToggle } from '@/components/ui/theme-toggle';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Dashboard', href: '/spaces', icon: LayoutDashboard },
  { label: 'Available Spaces', href: '/spaces/spaces', icon: Home },
  { label: 'My Bookings', href: '/spaces/bookings', icon: CalendarClock },
  { label: 'Booked Requests', href: '/spaces/incoming', icon: ClipboardList },
  { label: 'Calendar', href: '/spaces/calendar', icon: CalendarDays },
  { label: 'Notifications', href: '/spaces/notifications', icon: Bell },
  { label: 'Reports', href: '/spaces/reports', icon: FileText },
  { label: 'Settings', href: '/spaces/settings', icon: Settings },
];

export default function SpacesLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDashboard = pathname === '/spaces';

  return (
    <div className="flex h-[calc(100dvh-4rem)] overflow-hidden bg-background">
      <aside
        className="group/sidebar hidden h-full w-[4.5rem] shrink-0 border-r border-border bg-muted/40 transition-[width] duration-300 md:flex md:flex-col md:hover:w-[14rem] md:focus-within:w-[14rem]"
        aria-label="Office spaces sidebar"
      >
        <div className="flex h-14 items-center justify-center px-2.5 group-hover/sidebar:justify-start group-hover/sidebar:gap-2 group-focus-within/sidebar:justify-start group-focus-within/sidebar:gap-2">
          <Link href="/" className="inline-flex items-center gap-2" aria-label="Go to NationTrack home">
            <Image src="/NationTrack.png" alt="NationTrack" width={24} height={24} priority />
            <span className="w-0 overflow-hidden whitespace-nowrap text-[1.5rem] font-semibold leading-none text-foreground opacity-0 transition-all duration-200 group-hover/sidebar:w-[7.8rem] group-hover/sidebar:opacity-100 group-focus-within/sidebar:w-[7.8rem] group-focus-within/sidebar:opacity-100">
              NationTrack
            </span>
          </Link>
        </div>

        <ul className="flex flex-1 flex-col gap-1 px-2 pb-2">
          {navItems.map((item) => {
            const active =
              pathname.startsWith(item.href.split('?')[0]) || (pathname === '/spaces' && item.href === '/spaces');

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'group flex h-10 items-center rounded-full px-2.5 text-sm font-medium text-foreground transition',
                    'justify-center group-hover/sidebar:justify-start group-hover/sidebar:gap-2 group-focus-within/sidebar:justify-start group-focus-within/sidebar:gap-2',
                    active ? 'bg-accent text-accent-foreground' : 'hover:bg-muted hover:text-foreground'
                  )}
                  aria-label={item.label}
                  title={item.label}
                >
                  <item.icon className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-200 group-hover/sidebar:w-[7.8rem] group-hover/sidebar:opacity-100 group-focus-within/sidebar:w-[7.8rem] group-focus-within/sidebar:opacity-100">
                    {item.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center justify-center border-t border-border px-2 py-2">
          <div className="rounded-full border border-border/85 bg-card/92 p-0.5 shadow-sm backdrop-blur dark:[&>button:hover]:bg-muted [&>button]:h-9 [&>button]:w-9 [&>button]:rounded-full [&>button]:text-foreground">
            <ThemeToggle />
          </div>
        </div>
      </aside>

      <main
        id="maincontent"
        className={cn('min-h-0 flex-1', isDashboard ? 'overflow-hidden p-0' : 'overflow-auto')}
      >
        {children}
      </main>
    </div>
  );
}
