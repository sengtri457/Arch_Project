import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { db } from "@/lib/supabase/db"
import { queryKeys } from "@/lib/react-query/query-keys"

export function useEnrolledCourses(userId: string | undefined) {
  const supabase = createClient()
  return useQuery({
    queryKey: queryKeys.dashboard.enrolled(userId ?? "none"),
    queryFn: async () => {
      if (!userId) return []
      const allCourses = await db.getCourses(supabase)
      const accessChecks = await Promise.all(
        allCourses.map(async (course) => {
          const hasAccess = await db.checkCourseAccess(supabase, userId, course.course_id || course.id)
          return { course, hasAccess }
        })
      )
      return accessChecks.filter(c => c.hasAccess).map(c => c.course)
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useDashboardProgress(userId: string | undefined, courseIds: string[]) {
  const supabase = createClient()
  return useQuery({
    queryKey: queryKeys.dashboard.progress(userId ?? "none", courseIds.join(",")),
    queryFn: async () => {
      if (!userId || courseIds.length === 0) return { courseProgress: {}, labProgress: {} }

      const [allLessons, completedProgress, exRes, subRes] = await Promise.all([
        supabase.from('lessons').select('lesson_id, course_id'),
        supabase.from('lesson_progress').select('lesson_id, course_id').eq('student_id', userId).eq('is_completed', true),
        supabase.from('exercises').select('exercise_id, lesson_id').in('course_id', courseIds),
        supabase.from('exercise_submissions').select('exercise_id').eq('student_id', userId).eq('status', 'graded'),
      ])

      const gradedSet = new Set((subRes.data || []).map(s => s.exercise_id))
      const lessonToCourse: Record<string, string> = {}
      ;(allLessons.data || []).forEach(l => { lessonToCourse[l.lesson_id] = l.course_id })

      const courseProgress: Record<string, number> = {}
      const labProgress: Record<string, { graded: number; required: number }> = {}

      courseIds.forEach(id => {
        const courseLessons = (allLessons.data || []).filter(l => l.course_id === id)
        const completed = (completedProgress.data || []).filter(p => p.course_id === id)
        courseProgress[id] = courseLessons.length > 0
          ? Math.round((completed.length / courseLessons.length) * 100)
          : 0
        labProgress[id] = { graded: 0, required: 0 }
      })

      ;(exRes.data || []).forEach(ex => {
        const cid = lessonToCourse[ex.lesson_id]
        if (cid && labProgress[cid]) {
          labProgress[cid].required += 1
          if (gradedSet.has(ex.exercise_id)) labProgress[cid].graded += 1
        }
      })

      return { courseProgress, labProgress }
    },
    enabled: !!userId && courseIds.length > 0,
    staleTime: 30 * 1000,
  })
}

export function useDashboardStats(userId: string | undefined) {
  const supabase = createClient()
  return useQuery({
    queryKey: queryKeys.dashboard.stats(userId ?? "none"),
    queryFn: async () => {
      if (!userId) return { averageScore: null, gradedCount: 0, watchHours: 0 }

      const [gradedSubs, watchLogs] = await Promise.all([
        supabase.from('exercise_submissions').select('score').eq('student_id', userId).eq('status', 'graded'),
        supabase.from('lesson_progress').select('watched_seconds').eq('student_id', userId),
      ])

      const gradedData = gradedSubs.data || []
      const averageScore = gradedData.length > 0
        ? Math.round(gradedData.reduce((acc, curr) => acc + (curr.score || 0), 0) / gradedData.length)
        : null

      const totalSecs = (watchLogs.data || []).reduce((sum, item) => sum + (item.watched_seconds || 0), 0)

      return { averageScore, gradedCount: gradedData.length, watchHours: parseFloat((totalSecs / 3600).toFixed(1)) }
    },
    enabled: !!userId,
    staleTime: 30 * 1000,
  })
}

export function useSubscription(userId: string | undefined, userEmail?: string, role?: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: queryKeys.dashboard.subscription(userId ?? "none"),
    queryFn: async () => {
      if (!userId) return "Free Student"
      const { data: activeSub } = await supabase
        .from('user_subscriptions')
        .select('*, subscription_plans(name)')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle()
      if (activeSub?.subscription_plans) return (activeSub.subscription_plans as any).name || "Student Pro"
      if (role === 'instructor') return 'Instructor'
      const bypassEmails = (process.env.NEXT_PUBLIC_BYPASS_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
      if (userEmail && bypassEmails.includes(userEmail.toLowerCase())) return 'Student Pro (Bypass)'
      return 'Free Student'
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCertificates(userId: string | undefined) {
  const supabase = createClient()
  return useQuery({
    queryKey: queryKeys.dashboard.certificates(userId ?? "none"),
    queryFn: async () => {
      if (!userId) return []
      const { data } = await supabase.from('certificates').select('*, courses(title)').eq('student_id', userId)
      return data || []
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  })
}