import { NextResponse } from 'next/server';

import { getLookupData } from '@/lib/spaces-service';

export async function GET() {
  return NextResponse.json({ success: true, data: getLookupData() });
}
