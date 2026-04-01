import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/sitemap/xml")({
  loader: async () => {
    const baseUrl = "https://pollspree.com"
    const currentTime = new Date().toISOString()

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${currentTime}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/users/</loc>
    <lastmod>${currentTime}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/polls/</loc>
    <lastmod>${currentTime}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>`

    return new Response(sitemap, {
      headers: { "Content-Type": "application/xml" },
    })
  },
})
