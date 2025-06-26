import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

export const getPolls = query({
  args: {},
  handler: async (ctx) => {
    const polls = await ctx.db.query("polls").order("desc").collect()

    const pollsWithOptions = await Promise.all(
      polls.map(async (poll) => {
        const options = await ctx.db
          .query("pollOptions")
          .withIndex("by_pollId", (q) => q.eq("pollId", poll._id))
          .collect()

        return {
          id: poll._id,
          question: poll.question,
          totalVotes: poll.totalVotes,
          dev: poll.dev,
          authorId: poll.authorId,
          authorUsername: poll.authorUsername,
          createdAt: poll.createdAt,
          options: options.map((option) => ({
            id: option._id,
            pollId: option.pollId,
            text: option.text,
            votes: option.votes,
            votedUserIds: option.votedUserIds,
          })),
        }
      }),
    )

    return pollsWithOptions
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
      throw new Error("Poll option not found")
    }

    // Check if user has already voted on this poll
    const existingVote = await ctx.db
      .query("pollUsers")
      .withIndex("by_poll_user", (q) => q.eq("pollId", pollId).eq("userId", userId))
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
              votedUserIds: oldOption.votedUserIds.filter((id) => id !== userId),
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

    return {
      success: true,
      poll: {
        id: updatedPoll?._id,
        question: updatedPoll?.question,
        totalVotes: updatedPoll?.totalVotes,
        dev: updatedPoll?.dev,
        authorId: updatedPoll?.authorId,
        authorUsername: updatedPoll?.authorUsername,
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
      .withIndex("by_poll_user", (q) => q.eq("pollId", pollId).eq("userId", userId))
      .first()

    return {
      pollId: pollId,
      optionId: userVote?.optionId || null,
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
    const optionIds = await Promise.all(
      options.map((optionText) =>
        ctx.db.insert("pollOptions", {
          pollId,
          text: optionText,
          votes: 0,
          votedUserIds: [],
        }),
      ),
    )

    return { pollId, optionIds }
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
      throw new Error("Poll not found")
    }

    if (poll.authorId !== authorId) {
      throw new Error("Only the poll author can delete this poll")
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

export const createUser = mutation({
  args: {
    userId: v.string(),
    username: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId, username } = args

    // Check if username is already taken
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username))
      .first()

    if (existingUser) {
      throw new Error("Username already taken")
    }

    // Create the user
    const user = await ctx.db.insert("users", {
      userId,
      username,
      createdAt: Date.now(),
    })

    return { userId: user }
  },
})

export const getUser = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId } = args

    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first()

    return user
  },
})
