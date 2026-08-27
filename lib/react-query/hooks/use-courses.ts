import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { db } from "@/lib/supabase/db"
import { queryKeys } from "@/lib/react-query/query-keys"

export function useCourses(category?: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: queryKeys.courses.list(category),
    queryFn: () => db.getCourses(supabase, category),
    staleTime: 5 * 60 * 1000,
  })
}

export function useCourseAccessMap() {
  const supabase = createClient()
  return useQuery({
    queryKey: queryKeys.access.map("current"),
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return {} as Record<string, boolean>
      const courses = await db.getCourses(supabase)
      return db.getUserCourseAccessMap(supabase, user.id, courses)
    },
    staleTime: 5 * 60 * 1000,
    retry: 0,
  })
}

export function useCourseBySlug(slug: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: queryKeys.courses.detail(slug),
    queryFn: () => db.getCourseBySlug(supabase, slug),
    staleTime: 10 * 60 * 1000,
  })
}

export function useCourseLessons(courseId: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: queryKeys.courses.lessons(courseId),
    queryFn: () => db.getCourseLessons(supabase, courseId),
    staleTime: 10 * 60 * 1000,
  })
}

export function useCheckCourseAccess(userId: string | undefined, courseId: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: queryKeys.access.check(userId ?? "none", courseId),
    queryFn: () => db.checkCourseAccess(supabase, userId!, courseId),
    enabled: !!userId && !!courseId,
    staleTime: 5 * 60 * 1000,
  })
}