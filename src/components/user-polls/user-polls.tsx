import { useAuth } from "@clerk/clerk-react"
import { useParams, useSearch } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { BarChart3, Loader2, Users } from "lucide-react"
import { useCallback, useEffect, useRef, useState, useMemo } from "react"
import { Avatar } from "@/components/avatar"
import { Footer } from "@/components/footer"
import { PollCard } from "@/components/poll-card"
import type { Poll } from "@/types"
import type { Id } from "../../../convex/_generated/dataModel"
import { api } from "../../../convex/_generated/api"
import { UserPollsEmpty } from "./user-polls-empty"
import { UserPollsFilters } from "./user-polls-filters"
import { UserPollsSort } from "./user-polls-sort"

export const UserPolls = () => {
  const { username } = useParams({ from: "/users/$username" })
  const search = useSearch({ from: "/users/$username" })
  const { userId } = useAuth()

  const [paginationOpts, setPaginationOpts] = useState({
    numItems: 20,
    cursor: null as string | null,
  })
  const [allPolls, setAllPolls] = useState<Poll[]>([])
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // Get user data
  const user = useQuery(api.users.getUserByUsername, { username })
  const userStats = useQuery(api.polls.getUserStats, { userId: user?.userId || "" })

  // Parse filter and sort from URL params
  const filter = search.filter || "authored,voted"
  const sort = search.sort || "recent"
  const filters = filter.split(",") as ("authored" | "voted")[]
  const includeAuthored = filters.includes("authored")
  const includeVoted = filters.includes("voted")

  // Get polls based on filters
  const pollsResult = useQuery(api.polls.getPollsByUser, {
    userId: user?.userId || "",
    includeAuthored,
    includeVoted,
    paginationOpts,
  })

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

  // Reset pagination when filters change
  useEffect(() => {
    setPaginationOpts({ numItems: 20, cursor: null })
    setAllPolls([])
  }, [includeAuthored, includeVoted])

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
        rootMargin: "100px",
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

  if (user === undefined) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="space-y-4 text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading user...</p>
        </div>
      </div>
    )
  }

  if (user === null) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="mx-auto w-full max-w-md border-2 border-muted-foreground/20 border-dashed text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="font-bold text-2xl">User not found</h1>
          <p className="text-base">The user you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  const { isDone, continueCursor } = pollsResult || {}

  if (allPolls.length === 0 && !pollsResult) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="space-y-4 text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading polls...</p>
        </div>
      </div>
    )
  }

  // Don't return early - keep the user page layout even when no polls

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-background">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
              <Avatar
                size="lg"
                profileImageUrl={user.profileImageUrl}
                className="h-20 w-20 border-4 border-background shadow-lg"
              />
            </div>
            <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">@{user.username}</h1>
            <div className="mx-auto mb-8 flex max-w-2xl items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <span>{userStats?.totalPolls || 0} polls</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>{userStats?.totalVotes || 0} votes</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Filters and Sort */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <UserPollsFilters currentFilters={filters} />
          <UserPollsSort currentSort={sort} />
        </div>

        {/* Polls Grid or Empty State */}
        {allPolls.length === 0 ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <BarChart3 className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">No polls found</h3>
              <p className="text-muted-foreground">
                {filters.includes("authored") && filters.includes("voted")
                  ? "This user hasn't created or voted on any polls yet."
                  : filters.includes("authored")
                    ? "This user hasn't created any polls yet."
                    : "This user hasn't voted on any polls yet."}
              </p>
            </div>
          </div>
        ) : (
          <div className="mx-auto grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {allPolls.map((poll, index) => (
              <div
                key={poll.id}
                className="slide-in-from-bottom-4 animate-in duration-500"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <PollCard poll={poll} userVote={userVotes?.[poll.id] || null} />
              </div>
            ))}
          </div>
        )}

        {/* Load More Trigger */}
        {!isDone && continueCursor && (
          <div ref={loadMoreRef} className="mt-8 flex justify-center">
            {isLoadingMore && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading more polls...</span>
              </div>
            )}
          </div>
        )}

        {/* End Message */}
        {isDone && allPolls.length > 0 && (
          <div className="mt-8 text-center text-muted-foreground">
            <p>You've reached the end</p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
