import { useAuth } from "@clerk/clerk-react"
import { Link } from "@tanstack/react-router"
import { useMutation, useQuery } from "convex/react"
import {
  BarChart3,
  Calendar,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Trash2,
} from "lucide-react"
import { useEffect, useState } from "react"
import { Avatar } from "@/components/avatar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useNotification } from "@/components/ui/notification"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"
import type { Poll } from "../../types"

interface FeedPollCardProps {
  poll: Poll
  onPollDeleted?: () => void
  userVote?: string | null // Optional pre-fetched user vote
}

export const FeedPollCard = ({
  poll,
  onPollDeleted,
  userVote: preFetchedUserVote,
}: FeedPollCardProps) => {
  const [isVoting, setIsVoting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { userId, isSignedIn } = useAuth()
  const { showNotification, showSignInNotification } = useNotification()
  const vote = useMutation(api.polls.vote)
  const deletePoll = useMutation(api.polls.deletePoll)
  const toggleLike = useMutation(api.polls.toggleLike)
  const [isLiked, setIsLiked] = useState(false) // Optimistic UI

  const likeStatus = useQuery(api.polls.getPollLikeStatus, {
    pollId: poll.id as Id<"polls">,
    userId: userId || "",
  })

  useEffect(() => {
    if (likeStatus !== undefined) {
      setIsLiked(likeStatus)
    }
  }, [likeStatus])

  // Use pre-fetched user vote if available, otherwise fetch it
  const fetchedUserVote = useQuery(api.polls.getUserVote, {
    pollId: poll.id as Id<"polls">,
    userId: userId || "",
  })

  // Use pre-fetched vote if available, otherwise use fetched vote
  const userVote =
    preFetchedUserVote !== undefined
      ? { pollId: poll.id, optionId: preFetchedUserVote }
      : fetchedUserVote

  const currentUser = useQuery(api.users.getUser, { userId: userId || "" })

  // Add loading state check to prevent flash
  const isUserVoteLoading = userVote === undefined && isSignedIn

  const hasVoted =
    userVote?.optionId !== null && userVote?.optionId !== undefined
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
      showSignInNotification()
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
          // Vote removed successfully
        } else {
          showNotification({
            message: result.error || "Failed to remove vote",
            variant: "error",
          })
        }
      } catch (_error) {
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
        pollId: poll.id as Id<"polls">,
        optionId: optionId as Id<"pollOptions">,
        userId,
      })

      if (result.success) {
        // Vote recorded successfully
      } else {
        showNotification({
          message: result.error || "Failed to vote",
          variant: "error",
        })
      }
    } catch (_error) {
      showNotification({
        message: "An unexpected error occurred. Please try again.",
        variant: "error",
      })
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
        showNotification({
          message: "Poll deleted successfully!",
          variant: "success",
        })
        onPollDeleted?.()
      } else {
        showNotification({
          message: result.error || "Failed to delete poll",
          variant: "error",
        })
      }
    } catch (_error) {
      showNotification({
        message: "An unexpected error occurred. Please try again.",
        variant: "error",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Helper: get vote percentage
  const getVotePercentage = (votes: number) => {
    if (poll.totalVotes === 0) return 0
    return Math.round((votes / poll.totalVotes) * 100)
  }

  // Keep options in original order
  const getOptionsWithPlaces = () => {
    return poll.options.map((option) => ({ option, place: undefined }))
  }

  const handleLike = async () => {
    if (!isSignedIn) {
      showSignInNotification()
      return
    }
    if (!userId) return

    // Optimistic update
    setIsLiked(!isLiked)

    try {
      await toggleLike({ pollId: poll.id as Id<"polls">, userId })
    } catch (_error) {
      setIsLiked(!isLiked) // Revert
      showNotification({ message: "Failed to like poll", variant: "error" })
    }
  }

  const handleShare = () => {
    const url = `${window.location.origin}/polls/${poll.id}`
    navigator.clipboard.writeText(url)
    showNotification({
      message: "Link copied to clipboard!",
      variant: "success",
    })
  }

  return (
    <Card className="flex h-full w-full max-w-2xl flex-col justify-center border-none bg-transparent shadow-none">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-3">
            <Link
              to="/polls/$pollId"
              params={{ pollId: poll.id }}
              className="block w-full"
            >
              <CardTitle
                className="w-full cursor-pointer break-words font-bold text-3xl leading-tight transition-colors hover:text-primary"
                style={{ wordBreak: "break-word" }}
              >
                {poll.question}
              </CardTitle>
            </Link>
            <div className="flex flex-wrap items-center gap-4 text-muted-foreground text-sm">
              <Link
                to="/users/$username"
                params={{ username: poll.authorUsername }}
                className="flex items-center gap-2 transition-all hover:underline hover:opacity-80"
              >
                <Avatar
                  size="sm"
                  profileImageUrl={poll.authorProfileImageUrl}
                />
                <span className="font-medium">{poll.authorUsername}</span>
              </Link>
              <div className="flex items-center gap-1.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                  <Calendar className="h-3 w-3 text-primary" />
                </div>
                <span>{formatDateTime(poll.createdAt)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/10">
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

      <CardContent className="flex-1 py-4">
        <div className="flex flex-col gap-3">
          {getOptionsWithPlaces().map(({ option }) => {
            const isSelected =
              !isUserVoteLoading && userVote?.optionId === option.id

            return (
              <Button
                key={option.id}
                variant={isSelected ? "default" : "outline"}
                className={`flex h-auto w-full flex-col items-start justify-start rounded-xl border p-6 font-medium text-lg transition-all duration-200 ${
                  isSelected
                    ? "border-primary bg-primary/80 text-primary-foreground shadow-lg ring-2 ring-primary/20 hover:text-primary-foreground"
                    : "border-muted bg-card/50 text-foreground hover:bg-primary/10 hover:text-primary hover:shadow-md focus-visible:bg-muted/80 dark:border-foreground/20"
                } hover:border-primary`}
                onClick={() => handleVote(option.id)}
                disabled={isVoting || isUserVoteLoading}
                style={{
                  minHeight: 64,
                  whiteSpace: "normal",
                  wordBreak: "break-word",
                  borderColor: isSelected ? "var(--primary)" : undefined,
                }}
              >
                <span className="min-w-0 flex-1 break-words text-left">
                  {option.text}
                </span>
                {showResults && (
                  <span className="mt-2 text-sm opacity-90">
                    {getVotePercentage(option.votes)}% • {option.votes} vote
                    {option.votes === 1 ? "" : "s"}
                  </span>
                )}
              </Button>
            )
          })}
        </div>
      </CardContent>

      <CardFooter className="pt-2">
        <div className="flex w-full items-center justify-between text-muted-foreground text-sm">
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={handleLike}
              className={`flex items-center gap-2 transition-colors hover:text-red-500 ${isLiked ? "text-red-500" : ""}`}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${isLiked ? "bg-red-500/10" : "bg-muted hover:bg-red-500/10"}`}
              >
                <Heart className={`h-5 w-5 ${isLiked ? "fill-current" : ""}`} />
              </div>
              <span className="font-medium text-base">
                {poll.likes +
                  (isLiked && !likeStatus
                    ? 1
                    : !isLiked && likeStatus
                      ? -1
                      : 0)}
              </span>
            </button>
            <Link
              to="/polls/$pollId"
              params={{ pollId: poll.id }}
              className="flex items-center gap-2 transition-colors hover:text-blue-500"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted transition-colors hover:bg-blue-500/10">
                <MessageCircle className="h-5 w-5" />
              </div>
              <span className="font-medium text-base">Comments</span>
            </Link>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <Eye className="h-5 w-5" />
              </div>
              <span className="font-medium text-base">{poll.views || 0}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleShare}
            className="flex items-center gap-2 transition-colors hover:text-foreground"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted transition-colors hover:bg-foreground/10">
              <Share2 className="h-5 w-5" />
            </div>
          </button>
        </div>
      </CardFooter>
    </Card>
  )
}
