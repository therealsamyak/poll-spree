import { useAuth } from "@clerk/clerk-react"
import { Link } from "@tanstack/react-router"
import { useMutation, useQuery } from "convex/react"
import { BarChart3, Calendar, CheckCircle2, Trash2 } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { Avatar } from "@/components/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
  const [expanded, setExpanded] = useState(false)
  const [shouldMoveToTop, setShouldMoveToTop] = useState(false)
  const prevExpanded = useRef(expanded)

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
  const _showResults = !isUserVoteLoading && isSignedIn && (hasVoted || isAuthor)

  // Only move the selected option to the top if:
  // - The user has selected an option (userVote?.optionId)
  // - The selected option is at index >= 2 (option 3 or lower)
  // - The dialog was just closed (expanded changed from true to false)
  useEffect(() => {
    if (prevExpanded.current && !expanded) {
      // Dialog just closed
      if (userVote?.optionId) {
        const idx = poll.options.findIndex((o) => o.id === userVote.optionId)
        if (idx >= 2) {
          setShouldMoveToTop(true)
        } else {
          setShouldMoveToTop(false)
        }
      } else {
        setShouldMoveToTop(false)
      }
    }
    prevExpanded.current = expanded
  }, [expanded, userVote?.optionId, poll.options])

  // Helper to move selected option to top only if shouldMoveToTop is true AND dialog is closed
  const getSortedOptions = () => {
    if (!expanded && shouldMoveToTop && userVote?.optionId) {
      const selected = poll.options.find((o) => o.id === userVote.optionId)
      const rest = poll.options.filter((o) => o.id !== userVote.optionId)
      return selected ? [selected, ...rest] : poll.options
    }
    // When dialog is open, always show original order
    return poll.options
  }
  const sortedOptions = getSortedOptions()
  const collapsedOptions = sortedOptions.slice(0, 2)
  const hasMoreThanTwo = poll.options.length > 2

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

  const _getVotePercentage = (votes: number) => {
    if (poll.totalVotes === 0) return 0
    return Math.round((votes / poll.totalVotes) * 100)
  }

  return (
    <Card className="group flex h-full flex-col border border-muted/40 bg-card shadow-md backdrop-blur-sm transition-all duration-300 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-primary/20 dark:bg-gradient-to-br dark:from-card dark:to-card/50">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              {/*
              // Dev label logic retained for future use (e.g., filters)
              {poll.dev && (
                <Badge
                  variant="secondary"
                  className="border-accent-foreground/30 bg-gradient-to-r from-accent to-accent/80 text-accent-foreground"
                >
                  <TrendingUp className="mr-1 h-3 w-3" />
                  Dev
                </Badge>
              )}
              */}
              {/* {poll.totalVotes > 10 && (
                <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Popular
                </Badge>
              )} */}
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

      <CardContent className="flex min-h-[160px] flex-1 flex-col justify-between">
        {/* Collapsed State - Always show this */}
        <div className="flex flex-1 flex-col gap-3">
          {collapsedOptions.map((option, _index) => {
            const isSelected = !isUserVoteLoading && userVote?.optionId === option.id
            return (
              <Button
                key={option.id}
                variant={isSelected ? "default" : "outline"}
                className={`flex h-auto w-full items-center justify-between rounded-xl p-4 font-medium text-base transition-all duration-200${isSelected ? " border border-primary bg-primary/80 text-primary-foreground shadow-lg ring-2 ring-primary/20 hover:text-primary-foreground" : " border border-muted bg-muted text-foreground hover:bg-primary/10 hover:text-primary hover:shadow-md focus-visible:bg-muted/80 dark:border-foreground/20 dark:focus-visible:bg-foreground/5 dark:hover:border-foreground/40"}${isUserVoteLoading ? " animate-pulse" : ""}`}
                onClick={() => handleVote(option.id)}
                disabled={isVoting || isUserVoteLoading || hasMoreThanTwo}
                style={{ minHeight: 48 }}
              >
                <span className="flex items-center gap-2">
                  {isSelected && <CheckCircle2 className="h-5 w-5 text-inherit" />}
                  {option.text}
                </span>
                <span className="font-bold text-sm">{option.votes} votes</span>
              </Button>
            )
          })}
        </div>
        {/* Move the Show all options button to the bottom/footer */}
        {hasMoreThanTwo && (
          <div className="mt-4 flex justify-center border-muted-foreground/10 border-t pt-2">
            <Button
              variant="secondary"
              className="w-full rounded-lg border border-primary/20 text-primary hover:bg-primary/10"
              onClick={() => setExpanded(true)}
            >
              Show all options
            </Button>
          </div>
        )}
      </CardContent>

      {/* Expanded State: Dialog - Render outside of CardContent */}
      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{poll.question}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            {poll.options.map((option, _index) => {
              const isSelected = !isUserVoteLoading && userVote?.optionId === option.id
              return (
                <Button
                  key={option.id}
                  variant={isSelected ? "default" : "outline"}
                  className={`flex h-auto w-full items-center justify-between rounded-xl p-4 font-medium text-base transition-all duration-200${isSelected ? " border border-primary bg-primary/80 text-primary-foreground shadow-lg ring-2 ring-primary/20 hover:text-primary-foreground" : " border border-muted bg-muted text-foreground hover:bg-primary/10 hover:text-primary hover:shadow-md focus-visible:bg-muted/80 dark:border-foreground/20 dark:focus-visible:bg-foreground/5 dark:hover:border-foreground/40"}${isUserVoteLoading ? " animate-pulse" : ""}`}
                  onClick={() => handleVote(option.id)}
                  disabled={isVoting || isUserVoteLoading}
                  style={{ minHeight: 48 }}
                >
                  <span className="flex items-center gap-2">
                    {isSelected && <CheckCircle2 className="h-5 w-5 text-inherit" />}
                    {option.text}
                  </span>
                  <span className="font-bold text-sm">{option.votes} votes</span>
                </Button>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
