import { useUser } from "@clerk/clerk-react"
import { createRootRoute, HeadContent, Outlet, useRouterState } from "@tanstack/react-router"
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools"
import { useMutation } from "convex/react"
import { useEffect, useState } from "react"
import Loader from "@/components/loader"
import { Loading } from "@/components/loading"
import { NotFound } from "@/components/not-found"
import { Sidebar } from "@/components/sidebar"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { useAuthState } from "@/lib/clerk"
import { api } from "../../convex/_generated/api"
import "../index.css"

const RootComponent = () => {
  const isFetching = useRouterState({
    select: (s) => s.isLoading,
  })

  const { isLoaded } = useAuthState()
  const { user } = useUser()
  const [isClient, setIsClient] = useState(false)
  const updateProfileImage = useMutation(api.polls.updateProfileImage)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Sync profile image URL with Convex when user changes
  useEffect(() => {
    if (user?.id && user?.imageUrl !== undefined) {
      // Update the profile image URL in our Convex users table
      updateProfileImage({
        userId: user.id,
        profileImageUrl: user.imageUrl || "",
      }).catch((_error) => {
        // Silently handle profile image sync errors
      })
    }
  }, [user?.id, user?.imageUrl, updateProfileImage])

  // Show loading while Clerk is initializing or during SSR
  if (!isLoaded || !isClient) {
    return <Loading />
  }

  return (
    <>
      <HeadContent />
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <div className="flex h-svh">
          <Sidebar />
          <main className="ml-16 flex-1 md:ml-64">{isFetching ? <Loader /> : <Outlet />}</main>
        </div>
        <Toaster richColors />
      </ThemeProvider>
      <TanStackRouterDevtools position="bottom-right" />
    </>
  )
}

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFound,
  head: () => ({
    meta: [
      {
        title: "Poll Spree",
      },
      {
        name: "description",
        content: "Vote on polls and see what others think!",
      },
    ],
    links: [
      {
        rel: "icon",
        href: "/favicon.ico",
      },
    ],
  }),
})
