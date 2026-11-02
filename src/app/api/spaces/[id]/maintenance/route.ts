import { NextResponse } from 'next/server';

import { getMaintenanceBySpace, raiseMaintenance } from '@/lib/spaces-service';
import type { MaintenanceTicket } from '@/types/spaces';

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: Props) {
  const { id } = await params;
  const data = getMaintenanceBySpace(id);
  return NextResponse.json({ success: true, data, meta: { total: data.length } });
}

export async function POST(request: Request, { params }: Props) {
  const { id } = await params;
  const body = (await request.json()) as {
    createdBy?: string;
    description?: string;
    severity?: MaintenanceTicket['severity'];
    photos?: string[];
  };

  if (!body.description?.trim()) {
    return NextResponse.json(
      { success: false, message: 'Description is required' },
      { status: 400 }
    );
  }

  try {
    const data = raiseMaintenance(
      id,
      body.createdBy ?? 'Field Staff',
      body.description,
      body.severity ?? 'MEDIUM',
      body.photos ?? []
    );

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: (error as Error).message },
      { status: 400 }
    );
  }
}
