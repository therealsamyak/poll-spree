import { useAuth } from "@clerk/clerk-react"
import {
  Link,
  createFileRoute,
  notFound,
  useRouter,
} from "@tanstack/react-router"
import { useMutation, useQuery } from "convex/react"
import { BarChart3, Calendar, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"

import { Avatar } from "@/components/avatar"
import { CommentSection } from "@/components/comments/comment-section"
import { SEOHead } from "@/components/seo"
import { Button } from "@/components/ui/button"
import { useNotification } from "@/components/ui/notification"
import { generatePollSEOConfig } from "@/lib/seo"

import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"

const formatDateTime = (timestamp: number) => {
  const date = new Date(timestamp)
  return date.toLocaleString("en-US", {
    day: "numeric",
    hour: "2-digit",
    hour12: true,
    minute: "2-digit",
    month: "short",
    year: "numeric",
  })
}

const getVotePercentage = (votes: number, totalVotes: number) => {
  if (totalVotes === 0) {
    return 0
  }
  return Math.round((votes / totalVotes) * 100)
}

interface PollOption {
  id: string
  text: string
  votes: number
}

const getOptionsWithPlaces = (
  options: PollOption[],
  showResults: boolean,
): { option: PollOption; place: number | undefined }[] => {
  if (!showResults) {
    return options.map((option) => ({ option, place: undefined }))
  }
  const groups: Record<number, PollOption[]> = {}
  options.forEach((option) => {
    if (!groups[option.votes]) {
      groups[option.votes] = []
    }
    groups[option.votes].push(option)
  })
  const sortedVoteCounts = Object.keys(groups)
    .map((v) => Number(v))
    .toSorted((a, b) => b - a)
  let place = 1
  const result: { option: PollOption; place: number }[] = []
  for (const voteCount of sortedVoteCounts) {
    const group = groups[voteCount].toSorted((a, b) =>
      a.text.localeCompare(b.text, undefined, { sensitivity: "base" }),
    )
    for (const option of group) {
      result.push({ option, place })
    }
    place += group.length
  }
  return result
}

const PollPage = () => {
  const { pollId } = Route.useParams()
  const { userId, isSignedIn } = useAuth()
  const router = useRouter()
  const [isVoting, setIsVoting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { showNotification, showSignInNotification } = useNotification()

  const poll = useQuery(api.polls.getPoll, { pollId: pollId as Id<"polls"> })
  const userVote = useQuery(api.polls.getUserVote, {
    pollId: pollId as Id<"polls">,
    userId: userId || "",
  })
  const currentUser = useQuery(api.users.getUser, { userId: userId || "" })
  const vote = useMutation(api.polls.vote)
  const deletePoll = useMutation(api.polls.deletePoll)
  const viewPoll = useMutation(api.polls.viewPoll)

  useEffect(() => {
    if (pollId) {
      viewPoll({ pollId: pollId as Id<"polls"> })
    }
  }, [pollId, viewPoll])

  // Show loading state while fetching poll
  if (poll === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="border-primary mx-auto h-12 w-12 animate-spin rounded-full border-b-2" />
          <p className="text-muted-foreground animate-pulse">Loading poll...</p>
        </div>
      </div>
    )
  }

  // Show 404 if poll doesn't exist
  if (poll === null) {
    throw notFound()
  }

  const hasVoted =
    userVote?.optionId !== null && userVote?.optionId !== undefined
  const canDelete = currentUser && poll.authorId === userId
  const isAuthor = poll.authorId === userId
  const isUserVoteLoading = userVote === undefined && isSignedIn
  const showResults = !isUserVoteLoading && isSignedIn && (hasVoted || isAuthor)

  const handleVote = async (optionId: string) => {
    if (!isSignedIn) {
      showSignInNotification()
      return
    }

    if (!userId) {
      return
    }

    // If user clicks the same option, unvote
    if (userVote?.optionId === optionId) {
      setIsVoting(true)
      try {
        const result = await vote({
          optionId: optionId as Id<"pollOptions">,
          pollId: poll.id as Id<"polls">,
          userId,
        })

        if (result.success) {
          showNotification({ message: "Vote removed!", variant: "success" })
        } else {
          showNotification({
            message: result.error || "Failed to remove vote",
            variant: "error",
          })
        }
      } catch {
        showNotification({
          message: "An unexpected error occurred. Please try again.",
          variant: "error",
        })
      } finally {
        setIsVoting(false)
      }
      return
    }

    // Otherwise, change vote or vote for the first time
    setIsVoting(true)
    try {
      const result = await vote({
        optionId: optionId as Id<"pollOptions">,
        pollId: poll.id as Id<"polls">,
        userId,
      })

      if (result.success) {
        showNotification({ message: "Vote recorded!", variant: "success" })
      } else {
        showNotification({
          message: result.error || "Failed to vote",
          variant: "error",
        })
      }
    } catch {
      showNotification({
        message: "An unexpected error occurred. Please try again.",
        variant: "error",
      })
    } finally {
      setIsVoting(false)
    }
  }

  const handleDelete = async () => {
    if (!userId) {
      return
    }

    setIsDeleting(true)
    try {
      const result = await deletePoll({
        authorId: userId,
        pollId: poll.id as Id<"polls">,
      })

      if (result.success) {
        showNotification({
          message: "Poll deleted successfully!",
          variant: "success",
        })
        // Navigate back to home
        router.navigate({ to: "/" })
      } else {
        showNotification({
          message: result.error || "Failed to delete poll",
          variant: "error",
        })
      }
    } catch {
      showNotification({
        message: "An unexpected error occurred. Please try again.",
        variant: "error",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const seoConfig = generatePollSEOConfig(poll)

  return (
    <>
      <SEOHead
        title={seoConfig.title}
        description={seoConfig.description}
        keywords={seoConfig.keywords}
        canonical={seoConfig.canonical}
        structuredData={{
          pollData: seoConfig.pollData,
          type: "Poll",
        }}
      />
      <div className="fade-in animate-in container mx-auto max-w-4xl p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-4">
              {/* Question */}
              <h1 className="text-foreground text-3xl leading-tight font-bold tracking-tight wrap-break-word">
                {poll.question}
              </h1>

              {/* Metadata */}
              <div className="text-muted-foreground flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <Link
                    to="/users/$username"
                    params={{ username: poll.authorUsername }}
                    className="flex items-center gap-1.5 transition-all duration-200 hover:underline hover:opacity-80"
                  >
                    <Avatar
                      size="sm"
                      profileImageUrl={poll.authorProfileImageUrl}
                    />
                    <span className="font-medium">{poll.authorUsername}</span>
                  </Link>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="bg-primary/10 flex h-6 w-6 items-center justify-center rounded-full">
                    <Calendar className="text-primary h-3 w-3" />
                  </div>
                  <span>{formatDateTime(poll.createdAt)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="bg-primary/10 flex h-6 w-6 items-center justify-center rounded-full">
                    <BarChart3 className="text-primary h-3 w-3" />
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
            <h2 className="text-foreground text-xl font-semibold tracking-tight">
              {!isSignedIn
                ? "Vote on this poll:"
                : !isUserVoteLoading && !hasVoted && !isAuthor
                  ? "Cast your vote to see results:"
                  : "Cast your vote:"}
            </h2>

            <div className="grid gap-4">
              {getOptionsWithPlaces(poll.options, Boolean(showResults)).map(
                ({ option, place }) => {
                  const isSelected =
                    !isUserVoteLoading && userVote?.optionId === option.id

                  return (
                    <Button
                      key={option.id}
                      variant={isSelected ? "default" : "outline"}
                      className={`flex h-auto w-full items-center justify-between rounded-xl border p-6 text-lg font-medium transition-all duration-200 ${
                        isSelected
                          ? "border-primary bg-primary/80 text-primary-foreground ring-primary/20 hover:text-primary-foreground shadow-lg ring-2"
                          : "border-border bg-card text-foreground hover:bg-primary/10 hover:text-primary hover:scale-[1.01] hover:shadow-md"
                      } hover:border-primary`}
                      onClick={() => handleVote(option.id)}
                      disabled={isVoting || isUserVoteLoading}
                      style={{
                        borderColor: isSelected ? "var(--primary)" : undefined,
                        minHeight: 64,
                        whiteSpace: "normal",
                        wordBreak: "break-word",
                      }}
                    >
                      <span className="text-foreground flex w-full flex-col items-start gap-2">
                        <span className="flex w-full items-center">
                          {/* Show place if user has voted and is signed in */}
                          {place !== undefined && (
                            <span className="mr-3 shrink-0 flex-nowrap text-xl font-bold">
                              {place}.
                            </span>
                          )}
                          <span
                            className="text-lg wrap-break-word whitespace-pre-line"
                            style={{ wordBreak: "break-word" }}
                          >
                            {option.text}
                          </span>
                        </span>
                        {showResults && (
                          <span className="text-foreground mt-2 text-sm">
                            {getVotePercentage(option.votes, poll.totalVotes)}%
                            • {option.votes} vote
                            {option.votes === 1 ? "" : "s"}
                          </span>
                        )}
                      </span>
                    </Button>
                  )
                },
              )}
            </div>
          </div>

          {/* Sign in prompt for non-signed in users */}
          {!isSignedIn && (
            <div className="border-border/50 bg-card rounded-xl border p-4 text-center">
              <p className="text-muted-foreground">
                Sign in to vote on this poll and see real-time results!
              </p>
            </div>
          )}

          {/* Results hidden message for signed in users who haven't voted */}
          {isSignedIn && !isUserVoteLoading && !hasVoted && !isAuthor && (
            <div className="border-border/50 bg-card rounded-xl border p-4 text-center">
              <p className="text-muted-foreground">
                Vote to see the current results!
              </p>
            </div>
          )}

          <div className="border-border/50 border-t pt-8">
            <CommentSection pollId={pollId} />
          </div>
        </div>
      </div>
    </>
  )
}

export const Route = createFileRoute("/polls/$pollId")({
  component: PollPage,
})
