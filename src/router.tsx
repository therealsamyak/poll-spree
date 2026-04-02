import { ConvexQueryClient } from "@convex-dev/react-query"
import { QueryClient } from "@tanstack/react-query"
import { createRouter as createTanStackRouter } from "@tanstack/react-router"
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query"
import { ConvexProvider, ConvexReactClient } from "convex/react"
import type { ReactNode } from "react"

import { Loader } from "@/components/loader"

import { routeTree } from "./routeTree.gen"

export function getRouter() {
  const CONVEX_URL = import.meta.env.VITE_CONVEX_URL as string
  if (!CONVEX_URL) {
    throw new Error("missing VITE_CONVEX_URL envar")
  }
  const convex = new ConvexReactClient(CONVEX_URL)
  const convexQueryClient = new ConvexQueryClient(convex)

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 10,
        retry: 1,
        refetchOnWindowFocus: false,
        queryKeyHashFn: convexQueryClient.hashFn(),
        queryFn: convexQueryClient.queryFn(),
      },
    },
  })
  convexQueryClient.connect(queryClient)

  const router = createTanStackRouter({
    routeTree,
    defaultPreload: "intent",
    defaultErrorComponent: ({ error }) => (
      <div className="text-destructive p-4">
        <h1>Error</h1>
        <pre>{error.message}</pre>
      </div>
    ),
    defaultPendingComponent: () => <Loader />,
    context: { queryClient, convexClient: convex, convexQueryClient },
    Wrap: ({ children }: { children: ReactNode }) => (
      <ConvexProvider client={convexQueryClient.convexClient}>
        {children}
      </ConvexProvider>
    ),
  })
  setupRouterSsrQueryIntegration({ router, queryClient })

  return router
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}

export default getRouter()
