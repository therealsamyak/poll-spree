import { useAuth } from "@clerk/clerk-react"
import { useMutation, useQuery } from "convex/react"
import { formatDistanceToNow } from "date-fns"
import { Send, Trash2 } from "lucide-react"
import { useState } from "react"
import { Avatar } from "@/components/avatar"
import { Button } from "@/components/ui/button"
import { useNotification } from "@/components/ui/notification"
import { Textarea } from "@/components/ui/textarea"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"

interface CommentSectionProps {
  pollId: string
}

export const CommentSection = ({ pollId }: CommentSectionProps) => {
  const { userId, isSignedIn } = useAuth()
  const [text, setText] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { showNotification } = useNotification()

  const comments = useQuery(api.comments.list, { pollId: pollId as Id<"polls"> })
  const createComment = useMutation(api.comments.create)
  const deleteComment = useMutation(api.comments.deleteComment)
  const user = useQuery(api.users.getUser, { userId: userId || "" })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() || !user) return

    setIsSubmitting(true)
    try {
      await createComment({
        pollId: pollId as Id<"polls">,
        text: text.trim(),
        userId: user.userId,
        username: user.username,
      })
      setText("")
      showNotification({ message: "Comment posted!", variant: "success" })
    } catch (_error) {
      showNotification({ message: "Failed to post comment", variant: "error" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (commentId: Id<"comments">) => {
    try {
      await deleteComment({ commentId, userId: userId || "" })
      showNotification({ message: "Comment deleted", variant: "success" })
    } catch (_error) {
      showNotification({ message: "Failed to delete comment", variant: "error" })
    }
  }

  if (comments === undefined) {
    return <div className="h-20 animate-pulse rounded-lg bg-muted" />
  }

  return (
    <div className="space-y-6">
      <h3 className="font-semibold text-lg">Comments ({comments.length})</h3>

      {isSignedIn && (
        <form onSubmit={handleSubmit} className="flex gap-4">
          <Avatar size="md" profileImageUrl={user?.profileImageUrl} />
          <div className="flex flex-1 flex-col gap-2">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write a comment..."
              className="min-h-[80px] resize-none"
              maxLength={500}
            />
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
          </div>
        </form>
      )}

      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment._id} className="flex gap-4 rounded-lg bg-muted/30 p-4">
            <Avatar size="sm" profileImageUrl={comment.authorProfileImageUrl} />
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{comment.username}</span>
                  <span className="text-muted-foreground text-xs">
                    {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
                  </span>
                </div>
                {userId === comment.userId && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={() => handleDelete(comment._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="whitespace-pre-wrap break-words text-sm">{comment.text}</p>
            </div>
          </div>
        ))}
        {comments.length === 0 && (
          <div className="py-8 text-center text-muted-foreground">
            No comments yet. Be the first to share your thoughts!
          </div>
        )}
      </div>
    </div>
  )
}
