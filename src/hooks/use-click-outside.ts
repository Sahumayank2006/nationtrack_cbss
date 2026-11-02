import { useEffect, useRef } from 'react';

/**
 * Custom hook for detecting clicks outside of an element
 * @param callback - Function to call when click outside is detected
 * @returns ref to attach to the element
 * @example
 * const ref = useClickOutside(() => setIsOpen(false));
 * <div ref={ref}>Content</div>
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
  callback: () => void
): React.RefObject<T> {
  const ref = useRef<T>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [callback]);

  return ref;
}
