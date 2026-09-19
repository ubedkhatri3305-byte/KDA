'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Toaster } from 'sonner';

const CACHE_KEY = 'kda_catalog_cache_v1';
const PERSISTED_QUERY_KEYS = [
  'products:trending',
  'products:new-arrivals',
  'products:all-home',
  'banners:home',
];

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 2 * 60 * 1000, // 2 minutes
            gcTime: 15 * 60 * 1000, // 15 minutes
            retry: 2,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  // Restore cached catalog data from localStorage on client mount for instant 0ms display
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(CACHE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const now = Date.now();
        // Expire local storage cache after 4 hours
        if (parsed.timestamp && now - parsed.timestamp < 4 * 60 * 60 * 1000) {
          if (parsed.data) {
            Object.entries(parsed.data).forEach(([key, value]) => {
              const queryKey = key.split(':');
              if (!queryClient.getQueryData(queryKey)) {
                queryClient.setQueryData(queryKey, value);
              }
            });
          }
        }
      }
    } catch {}

    // Subscribe to query cache changes to persist fresh catalog queries
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event?.type === 'updated' && event.query.state.status === 'success') {
        const queryKeyStr = event.query.queryKey.join(':');
        if (PERSISTED_QUERY_KEYS.includes(queryKeyStr)) {
          try {
            const rawStored = localStorage.getItem(CACHE_KEY);
            const currentCache = rawStored ? JSON.parse(rawStored).data || {} : {};
            currentCache[queryKeyStr] = event.query.state.data;
            localStorage.setItem(
              CACHE_KEY,
              JSON.stringify({
                timestamp: Date.now(),
                data: currentCache,
              }),
            );
          } catch {}
        }
      }
    });

    return () => unsubscribe();
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster position="top-right" richColors closeButton duration={4000} />
    </QueryClientProvider>
  );
}
