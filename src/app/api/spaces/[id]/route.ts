import { NextResponse } from 'next/server';

import { getSpaceById } from '@/lib/spaces-service';

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: Props) {
  const { id } = await params;
  const data = getSpaceById(id);
  if (!data) {
    return NextResponse.json({ success: false, message: 'Space not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true, data });
}

export async function PATCH() {
  return NextResponse.json(
    { success: false, message: 'Update endpoint not enabled in demo mode.' },
    { status: 501 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { success: false, message: 'Delete endpoint not enabled in demo mode.' },
    { status: 501 }
  );
}
