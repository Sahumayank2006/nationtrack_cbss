import { NextResponse } from 'next/server';

import { getAvailabilityByDate } from '@/lib/spaces-service';

interface Props {
  params: Promise<{ id: string; date: string }>;
}

export async function GET(_request: Request, { params }: Props) {
  const { id, date } = await params;

  try {
    const data = getAvailabilityByDate(id, date);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: (error as Error).message },
      { status: 400 }
    );
  }
}
