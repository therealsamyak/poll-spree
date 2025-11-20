export interface SEOConfig {
  title?: string
  description?: string
  keywords?: string
  canonical?: string
  ogImage?: string
  twitterImage?: string
  type?: "website" | "article" | "poll"
  author?: string
  publishedTime?: string
  modifiedTime?: string
  pollData?: {
    question: string
    options: string[]
    totalVotes: number
  }
}

export const generateSEOTitle = (title?: string, siteName = "PollSpree") => {
  if (!title) return siteName
  return `${title} - ${siteName}`
}

export const generateSEODescription = (
  description?: string,
  pollData?: { question: string; authorUsername: string; totalVotes: number },
) => {
  if (pollData) {
    return `Vote on "${pollData.question}" by ${pollData.authorUsername}. ${pollData.totalVotes} votes so far. Join the discussion on PollSpree!`
  }
  return (
    description ||
    "Join PollSpree to create and vote on polls. Discover what others think about trending topics and share your opinion with the community."
  )
}

export const generateSEOKeywords = (
  baseKeywords: string[],
  additionalKeywords: string[] = [],
) => {
  const defaultKeywords = [
    "polls",
    "voting",
    "surveys",
    "community",
    "opinions",
    "trending topics",
    "social media polls",
  ]

  return [...defaultKeywords, ...baseKeywords, ...additionalKeywords]
    .filter(Boolean)
    .join(", ")
}

export const generateCanonicalUrl = (
  path: string,
  baseUrl = "https://pollspree.com",
) => {
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`
}

export const generateStructuredData = (config: SEOConfig) => {
  const baseData = {
    "@context": "https://schema.org",
    "@type": config.type === "poll" ? "Poll" : "WebPage",
    name: config.title,
    description: config.description,
    url: config.canonical,
    ...(config.author && {
      author: { "@type": "Person", name: config.author },
    }),
    ...(config.publishedTime && { datePublished: config.publishedTime }),
    ...(config.modifiedTime && { dateModified: config.modifiedTime }),
  }

  if (config.type === "poll" && config.pollData) {
    Object.assign(baseData, {
      mainEntity: {
        "@type": "Question",
        name: config.pollData.question,
        suggestedAnswer: config.pollData.options.map((option) => ({
          "@type": "Answer",
          text: option,
        })),
      },
      interactionStatistic: {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/VoteAction",
        userInteractionCount: config.pollData.totalVotes,
      },
    })
  }

  return baseData
}

export const generateSitemapUrl = (
  path: string,
  priority = 0.5,
  changefreq = "weekly",
) => {
  return {
    loc: `https://pollspree.com${path}`,
    lastmod: new Date().toISOString(),
    changefreq,
    priority,
  }
}

export const sanitizeForSEO = (text: string) => {
  return text
    .replace(/[^\w\s-]/g, "") // Remove special characters except spaces and hyphens
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .trim()
    .substring(0, 160) // Limit to 160 characters for meta descriptions
}

export const generatePollSEOConfig = (poll: {
  question: string
  authorUsername: string
  totalVotes: number
  options: { text: string }[]
  id: string
}): SEOConfig => {
  return {
    title: poll.question,
    description: generateSEODescription(undefined, {
      question: poll.question,
      authorUsername: poll.authorUsername,
      totalVotes: poll.totalVotes,
    }),
    keywords: generateSEOKeywords([poll.authorUsername, "poll", "voting"]),
    canonical: generateCanonicalUrl(`/polls/${poll.id}`),
    type: "poll",
    author: poll.authorUsername,
    pollData: {
      question: poll.question,
      options: poll.options.map((opt) => opt.text),
      totalVotes: poll.totalVotes,
    },
  }
}

export const generateUserSEOConfig = (username: string): SEOConfig => {
  return {
    title: `${username} - PollSpree`,
    description: `View polls created by ${username} on PollSpree. Discover what ${username} thinks about trending topics.`,
    keywords: generateSEOKeywords([username, "polls", "voting", "community"]),
    canonical: generateCanonicalUrl(`/users/${encodeURIComponent(username)}`),
    type: "website",
  }
}
