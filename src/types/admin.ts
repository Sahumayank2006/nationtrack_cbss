export type AdminModule = 'automobile' | 'spaces';

export type AdminSeverity = 'CRITICAL' | 'URGENT' | 'WARNING' | 'INFO';

export interface AdminRecentEvent {
  id: string;
  module: AdminModule;
  assetId: string;
  assetName: string;
  eventType: string;
  actorName: string;
  severity: AdminSeverity;
  timestamp: string;
}

export interface AdminPendingAction {
  id: string;
  module: AdminModule;
  category: 'SOS' | 'COMPLIANCE' | 'MAINTENANCE' | 'BOOKING' | 'TRANSFER';
  severity: AdminSeverity;
  title: string;
  description: string;
  assetId?: string;
  assetName?: string;
  status: 'PENDING';
  createdAt: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface AdminSummary {
  total: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  pendingApprovals: number;
  criticalAlerts: number;
  idleCount: number;
  recentEvents: AdminRecentEvent[];
  lastUpdated: string;
}

export interface DashboardStatsResponse {
  automobile: {
    activeCount: number;
    idleCount: number;
    pendingActionsCount: number;
    sosActiveCount: number;
  };
  globalAlerts: {
    total: number;
    critical: number;
    unreadNotifications: number;
  };
}
