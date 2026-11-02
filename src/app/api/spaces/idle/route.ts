import { NextResponse } from 'next/server';

import { getIdleSuggestions } from '@/lib/spaces-service';

export async function GET() {
  const data = getIdleSuggestions();
  return NextResponse.json({ success: true, data, meta: { total: data.length } });
}
