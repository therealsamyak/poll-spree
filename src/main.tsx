import { ClerkProvider } from "@clerk/clerk-react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createRouter, RouterProvider } from "@tanstack/react-router"
import { ConvexProvider, ConvexReactClient } from "convex/react"
import { StrictMode, useEffect, useState } from "react"
import ReactDOM from "react-dom/client"
import { Loader } from "@/components/loader"
import { NotificationProvider } from "@/components/ui/notification"
import { routeTree } from "./routeTree.gen"

// Initialize Convex client
const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string)

// Initialize Clerk
const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!publishableKey) {
  throw new Error("Missing Publishable Key")
}

// Create QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

// Create router with modern defaults
const router = createRouter({
  routeTree,
  // Preload routes on hover/touch
  defaultPreload: "intent",
  // Show loader while route components are loading
  defaultPendingComponent: () => <Loader />,
  // Enable client-side error boundaries
  defaultErrorComponent: ({ error }) => (
    <div className="p-4 text-destructive">
      <h1>Error</h1>
      <pre>{error.message}</pre>
    </div>
  ),
  context: {},
  // Wrap the app with providers
  Wrap: ({ children }: { children: React.ReactNode }) => {
    const [redirectUrl, setRedirectUrl] = useState("/")

    useEffect(() => {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search)
        const redirect = params.get("redirect_url")
        setRedirectUrl(redirect || "/")
      }
    }, [])

    return (
      <ClerkProvider
        publishableKey={publishableKey}
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-none",
          },
        }}
        signInForceRedirectUrl={redirectUrl}
        signUpForceRedirectUrl={redirectUrl}
      >
        <QueryClientProvider client={queryClient}>
          <ConvexProvider client={convex}>
            <NotificationProvider>{children}</NotificationProvider>
          </ConvexProvider>
        </QueryClientProvider>
      </ClerkProvider>
    )
  },
})

// Register router for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}

const mountApp = () => {
  const rootElement = document.getElementById("app")

  if (!rootElement) {
    throw new Error(
      "Root element #app not found. Please add <div id='app'></div> to your index.html",
    )
  }

  // Only create root if not already hydrated
  if (!rootElement.innerHTML) {
    const root = ReactDOM.createRoot(rootElement)
    root.render(
      <StrictMode>
        <RouterProvider router={router} />
      </StrictMode>,
    )
  }
}

// Mount the app and handle any errors
try {
  mountApp()
} catch (_error) {
  // Silently handle mount errors
}
