import { z } from 'zod';

import type { DemoRole, DemoSession } from '@/types/operations';

export const AUTH_COOKIE_NAME = 'nt_demo_session';

const roleSchema = z.enum(['ADMIN', 'MINISTRY', 'FIELD_OFFICER']);

const sessionCookieSchema = z.object({
  id: z.string().min(1),
  role: roleSchema,
  uid: z.string().min(1).optional(),
  email: z.string().email().optional(),
  name: z.string().min(1).optional(),
  openSpaceId: z.string().min(1).optional(),
  openSpaceName: z.string().min(1).optional(),
});

export type SessionCookiePayload = z.infer<typeof sessionCookieSchema>;

const loginSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120),
  role: roleSchema,
});

export type LoginPayload = z.infer<typeof loginSchema>;

export const parseLoginPayload = (payload: unknown): LoginPayload => loginSchema.parse(payload);

export const roleLabel = (role: DemoRole) => {
  if (role === 'ADMIN') return 'Admin';
  if (role === 'MINISTRY') return 'Ministry';
  return 'Field Officer';
};

export const createDemoSession = (payload: LoginPayload): DemoSession => ({
  id: `demo-${crypto.randomUUID()}`,
  name: payload.name,
  email: payload.email,
  role: payload.role,
  signedInAt: new Date().toISOString(),
});

export const parseSessionCookieValue = (cookieValue: string): SessionCookiePayload | null => {
  const parseJson = (raw: string): unknown => {
    try {
      return JSON.parse(raw) as unknown;
    } catch {
      return null;
    }
  };

  const firstPass = parseJson(cookieValue);
  const firstResult = sessionCookieSchema.safeParse(firstPass);
  if (firstResult.success) {
    return firstResult.data;
  }

  if (typeof firstPass === 'string') {
    const secondPass = parseJson(firstPass);
    const secondResult = sessionCookieSchema.safeParse(secondPass);
    if (secondResult.success) {
      return secondResult.data;
    }
  }

  return null;
};
