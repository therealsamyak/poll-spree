import { useAuth } from "@clerk/tanstack-react-start"
import { useMutation, useQuery } from "convex/react"
import { formatDistanceToNow } from "date-fns"
import { Send, Trash2 } from "lucide-react"
import { useState } from "react"

import { Avatar } from "@/components/avatar"
import { Button } from "@/components/ui/button"
import { useNotification } from "@/components/ui/notification"
import { Textarea } from "@/components/ui/textarea"
import { isTextSafe } from "@/lib/badWordsFilter"

import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"

interface CommentSectionProps {
  pollId: string
  currentUser?: {
    userId: string
    username: string
    profileImageUrl?: string
  } | null
}

export const CommentSection = ({
  pollId,
  currentUser,
}: CommentSectionProps) => {
  const { userId, isSignedIn } = useAuth()
  const [text, setText] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { showNotification } = useNotification()

  const comments = useQuery(api.comments.list, {
    pollId: pollId as Id<"polls">,
  })
  const createComment = useMutation(api.comments.create)
  const deleteComment = useMutation(api.comments.deleteComment)

  const hasAlreadyCommented =
    currentUser && comments?.some((c) => c.userId === currentUser.userId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() || !currentUser) {
      return
    }

    setError(null)

    // Validate comment for inappropriate content
    if (!isTextSafe(text)) {
      setError("Comment contains inappropriate content")
      return
    }

    setIsSubmitting(true)
    try {
      await createComment({
        pollId: pollId as Id<"polls">,
        text: text.trim(),
        userId: currentUser.userId,
        username: currentUser.username,
      })
      setText("")
      showNotification({ message: "Comment posted!", variant: "success" })
    } catch {
      setError("Failed to post comment. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (commentId: Id<"comments">) => {
    try {
      await deleteComment({ commentId, userId: userId || "" })
      showNotification({ message: "Comment deleted", variant: "success" })
    } catch {
      showNotification({
        message: "Failed to delete comment",
        variant: "error",
      })
    }
  }

  if (comments === undefined) {
    return <div className="bg-muted h-20 animate-pulse rounded-lg" />
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold tracking-tight">
        Comments ({comments.length})
      </h3>

      {isSignedIn && !hasAlreadyCommented && (
        <div className="flex gap-4">
          <Avatar size="md" profileImageUrl={currentUser?.profileImageUrl} />
          <div className="flex flex-1 flex-col gap-2">
            <form onSubmit={handleSubmit} className="flex flex-col gap-2">
              <Textarea
                value={text}
                onChange={(e) => {
                  setText(e.target.value)
                  if (error) setError(null)
                }}
                placeholder="Write a comment..."
                className={`min-h-[80px] resize-none ${error ? "border-destructive focus-visible:ring-destructive" : ""}`}
                maxLength={300}
              />
              {error && <p className="text-destructive text-xs">{error}</p>}
              <div className="flex justify-end">
                <Button type="submit" disabled={!text.trim() || isSubmitting}>
                  {isSubmitting ? (
                    "Posting..."
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" /> Post
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {comments.map((comment) => (
          <div
            key={comment._id}
            className="group border-border flex gap-4 rounded-xl border-t-2 p-4"
          >
            <Avatar size="sm" profileImageUrl={comment.authorProfileImageUrl} />
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{comment.username}</span>
                  <span className="text-muted-foreground text-xs">
                    {formatDistanceToNow(comment.createdAt, {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                {userId === comment.userId && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive h-8 w-8"
                    onClick={() => handleDelete(comment._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="text-sm break-words whitespace-pre-wrap">
                {comment.text}
              </p>
            </div>
          </div>
        ))}
        {comments.length === 0 && (
          <div className="text-muted-foreground flex flex-col items-center justify-center gap-2 py-12 text-center">
            No comments yet. Be the first to share your thoughts!
          </div>
        )}
      </div>
    </div>
  )
}
