import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes default — overridden per query
            gcTime: 1000 * 60 * 30, // 30 minutes - keep data in memory longer
            retry: false, // don't retry when offline — show error/cached data
            refetchOnWindowFocus: false,
            refetchOnReconnect: false, // handled manually in useBackgroundSync
        },
    },
});

export function QueryProvider({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
