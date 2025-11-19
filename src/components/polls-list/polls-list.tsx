import { SignInButton, useAuth } from "@clerk/clerk-react"
import { useQuery } from "convex/react"
import { BarChart3, ChevronLeft, ChevronRight, Loader2, Plus } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { CreatePollDialog } from "@/components/create-poll-dialog"
import { Footer } from "@/components/footer"
import { FeedPollCard } from "@/components/poll-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Poll } from "@/types"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"

export const PollsList = () => {
  const { isSignedIn, userId } = useAuth()
  const [paginationOpts, setPaginationOpts] = useState({
    numItems: 20,
    cursor: null as string | null,
  })
  const [allPolls, setAllPolls] = useState<Poll[]>([])
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const pollsResult = useQuery(api.polls.getPolls, { paginationOpts })
  const _stats = useQuery(api.polls.getPollsStats)

  // Scroll handlers
  const scrollLeft = useCallback(() => {
    if (scrollContainerRef.current) {
      const width = scrollContainerRef.current.clientWidth
      scrollContainerRef.current.scrollBy({ left: -width, behavior: "smooth" })
    }
  }, [])

  const scrollRight = useCallback(() => {
    if (scrollContainerRef.current) {
      const width = scrollContainerRef.current.clientWidth
      scrollContainerRef.current.scrollBy({ left: width, behavior: "smooth" })
    }
  }, [])

  // Batch fetch user votes for all visible polls
  const pollIds = useMemo(() => allPolls.map((poll) => poll.id as Id<"polls">), [allPolls])
  const userVotes = useQuery(api.polls.getUserVotesForPolls, {
    pollIds,
    userId: userId || "",
  })

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
        root: null, // Use viewport
        rootMargin: "400px", // Load sooner
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

  // Keyboard navigation (desktop only)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        scrollLeft()
      } else if (e.key === "ArrowRight") {
        scrollRight()
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [scrollLeft, scrollRight])

  if (pollsResult === undefined) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="space-y-4 text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading polls...</p>
        </div>
      </div>
    )
  }

  const { isDone } = pollsResult

  if (allPolls.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center px-4">
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

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-br from-background via-background to-muted/20 md:h-screen md:overflow-hidden">
      {/* Desktop Navigation Buttons */}
      <button
        type="button"
        onClick={scrollLeft}
        className="-translate-y-1/2 absolute top-1/2 left-4 z-40 hidden h-12 w-12 items-center justify-center rounded-full border border-border/50 bg-background/50 text-foreground/70 shadow-lg backdrop-blur-sm transition-all hover:scale-110 hover:bg-background hover:text-foreground md:flex"
        aria-label="Previous poll"
      >
        <ChevronLeft className="h-8 w-8" />
      </button>

      <button
        type="button"
        onClick={scrollRight}
        className="-translate-y-1/2 absolute top-1/2 right-4 z-40 hidden h-12 w-12 items-center justify-center rounded-full border border-border/50 bg-background/50 text-foreground/70 shadow-lg backdrop-blur-sm transition-all hover:scale-110 hover:bg-background hover:text-foreground md:flex"
        aria-label="Next poll"
      >
        <ChevronRight className="h-8 w-8" />
      </button>

      {/* Mobile: Vertical Layout */}
      <div className="flex flex-col gap-6 p-4 pb-24 md:hidden">
        {allPolls.map((poll, _index) => (
          <div key={poll.id} className="w-full">
            <FeedPollCard poll={poll} userVote={userVotes?.[poll.id] || null} />
          </div>
        ))}

        {/* Mobile Infinite Scroll Trigger / Loading State */}
        <div ref={loadMoreRef} className="w-full">
          {!isDone && (
            <div className="flex flex-col items-center gap-4 py-8 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="font-medium text-lg">Loading more polls...</span>
            </div>
          )}
          {isDone && allPolls.length > 0 && (
            <div className="flex flex-col items-center justify-center gap-6 p-8 text-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-muted/50">
                <BarChart3 className="h-12 w-12 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-3xl">You're all caught up!</h3>
                <p className="max-w-md text-lg text-muted-foreground">
                  You've seen all the polls. Why not create your own?
                </p>
              </div>
              {isSignedIn ? (
                <CreatePollDialog />
              ) : (
                <SignInButton mode="modal">
                  <Button className="gap-2 bg-primary shadow-lg hover:bg-primary/90">
                    <Plus className="h-5 w-5" />
                    Sign in to create polls
                  </Button>
                </SignInButton>
              )}
              <div className="mt-8">
                <Footer />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Desktop: Horizontal Layout */}
      <div
        ref={scrollContainerRef}
        className="hidden h-screen w-full snap-x snap-mandatory overflow-x-auto overflow-y-auto [-ms-overflow-style:'none'] [scrollbar-width:'none'] md:flex [&::-webkit-scrollbar]:hidden"
      >
        {allPolls.map((poll, _index) => (
          <div
            key={poll.id}
            className="flex w-full shrink-0 snap-start items-start justify-center overflow-y-auto p-4 pt-8 md:p-8 md:pt-12"
          >
            <div className="w-full max-w-3xl">
              <FeedPollCard poll={poll} userVote={userVotes?.[poll.id] || null} />
            </div>
          </div>
        ))}

        {/* Desktop Infinite Scroll Trigger / Loading State */}
        <div
          ref={loadMoreRef}
          className="flex h-full w-full shrink-0 snap-start items-center justify-center"
        >
          {!isDone && (
            <div className="flex flex-col items-center gap-4 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="font-medium text-lg">Loading more polls...</span>
            </div>
          )}
          {isDone && allPolls.length > 0 && (
            <div className="flex flex-col items-center justify-center gap-6 p-8 text-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-muted/50">
                <BarChart3 className="h-12 w-12 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-3xl">You're all caught up!</h3>
                <p className="max-w-md text-lg text-muted-foreground">
                  You've seen all the polls. Why not create your own?
                </p>
              </div>
              {isSignedIn ? (
                <CreatePollDialog />
              ) : (
                <SignInButton mode="modal">
                  <Button className="gap-2 bg-primary shadow-lg hover:bg-primary/90">
                    <Plus className="h-5 w-5" />
                    Sign in to create polls
                  </Button>
                </SignInButton>
              )}
              <div className="mt-8">
                <Footer />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
