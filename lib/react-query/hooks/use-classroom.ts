import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { db } from "@/lib/supabase/db"
import { queryKeys } from "@/lib/react-query/query-keys"

export function useClassroomCourse(slug: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: queryKeys.classroom.course(slug),
    queryFn: () => db.getCourseBySlug(supabase, slug),
    staleTime: 10 * 60 * 1000,
  })
}

export function useClassroomLessons(courseId: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: queryKeys.classroom.lessons(courseId),
    queryFn: () => db.getCourseLessons(supabase, courseId),
    staleTime: 10 * 60 * 1000,
  })
}

export function useClassroomProgress(userId: string | undefined, courseId: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: queryKeys.classroom.progress(userId ?? "none", courseId),
    queryFn: async () => {
      if (!userId) return []
      const { data } = await supabase
        .from("lesson_progress")
        .select("lesson_id, is_completed, watched_seconds")
        .eq("student_id", userId)
        .eq("course_id", courseId)
      return data || []
    },
    enabled: !!userId && !!courseId,
    staleTime: 30 * 1000,
  })
}

export function useClassroomCertificate(userId: string | undefined, courseId: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: queryKeys.classroom.certificate(userId ?? "none", courseId),
    queryFn: async () => {
      if (!userId) return null
      const { data } = await supabase
        .from("certificates")
        .select("certificate_id")
        .eq("student_id", userId)
        .eq("course_id", courseId)
        .maybeSingle()
      return data
    },
    enabled: !!userId && !!courseId,
    staleTime: 30 * 1000,
  })
}

export function useVideoUrl(lessonId: string | undefined, hasAccess: boolean | null) {
  return useQuery({
    queryKey: queryKeys.classroom.video(lessonId ?? "none"),
    queryFn: async () => {
      if (!lessonId) return null
      const res = await fetch(`/api/lessons/${lessonId}/video`)
      if (!res.ok) return null
      return res.json() as Promise<{ source: string; format: string; url: string } | null>
    },
    enabled: !!lessonId && hasAccess === true,
    staleTime: 5 * 60 * 1000,
  })
}

export function useLessonExercise(lessonId: string | undefined) {
  const supabase = createClient()
  return useQuery({
    queryKey: queryKeys.classroom.exercise(lessonId ?? "none"),
    queryFn: async () => {
      if (!lessonId) return null
      return db.getLessonExercise(supabase, lessonId)
    },
    enabled: !!lessonId,
    staleTime: 10 * 60 * 1000,
  })
}

export function useClassroomAccess(userId: string | undefined, courseId: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: queryKeys.access.check(userId ?? "none", courseId),
    queryFn: () => db.checkCourseAccess(supabase, userId!, courseId),
    enabled: !!userId && !!courseId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useUpdateProgress() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (progress: { userId: string; courseId: string; lessonId: string; watchedSeconds: number; isCompleted: boolean }) =>
      db.updateLessonProgress(supabase, progress),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.classroom.progress(variables.userId, variables.courseId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.progress(variables.userId, variables.courseId) })
    },
  })
}

export function useSubmitExercise() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (submission: { exerciseId: string; studentId: string; files: any[] }) =>
      db.submitExercise(supabase, submission),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.classroom.submission(variables.studentId, variables.exerciseId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.labProgress(variables.studentId, variables.exerciseId) })
    },
  })
}

export function useLessonComments(lessonId: string | undefined) {
  const supabase = createClient()
  return useQuery({
    queryKey: queryKeys.classroom.comments(lessonId ?? "none"),
    queryFn: async () => {
      if (!lessonId) return []
      const { data, error } = await supabase
        .from("lesson_comments")
        .select("*, profiles:user_id(full_name, avatar_url, role)")
        .eq("lesson_id", lessonId)
        .order("created_at", { ascending: true })
      if (error) throw error
      return data || []
    },
    enabled: !!lessonId,
    staleTime: 5 * 1000,
  })
}

export function useAddComment() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { lessonId: string; userId: string; content: string; parentId?: string }) => {
      const { data, error } = await supabase
        .from("lesson_comments")
        .insert({
          lesson_id: payload.lessonId,
          user_id: payload.userId,
          content: payload.content,
          parent_id: payload.parentId || null
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.classroom.comments(variables.lessonId) })
    }
  })
}

export function useDeleteComment() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { commentId: string; lessonId: string }) => {
      const { error } = await supabase
        .from("lesson_comments")
        .delete()
        .eq("comment_id", payload.commentId)
      if (error) throw error
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.classroom.comments(variables.lessonId) })
    }
  })
}