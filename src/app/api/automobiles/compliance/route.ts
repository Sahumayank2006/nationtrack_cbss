import { NextResponse } from 'next/server';

import { getComplianceAlerts } from '@/lib/automobiles-service';
import type { AdminComplianceAlert } from '@/types/admin-automobiles';

export async function GET() {
  const alerts = getComplianceAlerts();
  const data: AdminComplianceAlert[] = alerts.map((item) => ({
    id: item.id,
    vehicleId: item.vehicleId,
    registrationNumber: item.registrationNumber,
    alertType: item.type,
    expiresOn: item.expiresOn,
    daysRemaining: item.daysRemaining,
    severity: item.severity,
    smsAlertSent: item.severity !== 'CRITICAL',
    smsAlertSentAt: item.severity !== 'CRITICAL' ? new Date().toISOString() : undefined,
    renewalStatus:
      item.daysRemaining <= 7 ? 'PENDING' : item.daysRemaining <= 20 ? 'IN_PROGRESS' : 'COMPLETED',
    renewedAt: item.daysRemaining > 20 ? new Date().toISOString() : undefined,
  }));

  return NextResponse.json({
    success: true,
    data,
    alerts,
    generatedAt: new Date().toISOString(),
  });
}
