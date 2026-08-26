import { unstable_cache } from "next/cache"
import { createClient } from "@supabase/supabase-js"
import { db } from "./db"
import { Project } from "@/lib/projects-data"
import { Testimonial } from "@/lib/testimonials-data"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Safe, static client that does not touch cookies() or headers().
// Perfect for static prerendering / unstable_cache.
const staticClient = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Fetches featured projects with caching.
 * Revalidates every 1 hour (3600 seconds).
 */
export const getCachedFeaturedProjects = unstable_cache(
  async (limit: number = 8): Promise<Project[]> => {
    return db.getProjects(staticClient, { featured: true, limit })
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
    return db.getTestimonials(staticClient)
  },
  ["testimonials"],
  {
    revalidate: 3600, // Cache for 1 hour
    tags: ["testimonials"]
  }
)
