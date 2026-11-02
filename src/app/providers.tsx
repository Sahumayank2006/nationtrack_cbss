'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { TranslationProvider } from '@/components/i18n/TranslationProvider';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Registration failures should not block app rendering.
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TranslationProvider>{children}</TranslationProvider>
    </QueryClientProvider>
  );
}
