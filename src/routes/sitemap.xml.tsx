import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"

export const SitemapXml = () => {
  const sitemap = useQuery(api.sitemap.generateSitemap)

  if (!sitemap) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-primary border-b-2" />
          <p className="text-muted-foreground">Generating sitemap...</p>
        </div>
      </div>
    )
  }

  // Return the XML content with proper headers
  return <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{sitemap}</pre>
}

// This component will be rendered as XML, so we need to handle the response properly
export const loader = async () => {
  // This is a fallback in case the component doesn't render properly
  return new Response("", {
    status: 200,
    headers: {
      "Content-Type": "application/xml",
    },
  })
}

export const Route = createFileRoute("/sitemap/xml")({
  component: SitemapXml,
})
