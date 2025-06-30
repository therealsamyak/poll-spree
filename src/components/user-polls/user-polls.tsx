import { useParams, useSearch } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { BarChart3, Loader2, Users } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { useAuth } from "@clerk/clerk-react"
import { Avatar } from "@/components/avatar"
import { Footer } from "@/components/footer"
import { PollCard } from "@/components/poll-card"
import type { Poll } from "@/types"
import { api } from "../../../convex/_generated/api"
import { UserPollsEmpty } from "./user-polls-empty"
import { UserPollsFilters } from "./user-polls-filters"
import { UserPollsSort } from "./user-polls-sort"

export const UserPolls = () => {
  const { username } = useParams({ from: "/users/$username" })
  const search = useSearch({ from: "/users/$username" })
  const { userId } = useAuth()

  // Parse filter and sort from URL params
  const filter = search.filter || "authored,voted"
  const sort = search.sort || "recent"

  const filters = filter.split(",") as ("authored" | "voted")[]
  const includeAuthored = filters.includes("authored")
  const includeVoted = filters.includes("voted")

  // State for infinite scroll
  const [allPolls, setAllPolls] = useState<Poll[]>([])
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [paginationOpts, setPaginationOpts] = useState({
    numItems: 20,
    cursor: null as string | null,
  })
  const [isDone, setIsDone] = useState(false)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // Get user by username
  const user = useQuery(api.users.getUserByUsername, { username })

  // Get current user's information
  const currentUser = useQuery(api.users.getUser, { userId: userId || "" })

  // Get polls by user with pagination
  const pollsResult = useQuery(api.polls.getPollsByUser, {
    userId: user?.userId || "",
    includeAuthored,
    includeVoted,
    paginationOpts,
  })

  // Handle infinite scroll loading
  const loadMore = useCallback(() => {
    if (isLoadingMore || isDone || !pollsResult?.continueCursor) return

    setIsLoadingMore(true)
    setPaginationOpts((prev) => ({
      ...prev,
      cursor: pollsResult.continueCursor,
    }))
  }, [isLoadingMore, isDone, pollsResult?.continueCursor])

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore && !isDone) {
          loadMore()
        }
      },
      { rootMargin: "100px" },
    )

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }

    return () => observer.disconnect()
  }, [loadMore, isLoadingMore, isDone])

  // Handle polls data updates
  useEffect(() => {
    if (pollsResult) {
      const validPolls = (pollsResult.polls || []).filter(
        (poll): poll is NonNullable<typeof poll> => poll !== null,
      )

      if (paginationOpts.cursor === null) {
        // First load - replace all polls
        setAllPolls(validPolls as Poll[])
      } else {
        // Subsequent loads - append new polls
        setAllPolls((prev) => [...prev, ...(validPolls as Poll[])])
      }
      setIsDone(pollsResult.isDone || false)
      setIsLoadingMore(false)
    }
  }, [pollsResult, paginationOpts.cursor])

  // Reset pagination when filters change
  useEffect(() => {
    setAllPolls([])
    setPaginationOpts({ numItems: 20, cursor: null })
    setIsDone(false)
    setIsLoadingMore(false)
  }, [])

  // Show loading state while checking user
  if (user === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="space-y-4 text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Show error if user doesn't exist
  if (!user) {
    return (
      <UserPollsEmpty
        type="user-not-found"
        username={username}
        currentUserUsername={currentUser?.username}
      />
    )
  }

  // Sort polls based on sort option
  const sortedPolls = [...allPolls]
    .filter((poll): poll is NonNullable<typeof poll> => poll !== null)
    .sort((a, b) => {
      switch (sort) {
        case "recent":
          return b.createdAt - a.createdAt
        case "oldest":
          return a.createdAt - b.createdAt
        case "most-voted":
          return b.totalVotes - a.totalVotes
        case "least-voted":
          return a.totalVotes - b.totalVotes
        default:
          return b.createdAt - a.createdAt
      }
    })

  const totalVotes = sortedPolls.reduce((sum, poll) => sum + poll.totalVotes, 0)
  const totalPolls = sortedPolls.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Section */}
      <div className="relative overflow-hidden border-b bg-gradient-to-r from-primary/10 via-primary/5 to-background">
        <div className="absolute inset-0 bg-[size:50px_50px] bg-grid-white/[0.02]" />
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="space-y-4 text-center">
            <div className="flex w-full flex-col items-center justify-center gap-2 sm:flex-row sm:items-center sm:gap-0 sm:space-x-3">
              <Avatar profileImageUrl={user.profileImageUrl} size="lg" className="h-12 w-12" />
              <h1 className="w-full min-w-0 whitespace-normal break-words bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text font-bold text-4xl text-transparent sm:w-auto sm:text-5xl">
                {username}'s Polls
              </h1>
            </div>

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
        {/* Filters and Sort */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <UserPollsFilters currentFilters={filters} />
          <UserPollsSort currentSort={sort} />
        </div>

        {/* Polls Grid */}
        <div className="space-y-6">
          {pollsResult === undefined && paginationOpts.cursor === null ? (
            // Show loading state only for initial polls area
            <div className="flex min-h-[40vh] items-center justify-center">
              <div className="space-y-4 text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading polls...</p>
              </div>
            </div>
          ) : sortedPolls.length === 0 ? (
            // Show empty state if no polls match filters
            <UserPollsEmpty
              type={filters.length === 0 ? "no-polls" : "no-results"}
              username={username}
              filters={filters}
              currentUserUsername={currentUser?.username}
            />
          ) : (
            // Show polls
            <>
              {sortedPolls.map((poll, index) => (
                <div
                  key={poll.id}
                  className="slide-in-from-bottom-4 animate-in duration-500"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <PollCard poll={poll} />
                </div>
              ))}

              {/* Load more trigger */}
              {!isDone && (
                <div ref={loadMoreRef} className="flex justify-center py-4">
                  {isLoadingMore ? (
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Loading more polls...</span>
                    </div>
                  ) : (
                    <div className="h-4" /> // Invisible trigger element
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  )
}
