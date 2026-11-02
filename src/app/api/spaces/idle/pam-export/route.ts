import { NextResponse } from 'next/server';

import { requireRoles } from '@/lib/api-role';
import { getPamExportRows } from '@/lib/spaces-service';

export async function GET(request: Request) {
  const guard = requireRoles(request, ['ADMIN', 'MINISTRY']);
  if (!guard.ok) return guard.response;

  const rows = getPamExportRows();
  const headers = [
    'Asset ID',
    'Space Name',
    'Type',
    'District',
    'Capacity',
    'Idle Since',
    'Contact Officer',
    'PAM Portal ID',
  ];

  const csvRows = [
    headers.join(','),
    ...rows.map((row) =>
      [
        row.assetId,
        row.spaceName,
        row.type,
        row.district,
        row.capacity,
        row.idleSince,
        row.contactOfficer,
        row.pamPortalId,
      ]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(',')
    ),
  ];

  return new NextResponse(csvRows.join('\n'), {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="nationtrack-pam-export-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
