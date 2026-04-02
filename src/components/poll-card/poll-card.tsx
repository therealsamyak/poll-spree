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
import { memo, useEffect, useRef, useState } from "react"

import { Avatar } from "@/components/avatar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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

// Helper to determine font size class based on question length
const getQuestionFontSize = (length: number) => {
  if (length <= 40) {
    return "text-xl sm:text-xl lg:text-xl"
  } // Very short
  if (length <= 80) {
    return "text-lg sm:text-lg lg:text-lg"
  } // Short
  if (length <= 140) {
    return "text-base sm:text-base lg:text-base"
  } // Medium
  if (length <= 200) {
    return "text-sm sm:text-sm lg:text-base"
  } // Long
  return "text-sm sm:text-xs lg:text-sm" // Very long
}

const PollQuestionTitle = ({ question }: { question: string }) => {
  const displayText =
    question.length > 75 ? `${question.slice(0, 75)}...` : question
  return (
    <CardTitle
      className={`text-foreground hover:text-primary w-full cursor-pointer leading-tight font-bold tracking-tight break-words transition-colors ${getQuestionFontSize(displayText.length)}`}
      style={{ lineHeight: 1.15, width: "100%", wordBreak: "break-word" }}
      title={question}
    >
      {displayText}
    </CardTitle>
  )
}

const SelectedOptionButton = ({
  poll,
  userVote,
  setExpanded,
}: {
  poll: Poll
  userVote: { pollId: string; optionId: string | null } | undefined
  setExpanded: (v: boolean) => void
}) => {
  const selected = poll.options.find((o) => o.id === userVote?.optionId)
  if (!selected) {
    return null
  }
  const optionsWithPlaces = getOptionsWithPlaces(poll.options)
  const _selectedWithPlace = optionsWithPlaces.find(
    ({ option }) => option.id === selected.id,
  )
  return (
    <Button
      variant="default"
      className="border-primary bg-primary/80 text-foreground ring-primary/20 hover:text-primary-foreground flex h-auto w-full items-center justify-between rounded-xl border p-4 text-base font-medium shadow-lg ring-2"
      onClick={() => setExpanded(true)}
      style={{
        borderColor: "var(--primary)",
        minHeight: 48,
        whiteSpace: "normal",
        wordBreak: "break-word",
      }}
      data-ps-selected-option
    >
      <span className="text-foreground flex w-full flex-col items-start gap-1">
        <span
          className="text-foreground block max-w-[10rem] truncate"
          title={selected.text}
        >
          {selected.text}
        </span>
        <span className="text-foreground mt-1 text-xs">
          {getVotePercentage(selected.votes, poll.totalVotes)}% •{" "}
          {selected.votes} vote
          {selected.votes === 1 ? "" : "s"}
        </span>
      </span>
    </Button>
  )
}

interface PollCardProps {
  poll: Poll
  onPollDeleted?: () => void
  userVote?: string | null // Optional pre-fetched user vote
}

export const PollCard = memo(
  ({ poll, onPollDeleted, userVote: preFetchedUserVote }: PollCardProps) => {
    const [expanded, setExpanded] = useState(false)
    const [shouldMoveToTop, setShouldMoveToTop] = useState(false)
    const prevExpanded = useRef(expanded)
    const { userId, isSignedIn } = useAuth()
    const { showNotification, showSignInNotification } = useNotification()

    const vote = useMutation(api.polls.vote)
    const deletePoll = useMutation(api.polls.deletePoll)
    const toggleLike = useMutation(api.polls.toggleLike)

    const likeStatus = useQuery(api.polls.getPollLikeStatus, {
      pollId: poll.id as Id<"polls">,
      userId: userId || "",
    })

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
    const _showResults =
      !isUserVoteLoading && isSignedIn && (hasVoted || isAuthor)

    const {
      handleVote,
      handleDelete,
      handleLike,
      isVoting,
      isDeleting,
      isLiking,
    } = usePollActions({
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
    })

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
    const _collapsedOptions = sortedOptions.slice(0, 2)
    const _hasMoreThanTwo = poll.options.length > 2

    const handleShare = () => {
      const url = `${window.location.origin}/polls/${poll.id}`
      navigator.clipboard.writeText(url)
      showNotification({
        message: "Link copied to clipboard!",
        variant: "success",
      })
    }

    return (
      <Card className="group border-muted bg-card focus-visible:ring-primary/20 dark:from-card dark:to-card/50 flex h-full flex-col border shadow-md backdrop-blur-sm focus-visible:ring-2 dark:bg-gradient-to-br">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-3">
              {/* Fixed-height question container with dynamic font size */}
              <div className="flex h-[72px] items-center">
                <Link
                  to="/polls/$pollId"
                  params={{ pollId: poll.id }}
                  className="w-full"
                >
                  <PollQuestionTitle question={poll.question} />
                </Link>
              </div>
              <div className="text-muted-foreground flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <Link
                    to="/users/$username"
                    params={{ username: poll.authorUsername }}
                    className="flex items-center gap-1.5 hover:underline hover:opacity-80"
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
                    <BarChart3 className="text-accent-foreground h-3 w-3" />
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
                className="text-destructive hover:bg-destructive/10 hover:text-destructive dark:hover:bg-destructive/20 dark:hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex min-h-[100px] flex-1 flex-col justify-center">
          {/* Collapsed: Vote or Selected Option Button */}
          <div className="flex w-full flex-col gap-3">
            {/* If user has not voted, show Vote button */}
            {!isUserVoteLoading && !userVote?.optionId && (
              <Button
                variant="outline"
                className="border-muted bg-card text-foreground hover:bg-primary/10 hover:text-primary focus-visible:bg-muted/80 dark:border-foreground/20 dark:focus-visible:bg-foreground/5 dark:hover:border-foreground/40 w-full rounded-xl border p-4 text-base font-medium"
                onClick={() => {
                  if (!isSignedIn) {
                    showSignInNotification()
                    return
                  }
                  setExpanded(true)
                }}
                style={{ minHeight: 48 }}
              >
                Vote
              </Button>
            )}
            {/* If user has voted, show their selected option as a button with stats */}
            {!isUserVoteLoading && userVote?.optionId && (
              <SelectedOptionButton
                poll={poll}
                userVote={userVote}
                setExpanded={setExpanded}
              />
            )}
          </div>
        </CardContent>
        {/* Voting Modal */}
        <Dialog open={expanded} onOpenChange={setExpanded}>
          <DialogContent className="max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{poll.question}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              {getOptionsWithPlaces(poll.options).map(({ option }) => {
                const isSelected =
                  !isUserVoteLoading && userVote?.optionId === option.id
                const showResults = !isUserVoteLoading && userVote?.optionId
                return (
                  <Button
                    key={option.id}
                    variant={isSelected ? "default" : "outline"}
                    className={`flex h-auto w-full items-center justify-between rounded-xl border p-4 text-base font-medium ${isSelected ? "border-primary bg-primary/80 text-primary-foreground ring-primary/20 hover:text-primary-foreground shadow-lg ring-2" : "border-muted bg-card text-foreground hover:bg-primary/10 hover:text-primary focus-visible:bg-muted/80 dark:border-foreground/20 dark:focus-visible:bg-foreground/5 dark:hover:border-foreground/40"} hover:border-[var(--primary)]`}
                    onClick={() => handleVote(option.id)}
                    disabled={isVoting || isUserVoteLoading}
                    style={{
                      borderColor: isSelected ? "var(--primary)" : undefined,
                      minHeight: 48,
                      whiteSpace: "normal",
                      wordBreak: "break-word",
                    }}
                    data-ps-modal-option
                  >
                    <span className="text-foreground flex w-full flex-col items-start gap-1">
                      <span
                        className="break-words whitespace-pre-line"
                        style={{ wordBreak: "break-word" }}
                      >
                        {option.text}
                      </span>
                      {showResults && (
                        <span className="text-foreground mt-1 text-xs">
                          {getVotePercentage(option.votes, poll.totalVotes)}% •{" "}
                          {option.votes} vote
                          {option.votes === 1 ? "" : "s"}
                        </span>
                      )}
                    </span>
                  </Button>
                )
              })}
            </div>
          </DialogContent>
        </Dialog>
        <CardFooter className="border-border/50 border-t p-4">
          <div className="text-muted-foreground flex w-full items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleLike}
                disabled={isLiking}
                className={`hover:text-destructive flex items-center gap-1.5 ${likeStatus ? "text-destructive" : ""}`}
              >
                <Heart
                  className={`h-4 w-4 ${likeStatus ? "fill-current" : ""}`}
                />
                <span>{poll.likes}</span>
              </button>
              <Link
                to="/polls/$pollId"
                params={{ pollId: poll.id }}
                className="hover:text-primary flex items-center gap-1.5"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Comments</span>
              </Link>
              <div className="flex items-center gap-1.5">
                <Eye className="h-4 w-4" />
                <span>{poll.views || 0}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleShare}
              className="hover:text-foreground flex items-center gap-1.5"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </CardFooter>
      </Card>
    )
  },
)
