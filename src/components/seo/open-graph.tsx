interface OpenGraphProps {
  title?: string
  description?: string
  url?: string
  image?: string
  imageWidth?: number
  imageHeight?: number
  imageAlt?: string
  type?: string
  siteName?: string
  locale?: string
}

export const OpenGraph = ({
  title = "PollSpree - Vote on polls and see what others think!",
  description = "Join PollSpree to create and vote on polls. Discover what others think about trending topics and share your opinion with the community.",
  url,
  image = "/og-image.png",
  imageWidth = 1200,
  imageHeight = 630,
  imageAlt = "PollSpree - Social polling platform",
  type = "website",
  siteName = "PollSpree",
  locale = "en_US",
}: OpenGraphProps) => {
  return (
    <>
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content={locale} />
      {url && <meta property="og:url" content={url} />}
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content={imageWidth.toString()} />
      <meta property="og:image:height" content={imageHeight.toString()} />
      <meta property="og:image:alt" content={imageAlt} />
    </>
  )
}
