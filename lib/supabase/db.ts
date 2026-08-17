import { SupabaseClient } from '@supabase/supabase-js'
import { Project } from '@/lib/projects-data'
import { Course } from '@/lib/courses-data'
import { Testimonial } from '@/lib/testimonials-data'

// Mock fallbacks to ensure frontend keeps running if Supabase is offline or unseeded
import { projects as mockProjects } from '@/lib/projects-data'
import { courses as mockCourses } from '@/lib/courses-data'
import { testimonials as mockTestimonials } from '@/lib/testimonials-data'

/**
 * Maps database project object with nested joins to the frontend Project type.
 */
export function mapDbProjectToFrontend(dbProj: any): Project {
  const details = dbProj.project_details || {}

  const gallery = {
    exterior: [] as string[],
    interior: [] as string[],
    details: [] as string[],
    aerial: [] as string[]
  }

  if (dbProj.project_gallery && Array.isArray(dbProj.project_gallery)) {
    dbProj.project_gallery.forEach((g: any) => {
      const type = g.gallery_type as keyof typeof gallery
      if (gallery[type]) {
        gallery[type].push(g.image_url)
      }
    })
  }

  const videos = dbProj.project_videos && Array.isArray(dbProj.project_videos)
    ? dbProj.project_videos.map((v: any) => v.video_url)
    : []

  const testimonial = dbProj.project_testimonials
    ? {
        quote: dbProj.project_testimonials.quote,
        author: dbProj.project_testimonials.author,
        role: dbProj.project_testimonials.role
      }
    : undefined

  return {
    id: dbProj.slug,
    title: dbProj.title,
    category: dbProj.category,
    description: dbProj.description || "",
    image: dbProj.cover_image_url,
    year: dbProj.year,
    location: dbProj.location,
    price: dbProj.price,
    details: {
      client: details.client || "",
      scope: details.scope || "",
      software: Array.isArray(details.software) ? details.software : [],
      duration: details.duration || "",
      area: details.area || undefined,
      bedrooms: details.bedrooms || undefined,
      bathrooms: details.bathrooms || undefined,
      floors: details.floors || undefined,
      features: Array.isArray(details.features) ? details.features : [],
      challenges: Array.isArray(details.challenges) ? details.challenges : [],
      solutions: Array.isArray(details.solutions) ? details.solutions : []
    },
    images: dbProj.project_gallery && Array.isArray(dbProj.project_gallery)
      ? dbProj.project_gallery.map((g: any) => g.image_url)
      : [],
    gallery,
    videos: videos.length > 0 ? videos : undefined,
    testimonials: testimonial
  }
}

/**
 * Maps database course object to the frontend Course type.
 */
export function mapDbCourseToFrontend(dbCourse: any): Course {
  return {
    id: dbCourse.slug,
    title: dbCourse.title,
    description: dbCourse.description || "",
    image: dbCourse.thumbnail_url || "/placeholder.svg",
    category: dbCourse.category,
    duration: dbCourse.duration,
    level: dbCourse.difficulty,
    price: dbCourse.price,
    features: Array.isArray(dbCourse.features) ? dbCourse.features : [],
    instructor: dbCourse.instructor || "Bun Sambath",
    students: dbCourse.students || 0,
    lessons: dbCourse.lessons || 0
  }
}

/**
 * Database Fetch & Query helper functions
 */
export const db = {
  /**
   * Projects
   */
  async getProjects(
    supabase: SupabaseClient,
    filters?: { category?: string; featured?: boolean; limit?: number }
  ): Promise<Project[]> {
    try {
      let query = supabase
        .from('projects')
        .select(`
          *,
          project_gallery(image_url, gallery_type),
          project_details(software, features, challenges, solutions, client, scope, duration, area, bedrooms, bathrooms, floors),
          project_videos(video_url),
          project_testimonials(quote, author, role)
        `)
        .eq('is_published', true)

      if (filters?.category && filters.category !== 'All') {
        query = query.ilike('category', filters.category)
      }
      if (filters?.featured !== undefined) {
        query = query.eq('is_featured', filters.featured)
      }
      if (filters?.limit) {
        query = query.limit(filters.limit)
      }

      const { data, error } = await query

      if (error) throw error
      if (!data || data.length === 0) return mockProjects

      return data.map(mapDbProjectToFrontend)
    } catch (err) {
      console.warn("Failed to fetch projects from Supabase, falling back to mock data:", err)
      return mockProjects
    }
  },

  async getProjectBySlug(supabase: SupabaseClient, slug: string): Promise<Project | null> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          project_gallery(image_url, gallery_type),
          project_details(software, features, challenges, solutions, client, scope, duration, area, bedrooms, bathrooms, floors),
          project_videos(video_url),
          project_testimonials(quote, author, role)
        `)
        .eq('slug', slug)
        .eq('is_published', true)
        .single()

      if (error) throw error
      if (!data) return mockProjects.find(p => p.id === slug) || null

      return mapDbProjectToFrontend(data)
    } catch (err) {
      console.warn(`Failed to fetch project ${slug} from Supabase, falling back to mock data:`, err)
      return mockProjects.find(p => p.id === slug) || null
    }
  },

  /**
   * Courses
   */
  async getCourses(supabase: SupabaseClient, category?: string): Promise<Course[]> {
    try {
      let query = supabase.from('courses').select('*').eq('is_published', true)

      if (category && category !== 'All') {
        query = query.ilike('category', category)
      }

      const { data, error } = await query

      if (error) throw error
      if (!data || data.length === 0) return mockCourses

      return data.map(mapDbCourseToFrontend)
    } catch (err) {
      console.warn("Failed to fetch courses from Supabase, falling back to mock data:", err)
      return mockCourses
    }
  },

  /**
   * Testimonials
   */
  async getTestimonials(supabase: SupabaseClient): Promise<Testimonial[]> {
    try {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      if (!data || data.length === 0) return mockTestimonials

      return data.map((t: any) => ({
        id: t.id,
        name: t.name,
        role: t.role,
        organization: t.organization,
        text: t.text
      }))
    } catch (err) {
      console.warn("Failed to fetch testimonials from Supabase, falling back to mock data:", err)
      return mockTestimonials
    }
  },

  /**
   * Contact Inquiry Form Submissions
   */
  async submitContactMessage(
    supabase: SupabaseClient,
    message: { name: string; email: string; company?: string; message: string }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('contact_messages')
        .insert({
          name: message.name,
          email: message.email,
          company: message.company || null,
          message: message.message
        })

      if (error) throw error
      return { success: true }
    } catch (err: any) {
      console.error("Failed to insert contact message in database:", err)
      return { success: false, error: err.message || "Database write error" }
    }
  }
}
