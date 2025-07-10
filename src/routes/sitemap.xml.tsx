import { createFileRoute } from "@tanstack/react-router"

export const SitemapXml = () => {
  const baseUrl = "https://pollspree.com"
  const currentTime = new Date().toISOString()

  // Generate sitemap based on existing routes
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Homepage -->
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${currentTime}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  
  <!-- User profile pages - these will be discovered by search engines -->
  <url>
    <loc>${baseUrl}/users/</loc>
    <lastmod>${currentTime}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  
  <!-- Poll detail pages - these will be discovered by search engines -->
  <url>
    <loc>${baseUrl}/polls/</loc>
    <lastmod>${currentTime}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>`

  // Return the XML content with proper headers
  return <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{sitemap}</pre>
}

// This component will be rendered as XML
export const Route = createFileRoute("/sitemap/xml")({
  component: SitemapXml,
})
