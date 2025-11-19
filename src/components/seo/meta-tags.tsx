interface MetaTagsProps {
  title?: string
  description?: string
  keywords?: string
  author?: string
  robots?: string
  canonical?: string
  language?: string
  charset?: string
}

export const MetaTags = ({
  title = "PollSpree - Vote on polls and see what others think!",
  description = "Join PollSpree to create and vote on polls. Discover what others think about trending topics and share your opinion with the community.",
  keywords = "polls, voting, surveys, community, opinions, trending topics, social media polls",
  author = "PollSpree",
  robots = "index, follow",
  canonical,
  language = "en",
  charset = "UTF-8",
}: MetaTagsProps) => {
  return (
    <>
      <meta charSet={charset} />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author} />
      <meta name="robots" content={robots} />
      {canonical && <link rel="canonical" href={canonical} />}
      <meta httpEquiv="Content-Language" content={language} />
      <meta name="theme-color" content="#000000" />
      <meta name="color-scheme" content="dark light" />
    </>
  )
}
