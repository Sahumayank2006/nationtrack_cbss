'use client';

import { AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Next.js App Router error page component
 * Automatically used for error.tsx in app directory
 */
export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log error to console
    console.error('Application error:', error);

    // TODO: Log to error tracking service
    // logErrorToService(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8 text-center">
      <AlertTriangle className="mb-4 h-16 w-16 text-destructive" />
      <h1 className="mb-2 text-4xl font-bold">Oops! Something went wrong</h1>
      <p className="mb-6 text-lg text-muted-foreground">
        We encountered an unexpected error. Our team has been notified.
      </p>
      <div className="flex gap-3">
        <Button onClick={reset} size="lg">
          Try Again
        </Button>
        <Button variant="outline" size="lg" onClick={() => (window.location.href = '/')}>
          Go Home
        </Button>
      </div>

      {process.env.NODE_ENV === 'development' && (
        <details className="mt-8 w-full max-w-3xl rounded-lg bg-muted p-6 text-left">
          <summary className="cursor-pointer text-lg font-semibold">Developer Info</summary>
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium">Error Message:</p>
            <pre className="overflow-auto rounded bg-background p-3 text-xs">{error.message}</pre>
            {error.digest && (
              <>
                <p className="text-sm font-medium">Error Digest:</p>
                <pre className="overflow-auto rounded bg-background p-3 text-xs">
                  {error.digest}
                </pre>
              </>
            )}
            {error.stack && (
              <>
                <p className="text-sm font-medium">Stack Trace:</p>
                <pre className="overflow-auto rounded bg-background p-3 text-xs">{error.stack}</pre>
              </>
            )}
          </div>
        </details>
      )}
    </div>
  );
}
