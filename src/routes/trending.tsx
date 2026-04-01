import { SignInButton, useAuth } from "@clerk/clerk-react"
import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { Loader2, Plus, TrendingUp } from "lucide-react"
import { lazy, Suspense, useMemo } from "react"
import { Footer } from "@/components/footer"
import { Loader } from "@/components/loader"
import { PollCard } from "@/components/poll-card"
import { SEOHead } from "@/components/seo"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"

const CreatePollDialog = lazy(() =>
  import("@/components/create-poll-dialog").then((m) => ({
    default: m.CreatePollDialog,
  })),
)

const Trending = () => {
  const { isSignedIn, userId } = useAuth()

  const pollsResult = useQuery(api.polls.getTrendingPolls)

  // Trending polls are already sorted and limited by backend, so we don't need infinite scroll logic for now
  const allPolls = useMemo(() => pollsResult?.polls || [], [pollsResult?.polls])

  // Batch fetch user votes for all visible polls
  const pollIds = useMemo(
    () => allPolls.map((poll) => poll.id as Id<"polls">),
    [allPolls],
  )
  const userVotes = useQuery(api.polls.getUserVotesForPolls, {
    pollIds,
    userId: userId || "",
  })

  if (pollsResult === undefined) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="space-y-4 text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="animate-pulse text-muted-foreground">
            Loading trending polls...
          </p>
        </div>
      </div>
    )
  }

  if (allPolls.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <Card className="mx-auto w-full max-w-md border-2 border-primary/20 border-dashed text-center">
          <CardHeader className="pb-4">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="font-bold text-2xl tracking-tight">
              No trending polls yet
            </CardTitle>
            <CardDescription className="text-base">
              Be the first to create a viral poll!
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-6">
            {isSignedIn ? (
              <Suspense fallback={<Loader />}>
                <CreatePollDialog />
              </Suspense>
            ) : (
              <SignInButton mode="modal">
                <Button className="gap-2 bg-primary text-primary-foreground shadow-sm transition-all duration-200 hover:bg-primary/90">
                  <Plus className="h-4 w-4" />
                  Sign in to create polls
                </Button>
              </SignInButton>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <>
      <SEOHead
        title="Trending Polls - PollSpree"
        description="Discover the most popular polls on PollSpree. Vote on trending topics and see what the world thinks."
        keywords="trending polls, popular votes, viral surveys, top opinions"
        canonical="https://pollspree.com/trending"
      />
      <div className="relative h-[calc(100vh-4rem)] w-full bg-gradient-to-br from-background via-background to-muted/20 md:h-screen">
        {/* Content */}
        <div className="h-full w-full overflow-y-auto px-4 py-8 pb-20 sm:px-6 lg:px-8">
          {/* Header row: Trending Polls + Create Button */}
          <div className="mb-8 flex w-full items-center justify-center sm:justify-between">
            <h2 className="flex items-center gap-2 font-bold text-2xl tracking-tight">
              <TrendingUp className="h-6 w-6 text-primary" />
              Trending Polls
            </h2>
            {isSignedIn && (
              <div className="hidden sm:block">
                <Suspense fallback={<Loader />}>
                  <CreatePollDialog />
                </Suspense>
              </div>
            )}
          </div>

          {/* Polls Grid */}
          <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {allPolls.map((poll, index) => (
              <div
                key={poll.id}
                className="slide-in-from-bottom-4 animate-in duration-500"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <PollCard poll={poll} userVote={userVotes?.[poll.id] || null} />
              </div>
            ))}
          </div>

          {/* End of content indicator */}
          <div className="mt-8 text-center text-muted-foreground text-sm">
            <p>Showing top 50 trending polls</p>
          </div>

          {/* Footer */}
          <Footer />
        </div>
      </div>
    </>
  )
}

export const Route = createFileRoute("/trending")({
  component: Trending,
})
