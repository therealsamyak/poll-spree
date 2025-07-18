import { v } from "convex/values"
import { action, mutation, query } from "./_generated/server"
import { validateTextContent } from "./badWordsFilter"

/**
 * Comprehensive username validation following security best practices
 */
const validateUsername = (username: string): { isValid: boolean; error?: string } => {
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
const isReservedUsername = (username: string): boolean => {
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
      return {
        success: false,
        error: validation.error || "Invalid username",
      }
    }

    // Check for inappropriate content in username
    if (!validateTextContent(username)) {
      return {
        success: false,
        error: "Username contains inappropriate content and cannot be used.",
      }
    }

    if (isReservedUsername(username)) {
      return {
        success: false,
        error: "This username is reserved and cannot be used.",
      }
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

      return { success: true, userId: existingUserById._id, updated: true }
    }

    // Check if username is already taken by another user
    const existingUserByUsername = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username))
      .first()

    if (existingUserByUsername) {
      return {
        success: false,
        error: "Username already taken",
      }
    }

    // Create the user
    const user = await ctx.db.insert("users", {
      userId,
      username,
      profileImageUrl,
      createdAt: Date.now(),
    })

    return { success: true, userId: user, updated: false }
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
      return {
        success: false,
        error: validation.error || "Invalid username",
      }
    }

    // Check for inappropriate content in username
    if (!validateTextContent(username)) {
      return {
        success: false,
        error: "Username contains inappropriate content and cannot be used.",
      }
    }

    if (isReservedUsername(username)) {
      return {
        success: false,
        error: "This username is reserved and cannot be used.",
      }
    }

    // Check if username is already taken by another user
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username))
      .first()

    if (existingUser && existingUser.userId !== userId) {
      return {
        success: false,
        error: "Username already taken",
      }
    }

    // Get the current user
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first()

    if (!currentUser) {
      return {
        success: false,
        error: "User not found",
      }
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

export const getUserByUsername = query({
  args: {
    username: v.string(),
  },
  handler: async (ctx, args) => {
    const { username } = args

    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username))
      .first()

    return user
  },
})

export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect()

    return users.map((user) => ({
      username: user.username,
      createdAt: user.createdAt,
    }))
  },
})
