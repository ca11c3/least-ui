import { useEffect, useRef } from "react";

interface UseInfiniteScrollOptions {
  onLoadMore: () => void;
  enabled?: boolean;
  isLoading?: boolean; // Added this to prevent double-triggering
}

export function useInfiniteScroll<T extends HTMLElement>({
  onLoadMore,
  enabled = true,
  isLoading = false,
}: UseInfiniteScrollOptions) {
  const sentinelRef = useRef<T | null>(null);
  const hasTriggered = useRef(false);

  useEffect(() => {
    // 1. Exit if disabled, already loading, or no sentinel
    if (!enabled || isLoading || !sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasTriggered.current) {
          hasTriggered.current = true;
          onLoadMore();
          hasTriggered.current = false;
        }
      },
      {
        root: null,
        rootMargin: "200px", // Pre-load a bit earlier
        threshold: 0.01,
      },
    );

    observer.observe(sentinelRef.current);

    return () => observer.disconnect();
  }, [enabled, isLoading, onLoadMore]);

  return sentinelRef;
}
