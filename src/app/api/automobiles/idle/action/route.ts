import { NextResponse } from 'next/server';
import { z } from 'zod';

const idleActionSchema = z.object({
  vehicleId: z.string().trim().min(1),
  action: z.enum(['TRANSFER', 'GEM_EXPORT', 'DECOMMISSION']),
  notes: z.string().trim().max(300).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = idleActionSchema.parse(body);

    return NextResponse.json({
      success: true,
      data: {
        ...payload,
        processedAt: new Date().toISOString(),
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, message: 'Invalid idle action payload.' },
      { status: 400 }
    );
  }
}
