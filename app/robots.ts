import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://archtipsbox.com").replace(/\/$/, "")

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/admin/", "/dashboard", "/dashboard/", "/checkout", "/account", "/api/"]
    },
    sitemap: `${base}/sitemap.xml`
  }
}
