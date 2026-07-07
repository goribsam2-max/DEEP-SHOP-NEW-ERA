import { useEffect, useState } from "react";

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query);
    const documentChangeHandler = () => setMatches(mediaQueryList.matches);

    // Initial check
    setMatches(mediaQueryList.matches);

    // Listen to changes
    mediaQueryList.addListener(documentChangeHandler);
    return () => mediaQueryList.removeListener(documentChangeHandler);
  }, [query]);

  return matches;
}
