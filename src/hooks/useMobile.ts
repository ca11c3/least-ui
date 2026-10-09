import * as React from "react";

const MOBILE_BREAKPOINT = 768;
// Tailwind's `lg`, the width at which side-by-side layouts kick in.
const DESKTOP_BREAKPOINT = 1024;

export function useMediaQuery(query: string) {
  const [matches, setMatches] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);

    mql.addEventListener("change", onChange);
    setMatches(mql.matches);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return !!matches;
}

export function useIsMobile() {
  return useMediaQuery(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
}

// Use this, not `!useIsMobile()`, to gate anything that pairs with a `lg:`
// class, so the JS and the CSS switch at the same width.
export function useIsDesktop() {
  return useMediaQuery(`(min-width: ${DESKTOP_BREAKPOINT}px)`);
}
