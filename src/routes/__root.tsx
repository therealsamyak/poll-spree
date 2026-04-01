import { useUser } from "@clerk/clerk-react"
import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
  useRouterState,
} from "@tanstack/react-router"
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools"
import { useMutation } from "convex/react"
import { useEffect, useState } from "react"
import { Loader } from "@/components/loader"
import { Loading } from "@/components/loading"
import { NotFound } from "@/components/not-found"
import { SEOHead } from "@/components/seo"
import { Sidebar } from "@/components/sidebar"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { useAuthState } from "@/lib/clerk"
import { api } from "../../convex/_generated/api"
import indexCss from "../index.css?url"

const RootComponent = () => {
  const isFetching = useRouterState({
    select: (s) => s.isLoading,
  })

  const { isLoaded } = useAuthState()
  const { user } = useUser()
  const [isClient, setIsClient] = useState(false)
  const updateProfileImage = useMutation(api.users.updateProfileImage)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (user?.id && user?.imageUrl !== undefined) {
      updateProfileImage({
        userId: user.id,
        profileImageUrl: user.imageUrl || "",
      }).catch((_error) => {
        // Silently handle profile image sync errors
      })
    }
  }, [user?.id, user?.imageUrl, updateProfileImage])

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {!isLoaded || !isClient ? (
          <Loading />
        ) : (
          <>
            <SEOHead />
            <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
              <div className="flex max-h-screen max-w-screen overflow-hidden bg-background">
                <Sidebar />
                <main className="ml-16 flex-1 overflow-auto transition-colors duration-300 md:ml-64">
                  {isFetching ? (
                    <Loader />
                  ) : (
                    <div className="min-h-full animate-in">
                      <Outlet />
                    </div>
                  )}
                </main>
              </div>
              <Toaster richColors />
            </ThemeProvider>
            <TanStackRouterDevtools position="bottom-right" />
          </>
        )}
        <Scripts />
      </body>
    </html>
  )
}

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFound,
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
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap",
      },
    ],
  }),
})
