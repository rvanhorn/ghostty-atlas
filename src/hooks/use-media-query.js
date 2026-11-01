import { useCallback, useSyncExternalStore } from "react";

// Phones in portrait, and phones in landscape whose short height cannot fit the
// side-by-side workspace. The same query appears in the stylesheets.
export const compactLayoutQuery =
  "(max-width: 800px), (pointer: coarse) and (max-height: 520px)";

export const useMediaQuery = (query) => {
  const subscribe = useCallback(
    (onChange) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
  );
};
