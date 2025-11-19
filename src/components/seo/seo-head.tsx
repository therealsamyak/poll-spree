import { HeadContent } from "@tanstack/react-router"
import { MetaTags } from "./meta-tags"
import { OpenGraph } from "./open-graph"
import { StructuredData } from "./structured-data"
import { TwitterCard } from "./twitter-card"

interface SEOHeadProps {
  title?: string
  description?: string
  keywords?: string
  canonical?: string
  ogImage?: string
  twitterImage?: string
  structuredData?: {
    type?: "WebSite" | "Organization" | "WebPage" | "Article" | "Poll"
    pollData?: {
      question: string
      options: string[]
      totalVotes: number
    }
  }
}

export const SEOHead = ({
  title,
  description,
  keywords,
  canonical,
  ogImage,
  twitterImage,
  structuredData,
}: SEOHeadProps) => {
  return (
    // @ts-expect-error - HeadContent types are tricky
    <HeadContent>
      <MetaTags title={title} description={description} keywords={keywords} canonical={canonical} />
      <OpenGraph title={title} description={description} url={canonical} image={ogImage} />
      <TwitterCard title={title} description={description} image={twitterImage} />
      {structuredData && (
        <StructuredData type={structuredData.type} pollData={structuredData.pollData} />
      )}
    </HeadContent>
  )
}
