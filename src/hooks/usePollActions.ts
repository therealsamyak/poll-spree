import { useState } from "react"

import type { Id } from "../../convex/_generated/dataModel"

interface UsePollActionsParams {
  pollId: string
  userId: string | null | undefined
  isSignedIn: boolean | undefined
  userVote?: { optionId: string | null; pollId: string } | undefined
  vote: (args: {
    optionId: Id<"pollOptions">
    pollId: Id<"polls">
    userId: string
  }) => Promise<{ success: boolean; error?: string }>
  deletePoll: (args: {
    authorId: string
    pollId: Id<"polls">
  }) => Promise<{ success: boolean; error?: string }>
  toggleLike?: (args: {
    pollId: Id<"polls">
    userId: string
  }) => Promise<boolean>
  onPollDeleted?: () => void
  showNotification: (props: {
    message: string
    variant: "success" | "error" | "warning" | "info"
  }) => void
  showSignInNotification: () => void
  setIsLiked?: (
    updater: boolean | null | ((prev: boolean | null) => boolean | null),
  ) => void
  showVoteNotifications?: boolean
}

export const usePollActions = ({
  pollId,
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
  showVoteNotifications = true,
}: UsePollActionsParams) => {
  const [isVoting, setIsVoting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

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
          pollId: pollId as Id<"polls">,
          userId,
        })

        if (result.success) {
          if (showVoteNotifications) {
            showNotification({ message: "Vote removed!", variant: "success" })
          }
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
        pollId: pollId as Id<"polls">,
        userId,
      })

      if (result.success) {
        if (showVoteNotifications) {
          showNotification({ message: "Vote recorded!", variant: "success" })
        }
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
        pollId: pollId as Id<"polls">,
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
    } catch {
      showNotification({
        message: "An unexpected error occurred. Please try again.",
        variant: "error",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleLike = async () => {
    if (!isSignedIn) {
      showSignInNotification()
      return
    }
    if (!userId) {
      return
    }
    if (!toggleLike || !setIsLiked) {
      return
    }

    setIsLiked((prev) => !prev)

    try {
      await toggleLike({ pollId: pollId as Id<"polls">, userId })
    } catch {
      setIsLiked((prev) => !prev)
      showNotification({ message: "Failed to like poll", variant: "error" })
    }
  }

  return { handleVote, handleDelete, handleLike, isVoting, isDeleting }
}
