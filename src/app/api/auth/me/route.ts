import { NextResponse } from 'next/server';

import { getSessionContext } from '@/lib/api-role';

export async function GET(request: Request) {
  const session = getSessionContext(request);

  if (!session) {
    return NextResponse.json({ ok: false, authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    authenticated: true,
    session,
  });
}
