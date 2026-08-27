import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { queryKeys } from "@/lib/react-query/query-keys"

export function useAdminData() {
  const supabase = createClient()

  const profiles = useQuery({
    queryKey: queryKeys.admin.profiles,
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
      return data || []
    },
    staleTime: 2 * 60 * 1000,
  })

  const courses = useQuery({
    queryKey: queryKeys.admin.courses,
    queryFn: async () => {
      const { data } = await supabase.from('courses').select('*')
      return data || []
    },
    staleTime: 2 * 60 * 1000,
  })

  const projects = useQuery({
    queryKey: queryKeys.admin.projects,
    queryFn: async () => {
      const { data } = await supabase.from('projects').select('*')
      return data || []
    },
    staleTime: 2 * 60 * 1000,
  })

  const messages = useQuery({
    queryKey: queryKeys.admin.messages,
    queryFn: async () => {
      const { data } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false })
      return data || []
    },
    staleTime: 2 * 60 * 1000,
  })

  const submissionsData = useQuery({
    queryKey: queryKeys.admin.submissions,
    queryFn: async () => {
      const { data } = await supabase
        .from('exercise_submissions')
        .select(`*, profiles:student_id(full_name, avatar_url), exercises:exercise_id(title, max_score)`)
        .order('submitted_at', { ascending: false })
      return data || []
    },
    staleTime: 2 * 60 * 1000,
  })

  const enrollments = useQuery({
    queryKey: queryKeys.admin.enrollments,
    queryFn: async () => {
      const { data } = await supabase.from('course_enrollments').select('*')
      return data || []
    },
    staleTime: 2 * 60 * 1000,
  })

  const progressLogs = useQuery({
    queryKey: queryKeys.admin.progressLogs,
    queryFn: async () => {
      const { data } = await supabase.from('lesson_progress').select('*')
      return data || []
    },
    staleTime: 2 * 60 * 1000,
  })

  const lessons = useQuery({
    queryKey: queryKeys.admin.adminLessons,
    queryFn: async () => {
      const res = await fetch('/api/admin/lessons')
      if (!res.ok) return []
      const json = await res.json()
      return json.lessons || []
    },
    staleTime: 2 * 60 * 1000,
  })

  const certificates = useQuery({
    queryKey: queryKeys.admin.certificates,
    queryFn: async () => {
      const { data } = await supabase.from('certificates').select('*')
      return data || []
    },
    staleTime: 2 * 60 * 1000,
  })

  const plans = useQuery({
    queryKey: queryKeys.admin.plans,
    queryFn: async () => {
      const { data } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('plan_id', { ascending: true })
      return data || []
    },
    staleTime: 5 * 60 * 1000,
  })

  const promos = useQuery({
    queryKey: queryKeys.admin.promos,
    queryFn: async () => {
      const { data } = await supabase.from('promo_codes').select('*').order('created_at', { ascending: false })
      return data || []
    },
    staleTime: 2 * 60 * 1000,
  })

  const testimonialsData = useQuery({
    queryKey: [...queryKeys.testimonials.all, "admin"],
    queryFn: async () => {
      const { data } = await supabase.from('testimonials').select('*').order('created_at', { ascending: false })
      return data || []
    },
    staleTime: 2 * 60 * 1000,
  })

  return {
    profiles: profiles.data ?? [],
    courses: courses.data ?? [],
    projects: projects.data ?? [],
    messages: messages.data ?? [],
    submissions: submissionsData.data ?? [],
    enrollments: enrollments.data ?? [],
    progressLogs: progressLogs.data ?? [],
    lessons: lessons.data ?? [],
    certificates: certificates.data ?? [],
    plans: plans.data ?? [],
    promos: promos.data ?? [],
    testimonials: testimonialsData.data ?? [],
    isLoading: profiles.isLoading || courses.isLoading || projects.isLoading,
    refetch: () => {
      profiles.refetch()
      courses.refetch()
      projects.refetch()
      messages.refetch()
      submissionsData.refetch()
      enrollments.refetch()
      progressLogs.refetch()
      lessons.refetch()
      certificates.refetch()
      plans.refetch()
      promos.refetch()
      testimonialsData.refetch()
    },
  }
}