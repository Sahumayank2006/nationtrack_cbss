import { NextResponse } from 'next/server';

import { getIdleSuggestions, getVehicles } from '@/lib/automobiles-service';
import type { IdleVehicleRedeployment } from '@/types/admin-automobiles';

const toCondition = (idleDays: number): IdleVehicleRedeployment['estimatedCondition'] => {
  if (idleDays >= 540) return 'POOR';
  if (idleDays >= 300) return 'FAIR';
  return 'GOOD';
};

const toAction = (
  action: 'ELECTION_DEPLOYMENT' | 'INTER_DEPARTMENT_TRANSFER' | 'GEM_AUCTION'
): IdleVehicleRedeployment['suggestedAction'] => {
  if (action === 'GEM_AUCTION') return 'AUCTION';
  if (action === 'INTER_DEPARTMENT_TRANSFER') return 'TRANSFER';
  return 'ACTIVATE';
};

export async function GET() {
  const suggestions = getIdleSuggestions();
  const byVehicleId = new Map(getVehicles().map((v) => [v.id, v]));

  const data: IdleVehicleRedeployment[] = suggestions.map((item) => {
    const vehicle = byVehicleId.get(item.vehicleId);

    return {
      id: item.id,
      vehicleId: item.vehicleId,
      registrationNumber: item.registrationNumber,
      vehicleType: vehicle?.vehicleType ?? 'Vehicle',
      idleSinceDate:
        vehicle?.idleSinceDate ??
        new Date(Date.now() - item.idleDays * 24 * 60 * 60 * 1000).toISOString(),
      idleDays: item.idleDays,
      lastKnownLocation: vehicle?.locationLabel ?? 'Unknown',
      estimatedCondition: toCondition(item.idleDays),
      readyForReuse: item.idleDays < 365,
      suggestedAction: toAction(item.suggestedAction),
    };
  });

  return NextResponse.json({
    success: true,
    data,
    suggestions,
    generatedAt: new Date().toISOString(),
  });
}
