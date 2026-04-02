import { ClerkProvider } from "@clerk/clerk-react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createRouter } from "@tanstack/react-router"
import { ConvexProvider, ConvexReactClient } from "convex/react"
import { useState } from "react"
import type { ReactNode } from "react"

import { Loader } from "@/components/loader"
import { NotificationProvider } from "@/components/ui/notification"

import { routeTree } from "./routeTree.gen"

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!publishableKey) {
  throw new Error("Missing Publishable Key")
}

const router = createRouter({
  Wrap: ({ children }: { children: ReactNode }) => {
    const [queryClient] = useState(
      () =>
        new QueryClient({
          defaultOptions: {
            queries: {
              staleTime: 1000 * 60 * 5,
              gcTime: 1000 * 60 * 10,
              retry: 1,
              refetchOnWindowFocus: false,
            },
          },
        }),
    )

    const [convex] = useState(
      () => new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string),
    )

    return (
      <ClerkProvider
        publishableKey={publishableKey}
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-none",
          },
        }}
      >
        <QueryClientProvider client={queryClient}>
          <ConvexProvider client={convex}>
            <NotificationProvider>{children}</NotificationProvider>
          </ConvexProvider>
        </QueryClientProvider>
      </ClerkProvider>
    )
  },
  context: {} as Record<string, unknown>,
  defaultErrorComponent: ({ error }) => (
    <div className="text-destructive p-4">
      <h1>Error</h1>
      <pre>{error.message}</pre>
    </div>
  ),
  defaultPendingComponent: () => <Loader />,
  defaultPreload: "intent",
  routeTree,
})

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}

export default router

export function getRouter() {
  return router
}
