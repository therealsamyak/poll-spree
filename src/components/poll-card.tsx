import { useAuth } from "@clerk/clerk-react"
import { useMutation, useQuery } from "convex/react"
import { BarChart3, Calendar, CheckCircle2, Clock, Trash2, TrendingUp } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { Id } from "@/convex/_generated/dataModel"
import { api } from "../../convex/_generated/api"
import type { Poll } from "../types"
import { Avatar } from "./avatar"

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
  const currentUser = useQuery(api.polls.getUser, { userId: userId || "" })

  const hasVoted = userVote?.optionId !== null && userVote?.optionId !== undefined
  const canDelete = currentUser && poll.authorId === userId
  const showResults = isSignedIn && hasVoted

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
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
        await vote({
          pollId: poll.id as Id<"polls">,
          optionId: optionId as Id<"pollOptions">,
          userId,
        })
        toast.success("Vote removed!")
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to remove vote")
      } finally {
        setIsVoting(false)
      }
      return
    }

    // Otherwise, change vote or vote for the first time
    setIsVoting(true)
    try {
      await vote({
        pollId: poll.id as Id<"polls">,
        optionId: optionId as Id<"pollOptions">,
        userId,
      })
      toast.success("Vote recorded!")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to vote")
    } finally {
      setIsVoting(false)
    }
  }

  const handleDelete = async () => {
    if (!userId) return

    setIsDeleting(true)
    try {
      await deletePoll({
        pollId: poll.id as Id<"polls">,
        authorId: userId,
      })
      toast.success("Poll deleted successfully!")
      onPollDeleted?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete poll")
    } finally {
      setIsDeleting(false)
    }
  }

  const getVotePercentage = (votes: number) => {
    if (poll.totalVotes === 0) return 0
    return Math.round((votes / poll.totalVotes) * 100)
  }

  return (
    <Card className="group border-0 bg-gradient-to-br from-card to-card/50 shadow-md backdrop-blur-sm transition-all duration-300 hover:shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              {poll.dev && (
                <Badge
                  variant="secondary"
                  className="border-orange-500/30 bg-gradient-to-r from-orange-500/20 to-orange-600/20 text-orange-600"
                >
                  <TrendingUp className="mr-1 h-3 w-3" />
                  Dev
                </Badge>
              )}
              {poll.totalVotes > 10 && (
                <Badge
                  variant="outline"
                  className="border-green-500/30 bg-green-500/10 text-green-600"
                >
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
                <Avatar size="sm" profileImageUrl={poll.authorProfileImageUrl} />
                <span className="font-medium">{poll.authorUsername}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/20 to-blue-600/30">
                  <Calendar className="h-3 w-3 text-blue-600" />
                </div>
                <span>{formatDate(poll.createdAt)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-green-500/20 to-green-600/30">
                  <BarChart3 className="h-3 w-3 text-green-600" />
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
            const isSelected = userVote?.optionId === option.id
            const percentage = getVotePercentage(option.votes)
            const isWinning =
              poll.totalVotes > 0 &&
              percentage === Math.max(...poll.options.map((o) => getVotePercentage(o.votes)))

            return (
              <div key={option.id} className="space-y-3">
                <Button
                  variant={isSelected ? "default" : "outline"}
                  className={`h-auto w-full justify-start p-4 transition-all duration-200${
                    isSelected
                      ? " bg-gradient-to-r from-primary to-primary/80 text-foreground shadow-lg ring-2 ring-primary/20 hover:text-white dark:text-white"
                      : " border-2 border-border/60 text-foreground hover:bg-muted/70 hover:text-primary hover:shadow-md focus-visible:bg-muted/80 dark:border-white/20 dark:focus-visible:bg-white/5 dark:hover:border-white/40"
                  }${isWinning && showResults ? " bg-green-500/5 ring-2 ring-green-500/50" : ""}`}
                  onClick={() => handleVote(option.id)}
                  disabled={isVoting}
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
                            {percentage}%
                          </span>
                          <div
                            className={`text-xs${isSelected ? " text-inherit/90" : " text-muted-foreground"}`}
                          >
                            {option.votes} votes
                          </div>
                        </div>
                        {isWinning && <TrendingUp className="h-4 w-4 text-green-600" />}
                      </div>
                    )}
                  </div>
                </Button>

                {showResults && (
                  <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ease-out ${
                        isWinning
                          ? "bg-gradient-to-r from-green-500 to-green-600"
                          : "bg-gradient-to-r from-primary to-primary/80"
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  </div>
                )}
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

        {isSignedIn && !hasVoted && (
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
            <div className="flex items-center justify-center gap-2 text-green-600 text-sm">
              <CheckCircle2 className="h-4 w-4" />
              <p className="font-medium">You've voted!</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
