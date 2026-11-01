import type { MetadataRoute } from "next"
import { getSiteUrl } from "@/lib/seo"

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl()

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/dashboard",
          "/dashboard/",
          "/checkout",
          "/checkout/",
          "/account",
          "/account/",
          "/api/"
        ]
      },
      {
        userAgent: "Googlebot-Image",
        allow: ["/", "/projects/", "/assets/", "/_next/image*"],
        disallow: ["/admin/", "/dashboard/", "/account/"]
      }
    ],
    sitemap: `${base}/sitemap.xml`
  }
}
