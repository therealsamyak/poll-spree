import { v } from "convex/values"

import type { Id } from "./_generated/dataModel"
import { mutation, query } from "./_generated/server"
import {
  validateMultipleTextInputs,
  validateTextContent,
} from "./badWordsFilter"

export const getPolls = query({
  args: {
    paginationOpts: v.optional(
      v.object({
        cursor: v.optional(v.union(v.string(), v.null())),
        numItems: v.number(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const { paginationOpts } = args

    // Use pagination to limit the number of polls fetched
    const defaultPagination = { cursor: null, numItems: 20 }
    const pagination = {
      cursor:
        paginationOpts?.cursor !== undefined
          ? paginationOpts.cursor
          : defaultPagination.cursor,
      numItems: paginationOpts?.numItems ?? defaultPagination.numItems,
    }

    const pollsResult = await ctx.db
      .query("polls")
      .order("desc")
      .paginate(pagination)

    // Batch fetch options and comment counts for relevant polls only
    const pollIds = pollsResult.page.map((p) => p._id)
    const optionsResults = await Promise.all(
      pollIds.map((pollId) =>
        ctx.db
          .query("pollOptions")
          .withIndex("by_pollId", (q) => q.eq("pollId", pollId))
          .collect(),
      ),
    )
    const optionsByPollId = new Map(
      pollIds.map((id, i) => [id, optionsResults[i]]),
    )

    // Batch fetch all authors for all polls
    const authorIds = [
      ...new Set(pollsResult.page.map((poll) => poll.authorId)),
    ]
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

    // Batch fetch comment counts for relevant polls only
    const commentResults = await Promise.all(
      pollIds.map((pollId) =>
        ctx.db
          .query("comments")
          .withIndex("by_pollId", (q) => q.eq("pollId", pollId))
          .collect(),
      ),
    )
    const commentCounts = new Map(
      pollIds.map((id, i) => [id, commentResults[i].length]),
    )

    const pollsWithOptions = pollsResult.page.map((poll) => {
      const options = optionsByPollId.get(poll._id) || []
      const author = authorsById.get(poll.authorId)

      return {
        authorId: poll.authorId,
        authorProfileImageUrl: author?.profileImageUrl,
        authorUsername: poll.authorUsername,
        commentCount: commentCounts.get(poll._id) || 0,
        createdAt: poll.createdAt,
        dev: poll.dev,
        id: poll._id,
        likes: poll.likes || 0,
        options: options.map((option) => ({
          id: option._id,
          pollId: option.pollId,
          text: option.text,
          votes: option.votes,
          votedUserIds: option.votedUserIds,
        })),
        question: poll.question,
        totalVotes: poll.totalVotes,
        views: poll.views || 0,
      }
    })

    return {
      continueCursor: pollsResult.continueCursor,
      isDone: pollsResult.isDone,
      polls: pollsWithOptions,
    }
  },
})

export const getPoll = query({
  args: {
    pollId: v.id("polls"),
  },
  handler: async (ctx, args) => {
    const { pollId } = args

    const poll = await ctx.db.get(pollId)
    if (!poll) {
      return null
    }

    const options = await ctx.db
      .query("pollOptions")
      .withIndex("by_pollId", (q) => q.eq("pollId", poll._id))
      .collect()

    // Get the author's profile image URL
    const author = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", poll.authorId))
      .first()

    return {
      authorId: poll.authorId,
      authorProfileImageUrl: author?.profileImageUrl,
      authorUsername: poll.authorUsername,
      createdAt: poll.createdAt,
      dev: poll.dev,
      id: poll._id,
      likes: poll.likes || 0,
      options: options.map((option) => ({
        id: option._id,
        pollId: option.pollId,
        text: option.text,
        votes: option.votes,
        votedUserIds: option.votedUserIds,
      })),
      question: poll.question,
      totalVotes: poll.totalVotes,
      views: poll.views || 0,
    }
  },
})

// Add a query to get total poll count for stats
export const getPollsStats = query({
  args: {},
  handler: async (ctx) => {
    // For now, we still need to load polls to calculate total votes
    // In a real production system, you might want to add a separate stats table
    // Or use a background job to maintain these counts
    const polls = await ctx.db.query("polls").collect()

    // Calculate totals efficiently
    const totalPolls = polls.length
    const totalVotes = polls.reduce((sum, poll) => sum + poll.totalVotes, 0)

    return {
      totalPolls,
      totalVotes,
    }
  },
})

// More efficient stats query for specific user
export const getUserStats = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId } = args

    // Get authored polls count
    const authoredPolls = await ctx.db
      .query("polls")
      .withIndex("by_authorId", (q) => q.eq("authorId", userId))
      .collect()

    // Get total votes from authored polls
    const totalVotes = authoredPolls.reduce(
      (sum, poll) => sum + poll.totalVotes,
      0,
    )

    return {
      totalPolls: authoredPolls.length,
      totalVotes,
    }
  },
})

export const vote = mutation({
  args: {
    optionId: v.id("pollOptions"),
    pollId: v.id("polls"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const { pollId, optionId, userId } = args

    // Get the poll option
    const option = await ctx.db.get(optionId)
    if (!option) {
      return {
        error: "Poll option not found",
        success: false,
      }
    }

    // Check if user has already voted on this poll
    const existingVote = await ctx.db
      .query("pollUsers")
      .withIndex("by_poll_user", (q) =>
        q.eq("pollId", pollId).eq("userId", userId),
      )
      .first()

    if (existingVote) {
      // User has already voted, update their vote
      if (existingVote.optionId === optionId) {
        // User is unvoting
        await ctx.db.delete(existingVote._id)

        // Decrease vote count
        await ctx.db.patch(optionId, {
          votedUserIds: option.votedUserIds.filter((id) => id !== userId),
          votes: Math.max(0, option.votes - 1),
        })

        // Update poll total votes
        const poll = await ctx.db.get(pollId)
        if (poll) {
          await ctx.db.patch(pollId, {
            totalVotes: Math.max(0, poll.totalVotes - 1),
          })
        }
      } else {
        // User is changing their vote
        const oldOptionId = existingVote.optionId
        if (oldOptionId) {
          const oldOption = await ctx.db.get(oldOptionId)
          if (oldOption) {
            await ctx.db.patch(oldOptionId, {
              votedUserIds: oldOption.votedUserIds.filter(
                (id) => id !== userId,
              ),
              votes: Math.max(0, oldOption.votes - 1),
            })
          }
        }

        // Update user vote
        await ctx.db.patch(existingVote._id, {
          optionId: optionId,
          votedAt: Date.now(),
        })

        // Increase vote count for new option
        await ctx.db.patch(optionId, {
          votedUserIds: [...option.votedUserIds, userId],
          votes: option.votes + 1,
        })
      }
    } else {
      // User is voting for the first time
      await ctx.db.insert("pollUsers", {
        optionId,
        pollId,
        userId,
        votedAt: Date.now(),
      })

      // Increase vote count
      await ctx.db.patch(optionId, {
        votedUserIds: [...option.votedUserIds, userId],
        votes: option.votes + 1,
      })

      // Update poll total votes
      const poll = await ctx.db.get(pollId)
      if (poll) {
        await ctx.db.patch(pollId, {
          totalVotes: poll.totalVotes + 1,
        })
      }
    }

    // Return updated poll data
    const updatedPoll = await ctx.db.get(pollId)
    const updatedOptions = await ctx.db
      .query("pollOptions")
      .withIndex("by_pollId", (q) => q.eq("pollId", pollId))
      .collect()

    // Get the author's profile image URL
    const author = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) =>
        q.eq("userId", updatedPoll?.authorId || ""),
      )
      .first()

    return {
      poll: {
        authorId: updatedPoll?.authorId,
        authorProfileImageUrl: author?.profileImageUrl,
        authorUsername: updatedPoll?.authorUsername,
        createdAt: updatedPoll?.createdAt,
        dev: updatedPoll?.dev,
        id: updatedPoll?._id,
        options: updatedOptions.map((option) => ({
          id: option._id,
          pollId: option.pollId,
          text: option.text,
          votes: option.votes,
          votedUserIds: option.votedUserIds,
        })),
        question: updatedPoll?.question,
        totalVotes: updatedPoll?.totalVotes,
      },
      success: true,
    }
  },
})

export const getUserVote = query({
  args: {
    pollId: v.id("polls"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const { pollId, userId } = args

    const userVote = await ctx.db
      .query("pollUsers")
      .withIndex("by_poll_user", (q) =>
        q.eq("pollId", pollId).eq("userId", userId),
      )
      .first()

    return {
      optionId: userVote?.optionId || null,
      pollId: pollId,
    }
  },
})

// New optimized query to batch fetch user votes for multiple polls
export const getUserVotesForPolls = query({
  args: {
    pollIds: v.array(v.id("polls")),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const { pollIds, userId } = args

    if (pollIds.length === 0) {
      return {}
    }

    // Fetch all user votes for the given polls
    const userVotes = await ctx.db
      .query("pollUsers")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect()

    // Filter votes for the requested poll IDs and create a map
    const votesByPollId = new Map<string, string | null>()

    // Initialize all requested poll IDs with null (no vote)
    pollIds.forEach((pollId) => {
      votesByPollId.set(pollId, null)
    })

    // Set actual votes where they exist
    userVotes.forEach((vote) => {
      if (pollIds.includes(vote.pollId)) {
        votesByPollId.set(vote.pollId, vote.optionId || null)
      }
    })

    // Convert to object for easier consumption
    const result: Record<string, string | null> = {}
    votesByPollId.forEach((optionId, pollId) => {
      result[pollId] = optionId
    })

    return result
  },
})

export const getUserLikesForPolls = query({
  args: {
    pollIds: v.array(v.id("polls")),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const { pollIds, userId } = args

    if (pollIds.length === 0 || !userId) {
      return {}
    }

    const userLikes = await ctx.db
      .query("pollLikes")
      .withIndex("by_user_poll", (q) => q.eq("userId", userId))
      .collect()

    const likesByPollId = new Map<string, boolean>()
    pollIds.forEach((pollId) => {
      likesByPollId.set(pollId, false)
    })

    userLikes.forEach((like) => {
      if (pollIds.includes(like.pollId)) {
        likesByPollId.set(like.pollId, true)
      }
    })

    const result: Record<string, boolean> = {}
    likesByPollId.forEach((liked, pollId) => {
      result[pollId] = liked
    })

    return result
  },
})

export const getPollsByUser = query({
  args: {
    includeAuthored: v.boolean(),
    includeVoted: v.boolean(),
    paginationOpts: v.optional(
      v.object({
        numItems: v.number(),
        cursor: v.optional(v.union(v.string(), v.null())),
      }),
    ),
    sort: v.optional(v.string()),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const {
      userId,
      includeAuthored,
      includeVoted,
      paginationOpts,
      sort = "recent",
    } = args

    const defaultPagination = { cursor: null, numItems: 20 }
    const pagination = paginationOpts || defaultPagination

    // Build a set of poll IDs to fetch
    const pollIds = new Set<string>()

    // Get authored polls if requested
    if (includeAuthored) {
      const authoredPolls = await ctx.db
        .query("polls")
        .withIndex("by_authorId", (q) => q.eq("authorId", userId))
        .collect()

      authoredPolls.forEach((poll) => {
        pollIds.add(poll._id)
      })
    }

    // Get voted polls if requested
    if (includeVoted) {
      const userVotes = await ctx.db
        .query("pollUsers")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .collect()

      userVotes.forEach((vote) => {
        // If we're only showing voted polls (not authored), exclude polls the user authored
        if (!includeAuthored) {
          // We'll filter these out later when we fetch the actual polls
          pollIds.add(vote.pollId)
        } else {
          pollIds.add(vote.pollId)
        }
      })
    }

    // If no polls found, return empty result
    if (pollIds.size === 0) {
      return {
        continueCursor: null,
        isDone: true,
        polls: [],
      }
    }

    // Convert to array and fetch polls in batches
    const pollIdArray = [...pollIds]
    const allPolls = await Promise.all(
      pollIdArray.map(async (pollId) => {
        const poll = await ctx.db.get(pollId as Id<"polls">)
        if (!poll) {
          return null
        }

        // Filter out authored polls if we're only showing voted polls
        if (!includeAuthored && poll.authorId === userId) {
          return null
        }

        return poll
      }),
    )

    // Filter out null values and sort
    const sortedPolls = allPolls
      .filter((p): p is NonNullable<typeof p> => p !== null)
      .toSorted((a, b) => {
        switch (sort) {
          case "oldest": {
            return a.createdAt - b.createdAt
          }
          case "most-voted": {
            return (b.totalVotes || 0) - (a.totalVotes || 0)
          }
          case "least-voted": {
            return (a.totalVotes || 0) - (b.totalVotes || 0)
          }
          default: {
            return b.createdAt - a.createdAt
          }
        }
      })

    // Apply pagination
    let startIndex = 0
    if (pagination.cursor) {
      const cursorIndex = sortedPolls.findIndex(
        (poll) => poll._id === pagination.cursor,
      )
      if (cursorIndex !== -1) {
        startIndex = cursorIndex + 1
      }
    }

    const endIndex = startIndex + pagination.numItems
    const paginatedPolls = sortedPolls.slice(startIndex, endIndex)
    const isDone = endIndex >= sortedPolls.length
    const continueCursor = isDone
      ? null
      : paginatedPolls[paginatedPolls.length - 1]?._id || null

    const paginatedPollIds = paginatedPolls.map((p) => p._id)
    const optionsResults = await Promise.all(
      paginatedPollIds.map((pollId) =>
        ctx.db
          .query("pollOptions")
          .withIndex("by_pollId", (q) => q.eq("pollId", pollId))
          .collect(),
      ),
    )
    const optionsByPollId = new Map(
      paginatedPollIds.map((id, i) => [id, optionsResults[i]]),
    )

    const authorIds = [...new Set(paginatedPolls.map((poll) => poll.authorId))]
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

    const commentResults = await Promise.all(
      paginatedPollIds.map((pollId) =>
        ctx.db
          .query("comments")
          .withIndex("by_pollId", (q) => q.eq("pollId", pollId))
          .collect(),
      ),
    )
    const commentCountsByPollId = new Map(
      paginatedPollIds.map((id, i) => [id, commentResults[i].length]),
    )

    // Build the final result
    const pollsWithOptions = paginatedPolls.map((poll) => {
      const options = optionsByPollId.get(poll._id) || []
      const author = authorsById.get(poll.authorId)

      return {
        authorId: poll.authorId,
        authorProfileImageUrl: author?.profileImageUrl,
        authorUsername: poll.authorUsername,
        commentCount: commentCountsByPollId.get(poll._id) || 0,
        createdAt: poll.createdAt,
        dev: poll.dev,
        id: poll._id,
        likes: poll.likes || 0,
        options: options.map((option) => ({
          id: option._id,
          pollId: option.pollId,
          text: option.text,
          votes: option.votes,
          votedUserIds: option.votedUserIds,
        })),
        question: poll.question,
        totalVotes: poll.totalVotes,
        views: poll.views || 0,
      }
    })

    return {
      continueCursor,
      isDone,
      polls: pollsWithOptions,
    }
  },
})

export const createPoll = mutation({
  args: {
    authorId: v.string(),
    authorUsername: v.string(),
    dev: v.optional(v.boolean()),
    options: v.array(v.string()),
    question: v.string(),
  },
  handler: async (ctx, args) => {
    const { question, options, authorId, authorUsername, dev = false } = args

    // Validate question length (280 characters max)
    if (question.length > 280) {
      return {
        error: "Poll question cannot exceed 280 characters.",
        success: false,
      }
    }

    // Validate options count (minimum 2, maximum 10)
    if (options.length < 2) {
      return {
        error: "Poll must have at least 2 options.",
        success: false,
      }
    }

    if (options.length > 10) {
      return {
        error: "Poll cannot have more than 10 options.",
        success: false,
      }
    }

    // Validate each option length (280 characters max)
    for (let i = 0; i < options.length; i++) {
      if (options[i].length > 280) {
        return {
          error: `Poll option ${i + 1} cannot exceed 280 characters.`,
          success: false,
        }
      }
    }

    // Check for duplicate options within the poll
    const uniqueOptions = new Set(
      options.map((option) => option.trim().toLowerCase()),
    )
    if (uniqueOptions.size !== options.length) {
      return {
        error: "Poll cannot have duplicate options.",
        success: false,
      }
    }

    // Check for duplicate polls (exact match of question and options)
    const normalizedQuestion = question.trim().toLowerCase()
    const normalizedOptions = options
      .map((option) => option.trim().toLowerCase())
      .toSorted()

    const existingPolls = await ctx.db.query("polls").collect()

    for (const existingPoll of existingPolls) {
      const existingOptions = await ctx.db
        .query("pollOptions")
        .withIndex("by_pollId", (q) => q.eq("pollId", existingPoll._id))
        .collect()

      const existingNormalizedQuestion = existingPoll.question
        .trim()
        .toLowerCase()
      const existingNormalizedOptions = existingOptions
        .map((option) => option.text.trim().toLowerCase())
        .toSorted()

      // Check if question and options match exactly (order doesn't matter for options)
      if (
        existingNormalizedQuestion === normalizedQuestion &&
        JSON.stringify(existingNormalizedOptions) ===
          JSON.stringify(normalizedOptions)
      ) {
        return {
          error: "A poll with this exact question and options already exists.",
          success: false,
        }
      }
    }

    // Validate question content
    if (!validateTextContent(question)) {
      return {
        error:
          "Poll question contains inappropriate content and cannot be used.",
        success: false,
      }
    }

    // Validate all poll options
    const optionsValidation = validateMultipleTextInputs(
      options.reduce(
        (acc, option, index) => {
          acc[`poll option ${index + 1}`] = option
          return acc
        },
        {} as Record<string, string>,
      ),
    )

    if (!optionsValidation.isValid) {
      return {
        error: `${optionsValidation.fieldName.charAt(0).toUpperCase() + optionsValidation.fieldName.slice(1)} contains inappropriate content and cannot be used.`,
        success: false,
      }
    }

    // Create the poll
    const pollId = await ctx.db.insert("polls", {
      authorId,
      authorUsername,
      createdAt: Date.now(),
      dev,
      question,
      totalVotes: 0,
    })

    // Create poll options
    const _optionIds = await Promise.all(
      options.map((optionText) =>
        ctx.db.insert("pollOptions", {
          pollId,
          text: optionText,
          votedUserIds: [],
          votes: 0,
        }),
      ),
    )

    return {
      error: "",
      pollId,
      success: true,
    }
  },
})

export const deletePoll = mutation({
  args: {
    authorId: v.string(),
    pollId: v.id("polls"),
  },
  handler: async (ctx, args) => {
    const { pollId, authorId } = args

    // Get the poll to check if the user is the author
    const poll = await ctx.db.get(pollId)
    if (!poll) {
      return {
        error: "Poll not found",
        success: false,
      }
    }

    if (poll.authorId !== authorId) {
      return {
        error: "Only the poll author can delete this poll",
        success: false,
      }
    }

    // Delete all poll options
    const options = await ctx.db
      .query("pollOptions")
      .withIndex("by_pollId", (q) => q.eq("pollId", pollId))
      .collect()

    for (const option of options) {
      await ctx.db.delete(option._id)
    }

    // Delete all user votes for this poll
    const userVotes = await ctx.db
      .query("pollUsers")
      .withIndex("by_poll_user", (q) => q.eq("pollId", pollId))
      .collect()

    for (const vote of userVotes) {
      await ctx.db.delete(vote._id)
    }

    // Delete the poll
    await ctx.db.delete(pollId)

    return { success: true }
  },
})

export const getAllPollsForSitemap = query({
  args: {},
  handler: async (ctx) => {
    const polls = await ctx.db.query("polls").collect()

    return polls.map((poll) => ({
      _id: poll._id,
      createdAt: poll.createdAt,
    }))
  },
})

export const viewPoll = mutation({
  args: { pollId: v.id("polls") },
  handler: async (ctx, args) => {
    const poll = await ctx.db.get(args.pollId)
    if (!poll) {
      return
    }
    await ctx.db.patch(args.pollId, {
      views: (poll.views || 0) + 1,
    })
  },
})

export const toggleLike = mutation({
  args: { pollId: v.id("polls"), userId: v.string() },
  handler: async (ctx, args) => {
    const { pollId, userId } = args
    const existingLike = await ctx.db
      .query("pollLikes")
      .withIndex("by_user_poll", (q) =>
        q.eq("userId", userId).eq("pollId", pollId),
      )
      .first()

    const poll = await ctx.db.get(pollId)
    if (!poll) {
      throw new Error("Poll not found")
    }

    if (existingLike) {
      await ctx.db.delete(existingLike._id)
      await ctx.db.patch(pollId, {
        likes: Math.max(0, (poll.likes || 0) - 1),
      })
      return false // Unliked
    }
    await ctx.db.insert("pollLikes", {
      pollId,
      userId,
    })
    await ctx.db.patch(pollId, {
      likes: (poll.likes || 0) + 1,
    })
    return true // Liked
  },
})

export const getPollLikeStatus = query({
  args: { pollId: v.id("polls"), userId: v.string() },
  handler: async (ctx, args) => {
    const like = await ctx.db
      .query("pollLikes")
      .withIndex("by_user_poll", (q) =>
        q.eq("userId", args.userId).eq("pollId", args.pollId),
      )
      .first()
    return Boolean(like)
  },
})

export const getTrendingPolls = query({
  args: {},
  handler: async (ctx) => {
    const polls = await ctx.db.query("polls").collect()

    const cutoff = Date.now() - 24 * 60 * 60 * 1000
    const recentVotes = await ctx.db
      .query("pollUsers")
      .withIndex("by_votedAt", (q) => q.gte("votedAt", cutoff))
      .collect()

    const recentVoteCounts = new Map<string, number>()
    for (const vote of recentVotes) {
      const count = recentVoteCounts.get(vote.pollId) || 0
      recentVoteCounts.set(vote.pollId, count + 1)
    }

    // Sort by recent votes descending, tiebreak by poll _id (effectively random)
    const sortedPolls = polls
      .toSorted((a, b) => {
        const countA = recentVoteCounts.get(a._id) || 0
        const countB = recentVoteCounts.get(b._id) || 0
        if (countB !== countA) return countB - countA
        // Tiebreak: compare _id strings (random IDs → random order)
        return String(b._id).localeCompare(String(a._id))
      })
      .slice(0, 50)

    const sortedPollIds = sortedPolls.map((p) => p._id)
    const optionsResults = await Promise.all(
      sortedPollIds.map((pollId) =>
        ctx.db
          .query("pollOptions")
          .withIndex("by_pollId", (q) => q.eq("pollId", pollId))
          .collect(),
      ),
    )
    const optionsByPollId = new Map(
      sortedPollIds.map((id, i) => [id, optionsResults[i]]),
    )

    const authorIds = [...new Set(sortedPolls.map((poll) => poll.authorId))]
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

    const commentResults = await Promise.all(
      sortedPollIds.map((pollId) =>
        ctx.db
          .query("comments")
          .withIndex("by_pollId", (q) => q.eq("pollId", pollId))
          .collect(),
      ),
    )
    const trendingCommentCounts = new Map(
      sortedPollIds.map((id, i) => [id, commentResults[i].length]),
    )

    const pollsWithOptions = sortedPolls.map((poll) => {
      const options = optionsByPollId.get(poll._id) || []
      const author = authorsById.get(poll.authorId)

      return {
        authorId: poll.authorId,
        authorProfileImageUrl: author?.profileImageUrl,
        authorUsername: poll.authorUsername,
        commentCount: trendingCommentCounts.get(poll._id) || 0,
        createdAt: poll.createdAt,
        dev: poll.dev,
        id: poll._id,
        likes: poll.likes || 0,
        options: options.map((option) => ({
          id: option._id,
          pollId: option.pollId,
          text: option.text,
          votes: option.votes,
          votedUserIds: option.votedUserIds,
        })),
        question: poll.question,
        totalVotes: poll.totalVotes,
        views: poll.views || 0,
      }
    })

    return {
      continueCursor: null,
      isDone: true,
      polls: pollsWithOptions,
    }
  },
})

export const getRandomPoll = query({
  args: {},
  handler: async (ctx) => {
    const polls = await ctx.db.query("polls").collect()

    if (polls.length === 0) {
      return null
    }

    const randomPoll = polls[Math.floor(Math.random() * polls.length)]

    const options = await ctx.db
      .query("pollOptions")
      .withIndex("by_pollId", (q) => q.eq("pollId", randomPoll._id))
      .collect()

    const author = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", randomPoll.authorId))
      .first()

    return {
      authorId: randomPoll.authorId,
      authorProfileImageUrl: author?.profileImageUrl,
      authorUsername: randomPoll.authorUsername,
      createdAt: randomPoll.createdAt,
      dev: randomPoll.dev,
      id: randomPoll._id,
      options: options.map((option) => ({
        id: option._id,
        pollId: option.pollId,
        text: option.text,
        votes: option.votes,
        votedUserIds: option.votedUserIds,
      })),
      question: randomPoll.question,
      totalVotes: randomPoll.totalVotes,
    }
  },
})
