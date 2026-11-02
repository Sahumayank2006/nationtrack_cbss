import { NextResponse } from 'next/server';

import { requireRoles } from '@/lib/api-role';
import { activateIdleSpace } from '@/lib/spaces-service';

interface Props {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: Props) {
  const guard = requireRoles(request, ['ADMIN', 'MINISTRY']);
  if (!guard.ok) return guard.response;

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as { actorName?: string };

  try {
    const data = activateIdleSpace(id, body.actorName ?? 'Department Officer');
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: (error as Error).message },
      { status: 400 }
    );
  }
}
