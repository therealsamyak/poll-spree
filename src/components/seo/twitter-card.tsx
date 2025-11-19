interface TwitterCardProps {
  card?: string
  title?: string
  description?: string
  image?: string
  imageAlt?: string
  creator?: string
  site?: string
}

export const TwitterCard = ({
  card = "summary_large_image",
  title = "PollSpree - Vote on polls and see what others think!",
  description = "Join PollSpree to create and vote on polls. Discover what others think about trending topics and share your opinion with the community.",
  image = "/twitter-image.png",
  imageAlt = "PollSpree - Social polling platform",
  creator = "@pollspree",
  site = "@pollspree",
}: TwitterCardProps) => {
  return (
    <>
      <meta name="twitter:card" content={card} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:image:alt" content={imageAlt} />
      <meta name="twitter:creator" content={creator} />
      <meta name="twitter:site" content={site} />
    </>
  )
}
