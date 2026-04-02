import { ClerkProvider } from "@clerk/tanstack-react-start"
import { useAuth, useUser } from "@clerk/tanstack-react-start"
import { auth } from "@clerk/tanstack-react-start/server"
import { ConvexQueryClient } from "@convex-dev/react-query"
import { QueryClient } from "@tanstack/react-query"
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useRouteContext,
  useRouterState,
} from "@tanstack/react-router"
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools"
import { createServerFn } from "@tanstack/react-start"
import { useMutation } from "convex/react"
import { ConvexReactClient } from "convex/react"
import { ConvexProviderWithClerk } from "convex/react-clerk"
import { useEffect, useRef } from "react"

import { Loader } from "@/components/loader"
import { NotFound } from "@/components/not-found"
import { SEOHead } from "@/components/seo"
import { Sidebar } from "@/components/sidebar"
import { ThemeProvider } from "@/components/theme-provider"
import { NotificationProvider } from "@/components/ui/notification"
import { Toaster } from "@/components/ui/sonner"

import { api } from "../../convex/_generated/api"

import indexCss from "../index.css?url"

const fetchClerkAuth = createServerFn({ method: "GET" }).handler(async () => {
  const { userId, getToken } = await auth()
  const token = await getToken()
  return { userId, token }
})

const RootComponent = () => {
  const context = useRouteContext({ from: Route.id })
  const isFetching = useRouterState({
    select: (s) => s.isLoading,
  })

  return (
    <RootDocument>
      <ConvexProviderWithClerk client={context.convexClient} useAuth={useAuth}>
        <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
          <NotificationProvider>
            <UserProfileSync />
            <div className="bg-background flex h-screen max-w-screen overflow-hidden">
              <Sidebar />
              <main className="ml-16 flex-1 overflow-auto transition-colors md:ml-64">
                {isFetching ? <Loader /> : <Outlet />}
              </main>
            </div>
            <Toaster richColors />
          </NotificationProvider>
        </ThemeProvider>
        <SEOHead />
        <TanStackRouterDevtools position="bottom-right" />
      </ConvexProviderWithClerk>
    </RootDocument>
  )
}

const RootDocument = ({ children }: { children: React.ReactNode }) => (
  <ClerkProvider>
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  </ClerkProvider>
)

const UserProfileSync = () => {
  const { user } = useUser()
  const updateProfileImage = useMutation(api.users.updateProfileImage)
  const lastSyncedImageUrl = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (
      user?.id &&
      user?.imageUrl !== undefined &&
      user.imageUrl !== lastSyncedImageUrl.current
    ) {
      lastSyncedImageUrl.current = user.imageUrl
      updateProfileImage({
        profileImageUrl: user.imageUrl || "",
        userId: user.id,
      }).catch(() => {})
    }
  }, [user?.id, user?.imageUrl, updateProfileImage])

  return null
}

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
  convexClient: ConvexReactClient
  convexQueryClient: ConvexQueryClient
}>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" },
      { name: "theme-color", content: "#CB4839" },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: indexCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap",
        crossOrigin: "",
      },
    ],
  }),
  beforeLoad: async (ctx) => {
    const { userId, token } = await fetchClerkAuth()
    if (token) {
      ctx.context.convexQueryClient.serverHttpClient?.setAuth(token)
    }
    return { userId, token }
  },
  notFoundComponent: NotFound,
  component: RootComponent,
})
