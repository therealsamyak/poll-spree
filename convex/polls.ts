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
        numItems: v.number(),
        cursor: v.optional(v.union(v.string(), v.null())),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const { paginationOpts } = args

    // Use pagination to limit the number of polls fetched
    const defaultPagination = { numItems: 20, cursor: null }
    const pagination = {
      numItems: paginationOpts?.numItems ?? defaultPagination.numItems,
      cursor:
        paginationOpts?.cursor !== undefined
          ? paginationOpts.cursor
          : defaultPagination.cursor,
    }

    const pollsResult = await ctx.db
      .query("polls")
      .order("desc")
      .paginate(pagination)

    // Batch fetch all options for all polls
    const allOptions = await ctx.db.query("pollOptions").collect()
    const optionsByPollId = new Map<string, typeof allOptions>()
    allOptions.forEach((option) => {
      if (!optionsByPollId.has(option.pollId)) {
        optionsByPollId.set(option.pollId, [])
      }
      optionsByPollId.get(option.pollId)?.push(option)
    })

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

    const pollsWithOptions = pollsResult.page.map((poll) => {
      const options = optionsByPollId.get(poll._id) || []
      const author = authorsById.get(poll.authorId)

      return {
        id: poll._id,
        question: poll.question,
        totalVotes: poll.totalVotes,
        dev: poll.dev,
        authorId: poll.authorId,
        authorUsername: poll.authorUsername,
        authorProfileImageUrl: author?.profileImageUrl,
        createdAt: poll.createdAt,
        views: poll.views || 0,
        likes: poll.likes || 0,
        options: options.map((option) => ({
          id: option._id,
          pollId: option.pollId,
          text: option.text,
          votes: option.votes,
          votedUserIds: option.votedUserIds,
        })),
      }
    })

    return {
      polls: pollsWithOptions,
      isDone: pollsResult.isDone,
      continueCursor: pollsResult.continueCursor,
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
      id: poll._id,
      question: poll.question,
      totalVotes: poll.totalVotes,
      dev: poll.dev,
      authorId: poll.authorId,
      authorUsername: poll.authorUsername,
      authorProfileImageUrl: author?.profileImageUrl,
      createdAt: poll.createdAt,
      options: options.map((option) => ({
        id: option._id,
        pollId: option.pollId,
        text: option.text,
        votes: option.votes,
        votedUserIds: option.votedUserIds,
      })),
    }
  },
})

// Add a query to get total poll count for stats
export const getPollsStats = query({
  args: {},
  handler: async (ctx) => {
    // For now, we still need to load polls to calculate total votes
    // In a real production system, you might want to add a separate stats table
    // or use a background job to maintain these counts
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
    pollId: v.id("polls"),
    optionId: v.id("pollOptions"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const { pollId, optionId, userId } = args

    // Get the poll option
    const option = await ctx.db.get(optionId)
    if (!option) {
      return {
        success: false,
        error: "Poll option not found",
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
          votes: Math.max(0, option.votes - 1),
          votedUserIds: option.votedUserIds.filter((id) => id !== userId),
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
              votes: Math.max(0, oldOption.votes - 1),
              votedUserIds: oldOption.votedUserIds.filter(
                (id) => id !== userId,
              ),
            })
          }
        }

        // Update user vote
        await ctx.db.patch(existingVote._id, {
          optionId: optionId,
        })

        // Increase vote count for new option
        await ctx.db.patch(optionId, {
          votes: option.votes + 1,
          votedUserIds: [...option.votedUserIds, userId],
        })
      }
    } else {
      // User is voting for the first time
      await ctx.db.insert("pollUsers", {
        pollId,
        userId,
        optionId,
      })

      // Increase vote count
      await ctx.db.patch(optionId, {
        votes: option.votes + 1,
        votedUserIds: [...option.votedUserIds, userId],
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
      success: true,
      poll: {
        id: updatedPoll?._id,
        question: updatedPoll?.question,
        totalVotes: updatedPoll?.totalVotes,
        dev: updatedPoll?.dev,
        authorId: updatedPoll?.authorId,
        authorUsername: updatedPoll?.authorUsername,
        authorProfileImageUrl: author?.profileImageUrl,
        createdAt: updatedPoll?.createdAt,
        options: updatedOptions.map((option) => ({
          id: option._id,
          pollId: option.pollId,
          text: option.text,
          votes: option.votes,
          votedUserIds: option.votedUserIds,
        })),
      },
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
      pollId: pollId,
      optionId: userVote?.optionId || null,
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

export const getPollsByUser = query({
  args: {
    userId: v.string(),
    includeAuthored: v.boolean(),
    includeVoted: v.boolean(),
    sort: v.optional(v.string()),
    paginationOpts: v.optional(
      v.object({
        numItems: v.number(),
        cursor: v.optional(v.union(v.string(), v.null())),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const {
      userId,
      includeAuthored,
      includeVoted,
      paginationOpts,
      sort = "recent",
    } = args

    const defaultPagination = { numItems: 20, cursor: null }
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
        polls: [],
        isDone: true,
        continueCursor: null,
      }
    }

    // Convert to array and fetch polls in batches
    const pollIdArray = Array.from(pollIds)
    const allPolls = await Promise.all(
      pollIdArray.map(async (pollId) => {
        const poll = await ctx.db.get(pollId as Id<"polls">)
        if (!poll) return null

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
      .sort((a, b) => {
        switch (sort) {
          case "oldest":
            return a.createdAt - b.createdAt
          case "most-voted":
            return (b.totalVotes || 0) - (a.totalVotes || 0)
          case "least-voted":
            return (a.totalVotes || 0) - (b.totalVotes || 0)
          default:
            return b.createdAt - a.createdAt
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

    // Batch fetch options and authors for the paginated polls
    const allOptions = await ctx.db.query("pollOptions").collect()
    const optionsByPollId = new Map<string, typeof allOptions>()
    allOptions.forEach((option) => {
      if (!optionsByPollId.has(option.pollId)) {
        optionsByPollId.set(option.pollId, [])
      }
      optionsByPollId.get(option.pollId)?.push(option)
    })

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

    // Build the final result
    const pollsWithOptions = paginatedPolls.map((poll) => {
      const options = optionsByPollId.get(poll._id) || []
      const author = authorsById.get(poll.authorId)

      return {
        id: poll._id,
        question: poll.question,
        totalVotes: poll.totalVotes,
        dev: poll.dev,
        authorId: poll.authorId,
        authorUsername: poll.authorUsername,
        authorProfileImageUrl: author?.profileImageUrl,
        createdAt: poll.createdAt,
        views: poll.views || 0,
        likes: poll.likes || 0,
        options: options.map((option) => ({
          id: option._id,
          pollId: option.pollId,
          text: option.text,
          votes: option.votes,
          votedUserIds: option.votedUserIds,
        })),
      }
    })

    return {
      polls: pollsWithOptions,
      isDone,
      continueCursor,
    }
  },
})

export const createPoll = mutation({
  args: {
    question: v.string(),
    options: v.array(v.string()),
    authorId: v.string(),
    authorUsername: v.string(),
    dev: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { question, options, authorId, authorUsername, dev = false } = args

    // Validate question length (280 characters max)
    if (question.length > 280) {
      return {
        success: false,
        error: "Poll question cannot exceed 280 characters.",
      }
    }

    // Validate options count (minimum 2, maximum 10)
    if (options.length < 2) {
      return {
        success: false,
        error: "Poll must have at least 2 options.",
      }
    }

    if (options.length > 10) {
      return {
        success: false,
        error: "Poll cannot have more than 10 options.",
      }
    }

    // Validate each option length (280 characters max)
    for (let i = 0; i < options.length; i++) {
      if (options[i].length > 280) {
        return {
          success: false,
          error: `Poll option ${i + 1} cannot exceed 280 characters.`,
        }
      }
    }

    // Check for duplicate options within the poll
    const uniqueOptions = new Set(
      options.map((option) => option.trim().toLowerCase()),
    )
    if (uniqueOptions.size !== options.length) {
      return {
        success: false,
        error: "Poll cannot have duplicate options.",
      }
    }

    // Check for duplicate polls (exact match of question and options)
    const normalizedQuestion = question.trim().toLowerCase()
    const normalizedOptions = options
      .map((option) => option.trim().toLowerCase())
      .sort()

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
        .sort()

      // Check if question and options match exactly (order doesn't matter for options)
      if (
        existingNormalizedQuestion === normalizedQuestion &&
        JSON.stringify(existingNormalizedOptions) ===
          JSON.stringify(normalizedOptions)
      ) {
        return {
          success: false,
          error: "A poll with this exact question and options already exists.",
        }
      }
    }

    // Validate question content
    if (!validateTextContent(question)) {
      return {
        success: false,
        error:
          "Poll question contains inappropriate content and cannot be used.",
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
        success: false,
        error: `${optionsValidation.fieldName.charAt(0).toUpperCase() + optionsValidation.fieldName.slice(1)} contains inappropriate content and cannot be used.`,
      }
    }

    // Create the poll
    const pollId = await ctx.db.insert("polls", {
      question,
      totalVotes: 0,
      dev,
      authorId,
      authorUsername,
      createdAt: Date.now(),
    })

    // Create poll options
    const _optionIds = await Promise.all(
      options.map((optionText) =>
        ctx.db.insert("pollOptions", {
          pollId,
          text: optionText,
          votes: 0,
          votedUserIds: [],
        }),
      ),
    )

    return {
      success: true,
      error: "",
    }
  },
})

export const deletePoll = mutation({
  args: {
    pollId: v.id("polls"),
    authorId: v.string(),
  },
  handler: async (ctx, args) => {
    const { pollId, authorId } = args

    // Get the poll to check if the user is the author
    const poll = await ctx.db.get(pollId)
    if (!poll) {
      return {
        success: false,
        error: "Poll not found",
      }
    }

    if (poll.authorId !== authorId) {
      return {
        success: false,
        error: "Only the poll author can delete this poll",
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
    if (!poll) return
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
    if (!poll) throw new Error("Poll not found")

    if (existingLike) {
      await ctx.db.delete(existingLike._id)
      await ctx.db.patch(pollId, {
        likes: Math.max(0, (poll.likes || 0) - 1),
      })
      return false // unliked
    }
    await ctx.db.insert("pollLikes", {
      pollId,
      userId,
    })
    await ctx.db.patch(pollId, {
      likes: (poll.likes || 0) + 1,
    })
    return true // liked
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
    return !!like
  },
})

export const getTrendingPolls = query({
  args: {},
  handler: async (ctx) => {
    const polls = await ctx.db.query("polls").collect()

    const sortedPolls = polls
      .sort((a, b) => {
        const scoreA =
          (a.totalVotes || 0) * 2 + (a.likes || 0) + (a.views || 0) * 0.1
        const scoreB =
          (b.totalVotes || 0) * 2 + (b.likes || 0) + (b.views || 0) * 0.1
        return scoreB - scoreA
      })
      .slice(0, 50)

    const allOptions = await ctx.db.query("pollOptions").collect()
    const optionsByPollId = new Map<string, typeof allOptions>()
    allOptions.forEach((option) => {
      if (!optionsByPollId.has(option.pollId)) {
        optionsByPollId.set(option.pollId, [])
      }
      optionsByPollId.get(option.pollId)?.push(option)
    })

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

    const pollsWithOptions = sortedPolls.map((poll) => {
      const options = optionsByPollId.get(poll._id) || []
      const author = authorsById.get(poll.authorId)

      return {
        id: poll._id,
        question: poll.question,
        totalVotes: poll.totalVotes,
        dev: poll.dev,
        authorId: poll.authorId,
        authorUsername: poll.authorUsername,
        authorProfileImageUrl: author?.profileImageUrl,
        createdAt: poll.createdAt,
        views: poll.views || 0,
        likes: poll.likes || 0,
        options: options.map((option) => ({
          id: option._id,
          pollId: option.pollId,
          text: option.text,
          votes: option.votes,
          votedUserIds: option.votedUserIds,
        })),
      }
    })

    return {
      polls: pollsWithOptions,
      isDone: true,
      continueCursor: null,
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
      id: randomPoll._id,
      question: randomPoll.question,
      totalVotes: randomPoll.totalVotes,
      dev: randomPoll.dev,
      authorId: randomPoll.authorId,
      authorUsername: randomPoll.authorUsername,
      authorProfileImageUrl: author?.profileImageUrl,
      createdAt: randomPoll.createdAt,
      options: options.map((option) => ({
        id: option._id,
        pollId: option.pollId,
        text: option.text,
        votes: option.votes,
        votedUserIds: option.votedUserIds,
      })),
    }
  },
})
