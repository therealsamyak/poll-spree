import { SignInButton, useAuth } from "@clerk/tanstack-react-start"
import { convexQuery } from "@convex-dev/react-query"
import { useQuery } from "@tanstack/react-query"
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
} from "lucide-react"
import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"

import { Loader } from "@/components/loader"
import { FeedPollCard } from "@/components/poll-card"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Poll } from "@/types"

import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"

const CreatePollDialog = lazy(() =>
  import("@/components/create-poll-dialog").then((m) => ({
    default: m.CreatePollDialog,
  })),
)

export const PollsList = () => {
  const { isSignedIn, userId } = useAuth()
  const [paginationOpts, setPaginationOpts] = useState({
    cursor: null as string | null,
    numItems: 20,
  })
  const [allPolls, setAllPolls] = useState<Poll[]>([])
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const { data: pollsResult } = useQuery(
    convexQuery(api.polls.getPolls, { paginationOpts }),
  )

  // Scroll handlers
  const scrollLeft = useCallback(() => {
    if (scrollContainerRef.current) {
      const width = scrollContainerRef.current.clientWidth
      scrollContainerRef.current.scrollBy({ behavior: "smooth", left: -width })
    }
  }, [])

  const scrollRight = useCallback(() => {
    if (scrollContainerRef.current) {
      const width = scrollContainerRef.current.clientWidth
      scrollContainerRef.current.scrollBy({ behavior: "smooth", left: width })
    }
  }, [])

  // Batch fetch user votes for all visible polls
  const pollIds = useMemo(
    () => allPolls.map((poll) => poll.id as Id<"polls">),
    [allPolls],
  )
  const { data: userVotes } = useQuery(
    convexQuery(api.polls.getUserVotesForPolls, {
      pollIds,
      userId: userId || "",
    }),
  )
  const { data: userLikes } = useQuery(
    convexQuery(api.polls.getUserLikesForPolls, {
      pollIds,
      userId: userId || "",
    }),
  )

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
      setIsLoadingMore(false)
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
        if (
          target.isIntersecting &&
          pollsResult?.continueCursor &&
          !pollsResult?.isDone
        ) {
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
          <Loader2 className="text-primary mx-auto h-12 w-12 animate-spin" />
          <p className="text-muted-foreground animate-pulse">
            Loading polls...
          </p>
        </div>
      </div>
    )
  }

  const { isDone } = pollsResult

  if (allPolls.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center px-4">
        <Card className="border-primary/20 mx-auto w-full max-w-md border-2 border-dashed text-center">
          <CardHeader className="pb-4">
            <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
              <BarChart3 className="text-primary h-8 w-8" />
            </div>
            <CardTitle className="text-2xl font-bold">No polls yet</CardTitle>
            <CardDescription className="text-base">
              Be the first to create a poll and start the conversation!
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
    <div className="from-background via-background to-muted/20 relative min-h-screen w-full bg-gradient-to-br md:h-screen md:overflow-hidden">
      {/* Desktop Navigation Buttons */}
      <button
        type="button"
        onClick={scrollLeft}
        className="border-border/50 bg-background/50 text-foreground/80 hover:bg-background hover:text-foreground absolute top-1/2 left-4 z-40 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border shadow-lg backdrop-blur-sm md:flex"
        aria-label="Previous poll"
      >
        <ChevronLeft className="h-8 w-8" />
      </button>

      <button
        type="button"
        onClick={scrollRight}
        className="border-border/50 bg-background/50 text-foreground/80 hover:bg-background hover:text-foreground absolute top-1/2 right-4 z-40 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border shadow-lg backdrop-blur-sm md:flex"
        aria-label="Next poll"
      >
        <ChevronRight className="h-8 w-8" />
      </button>

      {/* Mobile: Vertical Layout */}
      <div className="flex flex-col gap-6 p-4 pb-24 md:hidden">
        {allPolls.map((poll, _index) => (
          <div key={poll.id} className="w-full">
            <FeedPollCard
              poll={poll}
              userVote={userVotes?.[poll.id] || null}
              userLikeStatus={userLikes?.[poll.id] || false}
            />
          </div>
        ))}

        {/* Mobile Infinite Scroll Trigger / Loading State */}
        <div ref={loadMoreRef} className="w-full">
          {!isDone && (
            <div className="text-muted-foreground flex flex-col items-center gap-4 py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="animate-pulse text-base font-medium">
                Loading more polls...
              </span>
            </div>
          )}
          {isDone && allPolls.length > 0 && (
            <div className="flex flex-col items-center justify-center gap-6 p-8 text-center">
              <div className="bg-primary/10 flex h-24 w-24 items-center justify-center rounded-full">
                <BarChart3 className="text-primary h-12 w-12" />
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-bold tracking-tight">
                  You're all caught up!
                </h3>
                <p className="text-muted-foreground max-w-md text-lg">
                  You've seen all the polls. Why not create your own?
                </p>
              </div>
              {isSignedIn ? (
                <Suspense fallback={<Loader />}>
                  <CreatePollDialog />
                </Suspense>
              ) : (
                <SignInButton mode="modal">
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 shadow-sm">
                    <Plus className="h-5 w-5" />
                    Sign in to create polls
                  </Button>
                </SignInButton>
              )}
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
              <FeedPollCard
                poll={poll}
                userVote={userVotes?.[poll.id] || null}
                userLikeStatus={userLikes?.[poll.id] || false}
              />
            </div>
          </div>
        ))}

        {/* Desktop Infinite Scroll Trigger / Loading State */}
        <div
          ref={loadMoreRef}
          className="flex h-full w-full shrink-0 snap-start items-center justify-center"
        >
          {!isDone && (
            <div className="text-muted-foreground flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="animate-pulse text-base font-medium">
                Loading more polls...
              </span>
            </div>
          )}
          {isDone && allPolls.length > 0 && (
            <div className="flex flex-col items-center justify-center gap-6 p-8 text-center">
              <div className="bg-primary/10 flex h-24 w-24 items-center justify-center rounded-full">
                <BarChart3 className="text-primary h-12 w-12" />
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-bold tracking-tight">
                  You're all caught up!
                </h3>
                <p className="text-muted-foreground max-w-md text-lg">
                  You've seen all the polls. Why not create your own?
                </p>
              </div>
              {isSignedIn ? (
                <Suspense fallback={<Loader />}>
                  <CreatePollDialog />
                </Suspense>
              ) : (
                <SignInButton mode="modal">
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 shadow-sm">
                    <Plus className="h-5 w-5" />
                    Sign in to create polls
                  </Button>
                </SignInButton>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
