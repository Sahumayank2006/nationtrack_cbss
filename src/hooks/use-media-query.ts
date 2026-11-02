import { useEffect, useState } from 'react';

/**
 * Custom hook for media query matching
 * @param query - Media query string
 * @returns boolean indicating if query matches
 * @example
 * const isDesktop = useMediaQuery('(min-width: 768px)');
 * const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);

    // Set initial value
    setMatches(media.matches);

    // Create event listener
    function handleChange() {
      setMatches(media.matches);
    }

    // Use addEventListener (modern browsers)
    if (media.addEventListener) {
      media.addEventListener('change', handleChange);
      return () => media.removeEventListener('change', handleChange);
    }
    // Fallback to addListener (older browsers)
    else {
      media.addListener(handleChange);
      return () => media.removeListener(handleChange);
    }
  }, [query]);

  return matches;
}
