import type { MetadataRoute } from "next"
import { createClient } from "@supabase/supabase-js"
import { db } from "@/lib/supabase/db"
import { getSiteUrl } from "@/lib/seo"

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl()
  const now = new Date()

  // Primary public marketing & discovery pages
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}`, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${base}/courses`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/projects`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/student-work`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/media`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/pricing`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 }
  ]

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const [projects, courses, studentWorks] = await Promise.all([
      db.getProjects(supabase).catch(() => []),
      db.getCourses(supabase).catch(() => []),
      db.getStudentWorkPosts(supabase, { onlyPublished: true }).catch(() => [])
    ])

    const projectEntries: MetadataRoute.Sitemap = projects
      .filter((p) => p && (p.id || (p as any).slug))
      .map((p) => ({
        url: `${base}/projects/${p.id || (p as any).slug}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.85
      }))

    const courseEntries: MetadataRoute.Sitemap = courses
      .filter((c) => c && (c.slug || c.id))
      .map((c) => ({
        url: `${base}/courses/${c.slug || c.id}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.9
      }))

    const studentWorkEntries: MetadataRoute.Sitemap = (studentWorks || [])
      .filter((sw) => sw && sw.slug)
      .map((sw) => ({
        url: `${base}/student-work/${sw.slug}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.75
      }))

    return [...staticRoutes, ...courseEntries, ...projectEntries, ...studentWorkEntries]
  } catch (error) {
    console.error("Failed to generate dynamic sitemap entries:", error)
    return staticRoutes
  }
}
