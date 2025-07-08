import { query } from "./_generated/server"

export const generateSitemap = query({
  args: {},
  handler: async (ctx) => {
    const baseUrl = "https://pollspree.com" // Update this with your actual domain
    const currentTime = new Date().toISOString()

    // Get all users for dynamic user pages
    const users = await ctx.db.query("users").collect()

    // Get all polls for potential poll detail pages (if you add them later)
    const _polls = await ctx.db.query("polls").collect()

    // Start building the sitemap XML
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`

    // Add static pages
    sitemap += `
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${currentTime}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`

    // Add user profile pages
    for (const user of users) {
      const lastmod = new Date(user.createdAt).toISOString()
      sitemap += `
  <url>
    <loc>${baseUrl}/users/${encodeURIComponent(user.username)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
    }

    // Add poll detail pages (if you implement them later)
    // for (const poll of polls) {
    //   const lastmod = new Date(poll.createdAt).toISOString()
    //   sitemap += `
    //   <url>
    //     <loc>${baseUrl}/polls/${poll._id}</loc>
    //     <lastmod>${lastmod}</lastmod>
    //     <changefreq>daily</changefreq>
    //     <priority>0.7</priority>
    //   </url>`
    // }

    sitemap += `
</urlset>`

    return sitemap
  },
})

// Function to get sitemap statistics for monitoring
export const getSitemapStats = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect()
    const polls = await ctx.db.query("polls").collect()

    return {
      totalUsers: users.length,
      totalPolls: polls.length,
      totalUrls: 1 + users.length, // 1 for homepage + user pages
      lastGenerated: new Date().toISOString(),
    }
  },
})
