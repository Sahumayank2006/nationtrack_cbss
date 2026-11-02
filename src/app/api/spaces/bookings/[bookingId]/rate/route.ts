import { NextResponse } from 'next/server';

import { requireAnyRole } from '@/lib/api-role';
import { submitRating } from '@/lib/spaces-service';

interface Props {
  params: Promise<{ bookingId: string }>;
}

export async function POST(request: Request, { params }: Props) {
  const guard = requireAnyRole(request);
  if (!guard.ok) return guard.response;

  const { bookingId } = await params;
  const body = (await request.json()) as { rating?: number; feedback?: string };

  if (!body.rating || body.rating < 1 || body.rating > 5) {
    return NextResponse.json(
      { success: false, message: 'Rating must be between 1 and 5' },
      { status: 400 }
    );
  }

  try {
    const data = submitRating(bookingId, body.rating, body.feedback ?? '');
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: (error as Error).message },
      { status: 400 }
    );
  }
}
