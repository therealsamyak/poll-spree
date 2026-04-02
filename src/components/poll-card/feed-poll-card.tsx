import { useAuth } from "@clerk/tanstack-react-start"
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
import { memo, useState } from "react"

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
import { usePollActions } from "@/hooks/usePollActions"
import {
  formatDateTime,
  getOptionsWithPlaces,
  getVotePercentage,
} from "@/lib/poll-utils"

import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"
import type { Poll } from "../../types"

interface FeedPollCardProps {
  poll: Poll
  onPollDeleted?: () => void
  userVote?: string | null // Optional pre-fetched user vote
}

export const FeedPollCard = memo(
  ({
    poll,
    onPollDeleted,
    userVote: preFetchedUserVote,
  }: FeedPollCardProps) => {
    const { userId, isSignedIn } = useAuth()
    const { showNotification, showSignInNotification } = useNotification()
    const vote = useMutation(api.polls.vote)
    const deletePoll = useMutation(api.polls.deletePoll)
    const toggleLike = useMutation(api.polls.toggleLike)
    const likeStatus = useQuery(api.polls.getPollLikeStatus, {
      pollId: poll.id as Id<"polls">,
      userId: userId || "",
    })

    const [isLiked, setIsLiked] = useState<boolean | null>(null)

    const displayIsLiked = isLiked ?? likeStatus ?? false

    const fetchedUserVote = useQuery(api.polls.getUserVote, {
      pollId: poll.id as Id<"polls">,
      userId: userId || "",
    })

    const userVote =
      preFetchedUserVote !== undefined
        ? { optionId: preFetchedUserVote, pollId: poll.id }
        : fetchedUserVote

    const currentUser = useQuery(api.users.getUser, { userId: userId || "" })

    const isUserVoteLoading = userVote === undefined && isSignedIn

    const hasVoted =
      userVote?.optionId !== null && userVote?.optionId !== undefined
    const canDelete = currentUser && poll.authorId === userId
    const isAuthor = poll.authorId === userId
    const showResults =
      !isUserVoteLoading && isSignedIn && (hasVoted || isAuthor)

    const { handleVote, handleDelete, handleLike, isVoting, isDeleting } =
      usePollActions({
        pollId: poll.id,
        userId,
        isSignedIn,
        userVote,
        vote,
        deletePoll,
        toggleLike,
        onPollDeleted,
        showNotification,
        showSignInNotification,
        setIsLiked,
        showVoteNotifications: false,
      })

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
                  className="text-foreground hover:text-primary w-full cursor-pointer text-3xl leading-tight font-bold tracking-tight break-words transition-colors"
                  style={{ wordBreak: "break-word" }}
                >
                  {poll.question}
                </CardTitle>
              </Link>
              <div className="text-muted-foreground flex flex-wrap items-center gap-4 text-sm">
                <Link
                  to="/users/$username"
                  params={{ username: poll.authorUsername }}
                  className="flex items-center gap-2 hover:underline hover:opacity-80"
                >
                  <Avatar
                    size="sm"
                    profileImageUrl={poll.authorProfileImageUrl}
                  />
                  <span className="font-medium">{poll.authorUsername}</span>
                </Link>
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
            {getOptionsWithPlaces(poll.options).map(({ option }) => {
              const isSelected =
                !isUserVoteLoading && userVote?.optionId === option.id

              return (
                <Button
                  key={option.id}
                  variant={isSelected ? "default" : "outline"}
                  className={`flex h-auto w-full flex-col items-start justify-start rounded-xl border p-6 text-lg font-medium ${
                    isSelected
                      ? "border-primary bg-primary/80 text-primary-foreground ring-primary/20 hover:text-primary-foreground shadow-lg ring-2"
                      : "border-muted bg-card text-foreground hover:bg-primary/10 hover:text-primary focus-visible:bg-muted/80 dark:border-foreground/20"
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
                  <span className="min-w-0 flex-1 text-left break-words">
                    {option.text}
                  </span>
                  {showResults && (
                    <span className="mt-2 text-sm opacity-90">
                      {getVotePercentage(option.votes, poll.totalVotes)}% •{" "}
                      {option.votes} vote
                      {option.votes === 1 ? "" : "s"}
                    </span>
                  )}
                </Button>
              )
            })}
          </div>
        </CardContent>

        <CardFooter className="pt-2">
          <div className="text-muted-foreground flex w-full items-center justify-between text-sm">
            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={handleLike}
                className={`hover:text-destructive flex items-center gap-2 ${displayIsLiked ? "text-destructive" : ""}`}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${displayIsLiked ? "bg-destructive/10" : "bg-muted/50 hover:bg-destructive/10"}`}
                >
                  <Heart
                    className={`h-5 w-5 ${displayIsLiked ? "fill-current" : ""}`}
                  />
                </div>
                <span className="text-base font-medium">
                  {poll.likes +
                    (displayIsLiked && !likeStatus
                      ? 1
                      : !displayIsLiked && likeStatus
                        ? -1
                        : 0)}
                </span>
              </button>
              <Link
                to="/polls/$pollId"
                params={{ pollId: poll.id }}
                className="hover:text-primary flex items-center gap-2"
              >
                <div className="bg-muted/50 hover:bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full transition-colors">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <span className="text-base font-medium">Comments</span>
              </Link>
              <div className="flex items-center gap-2">
                <div className="bg-muted/50 flex h-10 w-10 items-center justify-center rounded-full">
                  <Eye className="h-5 w-5" />
                </div>
                <span className="text-base font-medium">{poll.views || 0}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleShare}
              className="hover:text-foreground flex items-center gap-2"
            >
              <div className="bg-muted/50 hover:bg-foreground/10 flex h-10 w-10 items-center justify-center rounded-full transition-colors">
                <Share2 className="h-5 w-5" />
              </div>
            </button>
          </div>
        </CardFooter>
      </Card>
    )
  },
)
