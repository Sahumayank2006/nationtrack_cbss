'use client';

import { useEffect, useState } from 'react';

import type { DemoSession } from '@/types/operations';

const SESSION_KEY = 'nt.demo.session';

export const setDemoSession = (session: DemoSession) => {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

export const clearDemoSession = () => {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(SESSION_KEY);
};

export const useDemoSession = () => {
  const [session, setSession] = useState<DemoSession | null>(null);

  useEffect(() => {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (!raw) {
      setSession(null);
      return;
    }

    try {
      setSession(JSON.parse(raw) as DemoSession);
    } catch {
      setSession(null);
    }
  }, []);

  return session;
};
