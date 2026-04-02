import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  comments: defineTable({
    pollId: v.id("polls"),
    userId: v.string(),
    username: v.string(),
    text: v.string(),
    createdAt: v.number(),
  }).index("by_pollId", ["pollId"]),

  pollLikes: defineTable({
    pollId: v.id("polls"),
    userId: v.string(),
  })
    .index("by_pollId", ["pollId"])
    .index("by_user_poll", ["userId", "pollId"]),

  pollOptions: defineTable({
    pollId: v.id("polls"),
    text: v.string(),
    votes: v.number(),
    votedUserIds: v.array(v.string()),
  }).index("by_pollId", ["pollId"]),

  pollUsers: defineTable({
    pollId: v.id("polls"),
    userId: v.string(),
    optionId: v.optional(v.id("pollOptions")),
    votedAt: v.optional(v.number()),
  })
    .index("by_poll_user", ["pollId", "userId"])
    .index("by_userId", ["userId"])
    .index("by_votedAt", ["votedAt"]),

  polls: defineTable({
    question: v.string(),
    totalVotes: v.number(),
    dev: v.boolean(),
    authorId: v.string(),
    authorUsername: v.string(),
    views: v.optional(v.number()),
    likes: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_createdAt", ["createdAt"])
    .index("by_authorId", ["authorId"]),

  users: defineTable({
    userId: v.string(),
    username: v.string(),
    profileImageUrl: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_username", ["username"]),
})
