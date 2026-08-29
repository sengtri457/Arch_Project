import { useQuery, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { queryKeys } from "@/lib/react-query/query-keys"

export function useAdminData(activeTab: string) {
  const supabase = createClient()
  const queryClient = useQueryClient()

  const profiles = useQuery({
    queryKey: queryKeys.admin.profiles,
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
      return data || []
    },
    staleTime: 2 * 60 * 1000,
    enabled: activeTab === "crm" || activeTab === "users" || activeTab === "overview",
  })

  const courses = useQuery({
    queryKey: queryKeys.admin.courses,
    queryFn: async () => {
      const { data } = await supabase.from('courses').select('*')
      return data || []
    },
    staleTime: 2 * 60 * 1000,
    enabled: activeTab === "courses" || activeTab === "overview" || activeTab === "submissions",
  })

  const projects = useQuery({
    queryKey: queryKeys.admin.projects,
    queryFn: async () => {
      const { data } = await supabase.from('projects').select('*')
      return data || []
    },
    staleTime: 2 * 60 * 1000,
    enabled: activeTab === "projects" || activeTab === "overview",
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
    enabled: activeTab === "inquiries",
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
    enabled: activeTab === "submissions",
  })

  const enrollments = useQuery({
    queryKey: queryKeys.admin.enrollments,
    queryFn: async () => {
      const { data } = await supabase.from('course_enrollments').select('*')
      return data || []
    },
    staleTime: 2 * 60 * 1000,
    enabled: activeTab === "overview" || activeTab === "analytics",
  })

  const progressLogs = useQuery({
    queryKey: queryKeys.admin.progressLogs,
    queryFn: async () => {
      const { data } = await supabase.from('lesson_progress').select('*')
      return data || []
    },
    staleTime: 2 * 60 * 1000,
    enabled: activeTab === "users" || activeTab === "analytics",
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
    enabled: activeTab === "courses",
  })

  const certificates = useQuery({
    queryKey: queryKeys.admin.certificates,
    queryFn: async () => {
      const { data } = await supabase.from('certificates').select('*')
      return data || []
    },
    staleTime: 2 * 60 * 1000,
    enabled: activeTab === "users",
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
    enabled: activeTab === "plans",
  })

  const promos = useQuery({
    queryKey: queryKeys.admin.promos,
    queryFn: async () => {
      const { data } = await supabase.from('promo_codes').select('*').order('created_at', { ascending: false })
      return data || []
    },
    staleTime: 2 * 60 * 1000,
    enabled: activeTab === "promos",
  })

  const pendingEnrollments = useQuery({
    queryKey: queryKeys.admin.pendingEnrollments,
    queryFn: async () => {
      const { data } = await supabase.from('pending_enrollments').select('*').order('created_at', { ascending: false })
      return data || []
    },
    staleTime: 2 * 60 * 1000,
    enabled: activeTab === "manual_access",
  })

  const testimonialsData = useQuery({
    queryKey: [...queryKeys.testimonials.all, "admin"],
    queryFn: async () => {
      const { data } = await supabase.from('testimonials').select('*').order('created_at', { ascending: false })
      return data || []
    },
    staleTime: 2 * 60 * 1000,
    enabled: activeTab === "testimonials",
  })

  const studentWork = useQuery({
    queryKey: queryKeys.admin.studentWork,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_work_posts')
        .select('*, ratings:student_work_ratings(rating)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data || []).map((post: any) => {
        const ratings = post.ratings || []
        const count = ratings.length
        const avg = count > 0 ? ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / count : 0
        return {
          ...post,
          average_rating: parseFloat(avg.toFixed(1)),
          ratings_count: count
        }
      })
    },
    staleTime: 2 * 60 * 1000,
    enabled: activeTab === "student-showcase" || activeTab === "overview",
  })

  const youtubeVideos = useQuery({
    queryKey: queryKeys.admin.youtubeVideos,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('youtube_videos')
        .select('*')
        .order('published_at', { ascending: false })
      if (error) throw error
      return data || []
    },
    staleTime: 2 * 60 * 1000,
    enabled: activeTab === "media" || activeTab === "overview",
  })

  const payments = useQuery({
    queryKey: queryKeys.admin.payments,
    queryFn: async () => {
      const { data } = await supabase
        .from('payment_transactions')
        .select(`
          *,
          profiles:user_id(full_name, email, avatar_url),
          courses:course_id(title),
          subscription_plans:plan_id(name)
        `)
        .order('created_at', { ascending: false })
      return data || []
    },
    staleTime: 2 * 60 * 1000,
    enabled: activeTab === "payments" || activeTab === "overview",
  })

  const allQueries = [
    profiles,
    courses,
    projects,
    messages,
    submissionsData,
    enrollments,
    progressLogs,
    lessons,
    certificates,
    plans,
    promos,
    testimonialsData,
    pendingEnrollments,
    studentWork,
    youtubeVideos,
    payments,
  ]

  const isLoading = allQueries.some((q) => q.isLoading)
  const isFetching = allQueries.some((q) => q.isFetching)

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
    pendingEnrollments: pendingEnrollments.data ?? [],
    studentWork: studentWork.data ?? [],
    youtubeVideos: youtubeVideos.data ?? [],
    payments: payments.data ?? [],
    isLoading,
    isFetching,
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] })
      queryClient.invalidateQueries({ queryKey: queryKeys.testimonials.all })
    },
  }
}