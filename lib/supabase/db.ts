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
    course_id: dbCourse.course_id,
    title: dbCourse.title,
    description: dbCourse.description || "",
    image: dbCourse.thumbnail_url || "/placeholder.svg",
    category: dbCourse.category,
    duration: dbCourse.duration,
    level: dbCourse.difficulty,
    price: dbCourse.price || 49.99,
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
  },

  /**
   * LMS Lessons & Watch Progress
   */
  async getCourseBySlug(supabase: SupabaseClient, slug: string): Promise<Course | null> {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('slug', slug)
        .single()

      if (error) throw error
      return mapDbCourseToFrontend(data)
    } catch (err) {
      console.warn(`Failed to fetch course by slug ${slug}:`, err)
      return mockCourses.find(c => c.id === slug) || null
    }
  },

  async getCourseLessons(supabase: SupabaseClient, courseId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true })

      if (error) throw error
      if (!data) return []

      return data.map((l: any) => ({
        lesson_id: l.lesson_id,
        course_id: l.course_id,
        title: l.title,
        video_url: l.video_external_id,
        duration: l.duration_minutes * 60, // Convert minutes to seconds for player
        is_preview: l.is_preview,
        order_index: l.order_index
      }))
    } catch (err) {
      console.warn(`Failed to fetch lessons for course ${courseId}:`, err)
      return []
    }
  },

  async getLessonProgress(supabase: SupabaseClient, userId: string, lessonId: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('student_id', userId)
        .eq('lesson_id', lessonId)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return data || null
    } catch (err) {
      console.warn(`Failed to fetch lesson progress for user ${userId} and lesson ${lessonId}:`, err)
      return null
    }
  },

  async updateLessonProgress(
    supabase: SupabaseClient,
    progress: { userId: string; courseId: string; lessonId: string; watchedSeconds: number; isCompleted: boolean }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log("db.updateLessonProgress: Triggering upsert with data:", progress)
      const { error } = await supabase
        .from('lesson_progress')
        .upsert({
          student_id: progress.userId,
          course_id: progress.courseId,
          lesson_id: progress.lessonId,
          watched_seconds: Math.floor(progress.watchedSeconds),
          is_completed: progress.isCompleted,
          completed_at: progress.isCompleted ? new Date().toISOString() : null,
          last_watched_at: new Date().toISOString()
        }, { onConflict: 'student_id,lesson_id' })

      if (error) {
        console.error("db.updateLessonProgress: Upsert failed:", error)
        throw error
      }
      console.log("db.updateLessonProgress: Upsert succeeded.")
      return { success: true }
    } catch (err: any) {
      console.error("Failed to update lesson progress:", err)
      return { success: false, error: err.message }
    }
  },

  async checkCourseAccess(supabase: SupabaseClient, userId: string, courseId: string): Promise<boolean> {
    try {
      // 0. Check if user belongs to bypass student list (for testing functionality before payments)
      const { data: { user } } = await supabase.auth.getUser()
      const bypassEmails = ['sengtri457@gmail.com', 'sengktri@gmail.com', 'test-student@example.com']
      if (user && bypassEmails.includes(user.email || '')) {
        // Automatically ensure they are enrolled in the course so database RLS doesn't block queries!
        try {
          const { data: existing } = await supabase
            .from('course_enrollments')
            .select('status')
            .eq('student_id', user.id)
            .eq('course_id', courseId)
            .single()

          if (!existing) {
            await supabase
              .from('course_enrollments')
              .insert({
                student_id: user.id,
                course_id: courseId,
                status: 'active'
              })
          }
        } catch (e) {
          console.warn("Bypass auto-enrollment failed:", e)
        }
        return true
      }

      // 1. Check if user is an admin or instructor (they always have access)
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()

      if (profile && (profile.role === 'admin' || profile.role === 'instructor')) {
        return true
      }

      // 2. Check if student has an active direct enrollment (direct purchase) for the course
      const { data: enrollment } = await supabase
        .from('course_enrollments')
        .select('status')
        .eq('student_id', userId)
        .eq('course_id', courseId)
        .maybeSingle()

      if (enrollment && enrollment.status === 'active') {
        return true
      }

      // 3. Check if student has an active subscription satisfying the course plan requirement
      const { data: courseData } = await supabase
        .from('courses')
        .select('required_plan_id, slug')
        .eq('course_id', courseId)
        .single()

      if (!courseData) return false
      
      // Determine required plan level with safety code fallbacks if DB is not fully populated
      let requiredPlanId = courseData.required_plan_id
      if (requiredPlanId === null || requiredPlanId === undefined) {
        if (courseData.slug === 'photoshop-masterclass') {
          requiredPlanId = 3 // Mentorship
        } else if (['d5-masterclass', 'enscape-masterclass', 'indesign-masterclass'].includes(courseData.slug || '')) {
          requiredPlanId = 2 // Student Pro
        }
      }
      
      // If the course requires a subscription plan level to unlock
      if (requiredPlanId !== null && requiredPlanId !== undefined) {
        const { data: subscription } = await supabase
          .from('user_subscriptions')
          .select('plan_id')
          .eq('user_id', userId)
          .eq('status', 'active')
          .maybeSingle()

        if (subscription) {
          // Hierarchical access: e.g. Mentorship (3) can access Student Pro (2) courses
          return subscription.plan_id >= requiredPlanId
        }
      }

      return false
    } catch (err) {
      console.warn(`Failed to check course access for user ${userId}:`, err)
      return false
    }
  },

  /**
   * Exercises & Submissions
   */
  async getLessonExercise(supabase: SupabaseClient, lessonId: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .eq('lesson_id', lessonId)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return data || null
    } catch (err) {
      console.warn(`Failed to fetch exercise for lesson ${lessonId}:`, err)
      return null
    }
  },

  async submitExercise(
    supabase: SupabaseClient,
    submission: { exerciseId: string; studentId: string; files: any[] }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('exercise_submissions')
        .insert({
          exercise_id: submission.exerciseId,
          student_id: submission.studentId,
          submission_files_json: submission.files,
          status: 'submitted'
        })

      if (error) throw error
      return { success: true }
    } catch (err: any) {
      console.error("Failed to submit exercise:", err)
      return { success: false, error: err.message }
    }
  }
}
