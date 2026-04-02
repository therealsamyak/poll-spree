import { SignInButton, useAuth } from "@clerk/tanstack-react-start"
import { convexQuery } from "@convex-dev/react-query"
import { useQuery, useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Plus, TrendingUp } from "lucide-react"
import { Suspense, lazy, useMemo } from "react"

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

  const pollsResult = useSuspenseQuery(convexQuery(api.polls.getTrendingPolls))

  // Trending polls are already sorted and limited by backend, so we don't need infinite scroll logic for now
  const allPolls = useMemo(
    () => pollsResult.data?.polls || [],
    [pollsResult.data?.polls],
  )

  // Batch fetch user votes for all visible polls
  const pollIds = useMemo(
    () => allPolls.map((poll) => poll.id as Id<"polls">),
    [allPolls],
  )
  const userVotes = useQuery({
    ...convexQuery(api.polls.getUserVotesForPolls, {
      pollIds,
      userId: userId || "",
    }),
    enabled: pollIds.length > 0,
  })
  const userLikes = useQuery({
    ...convexQuery(api.polls.getUserLikesForPolls, {
      pollIds,
      userId: userId || "",
    }),
    enabled: pollIds.length > 0,
  })

  if (allPolls.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <Card className="border-primary/20 mx-auto w-full max-w-md border-2 border-dashed text-center">
          <CardHeader className="pb-4">
            <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
              <TrendingUp className="text-primary h-8 w-8" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">
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
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 shadow-sm">
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
      <div className="from-background via-background to-muted/20 relative h-[calc(100vh-4rem)] w-full bg-gradient-to-br md:h-screen">
        {/* Content */}
        <div className="h-full w-full overflow-y-auto px-4 py-8 pb-20 sm:px-6 lg:px-8">
          {/* Header row: Trending Polls + Create Button */}
          <div className="mb-8 flex w-full items-center justify-center sm:justify-between">
            <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
              <TrendingUp className="text-primary h-6 w-6" />
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
            {allPolls.map((poll) => (
              <div key={poll.id}>
                <PollCard
                  poll={poll}
                  userVote={userVotes.data?.[poll.id] || null}
                  userLikeStatus={userLikes.data?.[poll.id] || false}
                />
              </div>
            ))}
          </div>

          {/* End of content indicator */}
          <div className="text-muted-foreground mt-8 text-center text-sm">
            <p>Showing top 50 trending polls</p>
          </div>
        </div>
      </div>
    </>
  )
}

export const Route = createFileRoute("/trending")({
  loader: async (opts) => {
    await opts.context.queryClient.ensureQueryData(
      convexQuery(api.polls.getTrendingPolls),
    )
  },
  component: Trending,
})
