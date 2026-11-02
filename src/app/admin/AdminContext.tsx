'use client';

import { useQuery } from '@tanstack/react-query';
import { usePathname, useRouter } from 'next/navigation';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { AdminModule, DashboardStatsResponse } from '@/types/admin';

const DEFAULT_MODULE: AdminModule = 'automobile';
const DEFAULT_SUBTYPE_BY_MODULE: Record<AdminModule, string> = {
  automobile: 'ALL',
  spaces: 'ALL',
};

export type AdminContextType = {
  activeModule: AdminModule;
  activeSubType: string;
  setActiveModule: (module: AdminModule) => void;
  setActiveSubType: (subType: string) => void;
  dashboardStats: DashboardStatsResponse | null;
  isLoadingStats: boolean;
};

const AdminContext = createContext<AdminContextType | null>(null);

export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();

  const [activeModule, setActiveModuleState] = useState<AdminModule>(DEFAULT_MODULE);
  const [activeSubType, setActiveSubTypeState] = useState<string>(
    DEFAULT_SUBTYPE_BY_MODULE[DEFAULT_MODULE]
  );

  useEffect(() => {
    const nextModule: AdminModule = pathname.startsWith('/admin/spaces') ? 'spaces' : 'automobile';
    setActiveModuleState(nextModule);
    setActiveSubTypeState(DEFAULT_SUBTYPE_BY_MODULE[nextModule]);
  }, [pathname]);

  const setActiveModule = useCallback(
    (moduleValue: AdminModule) => {
      router.push(moduleValue === 'spaces' ? '/admin/spaces' : '/admin/automobiles');
    },
    [router]
  );

  const setActiveSubType = useCallback((subTypeValue: string) => {
    setActiveSubTypeState(subTypeValue);
  }, []);

  const statsQuery = useQuery({
    queryKey: ['admin', 'dashboard-stats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/dashboard-stats', { cache: 'no-store' });
      const json = (await response.json()) as {
        success: boolean;
        data?: DashboardStatsResponse;
      };

      if (!response.ok || !json.success || !json.data) {
        throw new Error('Unable to load dashboard stats');
      }

      return json.data;
    },
    refetchInterval: 60_000,
    retry: 1,
  });

  const value = useMemo<AdminContextType>(
    () => ({
      activeModule,
      activeSubType,
      setActiveModule,
      setActiveSubType,
      dashboardStats: statsQuery.data ?? null,
      isLoadingStats: statsQuery.isLoading,
    }),
    [
      activeModule,
      activeSubType,
      setActiveModule,
      setActiveSubType,
      statsQuery.data,
      statsQuery.isLoading,
    ]
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
};

export const useAdminContext = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdminContext must be used inside AdminProvider');
  }
  return context;
};
