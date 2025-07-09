import { useAuth } from "@clerk/clerk-react"
import { createFileRoute, notFound } from "@tanstack/react-router"
import { useMutation, useQuery } from "convex/react"
import { BarChart3, Calendar, Trash2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { Avatar } from "@/components/avatar"
import { Button } from "@/components/ui/button"
import { Link } from "@tanstack/react-router"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"

const PollPage = () => {
  const { pollId } = Route.useParams()
  const { userId, isSignedIn } = useAuth()
  const [isVoting, setIsVoting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const poll = useQuery(api.polls.getPoll, { pollId: pollId as Id<"polls"> })
  const userVote = useQuery(api.polls.getUserVote, {
    pollId: pollId as Id<"polls">,
    userId: userId || "",
  })
  const currentUser = useQuery(api.users.getUser, { userId: userId || "" })
  const vote = useMutation(api.polls.vote)
  const deletePoll = useMutation(api.polls.deletePoll)

  // Show loading state while fetching poll
  if (poll === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-primary border-b-2" />
          <p className="text-muted-foreground">Loading poll...</p>
        </div>
      </div>
    )
  }

  // Show 404 if poll doesn't exist
  if (poll === null) {
    throw notFound()
  }

  const hasVoted = userVote?.optionId !== null && userVote?.optionId !== undefined
  const canDelete = currentUser && poll.authorId === userId
  const isAuthor = poll.authorId === userId
  const isUserVoteLoading = userVote === undefined && isSignedIn
  const showResults = !isUserVoteLoading && isSignedIn && (hasVoted || isAuthor)

  const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  }

  const handleVote = async (optionId: string) => {
    if (!isSignedIn) {
      toast.error("Please sign in to vote")
      return
    }

    if (!userId) return

    // If user clicks the same option, unvote
    if (userVote?.optionId === optionId) {
      setIsVoting(true)
      try {
        const result = await vote({
          pollId: poll.id as Id<"polls">,
          optionId: optionId as Id<"pollOptions">,
          userId,
        })

        if (result.success) {
          toast.success("Vote removed!")
        } else {
          toast.error(result.error || "Failed to remove vote")
        }
      } catch (_error) {
        toast.error("An unexpected error occurred. Please try again.")
      } finally {
        setIsVoting(false)
      }
      return
    }

    // Otherwise, change vote or vote for the first time
    setIsVoting(true)
    try {
      const result = await vote({
        pollId: poll.id as Id<"polls">,
        optionId: optionId as Id<"pollOptions">,
        userId,
      })

      if (result.success) {
        toast.success("Vote recorded!")
      } else {
        toast.error(result.error || "Failed to vote")
      }
    } catch (_error) {
      toast.error("An unexpected error occurred. Please try again.")
    } finally {
      setIsVoting(false)
    }
  }

  const handleDelete = async () => {
    if (!userId) return

    setIsDeleting(true)
    try {
      const result = await deletePoll({
        pollId: poll.id as Id<"polls">,
        authorId: userId,
      })

      if (result.success) {
        toast.success("Poll deleted successfully!")
        // Navigate back to home
        window.location.href = "/"
      } else {
        toast.error(result.error || "Failed to delete poll")
      }
    } catch (_error) {
      toast.error("An unexpected error occurred. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  // Helper: get vote percentage
  const getVotePercentage = (votes: number) => {
    if (poll.totalVotes === 0) return 0
    return Math.round((votes / poll.totalVotes) * 100)
  }

  // Helper to compute places and sorted options
  const getOptionsWithPlaces = () => {
    if (!showResults) {
      return poll.options.map((option) => ({ option, place: undefined }))
    }
    const groups: Record<number, typeof poll.options> = {}
    poll.options.forEach((option) => {
      if (!groups[option.votes]) groups[option.votes] = []
      groups[option.votes].push(option)
    })
    const sortedVoteCounts = Object.keys(groups)
      .map((v) => Number(v))
      .sort((a, b) => b - a)
    let place = 1
    const result: { option: (typeof poll.options)[0]; place: number }[] = []
    for (const voteCount of sortedVoteCounts) {
      const group = groups[voteCount].sort((a, b) =>
        a.text.localeCompare(b.text, undefined, { sensitivity: "base" }),
      )
      for (const option of group) {
        result.push({ option, place })
      }
      place += group.length
    }
    return result
  }

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-4">
            {/* Question */}
            <h1 className="text-3xl font-bold text-foreground leading-tight break-words">
              {poll.question}
            </h1>

            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-4 text-muted-foreground text-sm">
              <div className="flex items-center gap-1.5">
                <Link
                  to="/users/$username"
                  params={{ username: poll.authorUsername }}
                  className="flex items-center gap-1.5 transition-all hover:underline hover:opacity-80"
                >
                  <Avatar size="sm" profileImageUrl={poll.authorProfileImageUrl} />
                  <span className="font-medium">{poll.authorUsername}</span>
                </Link>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/30">
                  <Calendar className="h-3 w-3 text-primary" />
                </div>
                <span>{formatDateTime(poll.createdAt)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-accent/20 to-accent/30">
                  <BarChart3 className="h-3 w-3 text-accent-foreground" />
                </div>
                <span className="font-medium">{poll.totalVotes} votes</span>
              </div>
            </div>
          </div>

          {/* Delete button */}
          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Voting Options */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">
            {!isSignedIn
              ? "Vote on this poll:"
              : !isUserVoteLoading && !hasVoted && !isAuthor
                ? "Cast your vote to see results:"
                : "Cast your vote:"}
          </h2>

          <div className="grid gap-4">
            {getOptionsWithPlaces().map(({ option, place }) => {
              const isSelected = !isUserVoteLoading && userVote?.optionId === option.id

              return (
                <Button
                  key={option.id}
                  variant={isSelected ? "default" : "outline"}
                  className={`flex h-auto w-full items-center justify-between rounded-xl border p-6 font-medium text-lg transition-all duration-200 ${
                    isSelected
                      ? "border-primary bg-primary/80 text-primary-foreground shadow-lg ring-2 ring-primary/20 hover:text-primary-foreground"
                      : "border-muted bg-muted text-foreground hover:bg-primary/10 hover:text-primary hover:shadow-md focus-visible:bg-muted/80 dark:border-foreground/20 dark:focus-visible:bg-foreground/5 dark:hover:border-foreground/40"
                  } hover:border-[var(--primary)]`}
                  onClick={() => handleVote(option.id)}
                  disabled={isVoting || isUserVoteLoading}
                  style={{
                    minHeight: 64,
                    whiteSpace: "normal",
                    wordBreak: "break-word",
                    color: "var(--foreground)",
                    borderColor: isSelected ? "var(--primary)" : undefined,
                  }}
                >
                  <span
                    className="flex w-full flex-col items-start gap-2"
                    style={{ color: "var(--foreground)" }}
                  >
                    <span className="flex w-full items-center">
                      {/* Show place if user has voted and is signed in */}
                      {place !== undefined && (
                        <span className="mr-3 flex-shrink-0 flex-nowrap text-xl font-bold">
                          {place}.
                        </span>
                      )}
                      <span
                        className="whitespace-pre-line break-words text-lg"
                        style={{ wordBreak: "break-word" }}
                      >
                        {option.text}
                      </span>
                    </span>
                    {showResults && (
                      <span className="mt-2 text-sm" style={{ color: "var(--foreground)" }}>
                        {getVotePercentage(option.votes)}% • {option.votes} vote
                        {option.votes === 1 ? "" : "s"}
                      </span>
                    )}
                  </span>
                </Button>
              )
            })}
          </div>
        </div>

        {/* Sign in prompt for non-signed in users */}
        {!isSignedIn && (
          <div className="rounded-lg border border-muted bg-muted/50 p-4 text-center">
            <p className="text-muted-foreground">
              Sign in to vote on this poll and see real-time results!
            </p>
          </div>
        )}

        {/* Results hidden message for signed in users who haven't voted */}
        {isSignedIn && !isUserVoteLoading && !hasVoted && !isAuthor && (
          <div className="rounded-lg border border-muted bg-muted/50 p-4 text-center">
            <p className="text-muted-foreground">Vote to see the current results!</p>
          </div>
        )}
      </div>
    </div>
  )
}

export const Route = createFileRoute("/polls/$pollId")({
  component: PollPage,
})
