import { useAuth } from "@clerk/clerk-react"
import { Link } from "@tanstack/react-router"
import { useMutation, useQuery } from "convex/react"
import { BarChart3, Calendar, Eye, Heart, MessageCircle, Share2, Trash2 } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { Avatar } from "@/components/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useNotification } from "@/components/ui/notification"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"
import type { Poll } from "../../types"

interface PollCardProps {
  poll: Poll
  onPollDeleted?: () => void
  userVote?: string | null // Optional pre-fetched user vote
}

// Helper to determine font size class based on question length
const getQuestionFontSize = (length: number) => {
  if (length <= 40) return "text-xl sm:text-xl lg:text-xl" // very short
  if (length <= 80) return "text-lg sm:text-lg lg:text-lg" // short
  if (length <= 140) return "text-base sm:text-base lg:text-base" // medium
  if (length <= 200) return "text-sm sm:text-sm lg:text-base" // long
  return "text-sm sm:text-xs lg:text-sm" // very long
}

export const PollCard = ({ poll, onPollDeleted, userVote: preFetchedUserVote }: PollCardProps) => {
  const [isVoting, setIsVoting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { userId, isSignedIn } = useAuth()
  const [expanded, setExpanded] = useState(false)
  const [shouldMoveToTop, setShouldMoveToTop] = useState(false)
  const prevExpanded = useRef(expanded)
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
  const _collapsedOptions = sortedOptions.slice(0, 2)
  const _hasMoreThanTwo = poll.options.length > 2

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
          showNotification({ message: "Vote removed!", variant: "success" })
        } else {
          showNotification({ message: result.error || "Failed to remove vote", variant: "error" })
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
        pollId: poll.id as Id<"polls">,
        optionId: optionId as Id<"pollOptions">,
        userId,
      })

      if (result.success) {
        showNotification({ message: "Vote recorded!", variant: "success" })
      } else {
        showNotification({ message: result.error || "Failed to vote", variant: "error" })
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
        showNotification({ message: "Poll deleted successfully!", variant: "success" })
        onPollDeleted?.()
      } else {
        showNotification({ message: result.error || "Failed to delete poll", variant: "error" })
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
    showNotification({ message: "Link copied to clipboard!", variant: "success" })
  }

  return (
    <Card className="group flex h-full flex-col border border-muted bg-card/50 shadow-md backdrop-blur-sm transition-all duration-300 focus-visible:ring-2 focus-visible:ring-primary/20 dark:bg-gradient-to-br dark:from-card dark:to-card/50">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-3">
            {/* Fixed-height question container with dynamic font size */}
            <div className="flex h-[72px] items-center">
              <Link to="/polls/$pollId" params={{ pollId: poll.id }} className="w-full">
                {(() => {
                  const displayText =
                    poll.question.length > 75 ? `${poll.question.slice(0, 75)}...` : poll.question
                  return (
                    <CardTitle
                      className={`w-full cursor-pointer break-words font-bold text-foreground leading-tight transition-colors hover:text-primary ${getQuestionFontSize(displayText.length)}`}
                      style={{ lineHeight: 1.15, width: "100%", wordBreak: "break-word" }}
                      title={poll.question}
                    >
                      {displayText}
                    </CardTitle>
                  )
                })()}
              </Link>
            </div>
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
              className="w-full rounded-xl border border-muted bg-muted p-4 font-medium text-base text-foreground hover:bg-primary/10 hover:text-primary hover:shadow-md focus-visible:bg-muted/80 dark:border-foreground/20 dark:focus-visible:bg-foreground/5 dark:hover:border-foreground/40"
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
          {!isUserVoteLoading &&
            userVote?.optionId &&
            (() => {
              const selected = poll.options.find((o) => o.id === userVote.optionId)
              if (!selected) return null
              const optionsWithPlaces = getOptionsWithPlaces()
              const _selectedWithPlace = optionsWithPlaces.find(
                ({ option }) => option.id === selected.id,
              )
              return (
                <Button
                  variant={"default"}
                  className="flex h-auto w-full items-center justify-between rounded-xl border border-primary bg-primary/80 p-4 font-medium text-base shadow-lg ring-2 ring-primary/20 transition-all duration-200 hover:text-primary-foreground"
                  onClick={() => setExpanded(true)}
                  style={{
                    minHeight: 48,
                    whiteSpace: "normal",
                    wordBreak: "break-word",
                    color: "var(--foreground)",
                    borderColor: "var(--primary)",
                  }}
                  data-ps-selected-option
                >
                  <span
                    className="flex w-full flex-col items-start gap-1"
                    style={{ color: "var(--foreground)" }}
                  >
                    <span
                      style={{ color: "var(--foreground)" }}
                      className="block max-w-[10rem] truncate"
                      title={selected.text}
                    >
                      {selected.text}
                    </span>
                    <span className="mt-1 text-xs" style={{ color: "var(--foreground)" }}>
                      {getVotePercentage(selected.votes)}% • {selected.votes} vote
                      {selected.votes === 1 ? "" : "s"}
                    </span>
                  </span>
                </Button>
              )
            })()}
        </div>
      </CardContent>
      {/* Voting Modal */}
      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{poll.question}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            {getOptionsWithPlaces().map(({ option }) => {
              const isSelected = !isUserVoteLoading && userVote?.optionId === option.id
              const showResults = !isUserVoteLoading && userVote?.optionId
              return (
                <Button
                  key={option.id}
                  variant={isSelected ? "default" : "outline"}
                  className={`flex h-auto w-full items-center justify-between rounded-xl border p-4 font-medium text-base transition-all duration-200 ${isSelected ? "border-primary bg-primary/80 text-primary-foreground shadow-lg ring-2 ring-primary/20 hover:text-primary-foreground" : "border-muted bg-muted text-foreground hover:bg-primary/10 hover:text-primary hover:shadow-md focus-visible:bg-muted/80 dark:border-foreground/20 dark:focus-visible:bg-foreground/5 dark:hover:border-foreground/40"} hover:border-[var(--primary)]`}
                  onClick={() => handleVote(option.id)}
                  disabled={isVoting || isUserVoteLoading}
                  style={{
                    minHeight: 48,
                    whiteSpace: "normal",
                    wordBreak: "break-word",
                    color: "var(--foreground)",
                    borderColor: isSelected ? "var(--primary)" : undefined,
                  }}
                  data-ps-modal-option
                >
                  <span
                    className="flex w-full flex-col items-start gap-1"
                    style={{ color: "var(--foreground)" }}
                  >
                    <span
                      className="whitespace-pre-line break-words"
                      style={{ wordBreak: "break-word" }}
                    >
                      {option.text}
                    </span>
                    {showResults && (
                      <span className="mt-1 text-xs" style={{ color: "var(--foreground)" }}>
                        {getVotePercentage(option.votes)}% • {option.votes} vote
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
      <CardFooter className="border-muted/50 border-t p-4">
        <div className="flex w-full items-center justify-between text-muted-foreground text-sm">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleLike}
              className={`flex items-center gap-1.5 transition-colors hover:text-red-500 ${isLiked ? "text-red-500" : ""}`}
            >
              <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
              <span>
                {poll.likes + (isLiked && !likeStatus ? 1 : !isLiked && likeStatus ? -1 : 0)}
              </span>
            </button>
            <Link
              to="/polls/$pollId"
              params={{ pollId: poll.id }}
              className="flex items-center gap-1.5 transition-colors hover:text-blue-500"
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
            className="flex items-center gap-1.5 transition-colors hover:text-foreground"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </CardFooter>
    </Card>
  )
}
