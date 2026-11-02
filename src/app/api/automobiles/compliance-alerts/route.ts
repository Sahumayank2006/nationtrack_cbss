import { NextRequest, NextResponse } from 'next/server';

import { getComplianceAlerts } from '@/lib/automobiles-service';
import type { AdminComplianceAlert } from '@/types/admin-automobiles';

const subtypeToPrefix: Record<string, string | null> = {
  ALL: null,
  AMBULANCE: 'AMB',
  PATROL: 'POL',
  WASTE_TRUCK: 'WST',
  PWD_MACHINERY: 'PWD',
  HEALTH_VAN: 'HLT',
  ELECTION: 'ELE',
  SEIZED: 'SEZ',
};

export async function GET(request: NextRequest) {
  const subtype = request.nextUrl.searchParams.get('subtype') ?? 'ALL';
  const alerts = getComplianceAlerts();

  const mapped: AdminComplianceAlert[] = alerts.map((item) => ({
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

  const marker = subtypeToPrefix[subtype] ?? null;
  const filtered = marker
    ? mapped.filter((item) => item.registrationNumber.includes(marker))
    : mapped;

  return NextResponse.json({ success: true, data: filtered });
}
