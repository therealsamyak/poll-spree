import { createRootRoute, HeadContent, Outlet, useRouterState } from "@tanstack/react-router"
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools"
import { useEffect, useState } from "react"
import { Header } from "@/components/header"
import Loader from "@/components/loader"
import { Loading } from "@/components/loading"
import { NotFound } from "@/components/not-found"
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
        <div className="grid h-svh grid-rows-[auto_1fr]">
          <Header />
          {isFetching ? <Loader /> : <Outlet />}
        </div>
        <Toaster richColors />
      </ThemeProvider>
      <TanStackRouterDevtools position="bottom-left" />
    </>
  )
}
