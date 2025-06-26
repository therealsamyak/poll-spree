import { useAuth } from "@clerk/clerk-react"
import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import { PollsList } from "../components/polls-list"
import { UsernameSetup } from "../components/username-setup"

function Index() {
  const { userId, isSignedIn } = useAuth()
  const user = useQuery(api.polls.getUser, { userId: userId || "" })

  // Show loading state while checking user
  if (isSignedIn && user === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-primary border-b-2" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Show username setup for signed-in users without usernames
  if (isSignedIn && !user) {
    return <UsernameSetup />
  }

  // Show polls list for users with usernames or non-signed-in users
  return <PollsList />
}

export const Route = createFileRoute("/")({
  component: Index,
})
