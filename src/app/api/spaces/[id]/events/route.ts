import { NextResponse } from 'next/server';

import { getSpaceEvents } from '@/lib/spaces-service';

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: Props) {
  const { id } = await params;
  const data = getSpaceEvents(id);
  return NextResponse.json({ success: true, data, meta: { total: data.length } });
}
