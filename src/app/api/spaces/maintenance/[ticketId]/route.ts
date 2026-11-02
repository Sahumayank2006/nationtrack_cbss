import { NextResponse } from 'next/server';

import { requireRoles } from '@/lib/api-role';
import { updateMaintenanceTicket } from '@/lib/spaces-service';
import type { MaintenanceTicket } from '@/types/spaces';

interface Props {
  params: Promise<{ ticketId: string }>;
}

export async function PATCH(request: Request, { params }: Props) {
  const guard = requireRoles(request, ['ADMIN', 'MINISTRY']);
  if (!guard.ok) return guard.response;

  const { ticketId } = await params;
  const body = (await request.json()) as {
    status?: MaintenanceTicket['status'];
    actorName?: string;
  };

  if (!body.status) {
    return NextResponse.json({ success: false, message: 'status is required' }, { status: 400 });
  }

  try {
    const data = updateMaintenanceTicket(
      ticketId,
      body.status,
      body.actorName ?? 'Department Officer'
    );
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: (error as Error).message },
      { status: 400 }
    );
  }
}
