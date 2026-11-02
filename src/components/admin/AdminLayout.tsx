'use client';

import { usePathname } from 'next/navigation';

import { AdminProvider } from '@/app/admin/AdminContext';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

interface AdminLayoutProps {
  children: React.ReactNode;
  hideLayoutForAuth?: boolean;
}

export function AdminLayout({ children, hideLayoutForAuth }: AdminLayoutProps) {
  const pathname = usePathname();
  const showSelectionOnly = pathname === '/admin';

  if (hideLayoutForAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
        <div className="w-full max-w-md">{children}</div>
      </div>
    );
  }

  return (
    <AdminProvider>
      {showSelectionOnly ? (
        <main className="min-h-[calc(100vh-4rem)] bg-[#f6f7fb] px-4 py-8 md:px-6 md:py-10">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      ) : (
        <div className="relative flex h-[calc(100vh-4rem)] overflow-hidden bg-[#f6f7fb] text-slate-900">
          <a
            href="#maincontent"
            className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-[1000] focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-medium"
          >
            Skip to main content
          </a>
          <AdminSidebar />
          <main id="maincontent" className="relative z-10 flex-1 overflow-y-auto md:ml-44 md:pb-0">
            <div className="p-4 pb-20 md:p-5 lg:p-6">{children}</div>
          </main>
        </div>
      )}
    </AdminProvider>
  );
}
