import { useAuth } from "@clerk/clerk-react"
import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { lazy, Suspense } from "react"
import { Loader } from "@/components/loader"
import { PollsList } from "@/components/polls-list"
import { SEOHead } from "@/components/seo"
import { api } from "../../convex/_generated/api"

const UsernameSetup = lazy(() =>
  import("@/components/username-setup").then((m) => ({
    default: m.UsernameSetup,
  })),
)

const structuredData = {
  type: "WebSite",
} as const

const Index = () => {
  const { userId, isSignedIn } = useAuth()
  const user = useQuery(api.users.getUser, { userId: userId || "" })

  // Show loading state while checking user
  if (isSignedIn && user === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="space-y-4 text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-primary border-b-2" />
          <p className="animate-pulse text-base text-muted-foreground">
            Loading...
          </p>
        </div>
      </div>
    )
  }

  // Show username setup for signed-in users without usernames
  if (isSignedIn && !user) {
    return (
      <Suspense fallback={<Loader />}>
        <UsernameSetup />
      </Suspense>
    )
  }

  // Show polls list for users with usernames or non-signed-in users
  return (
    <>
      <SEOHead
        title="PollSpree - Vote on polls and see what others think!"
        description="Join PollSpree to create and vote on polls. Discover what others think about trending topics and share your opinion with the community."
        keywords="polls, voting, surveys, community, opinions, trending topics, social media polls"
        canonical="https://pollspree.com"
        structuredData={structuredData}
      />
      <PollsList />
    </>
  )
}

export const Route = createFileRoute("/")({
  component: Index,
})
