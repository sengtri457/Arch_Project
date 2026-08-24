import type { MetadataRoute } from "next"
import { createClient } from "@supabase/supabase-js"
import { db } from "@/lib/supabase/db"

export const revalidate = 3600

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://archtipsbox.com").replace(/\/$/, "")
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl()

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/projects",
    "/courses",
    "/pricing",
    "/about",
    "/login",
    "/terms",
    "/privacy"
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.7
  }))

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const [projects, courses] = await Promise.all([
      db.getProjects(supabase),
      db.getCourses(supabase)
    ])

    const projectEntries: MetadataRoute.Sitemap = projects.map((p) => ({
      url: `${base}/projects/${p.id}`,
      changeFrequency: "monthly",
      priority: 0.8
    }))

    const courseEntries: MetadataRoute.Sitemap = courses.map((c) => ({
      url: `${base}/courses/${c.id}`,
      changeFrequency: "weekly",
      priority: 0.9
    }))

    return [...staticRoutes, ...projectEntries, ...courseEntries]
  } catch {
    return staticRoutes
  }
}
