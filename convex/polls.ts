import { v } from "convex/values"
import { action, mutation, query } from "./_generated/server"

/**
 * Comprehensive username validation following security best practices
 */
function validateUsername(username: string): { isValid: boolean; error?: string } {
  // Trim whitespace first
  const trimmed = username.trim()

  // Check if empty after trimming
  if (!trimmed) {
    return { isValid: false, error: "Username cannot be empty" }
  }

  // Check length (3-20 characters)
  if (trimmed.length < 3) {
    return { isValid: false, error: "Username must be at least 3 characters long" }
  }

  if (trimmed.length > 20) {
    return { isValid: false, error: "Username must be 20 characters or less" }
  }

  // Check for leading/trailing whitespace (shouldn't happen after trim, but double-check)
  if (username !== trimmed) {
    return { isValid: false, error: "Username cannot have leading or trailing spaces" }
  }

  // Check for multiple consecutive spaces
  if (/\s{2,}/.test(username)) {
    return { isValid: false, error: "Username cannot have multiple consecutive spaces" }
  }

  // Only allow ASCII letters, numbers, underscores, and hyphens
  // This prevents Unicode control characters, bidirectional text, and other problematic characters
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return {
      isValid: false,
      error: "Username can only contain English letters, numbers, underscores, and hyphens",
    }
  }

  // Prevent usernames that start with numbers (optional, but common practice)
  if (/^\d/.test(trimmed)) {
    return { isValid: false, error: "Username cannot start with a number" }
  }

  // Prevent usernames that end with hyphens or underscores (optional, but cleaner)
  if (/[-_]$/.test(trimmed)) {
    return { isValid: false, error: "Username cannot end with a hyphen or underscore" }
  }

  // Prevent consecutive hyphens or underscores (optional, but cleaner)
  if (/[-_]{2,}/.test(trimmed)) {
    return { isValid: false, error: "Username cannot have consecutive hyphens or underscores" }
  }

  return { isValid: true }
}

/**
 * Check if username is reserved (common reserved usernames)
 */
function isReservedUsername(username: string): boolean {
  const reserved = [
    "admin",
    "administrator",
    "root",
    "system",
    "support",
    "help",
    "info",
    "contact",
    "mail",
    "email",
    "webmaster",
    "postmaster",
    "hostmaster",
    "usenet",
    "news",
    "nobody",
    "noreply",
    "no-reply",
    "donotreply",
    "test",
    "demo",
    "example",
    "guest",
    "anonymous",
    "null",
    "undefined",
    "api",
    "www",
    "ftp",
    "mail",
    "pop",
    "smtp",
    "imap",
    "dns",
    "ns",
    "www-data",
    "daemon",
    "bin",
    "sys",
    "sync",
    "games",
    "man",
    "lp",
    "news",
    "uucp",
    "proxy",
    "www-data",
    "backup",
    "list",
    "irc",
    "gnats",
    "nobody",
    "libuuid",
    "dhcp",
    "syslog",
    "klog",
    "bind",
    "statd",
    "messagebus",
    "avahi",
    "avahi-autoipd",
    "speech-dispatcher",
    "kernoops",
    "pulse",
    "rtkit",
    "saned",
    "usbmux",
    "colord",
    "hplip",
    "gdm",
    "whoopsie",
    "lightdm",
    "avahi",
    "dnsmasq",
    "cups-pk-helper",
    "kernoops",
    "pulse",
    "rtkit",
    "saned",
    "usbmux",
    "colord",
    "hplip",
    "gdm",
    "whoopsie",
    "lightdm",
    "avahi",
    "dnsmasq",
    "cups-pk-helper",
  ]

  return reserved.includes(username.toLowerCase())
}

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

    // Get the author's profile image URL
    const author = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", updatedPoll?.authorId || ""))
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
    profileImageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, username, profileImageUrl } = args

    // Validate username
    const validation = validateUsername(username)
    if (!validation.isValid) {
      throw new Error(validation.error || "Invalid username")
    }
    if (isReservedUsername(username)) {
      throw new Error("This username is reserved and cannot be used")
    }

    // Check if user already exists by userId
    const existingUserById = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first()

    if (existingUserById) {
      // User exists, update their username and profile image
      await ctx.db.patch(existingUserById._id, {
        username,
        profileImageUrl,
      })

      // Update all polls by this user to use the new username
      const userPolls = await ctx.db
        .query("polls")
        .withIndex("by_authorId", (q) => q.eq("authorId", userId))
        .collect()

      for (const poll of userPolls) {
        await ctx.db.patch(poll._id, {
          authorUsername: username,
        })
      }

      return { userId: existingUserById._id, updated: true }
    }

    // Check if username is already taken by another user
    const existingUserByUsername = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username))
      .first()

    if (existingUserByUsername) {
      throw new Error("Username already taken")
    }

    // Create the user
    const user = await ctx.db.insert("users", {
      userId,
      username,
      profileImageUrl,
      createdAt: Date.now(),
    })

    return { userId: user, updated: false }
  },
})

export const updateUsername = mutation({
  args: {
    userId: v.string(),
    username: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId, username } = args

    // Validate username
    const validation = validateUsername(username)
    if (!validation.isValid) {
      throw new Error(validation.error || "Invalid username")
    }
    if (isReservedUsername(username)) {
      throw new Error("This username is reserved and cannot be used")
    }

    // Check if username is already taken by another user
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username))
      .first()

    if (existingUser && existingUser.userId !== userId) {
      throw new Error("Username already taken")
    }

    // Get the current user
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first()

    if (!currentUser) {
      throw new Error("User not found")
    }

    // Update the username
    await ctx.db.patch(currentUser._id, {
      username,
    })

    // Update all polls by this user to use the new username
    const userPolls = await ctx.db
      .query("polls")
      .withIndex("by_authorId", (q) => q.eq("authorId", userId))
      .collect()

    for (const poll of userPolls) {
      await ctx.db.patch(poll._id, {
        authorUsername: username,
      })
    }

    return { success: true }
  },
})

export const updateProfileImage = mutation({
  args: {
    userId: v.string(),
    profileImageUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId, profileImageUrl } = args

    // Get the current user
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first()

    if (!currentUser) {
      // User doesn't exist yet, skip the update
      // The profile image will be set when the user is created during username setup
      return { success: true, skipped: true }
    }

    // Update the profile image URL in the users table
    await ctx.db.patch(currentUser._id, {
      profileImageUrl,
    })

    // Note: We don't need to update the polls table because we always query
    // the users table for the latest profile image URL in getPolls and vote functions.
    // This ensures that profile image changes are immediately reflected in all polls.

    return { success: true, skipped: false }
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

export const deleteAccount = mutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId } = args

    // Step 1: Get all poll options where this user has voted
    const allPollOptions = await ctx.db.query("pollOptions").collect()
    const optionsUserVotedFor = allPollOptions.filter((option) =>
      option.votedUserIds.includes(userId),
    )

    // Step 2: Remove user from all poll options they voted for and adjust vote counts
    for (const option of optionsUserVotedFor) {
      const updatedVotedUserIds = option.votedUserIds.filter((id) => id !== userId)
      const newVoteCount = updatedVotedUserIds.length

      await ctx.db.patch(option._id, {
        votedUserIds: updatedVotedUserIds,
        votes: newVoteCount,
      })

      // Update the total votes for the poll this option belongs to
      const poll = await ctx.db.get(option.pollId)
      if (poll) {
        const pollOptions = await ctx.db
          .query("pollOptions")
          .withIndex("by_pollId", (q) => q.eq("pollId", option.pollId))
          .collect()

        const totalVotes = pollOptions.reduce((sum, opt) => sum + opt.votes, 0)
        await ctx.db.patch(option.pollId, {
          totalVotes,
        })
      }
    }

    // Step 3: Delete all polls created by this user
    const userPolls = await ctx.db
      .query("polls")
      .withIndex("by_authorId", (q) => q.eq("authorId", userId))
      .collect()

    for (const poll of userPolls) {
      // Delete all poll options for this poll
      const pollOptions = await ctx.db
        .query("pollOptions")
        .withIndex("by_pollId", (q) => q.eq("pollId", poll._id))
        .collect()

      for (const option of pollOptions) {
        await ctx.db.delete(option._id)
      }

      // Delete the poll
      await ctx.db.delete(poll._id)
    }

    // Step 4: Delete all pollUsers entries for this user
    const userVoteEntries = await ctx.db
      .query("pollUsers")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect()

    for (const vote of userVoteEntries) {
      await ctx.db.delete(vote._id)
    }

    // Step 5: Delete the user record
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first()

    if (user) {
      await ctx.db.delete(user._id)
    }

    return { success: true }
  },
})

export const deleteClerkUser = action({
  args: {
    userId: v.string(),
  },
  handler: async (_ctx, args) => {
    const { userId } = args

    console.log("Starting deleteClerkUser action for userId:", userId)

    const clerkSecretKey = process.env.CLERK_SECRET_KEY
    if (!clerkSecretKey) {
      console.error("CLERK_SECRET_KEY environment variable is not set")
      throw new Error("CLERK_SECRET_KEY environment variable is not set")
    }

    console.log("CLERK_SECRET_KEY is set, attempting to delete user from Clerk")

    try {
      const response = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${clerkSecretKey}`,
          "Content-Type": "application/json",
        },
      })

      console.log("Clerk API response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Clerk API error:", errorData)
        throw new Error(`Failed to delete Clerk user: ${errorData.message || response.statusText}`)
      }

      console.log("Successfully deleted user from Clerk")
      return { success: true }
    } catch (error) {
      console.error("Error deleting user from Clerk:", error)
      throw new Error("Failed to delete user from Clerk")
    }
  },
})
