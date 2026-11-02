import { useState, useEffect, useCallback } from 'react';

type CopiedValue = string | null;
type CopyFn = (text: string) => Promise<boolean>;

/**
 * Custom hook for copying text to clipboard
 * @param resetDelay - Time in ms before resetting copied state (default: 2000)
 * @returns [copiedText, copy function]
 * @example
 * const [copiedText, copy] = useClipboard();
 * <button onClick={() => copy('Hello!')}>
 *   {copiedText ? 'Copied!' : 'Copy'}
 * </button>
 */
export function useClipboard(resetDelay = 2000): [CopiedValue, CopyFn] {
  const [copiedText, setCopiedText] = useState<CopiedValue>(null);

  const copy: CopyFn = useCallback(async (text: string) => {
    if (!navigator?.clipboard) {
      console.warn('Clipboard not supported');
      return false;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      return true;
    } catch (error) {
      console.warn('Copy failed', error);
      setCopiedText(null);
      return false;
    }
  }, []);

  useEffect(() => {
    if (copiedText !== null) {
      const timeout = setTimeout(() => {
        setCopiedText(null);
      }, resetDelay);

      return () => clearTimeout(timeout);
    }
  }, [copiedText, resetDelay]);

  return [copiedText, copy];
}
