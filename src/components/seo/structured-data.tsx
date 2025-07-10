import { HeadContent } from "@tanstack/react-router"
import { useEffect, useRef } from "react"

interface StructuredDataProps {
  type?: "WebSite" | "Organization" | "WebPage" | "Article" | "Poll"
  name?: string
  description?: string
  url?: string
  logo?: string
  image?: string
  author?: string
  datePublished?: string
  dateModified?: string
  pollData?: {
    question: string
    options: string[]
    totalVotes: number
  }
}

export const StructuredData = ({
  type = "WebSite",
  name = "PollSpree",
  description = "Join PollSpree to create and vote on polls. Discover what others think about trending topics and share your opinion with the community.",
  url = "https://pollspree.com",
  logo = "https://pollspree.com/logo.png",
  image,
  author,
  datePublished,
  dateModified,
  pollData,
}: StructuredDataProps) => {
  const scriptRef = useRef<HTMLScriptElement>(null)

  useEffect(() => {
    const baseData = {
      "@context": "https://schema.org",
      "@type": type,
      name,
      description,
      url,
      logo: {
        "@type": "ImageObject",
        url: logo,
      },
      ...(image && {
        image: {
          "@type": "ImageObject",
          url: image,
        },
      }),
      ...(author && { author: { "@type": "Person", name: author } }),
      ...(datePublished && { datePublished }),
      ...(dateModified && { dateModified }),
    }

    // Add poll-specific structured data
    if (type === "Poll" && pollData) {
      Object.assign(baseData, {
        mainEntity: {
          "@type": "Question",
          name: pollData.question,
          suggestedAnswer: pollData.options.map((option) => ({
            "@type": "Answer",
            text: option,
          })),
        },
        interactionStatistic: {
          "@type": "InteractionCounter",
          interactionType: "https://schema.org/VoteAction",
          userInteractionCount: pollData.totalVotes,
        },
      })
    }

    if (scriptRef.current) {
      scriptRef.current.textContent = JSON.stringify(baseData)
    }
  }, [type, name, description, url, logo, image, author, datePublished, dateModified, pollData])

  return (
    <HeadContent>
      <script ref={scriptRef} type="application/ld+json" />
    </HeadContent>
  )
}
