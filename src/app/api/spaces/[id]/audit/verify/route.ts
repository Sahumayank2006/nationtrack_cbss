import { NextResponse } from 'next/server';

import { verifySpaceAuditChain } from '@/lib/spaces-service';

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: Props) {
  const { id } = await params;
  const data = verifySpaceAuditChain(id);
  return NextResponse.json({ success: true, data });
}
