import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"
import { SEOHead } from "@/components/seo"
import { UserPolls } from "@/components/user-polls"
import { generateUserSEOConfig } from "@/lib/seo"

const searchSchema = z.object({
  filter: z.string().optional(),
  sort: z.enum(["recent", "oldest", "most-voted", "least-voted"]).optional(),
})

const UserProfilePage = () => {
  const { username } = Route.useParams()
  const seoConfig = generateUserSEOConfig(username)

  return (
    <>
      <SEOHead
        title={seoConfig.title}
        description={seoConfig.description}
        keywords={seoConfig.keywords}
        canonical={seoConfig.canonical}
        structuredData={{
          type: "WebPage",
        }}
      />
      <UserPolls />
    </>
  )
}

export const Route = createFileRoute("/users/$username")({
  component: UserProfilePage,
  validateSearch: searchSchema,
})
