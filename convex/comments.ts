import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { validateTextContent } from "./badWordsFilter"

export const list = query({
  args: { pollId: v.id("polls") },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_pollId", (q) => q.eq("pollId", args.pollId))
      .order("desc")
      .collect()

    const authorIds = [...new Set(comments.map((c) => c.userId))]
    const authors = await Promise.all(
      authorIds.map((authorId) =>
        ctx.db
          .query("users")
          .withIndex("by_userId", (q) => q.eq("userId", authorId))
          .first(),
      ),
    )
    const authorsById = new Map<string, (typeof authors)[0]>()
    authors.forEach((author) => {
      if (author) {
        authorsById.set(author.userId, author)
      }
    })

    return comments.map((c) => ({
      ...c,
      authorProfileImageUrl: authorsById.get(c.userId)?.profileImageUrl,
    }))
  },
})

export const create = mutation({
  args: {
    pollId: v.id("polls"),
    text: v.string(),
    userId: v.string(),
    username: v.string(),
  },
  handler: async (ctx, args) => {
    if (!validateTextContent(args.text)) {
      throw new Error("Comment contains inappropriate content")
    }

    await ctx.db.insert("comments", {
      pollId: args.pollId,
      text: args.text,
      userId: args.userId,
      username: args.username,
      createdAt: Date.now(),
    })
  },
})

export const deleteComment = mutation({
  args: {
    commentId: v.id("comments"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const comment = await ctx.db.get(args.commentId)
    if (!comment) {
      throw new Error("Comment not found")
    }
    if (comment.userId !== args.userId) {
      throw new Error("Unauthorized")
    }
    await ctx.db.delete(args.commentId)
  },
})
