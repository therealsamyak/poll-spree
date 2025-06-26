import { createRootRoute, HeadContent, Outlet, useRouterState } from "@tanstack/react-router"
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools"
import { useEffect, useState } from "react"
import Loader from "@/components/loader"
import { Loading } from "@/components/loading"
import { NotFound } from "@/components/not-found"
import { Sidebar } from "@/components/sidebar"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { useAuthState } from "@/lib/clerk"
import "../index.css"

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

function RootComponent() {
  const isFetching = useRouterState({
    select: (s) => s.isLoading,
  })

  const { isLoaded } = useAuthState()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

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
      <TanStackRouterDevtools position="bottom-left" />
    </>
  )
}
