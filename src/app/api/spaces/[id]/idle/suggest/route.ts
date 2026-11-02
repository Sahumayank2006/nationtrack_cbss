import { NextResponse } from 'next/server';

import { requireRoles } from '@/lib/api-role';
import { getIdleSuggestions } from '@/lib/spaces-service';

interface Props {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, { params }: Props) {
  const guard = requireRoles(_request, ['ADMIN', 'MINISTRY']);
  if (!guard.ok) return guard.response;

  const { id } = await params;
  const suggestion = getIdleSuggestions().find((item) => item.spaceId === id);

  return NextResponse.json({
    success: true,
    data: suggestion ?? {
      spaceId: id,
      idleDays: 0,
      suggestions: ['No idle suggestions currently'],
    },
  });
}
