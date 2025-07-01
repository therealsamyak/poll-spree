import { SignInButton, useAuth } from "@clerk/clerk-react"
import { useQuery } from "convex/react"
import { BarChart3, Loader2, Plus, Users } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { CreatePollDialog } from "@/components/create-poll-dialog"
import { Footer } from "@/components/footer"
import { PollCard } from "@/components/poll-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Poll } from "@/types"
import { api } from "../../../convex/_generated/api"

export const PollsList = () => {
  const { isSignedIn } = useAuth()
  const [paginationOpts, setPaginationOpts] = useState({
    numItems: 20,
    cursor: null as string | null,
  })
  const [allPolls, setAllPolls] = useState<Poll[]>([])
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const pollsResult = useQuery(api.polls.getPolls, { paginationOpts })
  const stats = useQuery(api.polls.getPollsStats)

  // Update allPolls when new data comes in
  useEffect(() => {
    if (pollsResult?.polls) {
      if (paginationOpts.cursor === null) {
        // First load - replace all polls
        setAllPolls(pollsResult.polls)
      } else {
        // Subsequent loads - append new polls
        setAllPolls((prev) => [...prev, ...pollsResult.polls])
      }
    }
  }, [pollsResult?.polls, paginationOpts.cursor])

  // Infinite scroll logic
  const loadMore = useCallback(() => {
    if (pollsResult?.continueCursor && !pollsResult?.isDone && !isLoadingMore) {
      setIsLoadingMore(true)
      setPaginationOpts((prev) => ({
        ...prev,
        cursor: pollsResult.continueCursor,
      }))
    }
  }, [pollsResult?.continueCursor, pollsResult?.isDone, isLoadingMore])

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0]
        if (target.isIntersecting && pollsResult?.continueCursor && !pollsResult?.isDone) {
          loadMore()
        }
      },
      {
        rootMargin: "100px", // Start loading when user is 100px away from the bottom
        threshold: 0.1,
      },
    )

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }

    return () => observer.disconnect()
  }, [loadMore, pollsResult?.continueCursor, pollsResult?.isDone])

  // Reset loading state when new data arrives
  useEffect(() => {
    if (pollsResult) {
      setIsLoadingMore(false)
    }
  }, [pollsResult])

  if (pollsResult === undefined) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="space-y-4 text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading polls...</p>
        </div>
      </div>
    )
  }

  const { isDone, continueCursor } = pollsResult

  if (allPolls.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <Card className="mx-auto w-full max-w-md border-2 border-muted-foreground/20 border-dashed text-center">
          <CardHeader className="pb-4">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle className="font-bold text-2xl">No polls yet</CardTitle>
            <CardDescription className="text-base">
              Be the first to create a poll and start the conversation!
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-6">
            {isSignedIn ? (
              <CreatePollDialog />
            ) : (
              <SignInButton mode="modal">
                <Button className="gap-2 bg-gradient-to-r from-primary to-primary/80 shadow-lg hover:from-primary/90 hover:to-primary/70">
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

  const totalVotes = stats?.totalVotes || 0
  const totalPolls = stats?.totalPolls || allPolls.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Section */}
      <div className="relative overflow-hidden border-b bg-gradient-to-r from-primary/10 via-primary/5 to-background">
        <div className="absolute inset-0 bg-[size:50px_50px] bg-grid-white/[0.02]" />
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="space-y-4 text-center">
            <h1 className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text font-bold text-4xl text-transparent sm:text-5xl">
              Community Polls
            </h1>
            <p className="mx-auto max-w-2xl text-muted-foreground text-xl">
              Vote on polls and see what the community thinks. Your opinion matters!
            </p>

            {/* Stats */}
            <div className="flex flex-col items-center justify-center gap-2 pt-4 sm:flex-row sm:gap-0 sm:space-x-8">
              <div className="flex items-center space-x-2 text-muted-foreground">
                <BarChart3 className="h-5 w-5" />
                <span className="font-medium">{totalPolls} polls</span>
              </div>
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Users className="h-5 w-5" />
                <span className="font-medium">{totalVotes} votes</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header with Create Button */}
        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="space-y-1">
            <h2 className="font-bold text-2xl">Recent Polls</h2>
            <p className="text-muted-foreground">Join the conversation and make your voice heard</p>
          </div>
          {isSignedIn && <CreatePollDialog />}
        </div>

        {/* Polls Grid */}
        <div className="flex w-full flex-col justify-center gap-6 sm:flex-row sm:flex-wrap">
          {allPolls.map((poll, index) => (
            <div
              key={poll.id}
              className="slide-in-from-bottom-4 min-w-[280px] max-w-[280px] flex-1 animate-in duration-500 sm:basis-1/2 md:basis-1/3"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <PollCard poll={poll} />
            </div>
          ))}
        </div>

        {/* Infinite Scroll Trigger */}
        {!isDone && continueCursor && (
          <div ref={loadMoreRef} className="mt-8 flex justify-center py-4">
            {isLoadingMore ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading more polls...</span>
              </div>
            ) : (
              <div className="h-4" /> // Invisible trigger element
            )}
          </div>
        )}

        {/* End of content indicator */}
        {isDone && allPolls.length > 0 && (
          <div className="mt-8 text-center text-muted-foreground">
            <p>You've reached the end! 🎉</p>
          </div>
        )}

        {/* Footer */}
        <Footer />
      </div>
    </div>
  )
}
