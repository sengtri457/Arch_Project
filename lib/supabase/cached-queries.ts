import { unstable_cache } from "next/cache"
import { createClient } from "./server"
import { db } from "./db"
import { Project } from "@/lib/projects-data"
import { Testimonial } from "@/lib/testimonials-data"

/**
 * Fetches featured projects with caching.
 * Revalidates every 1 hour (3600 seconds).
 */
export const getCachedFeaturedProjects = unstable_cache(
  async (limit: number = 8): Promise<Project[]> => {
    const supabase = await createClient()
    return db.getProjects(supabase, { featured: true, limit })
  },
  ["featured-projects"],
  {
    revalidate: 3600, // Cache for 1 hour
    tags: ["projects", "featured-projects"]
  }
)

/**
 * Fetches all testimonials with caching.
 * Revalidates every 1 hour (3600 seconds).
 */
export const getCachedTestimonials = unstable_cache(
  async (): Promise<Testimonial[]> => {
    const supabase = await createClient()
    return db.getTestimonials(supabase)
  },
  ["testimonials"],
  {
    revalidate: 3600, // Cache for 1 hour
    tags: ["testimonials"]
  }
)
