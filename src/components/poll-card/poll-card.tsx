import { useAuth } from "@clerk/clerk-react"
import { Link } from "@tanstack/react-router"
import { useMutation, useQuery } from "convex/react"
import { BarChart3, Calendar, CheckCircle2, Clock, Trash2, TrendingUp } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { Avatar } from "@/components/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"
import type { Poll } from "../../types"

interface PollCardProps {
  poll: Poll
  onPollDeleted?: () => void
}

export const PollCard = ({ poll, onPollDeleted }: PollCardProps) => {
  const [isVoting, setIsVoting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { userId, isSignedIn } = useAuth()

  const vote = useMutation(api.polls.vote)
  const deletePoll = useMutation(api.polls.deletePoll)
  const userVote = useQuery(api.polls.getUserVote, {
    pollId: poll.id as Id<"polls">,
    userId: userId || "",
  })
  const currentUser = useQuery(api.users.getUser, { userId: userId || "" })

  // Add loading state check to prevent flash
  const isUserVoteLoading = userVote === undefined && isSignedIn

  const hasVoted = userVote?.optionId !== null && userVote?.optionId !== undefined
  const canDelete = currentUser && poll.authorId === userId
  const isAuthor = poll.authorId === userId
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
        onPollDeleted?.()
      } else {
        toast.error(result.error || "Failed to delete poll")
      }
    } catch (_error) {
      toast.error("An unexpected error occurred. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  const getVotePercentage = (votes: number) => {
    if (poll.totalVotes === 0) return 0
    return Math.round((votes / poll.totalVotes) * 100)
  }

  return (
    <Card
      className={
        "group border border-muted/40 bg-card shadow-md backdrop-blur-sm transition-all duration-300 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-primary/20 dark:bg-gradient-to-br dark:from-card dark:to-card/50"
      }
    >
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              {poll.dev && (
                <Badge
                  variant="secondary"
                  className="border-accent-foreground/30 bg-gradient-to-r from-accent to-accent/80 text-accent-foreground"
                >
                  <TrendingUp className="mr-1 h-3 w-3" />
                  Dev
                </Badge>
              )}
              {poll.totalVotes > 10 && (
                <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Popular
                </Badge>
              )}
            </div>

            <CardTitle className="font-bold text-foreground text-xl leading-tight">
              {poll.question}
            </CardTitle>

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
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-4">
          {poll.options.map((option, _index) => {
            const isSelected = !isUserVoteLoading && userVote?.optionId === option.id
            const percentage = getVotePercentage(option.votes)
            const isWinning =
              poll.totalVotes > 0 &&
              percentage === Math.max(...poll.options.map((o) => getVotePercentage(o.votes)))

            // Determine if we should show the real percentage or 0%
            const shouldShowEmptyBar = !isSignedIn || (isSignedIn && !hasVoted && !isAuthor)

            return (
              <div key={option.id} className="space-y-4">
                <Button
                  variant={isSelected ? "default" : "outline"}
                  className={`h-auto w-full justify-start p-4 transition-all duration-200${
                    isSelected
                      ? " border border-transparent bg-primary/80 text-primary-foreground shadow-lg ring-2 ring-primary/20 hover:text-primary-foreground"
                      : " border border-transparent bg-primary/10 text-foreground hover:bg-primary/20 hover:text-primary hover:shadow-md focus-visible:bg-muted/80 dark:border-foreground/20 dark:focus-visible:bg-foreground/5 dark:hover:border-foreground/40"
                  }${isWinning && showResults && !isSelected ? " bg-accent/5 ring-2 ring-accent/50 dark:bg-accent/35" : ""}${
                    isUserVoteLoading ? " animate-pulse" : ""
                  }`}
                  onClick={() => handleVote(option.id)}
                  disabled={isVoting || isUserVoteLoading}
                >
                  <div className="flex w-full items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isSelected && <CheckCircle2 className="h-5 w-5 text-inherit" />}
                      <span className={`text-left font-medium${isSelected ? " text-inherit" : ""}`}>
                        {option.text}
                      </span>
                    </div>
                    {showResults && (
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className={`font-bold text-sm${isSelected ? " text-inherit" : ""}`}>
                            {shouldShowEmptyBar ? 0 : percentage}%
                          </span>
                          <div
                            className={`text-xs${isSelected ? " text-inherit/90" : " text-muted-foreground"}`}
                          >
                            {shouldShowEmptyBar ? 0 : option.votes} votes
                          </div>
                        </div>
                        {isWinning && !shouldShowEmptyBar && (
                          <TrendingUp className="h-4 w-4 text-accent-foreground" />
                        )}
                      </div>
                    )}
                  </div>
                </Button>

                {/* Result Bar: always render, but width is 0 unless showResults and not shouldShowEmptyBar */}
                <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ease-out ${
                      isWinning && !shouldShowEmptyBar
                        ? "bg-gradient-to-r from-accent to-accent-foreground"
                        : "bg-gradient-to-r from-primary to-primary/80"
                    }`}
                    style={{
                      width: showResults ? (shouldShowEmptyBar ? "0%" : `${percentage}%`) : "0%",
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />
                </div>
              </div>
            )
          })}
        </div>

        {!isSignedIn && (
          <div className="rounded-lg border border-muted-foreground/20 border-dashed bg-gradient-to-r from-muted/30 to-muted/50 py-6 text-center">
            <div className="space-y-2">
              <p className="font-medium text-muted-foreground text-sm">
                Sign in to vote and see results
              </p>
              <p className="text-muted-foreground text-xs">
                Join the community and make your voice heard
              </p>
            </div>
          </div>
        )}

        {isSignedIn && !hasVoted && !isAuthor && (
          <div className="py-4 text-center">
            <Separator className="my-3" />
            <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
              <Clock className="h-4 w-4" />
              <p>Vote to see the results</p>
            </div>
          </div>
        )}

        {hasVoted && (
          <div className="py-4 text-center">
            <Separator className="my-3" />
            <div className="flex items-center justify-center gap-2 text-accent-foreground text-sm">
              <CheckCircle2 className="h-4 w-4" />
              <p className="font-medium">You've voted!</p>
            </div>
          </div>
        )}

        {isSignedIn && !hasVoted && isAuthor && (
          <div className="py-4 text-center">
            <Separator className="my-3" />
            <div className="flex items-center justify-center gap-2 text-primary text-sm">
              <BarChart3 className="h-4 w-4" />
              <p className="font-medium">You can see results as the poll creator</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
