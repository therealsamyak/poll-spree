import { ClerkProvider } from "@clerk/clerk-react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createRouter } from "@tanstack/react-router"
import { ConvexProvider, ConvexReactClient } from "convex/react"
import { Loader } from "@/components/loader"
import { NotificationProvider } from "@/components/ui/notification"
import { routeTree } from "./routeTree.gen"

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string)

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!publishableKey) {
  throw new Error("Missing Publishable Key")
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
})

const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  defaultPendingComponent: () => <Loader />,
  defaultErrorComponent: ({ error }) => (
    <div className="p-4 text-destructive">
      <h1>Error</h1>
      <pre>{error.message}</pre>
    </div>
  ),
  context: {},
  Wrap: ({ children }: { children: React.ReactNode }) => (
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
  ),
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
