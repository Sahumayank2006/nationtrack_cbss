import { getAutomobileDashboardStats } from '@/lib/automobiles-service';
import type { DashboardStatsResponse } from '@/types/admin';

const CACHE_KEY = 'admin:dashboard:stats';
const CACHE_TTL_MS = 60 * 1000;

type CacheRecord = {
  expiresAt: number;
  value: DashboardStatsResponse;
};

const getGlobalCacheStore = (): Map<string, CacheRecord> => {
  const globalWithCache = globalThis as typeof globalThis & {
    __nationtrackAdminCache?: Map<string, CacheRecord>;
  };

  if (!globalWithCache.__nationtrackAdminCache) {
    globalWithCache.__nationtrackAdminCache = new Map<string, CacheRecord>();
  }

  return globalWithCache.__nationtrackAdminCache;
};

const getCachedDashboardStats = (): DashboardStatsResponse | null => {
  const entry = getGlobalCacheStore().get(CACHE_KEY);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    getGlobalCacheStore().delete(CACHE_KEY);
    return null;
  }
  return entry.value;
};

const setCachedDashboardStats = (value: DashboardStatsResponse) => {
  getGlobalCacheStore().set(CACHE_KEY, {
    value,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
};

export const getAdminDashboardStats = async (): Promise<DashboardStatsResponse> => {
  const cached = getCachedDashboardStats();
  if (cached) {
    return cached;
  }

  const automobile = await Promise.resolve(getAutomobileDashboardStats());

  const totalAlerts = automobile.pendingActionsCount;

  const criticalAlerts = automobile.sosActiveCount;

  const value: DashboardStatsResponse = {
    automobile,
    globalAlerts: {
      total: totalAlerts,
      critical: criticalAlerts,
      unreadNotifications: totalAlerts,
    },
  };

  setCachedDashboardStats(value);
  return value;
};
