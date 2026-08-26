"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { createClient } from "@/lib/supabase/client"
import { Profile } from "@/components/auth-provider"
import { Course } from "@/lib/courses-data"
import { Project } from "@/lib/projects-data"
import { getMediaUrl } from "@/lib/utils"
import Swal from "sweetalert2"

const MySwal = Swal.mixin({
  background: '#060010',
  color: '#fff',
  confirmButtonColor: '#9ACD32',
  cancelButtonColor: '#27272a',
  customClass: {
    popup: 'border border-zinc-800 rounded-2xl shadow-2xl font-sans text-white bg-zinc-950',
    title: 'text-white font-bold',
    htmlContainer: 'text-zinc-300',
    confirmButton: 'px-5 py-2.5 rounded-xl font-semibold text-black hover:opacity-90 transition-opacity',
    cancelButton: 'px-5 py-2.5 rounded-xl font-semibold hover:bg-zinc-800 transition-colors'
  },
  buttonsStyling: true
})

type AdminCourseRow = Course & {
  thumbnail_url?: string | null
  difficulty?: string | null
  software_used?: string | null
  slug?: string | null
  instructor?: string | null
  category?: string | null
  required_plan_id?: number | null
  is_published?: boolean | null
}

type AdminProjectRow = Project & {
  cover_image_url?: string | null
  slug?: string | null
  software_used?: string | null
  software?: string | null
  is_featured?: boolean | null
  client?: string | null
  scope?: string | null
  features_json?: string[] | null
  challenges_json?: string[] | null
  solutions_json?: string[] | null
}

type AdminProfileRow = Profile & {
  email?: string | null
}
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { 
  Users, 
  BookOpen, 
  FolderGit, 
  ShieldAlert, 
  Settings, 
  UserPlus, 
  Plus, 
  Trash2, 
  Edit3, 
  Loader2, 
  TrendingUp, 
  FileText,
  Lock,
  Globe,
  Award,
  Tag,
  Quote,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  LogOut
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from "recharts"

type AdminTab = "overview" | "crm" | "courses" | "projects" | "submissions" | "inquiries" | "analytics" | "plans" | "promos" | "testimonials" | "users"

export default function AdminDashboard() {
  const { user, profile, loading, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState<AdminTab>("overview")

  useEffect(() => {
    const tabParam = new URLSearchParams(window.location.search).get("tab")
    const validTabs: AdminTab[] = ["overview", "analytics", "courses", "projects", "submissions", "crm", "plans", "promos", "testimonials", "inquiries", "users"]
    if (tabParam && validTabs.includes(tabParam as AdminTab)) {
      setActiveTab(tabParam as AdminTab)
    }
  }, [])
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false)
  const [profiles, setProfiles] = useState<AdminProfileRow[]>([])
  const [courses, setCourses] = useState<AdminCourseRow[]>([])
  const [projects, setProjects] = useState<AdminProjectRow[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [submissions, setSubmissions] = useState<any[]>([])
  const [submissionFilter, setSubmissionFilter] = useState<"pending" | "graded" | "all">("pending")
  const [submissionSearch, setSubmissionSearch] = useState("")
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [progressLogs, setProgressLogs] = useState<any[]>([])
  const [lessons, setLessons] = useState<any[]>([])
  const [selectedStudent, setSelectedStudent] = useState<Profile | null>(null)
  const [certificates, setCertificates] = useState<any[]>([])
  
  // Plans & Pricing CRUD states
  const [plans, setPlans] = useState<any[]>([])
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null)
  const [editPlanName, setEditPlanName] = useState<string>("")
  const [editPlanCode, setEditPlanCode] = useState<string>("")
  const [editPlanPrice, setEditPlanPrice] = useState<string>("")
  const [editPlanInterval, setEditPlanInterval] = useState<string>("monthly")
  const [editPlanActive, setEditPlanActive] = useState<boolean>(true)
  const [isSavingPlan, setIsSavingPlan] = useState<boolean>(false)
  const [showPlanModal, setShowPlanModal] = useState<boolean>(false)
  const [planForm, setPlanForm] = useState({
    name: "",
    code: "",
    price: "19.99",
    interval: "monthly",
    is_active: true
  })

  // Promo Codes CRUD States
  const [promos, setPromos] = useState<any[]>([])
  const [showPromoModal, setShowPromoModal] = useState<boolean>(false)
  const [promoForm, setPromoForm] = useState({
    code: "",
    type: "percentage",
    value: "10.00",
    max: "",
    expiry: "",
    is_active: true
  })

  // Testimonials CRUD States
  const [testimonials, setTestimonials] = useState<any[]>([])
  const [showTestimonialModal, setShowTestimonialModal] = useState<boolean>(false)
  const [editingTestimonialId, setEditingTestimonialId] = useState<string | null>(null)
  const [testimonialForm, setTestimonialForm] = useState({
    name: "",
    role: "",
    organization: "",
    text: ""
  })
  
  // Courses CRUD States
  const [showCourseModal, setShowCourseModal] = useState(false)
  const [editingCourse, setEditingCourse] = useState<any | null>(null)
  const [courseForm, setCourseForm] = useState({
    title: "",
    slug: "",
    description: "",
    image: "",
    category: "",
    duration: "",
    level: "",
    price: "49.99",
    instructor: "",
    courseCategory: "",
    requiredPlanId: "",
    published: true
  })

  // Syllabus Lessons CRUD States
  const [showSyllabusModal, setShowSyllabusModal] = useState(false)
  const [activeSyllabusCourse, setActiveSyllabusCourse] = useState<any | null>(null)
  const [showLessonModal, setShowLessonModal] = useState(false)
  const [editingLesson, setEditingLesson] = useState<any | null>(null)
  const [lessonForm, setLessonForm] = useState({
    title: "",
    video_url: "",
    duration: "600",
    index: "1",
    source: "direct",
    downloadable_asset_url: ""
  })

  // Projects CRUD States
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [editingProject, setEditingProject] = useState<any | null>(null)
  const [projectForm, setProjectForm] = useState({
    title: "",
    slug: "",
    description: "",
    image: "",
    category: "",
    software: "",
    is_featured: false,
    year: "",
    location: "",
    price: "",
    client: "",
    scope: "",
    features: "",
    challenges: "",
    solutions: ""
  })
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingLessonAsset, setUploadingLessonAsset] = useState(false)

  const [loadingData, setLoadingData] = useState(true)
  
  const router = useRouter()
  const supabase = createClient()

  // Guard routing client-side (as backup to server middleware)
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login")
      } else if (profile?.role !== 'admin') {
        router.push("/")
      }
    }
  }, [user, profile, loading, router])

  // Load CRM, courses, and projects data
  useEffect(() => {
    if (!user || profile?.role !== 'admin') return

    async function loadAdminData() {
      try {
        setLoadingData(true)
        
        // 1. Fetch profiles
        const { data: profilesData, error: profilesErr } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })
        if (!profilesErr && profilesData) setProfiles(profilesData as Profile[])

        // 2. Fetch courses
        const { data: coursesData } = await supabase
          .from('courses')
          .select('*')
        if (coursesData) setCourses(coursesData as Course[])

        // 3. Fetch projects
        const { data: projectsData } = await supabase
          .from('projects')
          .select('*')
        if (projectsData) setProjects(projectsData as Project[])
        
        // 4. Fetch contact messages
        const { data: messagesData, error: messagesErr } = await supabase
          .from('contact_messages')
          .select('*')
          .order('created_at', { ascending: false })
        if (!messagesErr && messagesData) setMessages(messagesData)
        
        // 5. Fetch student exercise submissions
        const { data: subData, error: subErr } = await supabase
          .from('exercise_submissions')
          .select(`
            *,
            profiles:student_id(full_name, avatar_url),
            exercises:exercise_id(title, max_score)
          `)
          .order('submitted_at', { ascending: false })
        if (!subErr && subData) setSubmissions(subData)

        // 6. Fetch enrollments
        const { data: enrollData } = await supabase
          .from('course_enrollments')
          .select('*')
        if (enrollData) setEnrollments(enrollData)

        // 7. Fetch progress logs
        const { data: progressData } = await supabase
          .from('lesson_progress')
          .select('*')
        if (progressData) setProgressLogs(progressData)

        // 8. Fetch all lessons (video URLs are locked down - served via admin API)
        const lessonsRes = await fetch('/api/admin/lessons')
        if (lessonsRes.ok) {
          const lessonsJson = await lessonsRes.json()
          setLessons(lessonsJson.lessons || [])
        }

        // 9. Fetch all certificates
        const { data: certsData } = await supabase
          .from('certificates')
          .select('*')
        if (certsData) setCertificates(certsData)

        // 10. Fetch subscription plans
        const { data: plansData } = await supabase
          .from('subscription_plans')
          .select('*')
          .order('plan_id', { ascending: true })
        if (plansData) setPlans(plansData)

        // 11. Fetch promo codes
        const { data: promosData } = await supabase
          .from('promo_codes')
          .select('*')
          .order('created_at', { ascending: false })
        if (promosData) setPromos(promosData)

        // 12. Fetch testimonials (homepage carousel content)
        const { data: testimonialsData } = await supabase
          .from('testimonials')
          .select('*')
          .order('created_at', { ascending: false })
        if (testimonialsData) setTestimonials(testimonialsData)
        
      } catch (err) {
        console.error("Admin data loading error:", err)
      } finally {
        setLoadingData(false)
      }
    }
    loadAdminData()
  }, [user, profile])

  // Filtered submissions for the Submissions tab
  const filteredSubmissions = submissions.filter((sub: any) => {
    if (submissionFilter === "pending" && sub.status === "graded") return false
    if (submissionFilter === "graded" && sub.status !== "graded") return false
    const name = (sub.profiles?.full_name || "").toLowerCase()
    const q = submissionSearch.trim().toLowerCase()
    if (q && !name.includes(q)) return false
    return true
  })

  // Promoting a user role to Admin or Instructor
  const handleUpdateRole = async (targetUserId: string, newRole: 'student' | 'instructor' | 'admin') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', targetUserId)

      if (error) throw error
      
      // Update local state
      setProfiles(prev => prev.map(p => p.id === targetUserId ? { ...p, role: newRole } : p))
      MySwal.fire({ icon: 'success', title: 'Updated!', text: `User role successfully updated to ${newRole}!` })
    } catch (err: any) {
      MySwal.fire({ icon: 'error', title: 'Error', text: `Failed to update user role: ${err.message}` })
    }
  }

  // Grading a student submission
  const handleGradeSubmission = async (
    submissionId: string, 
    score: number, 
    feedback: string
  ) => {
    try {
      const { error } = await supabase
        .from('exercise_submissions')
        .update({
          status: 'graded',
          score,
          instructor_feedback: feedback,
          reviewed_at: new Date().toISOString()
        })
        .eq('submission_id', submissionId)

      if (error) throw error

      setSubmissions(prev => prev.map(s => 
        s.submission_id === submissionId 
          ? { ...s, status: 'graded', score, instructor_feedback: feedback } 
          : s
      ))
      MySwal.fire({ icon: 'success', title: 'Graded!', text: "Submission successfully graded!" })
    } catch (err: any) {
      MySwal.fire({ icon: 'error', title: 'Error', text: `Failed to grade submission: ${err.message}` })
    }
  }

  // 1. Save Pricing Plan
  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPlan) return
    try {
      setIsSavingPlan(true)
      const { error } = await supabase
        .from('subscription_plans')
        .update({
          name: editPlanName,
          plan_code: editPlanCode.toUpperCase().trim(),
          price_usd: parseFloat(editPlanPrice),
          billing_interval: editPlanInterval,
          is_active: editPlanActive
        })
        .eq('plan_id', selectedPlan.plan_id)

      if (error) throw error
      
      setPlans(prev => prev.map(p => p.plan_id === selectedPlan.plan_id ? { 
        ...p, 
        name: editPlanName, 
        plan_code: editPlanCode.toUpperCase().trim(), 
        price_usd: parseFloat(editPlanPrice),
        billing_interval: editPlanInterval,
        is_active: editPlanActive
      } : p))
      setSelectedPlan(null)
      MySwal.fire({ icon: 'success', title: 'Saved!', text: "Plan details saved successfully!" })
    } catch (err: any) {
      MySwal.fire({ icon: 'error', title: 'Error', text: `Failed to save plan: ${err.message}` })
    } finally {
      setIsSavingPlan(false)
    }
  }

  // 1b. Create Plan
  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { error } = await supabase
        .from('subscription_plans')
        .insert({
          name: planForm.name,
          plan_code: planForm.code.toUpperCase().trim(),
          price_usd: parseFloat(planForm.price),
          billing_interval: planForm.interval,
          is_active: planForm.is_active
        })
      if (error) throw error
      await MySwal.fire({ icon: 'success', title: 'Created!', text: "Plan created successfully!" })
      setShowPlanModal(false)
      window.location.reload()
    } catch (err: any) {
      MySwal.fire({ icon: 'error', title: 'Error', text: `Failed to create plan: ${err.message}` })
    }
  }

  // 1c. Delete Plan
  const handleDeletePlan = async (planId: number) => {
    const result = await MySwal.fire({
      title: 'Delete Plan?',
      text: 'Are you sure you want to delete this pricing plan? Existing user subscriptions may be affected!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'No, cancel'
    })
    
    if (!result.isConfirmed) return

    try {
      const { error } = await supabase
        .from('subscription_plans')
        .delete()
        .eq('plan_id', planId)
      if (error) throw error
      await MySwal.fire({ icon: 'success', title: 'Deleted!', text: "Plan deleted successfully!" })
      window.location.reload()
    } catch (err: any) {
      MySwal.fire({ icon: 'error', title: 'Error', text: `Failed to delete plan: ${err.message}` })
    }
  }

  // 1d. Create Promo Code
  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const maxVal = promoForm.max.trim() ? parseInt(promoForm.max) : null
      const expiryVal = promoForm.expiry.trim() ? new Date(promoForm.expiry).toISOString() : null

      const { error } = await supabase
        .from('promo_codes')
        .insert({
          code: promoForm.code.toUpperCase().trim(),
          discount_type: promoForm.type,
          discount_value: parseFloat(promoForm.value),
          max_redemptions: maxVal,
          expires_at: expiryVal,
          is_active: promoForm.is_active
        })
      if (error) throw error
      await MySwal.fire({ icon: 'success', title: 'Created!', text: "Promo code created successfully!" })
      setShowPromoModal(false)
      window.location.reload()
    } catch (err: any) {
      MySwal.fire({ icon: 'error', title: 'Error', text: `Failed to create promo code: ${err.message}` })
    }
  }

  // 1e. Delete Promo Code
  const handleDeletePromo = async (code: string) => {
    const result = await MySwal.fire({
      title: 'Delete Promo Code?',
      text: `Are you sure you want to delete promo code ${code}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'No, cancel'
    })

    if (!result.isConfirmed) return

    try {
      const { error } = await supabase
        .from('promo_codes')
        .delete()
        .eq('code', code)
      if (error) throw error
      await MySwal.fire({ icon: 'success', title: 'Deleted!', text: "Promo code deleted successfully!" })
      window.location.reload()
    } catch (err: any) {
      MySwal.fire({ icon: 'error', title: 'Error', text: `Failed to delete promo code: ${err.message}` })
    }
  }

  // Testimonials CRUD (homepage carousel - RLS already authorizes admin writes)
  const handleSaveTestimonial = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = {
        name: testimonialForm.name.trim(),
        role: testimonialForm.role.trim(),
        organization: testimonialForm.organization.trim(),
        text: testimonialForm.text.trim()
      }
      if (!payload.name || !payload.role || !payload.organization || !payload.text) {
        MySwal.fire({ icon: 'warning', title: 'Required Fields', text: "All fields are required." })
        return
      }

      if (editingTestimonialId) {
        const { error } = await supabase
          .from('testimonials')
          .update(payload)
          .eq('id', editingTestimonialId)
        if (error) throw error
        await MySwal.fire({ icon: 'success', title: 'Updated!', text: "Testimonial updated successfully!" })
      } else {
        const { error } = await supabase
          .from('testimonials')
          .insert(payload)
        if (error) throw error
        await MySwal.fire({ icon: 'success', title: 'Created!', text: "Testimonial created successfully!" })
      }
      setShowTestimonialModal(false)
      window.location.reload()
    } catch (err: any) {
      MySwal.fire({ icon: 'error', title: 'Error', text: `Failed to save testimonial: ${err.message}` })
    }
  }

  const handleDeleteTestimonial = async (id: string, name: string) => {
    const result = await MySwal.fire({
      title: 'Delete Testimonial?',
      text: `Are you sure you want to delete the testimonial from ${name}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'No, cancel'
    })

    if (!result.isConfirmed) return

    try {
      const { error } = await supabase
        .from('testimonials')
        .delete()
        .eq('id', id)
      if (error) throw error
      await MySwal.fire({ icon: 'success', title: 'Deleted!', text: "Testimonial deleted successfully!" })
      window.location.reload()
    } catch (err: any) {
      MySwal.fire({ icon: 'error', title: 'Error', text: `Failed to delete testimonial: ${err.message}` })
    }
  }

  // 2. Save Course (Create or Edit)
  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault()
    const courseSlug = courseForm.slug.trim()
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(courseSlug)) {
      MySwal.fire({
        icon: 'error',
        title: 'Invalid Slug',
        text: 'Invalid slug. Use only lowercase letters, numbers and hyphens - e.g. "d5-masterclass". Do not paste a URL here.'
      })
      return
    }
    const requiredPlanId = courseForm.requiredPlanId ? parseInt(courseForm.requiredPlanId) : null
    const payload = {
      title: courseForm.title.trim(),
      slug: courseSlug,
      description: courseForm.description,
      thumbnail_url: courseForm.image,
      software_used: courseForm.category,
      difficulty: courseForm.level.toLowerCase().includes('adv') ? 'advanced' : 'intermediate',
      price: parseFloat(courseForm.price),
      instructor: courseForm.instructor.trim() || null,
      category: courseForm.courseCategory.replace(/\s+/g, ' ').trim() || null,
      required_plan_id: requiredPlanId && Number.isInteger(requiredPlanId) ? requiredPlanId : null,
      is_published: courseForm.published
    }
    try {
      if (editingCourse) {
        // Update
        const { error } = await supabase
          .from('courses')
          .update(payload)
          .eq('course_id', editingCourse.course_id || editingCourse.id)

        if (error) throw error
        await MySwal.fire({ icon: 'success', title: 'Updated!', text: "Course updated successfully!" })
      } else {
        // Create
        const { error } = await supabase
          .from('courses')
          .insert(payload)

        if (error) throw error
        await MySwal.fire({ icon: 'success', title: 'Created!', text: "Course created successfully!" })
      }
      
      setShowCourseModal(false)
      setEditingCourse(null)
      window.location.reload()
    } catch (err: any) {
      MySwal.fire({ icon: 'error', title: 'Error', text: `Failed to save course: ${err.message}` })
    }
  }

  // Delete Course
  const handleDeleteCourse = async (cId: string) => {
    const result = await MySwal.fire({
      title: 'Delete Course?',
      text: 'Are you sure you want to delete this course? This will remove all lesson references.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'No, cancel'
    })

    if (!result.isConfirmed) return

    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('course_id', cId)

      if (error) throw error
      await MySwal.fire({ icon: 'success', title: 'Deleted!', text: "Course deleted successfully!" })
      window.location.reload()
    } catch (err: any) {
      MySwal.fire({
        icon: 'error',
        title: 'Failed to Delete Course',
        html: `Failed to delete course: ${err.message}<br/><br/><strong>Tip:</strong> If students have already submitted exercises for this course, you must delete their submissions or apply the cascade-delete database migration.`
      })
    }
  }

  const reloadLessons = async () => {
    try {
      const res = await fetch('/api/admin/lessons')
      if (res.ok) {
        const json = await res.json()
        setLessons(json.lessons || [])
      } else {
        MySwal.fire({ icon: 'error', title: 'Error', text: 'Failed to reload lessons: admin API error' })
      }
    } catch (err: any) {
      MySwal.fire({ icon: 'error', title: 'Error', text: `Failed to reload lessons: ${err.message}` })
    }
  }

  // 3. Save Lesson (Create or Edit)
  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeSyllabusCourse) return
    const courseId = activeSyllabusCourse.course_id || activeSyllabusCourse.id
    try {
      const response = await fetch('/api/admin/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lesson_id: editingLesson?.lesson_id,
          course_id: courseId,
          title: lessonForm.title,
          video_source_type: lessonForm.source || 'direct',
          video_external_id: lessonForm.video_url,
          duration_minutes: Math.round(parseInt(lessonForm.duration) / 60),
          order_index: parseInt(lessonForm.index),
          downloadable_asset_url: lessonForm.downloadable_asset_url
        })
      })

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}))
        throw new Error(errJson.error || 'Admin API error')
      }
      await MySwal.fire({
        icon: 'success',
        title: 'Success!',
        text: editingLesson ? "Lesson updated successfully!" : "Lesson added to syllabus successfully!"
      })

      setShowLessonModal(false)
      setEditingLesson(null)
      await reloadLessons()
    } catch (err: any) {
      MySwal.fire({ icon: 'error', title: 'Error', text: `Failed to save lesson: ${err.message}` })
    }
  }

  // Delete Lesson
  const handleDeleteLesson = async (lId: string) => {
    const result = await MySwal.fire({
      title: 'Delete Lesson?',
      text: 'Are you sure you want to delete this lesson module?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'No, cancel'
    })

    if (!result.isConfirmed) return

    try {
      const response = await fetch(`/api/admin/lessons?lessonId=${encodeURIComponent(lId)}`, {
        method: 'DELETE'
      })
      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}))
        throw new Error(errJson.error || 'Admin API error')
      }
      await MySwal.fire({ icon: 'success', title: 'Deleted!', text: "Lesson deleted successfully!" })
      await reloadLessons()
    } catch (err: any) {
      MySwal.fire({ icon: 'error', title: 'Error', text: `Failed to delete lesson: ${err.message}` })
    }
  }

  // Upload Lesson Attachment File
  const handleLessonAssetUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingLessonAsset(true)
    try {
      const fileExt = file.name.split('.').pop()
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const fileName = `${Date.now()}-${sanitizedName}`
      const filePath = `lesson-resources/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('projects')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('projects')
        .getPublicUrl(filePath)

      setLessonForm(prev => ({ ...prev, downloadable_asset_url: data.publicUrl }))
    } catch (err: any) {
      MySwal.fire({ icon: 'error', title: 'Upload Failed', text: `Asset upload failed: ${err.message}` })
    } finally {
      setUploadingLessonAsset(false)
    }
  }

  // Upload Project Image File
  const handleProjectImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`
      const filePath = `covers/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('projects')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('projects')
        .getPublicUrl(filePath)

      setProjectForm(prev => ({ ...prev, image: data.publicUrl }))
    } catch (err: any) {
      MySwal.fire({ icon: 'error', title: 'Upload Failed', text: `Upload failed: ${err.message}` })
    } finally {
      setUploadingImage(false)
    }
  }

  // 4. Save Project (Create or Edit)
  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault()
    const projectSlug = projectForm.slug.trim()
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(projectSlug)) {
      MySwal.fire({
        icon: 'error',
        title: 'Invalid Slug',
        text: 'Invalid slug. Use only lowercase letters, numbers and hyphens - e.g. "modern-concrete-villa". Do not paste a URL here.'
      })
      return
    }
    const featuresArr = projectForm.features.split(',').map((f: any) => f.trim()).filter(Boolean)
    const challengesArr = projectForm.challenges.split(',').map((c: any) => c.trim()).filter(Boolean)
    const solutionsArr = projectForm.solutions.split(',').map((s: any) => s.trim()).filter(Boolean)

    try {
      if (editingProject) {
        // Update
        const { error } = await supabase
          .from('projects')
          .update({
            title: projectForm.title,
            slug: projectSlug,
            description: projectForm.description,
            cover_image_url: projectForm.image,
            category: projectForm.category,
            software_used: projectForm.software,
            is_featured: projectForm.is_featured,
            year: projectForm.year,
            location: projectForm.location,
            price: projectForm.price,
            client: projectForm.client,
            scope: projectForm.scope,
            features_json: featuresArr,
            challenges_json: challengesArr,
            solutions_json: solutionsArr
          })
          .eq('project_id', editingProject.project_id)

        if (error) throw error
        await MySwal.fire({ icon: 'success', title: 'Updated!', text: "Project updated successfully!" })
      } else {
        if (!user) {
          MySwal.fire({ icon: 'error', title: 'Authentication Error', text: "You must be signed in to publish a project." })
          return
        }
        // Create
        const { error } = await supabase
          .from('projects')
          .insert({
            title: projectForm.title,
            slug: projectSlug,
            description: projectForm.description,
            cover_image_url: projectForm.image,
            category: projectForm.category,
            software_used: projectForm.software,
            is_featured: projectForm.is_featured,
            created_by: user.id,
            year: projectForm.year,
            location: projectForm.location,
            price: projectForm.price,
            client: projectForm.client,
            scope: projectForm.scope,
            features_json: featuresArr,
            challenges_json: challengesArr,
            solutions_json: solutionsArr
          })

        if (error) throw error
        await MySwal.fire({ icon: 'success', title: 'Published!', text: "Project published successfully!" })
      }

      setShowProjectModal(false)
      setEditingProject(null)
      window.location.reload()
    } catch (err: any) {
      MySwal.fire({ icon: 'error', title: 'Error', text: `Failed to save project: ${err.message}` })
    }
  }

  // Delete Project
  const handleDeleteProject = async (pId: string) => {
    const result = await MySwal.fire({
      title: 'Delete Project?',
      text: 'Are you sure you want to delete this project showcase?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'No, cancel'
    })

    if (!result.isConfirmed) return

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('project_id', pId)

      if (error) throw error
      await MySwal.fire({ icon: 'success', title: 'Deleted!', text: "Project deleted successfully!" })
      window.location.reload()
    } catch (err: any) {
      MySwal.fire({ icon: 'error', title: 'Error', text: `Failed to delete project: ${err.message}` })
    }
  }

  // Compute chart datasets
  const enrollmentChartData = courses.map(c => {
    const count = enrollments.filter(e => e.course_id === c.course_id || e.course_id === c.id).length
    return {
      name: c.title.split(' ')[0], // Short name like "D5", "Enscape"
      fullName: c.title,
      students: count
    }
  })

  const studentRoleData = [
    { name: 'Students', value: profiles.filter(p => p.role === 'student').length },
    { name: 'Instructors', value: profiles.filter(p => p.role === 'instructor').length },
    { name: 'Admins', value: profiles.filter(p => p.role === 'admin').length }
  ]
  const COLORS = ['#9ACD32', '#8A2BE2', '#FF4500']

  if (loading) {
    return (
      <main className="min-h-screen flex flex-col justify-between animate-pulse" style={{ backgroundColor: '#060010' }}>
        <Navigation />

        {/* Main Panel Content */}
        <div className="flex-grow container mx-auto px-6 py-24 md:py-32 max-w-7xl relative z-10">
          
          {/* Layout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Sidebar Skeleton */}
            <div className="lg:col-span-3 bg-zinc-950 border border-zinc-850 p-4 sm:p-5 rounded-2xl space-y-3 w-full">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="h-10 bg-zinc-900 border border-zinc-850/40 rounded-xl w-full" />
              ))}
            </div>

            {/* Main Tab Board Content Skeleton */}
            <div className="lg:col-span-9 bg-zinc-950 border border-zinc-850 p-6 sm:p-8 rounded-2xl min-h-[500px] space-y-8">
              <div className="h-8 bg-zinc-900 rounded w-48" />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-zinc-900/40 border border-zinc-850 p-5 rounded-xl space-y-3">
                    <div className="h-3 bg-zinc-805 rounded w-32" />
                    <div className="h-8 bg-zinc-805 rounded w-16" />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-zinc-900/40 border border-zinc-850 p-6 rounded-xl space-y-4">
                  <div className="h-5 bg-zinc-805 rounded w-48" />
                  <div className="h-64 bg-zinc-805 rounded w-full" />
                </div>
                <div className="bg-zinc-900/40 border border-zinc-850 p-6 rounded-xl space-y-4">
                  <div className="h-5 bg-zinc-805 rounded w-48" />
                  <div className="h-64 bg-zinc-805 rounded w-full" />
                </div>
              </div>
            </div>

          </div>
        </div>

        <Footer />
      </main>
    )
  }

  if (!user || profile?.role !== 'admin') {
    return null
  }

  return (
    <main className="min-h-screen flex flex-col justify-between" style={{ backgroundColor: '#060010' }}>
      <Navigation />

      {/* Main Panel Content */}
      <div className="flex-grow container mx-auto px-6 py-24 md:py-32 max-w-7xl relative z-10">
        
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-zinc-800 pb-8 mb-10 gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-white flex items-center gap-2">
              LMS Admin Portal
            </h1>
            <p className="text-zinc-400 text-sm mt-1">
              Code-free course creation, student enrollment CRM, and project showcase management.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm bg-zinc-900 border border-zinc-850 px-4 py-2 rounded-lg text-zinc-300">
              Welcome, <span className="font-semibold text-white">{profile.full_name}</span>
            </div>
            <Button
              onClick={async () => {
                await signOut()
                router.push('/')
              }}
              variant="ghost"
              className="text-red-400 hover:text-red-300 hover:bg-red-950/20 border border-red-950/40 rounded-lg px-4"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Dashboard Sidebar + Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative items-start">
          
          {/* Sidebar Menu */}
          <div className={`${sidebarCollapsed ? 'lg:col-span-1' : 'lg:col-span-3'} lg:sticky lg:top-28 bg-zinc-900/10 border border-zinc-850 p-4 rounded-2xl space-y-4 backdrop-blur-sm self-start transition-all duration-300`}>
            
            {/* Collapse/Expand Toggle Button */}
            <div className={`flex ${sidebarCollapsed ? 'justify-center' : 'justify-end'} border-b border-zinc-850/60 pb-2`}>
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="text-zinc-400 hover:text-white p-1 hover:bg-zinc-800/40 rounded-lg transition-colors"
                title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              >
                {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
              </button>
            </div>

            {/* Group 1: Monitoring */}
            <div>
              {!sidebarCollapsed && (
                <span className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase px-3 block mb-2 transition-opacity duration-300">
                  Monitoring
                </span>
              )}
              <div className="space-y-1">
                <button
                  onClick={() => setActiveTab("overview")}
                  title="Overview"
                  className={`w-full ${sidebarCollapsed ? 'justify-center py-3' : 'px-4 py-2.5 gap-3'} rounded-xl text-sm font-medium flex items-center transition-all duration-300 ${
                    activeTab === "overview" 
                      ? "bg-[#9ACD32] text-black font-bold shadow-lg shadow-[#9ACD32]/10" 
                      : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  {!sidebarCollapsed && <span>Overview</span>}
                </button>
                
                <button
                  onClick={() => setActiveTab("analytics")}
                  title="Syllabus Analytics"
                  className={`w-full ${sidebarCollapsed ? 'justify-center py-3' : 'px-4 py-2.5 gap-3'} rounded-xl text-sm font-medium flex items-center transition-all duration-300 ${
                    activeTab === "analytics" 
                      ? "bg-[#9ACD32] text-black font-bold shadow-lg shadow-[#9ACD32]/10" 
                      : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  {!sidebarCollapsed && <span>Syllabus Analytics</span>}
                </button>
              </div>
            </div>

            {/* Group 2: LMS Administration */}
            <div>
              {!sidebarCollapsed && (
                <span className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase px-3 block mb-2 transition-opacity duration-300">
                  LMS Management
                </span>
              )}
              <div className="space-y-1">
                <button
                  onClick={() => setActiveTab("courses")}
                  title="Courses Builder"
                  className={`w-full ${sidebarCollapsed ? 'justify-center py-3' : 'px-4 py-2.5 gap-3'} rounded-xl text-sm font-medium flex items-center transition-all duration-300 ${
                    activeTab === "courses" 
                      ? "bg-[#9ACD32] text-black font-bold shadow-lg shadow-[#9ACD32]/10" 
                      : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  {!sidebarCollapsed && <span>Courses Builder</span>}
                </button>

                <button
                  onClick={() => setActiveTab("submissions")}
                  title="Homework Submissions"
                  className={`w-full ${sidebarCollapsed ? 'justify-center py-3' : 'px-4 py-2.5 gap-3'} rounded-xl text-sm font-medium flex items-center justify-between transition-all duration-300 ${
                    activeTab === "submissions" 
                      ? "bg-[#9ACD32] text-black font-bold shadow-lg shadow-[#9ACD32]/10" 
                      : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <FileText className="w-4 h-4" />
                    {!sidebarCollapsed && <span>Submissions</span>}
                  </span>
                  {!sidebarCollapsed && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      activeTab === "submissions" ? "bg-black/20 text-black" : "bg-zinc-800 text-zinc-400"
                    }`}>
                      {submissions.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab("crm")}
                  title="Student CRM"
                  className={`w-full ${sidebarCollapsed ? 'justify-center py-3' : 'px-4 py-2.5 gap-3'} rounded-xl text-sm font-medium flex items-center transition-all duration-300 ${
                    activeTab === "crm" 
                      ? "bg-[#9ACD32] text-black font-bold shadow-lg shadow-[#9ACD32]/10" 
                      : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
                  }`}
                >
                  <Users className="w-4 h-4" />
                  {!sidebarCollapsed && <span>Student CRM</span>}
                </button>

                <button
                  onClick={() => setActiveTab("projects")}
                  title="Projects Showcase"
                  className={`w-full ${sidebarCollapsed ? 'justify-center py-3' : 'px-4 py-2.5 gap-3'} rounded-xl text-sm font-medium flex items-center transition-all duration-300 ${
                    activeTab === "projects" 
                      ? "bg-[#9ACD32] text-black font-bold shadow-lg shadow-[#9ACD32]/10" 
                      : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
                  }`}
                >
                  <FolderGit className="w-4 h-4" />
                  {!sidebarCollapsed && <span>Projects Showcase</span>}
                </button>
              </div>
            </div>

            {/* Group 3: Sales & Communications */}
            <div>
              {!sidebarCollapsed && (
                <span className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase px-3 block mb-2 transition-opacity duration-300">
                  Business
                </span>
              )}
              <div className="space-y-1">
                <button
                  onClick={() => setActiveTab("plans")}
                  title="Pricing Plans"
                  className={`w-full ${sidebarCollapsed ? 'justify-center py-3' : 'px-4 py-2.5 gap-3'} rounded-xl text-sm font-medium flex items-center transition-all duration-300 ${
                    activeTab === "plans" 
                      ? "bg-[#9ACD32] text-black font-bold shadow-lg shadow-[#9ACD32]/10" 
                      : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  {!sidebarCollapsed && <span>Pricing Plans</span>}
                </button>

                <button
                  onClick={() => setActiveTab("promos")}
                  title="Promo Codes"
                  className={`w-full ${sidebarCollapsed ? 'justify-center py-3' : 'px-4 py-2.5 gap-3'} rounded-xl text-sm font-medium flex items-center transition-all duration-300 ${
                    activeTab === "promos" 
                      ? "bg-[#9ACD32] text-black font-bold shadow-lg shadow-[#9ACD32]/10" 
                      : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
                  }`}
                >
                  <Tag className="w-4 h-4" />
                  {!sidebarCollapsed && <span>Promo Codes</span>}
                </button>

                <button
                  onClick={() => setActiveTab("testimonials")}
                  title="Homepage Testimonials"
                  className={`w-full ${sidebarCollapsed ? 'justify-center py-3' : 'px-4 py-2.5 gap-3'} rounded-xl text-sm font-medium flex items-center transition-all duration-300 ${
                    activeTab === "testimonials"
                      ? "bg-[#9ACD32] text-black font-bold shadow-lg shadow-[#9ACD32]/10"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
                  }`}
                >
                  <Quote className="w-4 h-4" />
                  {!sidebarCollapsed && <span>Testimonials</span>}
                </button>

                <button
                  onClick={() => setActiveTab("inquiries")}
                  title="Inquiries"
                  className={`w-full ${sidebarCollapsed ? 'justify-center py-3' : 'px-4 py-2.5 gap-3'} rounded-xl text-sm font-medium flex items-center justify-between transition-all duration-300 ${
                    activeTab === "inquiries" 
                      ? "bg-[#9ACD32] text-black font-bold shadow-lg shadow-[#9ACD32]/10" 
                      : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Globe className="w-4 h-4" />
                    {!sidebarCollapsed && <span>Inquiries</span>}
                  </span>
                  {!sidebarCollapsed && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      activeTab === "inquiries" ? "bg-black/20 text-black" : "bg-zinc-800 text-zinc-400"
                    }`}>
                      {messages.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab("users")}
                  title="User Management"
                  className={`w-full ${sidebarCollapsed ? 'justify-center py-3' : 'px-4 py-2.5 gap-3'} rounded-xl text-sm font-medium flex items-center transition-all duration-300 ${
                    activeTab === "users"
                      ? "bg-[#9ACD32] text-black font-bold shadow-lg shadow-[#9ACD32]/10"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
                  }`}
                >
                  <Users className="w-4 h-4" />
                  {!sidebarCollapsed && <span>Users</span>}
                </button>
              </div>
            </div>
          </div>

          {/* Main Tab Board Content */}
          <div className={`${sidebarCollapsed ? 'lg:col-span-11' : 'lg:col-span-9'} bg-zinc-950 border border-zinc-850 p-6 sm:p-8 rounded-2xl min-h-[500px] transition-all duration-300`}>
            {loadingData ? (
              <div className="animate-pulse space-y-8">
                <div className="h-8 bg-zinc-900 rounded w-48" />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="bg-zinc-900/40 border border-zinc-850 p-5 rounded-xl space-y-3">
                      <div className="h-3 bg-zinc-805 rounded w-32" />
                      <div className="h-8 bg-zinc-805 rounded w-16" />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-zinc-900/40 border border-zinc-850 p-6 rounded-xl space-y-4">
                    <div className="h-5 bg-zinc-805 rounded w-48" />
                    <div className="h-64 bg-zinc-805 rounded w-full" />
                  </div>
                  <div className="bg-zinc-900/40 border border-zinc-850 p-6 rounded-xl space-y-4">
                    <div className="h-5 bg-zinc-805 rounded w-48" />
                    <div className="h-64 bg-zinc-805 rounded w-full" />
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* 1. OVERVIEW TAB */}
                {activeTab === "overview" && (
                  <div className="space-y-8">
                    <h2 className="text-2xl font-bold text-white">System Health Overview</h2>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      <div className="bg-zinc-900/40 border border-zinc-850 p-5 rounded-xl">
                        <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Total Registered Users</p>
                        <p className="text-3xl font-bold text-white mt-2">{profiles.length}</p>
                      </div>
                      
                      <div className="bg-zinc-900/40 border border-zinc-850 p-5 rounded-xl">
                        <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Active Courses</p>
                        <p className="text-3xl font-bold text-white mt-2">{courses.length}</p>
                      </div>
                      
                      <div className="bg-zinc-900/40 border border-zinc-850 p-5 rounded-xl">
                        <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Published Projects</p>
                        <p className="text-3xl font-bold text-white mt-2">{projects.length}</p>
                      </div>
                    </div>

                    {/* Chart Analysis Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* BarChart: Course Enrollments */}
                      <div className="bg-zinc-900/20 border border-zinc-850 p-6 rounded-2xl space-y-4">
                        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Course Enrollments</h3>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={enrollmentChartData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                              <XAxis dataKey="name" stroke="#71717a" fontSize={11} tickLine={false} />
                              <YAxis stroke="#71717a" fontSize={11} tickLine={false} />
                              <Tooltip 
                                contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px' }}
                                itemStyle={{ color: '#fff' }}
                              />
                              <Bar dataKey="students" fill="#9ACD32" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* PieChart: User Directory breakdown */}
                      <div className="bg-zinc-900/20 border border-zinc-850 p-6 rounded-2xl space-y-4">
                        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">User Directory Roles</h3>
                        <div className="h-64 flex items-center justify-center">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={studentRoleData}
                                cx="50%"
                                cy="50%"
                                innerRadius={55}
                                outerRadius={75}
                                paddingAngle={5}
                                dataKey="value"
                              >
                                {studentRoleData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip 
                                contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px' }}
                              />
                              <Legend formatter={(value) => <span className="text-zinc-400 text-xs font-medium">{value}</span>} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>

                    <div className="bg-zinc-900/20 border border-zinc-850/60 p-6 rounded-xl space-y-4">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-primary" style={{ color: '#9ACD32' }} />
                        Security RLS Rules Status
                      </h3>
                      <p className="text-sm text-zinc-400">
                        Supabase Row Level Security is currently **Enabled** on all database tables. Guests are restricted to reading published projects and courses. Only accounts containing the `'admin'` profile role can write updates to projects, courses, and lessons.
                      </p>
                    </div>
                  </div>
                )}

                {/* 2. STUDENT CRM TAB */}
                {activeTab === "crm" && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h2 className="text-2xl font-bold text-white">Student CRM Directory</h2>
                      <span className="text-xs font-semibold bg-zinc-800 text-zinc-300 px-3 py-1 rounded-full">
                        {profiles.length} total profiles
                      </span>
                    </div>

                    {/* Table list */}
                    <div className="overflow-x-auto border border-zinc-850 rounded-xl">
                      <table className="w-full text-left border-collapse text-sm">
                        <thead>
                          <tr className="bg-zinc-900/60 border-b border-zinc-850 text-zinc-400 font-semibold uppercase text-xs">
                            <th className="p-4">Name</th>
                            <th className="p-4">Role</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-900">
                          {profiles.map((p) => (
                            <tr key={p.id} className="hover:bg-zinc-900/20 text-zinc-300">
                              <td className="p-4 flex items-center gap-3 font-semibold text-white">
                                {p.avatar_url ? (
                                  <img src={p.avatar_url} alt="" className="w-8 h-8 rounded-full" />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold">
                                    {p.full_name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                {p.full_name}
                              </td>
                              <td className="p-4">
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                                  p.role === 'admin' 
                                    ? 'bg-red-950/20 text-red-400 border-red-900/30' 
                                    : p.role === 'instructor' 
                                      ? 'bg-purple-950/20 text-purple-400 border-purple-900/30' 
                                      : 'bg-zinc-850 text-zinc-400 border-zinc-800'
                                }`}>
                                  {p.role}
                                </span>
                              </td>
                              <td className="p-4">
                                <span className={`w-2.5 h-2.5 rounded-full inline-block ${p.is_active ? 'bg-green-500' : 'bg-zinc-600'}`} />
                              </td>
                              <td className="p-4 text-right space-x-2">
                                <Button 
                                  onClick={() => setSelectedStudent(p)}
                                  size="sm" 
                                  variant="outline" 
                                  className="border-zinc-850 text-xs text-zinc-300 hover:text-white"
                                >
                                  View Stats
                                </Button>
                                {p.role !== 'admin' ? (
                                  <Button 
                                    onClick={() => handleUpdateRole(p.id, 'admin')}
                                    size="sm" 
                                    variant="outline" 
                                    className="border-zinc-850 text-xs text-zinc-300 hover:text-white"
                                  >
                                    Promote Admin
                                  </Button>
                                ) : (
                                  <Button 
                                    onClick={() => handleUpdateRole(p.id, 'student')}
                                    size="sm" 
                                    variant="outline" 
                                    className="border-zinc-850 text-xs text-red-400 hover:text-red-300"
                                  >
                                    Demote
                                  </Button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Student Stats Modal */}
                    {selectedStudent && (() => {
                      const studentEnrollments = enrollments.filter(e => e.student_id === selectedStudent.id)
                      const studentProgress = progressLogs.filter(p => p.student_id === selectedStudent.id)
                      const studentSubmissions = submissions.filter(s => s.student_id === selectedStudent.id)
                      const studentCerts = certificates.filter(c => c.student_id === selectedStudent.id)
                      const totalWatchedSecs = studentProgress.reduce((sum, item) => sum + (item.watched_seconds || 0), 0)
                      const totalWatchedHours = (totalWatchedSecs / 3600).toFixed(1)

                      return (
                        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
                          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto space-y-6 animate-in fade-in zoom-in-95 duration-200 custom-scrollbar text-zinc-300">
                            
                            {/* Modal Header */}
                            <div className="flex justify-between items-start border-b border-zinc-800 pb-4">
                              <div>
                                <h3 className="text-2xl font-bold text-white">{selectedStudent.full_name}</h3>
                                <p className="text-xs text-zinc-500 mt-1">{(selectedStudent as AdminProfileRow).email || "Email hidden"}</p>
                              </div>
                              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold border bg-zinc-855 text-zinc-400 border-zinc-800 uppercase">
                                {selectedStudent.role}
                              </span>
                            </div>

                            {/* Core stats grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-850">
                                <p className="text-[10px] text-zinc-500 uppercase font-bold">Watch Time</p>
                                <p className="text-xl font-bold text-white mt-1">{totalWatchedHours} Hours</p>
                              </div>
                              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-850">
                                <p className="text-[10px] text-zinc-500 uppercase font-bold">Enrollments</p>
                                <p className="text-xl font-bold text-white mt-1">{studentEnrollments.length} Courses</p>
                              </div>
                              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-850">
                                <p className="text-[10px] text-zinc-500 uppercase font-bold">Certificates</p>
                                <p className="text-xl font-bold text-white mt-1">{studentCerts.length} Earned</p>
                              </div>
                            </div>

                            {/* Study progress logs by course */}
                            <div className="space-y-4">
                              <h4 className="font-bold text-white text-sm">Course Enrollment Progress</h4>
                              {studentEnrollments.length === 0 ? (
                                <p className="text-xs text-zinc-500 italic">Not enrolled in any courses yet.</p>
                              ) : (
                                <div className="space-y-3">
                                  {studentEnrollments.map(e => {
                                    const matchingCourse = courses.find(c => c.id === e.course_id || c.course_id === e.course_id)
                                    const courseLessons = lessons.filter(l => l.course_id === e.course_id)
                                    const completedLessons = studentProgress.filter(p => p.course_id === e.course_id && p.is_completed)
                                    const completionPercent = courseLessons.length > 0 
                                      ? Math.round((completedLessons.length / courseLessons.length) * 100)
                                      : 0
                                    
                                    const cert = studentCerts.find(c => c.course_id === e.course_id)

                                    return (
                                      <div key={e.enrollment_id} className="p-4 bg-zinc-950 rounded-xl border border-zinc-850 space-y-3">
                                        <div className="flex justify-between items-center">
                                          <h5 className="text-xs font-bold text-white">{matchingCourse?.title || "Masterclass Course"}</h5>
                                          {cert && (
                                            <span className="text-[9px] uppercase font-bold bg-[#9ACD32]/10 border border-[#9ACD32]/35 text-[#9ACD32] px-2 py-0.5 rounded flex items-center gap-1">
                                              <Award className="w-3 h-3" /> Cert Earned
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-zinc-500">
                                          <span>Syllabus: {completedLessons.length} / {courseLessons.length} modules</span>
                                          <span>•</span>
                                          <span>Status: {e.status}</span>
                                        </div>
                                        {/* Progress Bar */}
                                        <div className="flex items-center gap-3">
                                          <div className="flex-grow bg-zinc-900 h-2 rounded-full overflow-hidden">
                                            <div 
                                              className="h-full bg-primary" 
                                              style={{ width: `${completionPercent}%`, backgroundColor: '#9ACD32' }}
                                            />
                                          </div>
                                          <span className="text-[10px] font-bold text-zinc-400">{completionPercent}%</span>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </div>

                            {/* Submissions list */}
                            <div className="space-y-4">
                              <h4 className="font-bold text-white text-sm">Graded Submissions</h4>
                              {studentSubmissions.length === 0 ? (
                                <p className="text-xs text-zinc-500 italic">No submissions recorded for exercises.</p>
                              ) : (
                                <div className="space-y-2.5 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
                                  {studentSubmissions.map((s: any) => (
                                    <div key={s.submission_id} className="p-3 bg-zinc-950 rounded-xl border border-zinc-850 flex justify-between items-start gap-4">
                                      <div>
                                        <h5 className="text-xs font-semibold text-white">{s.exercises?.title || "Exercise Submission"}</h5>
                                        <p className="text-[10px] text-zinc-500 mt-0.5 italic">"{s.instructor_feedback || "No feedback left yet"}"</p>
                                      </div>
                                      <div className="text-right flex-shrink-0">
                                        <span className="text-xs font-bold text-primary" style={{ color: '#9ACD32' }}>{s.score}%</span>
                                        <p className="text-[9px] text-zinc-500 mt-0.5">{s.status}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Modal Close Button */}
                            <div className="pt-2 border-t border-zinc-800 flex justify-end">
                              <Button 
                                onClick={() => setSelectedStudent(null)} 
                                className="bg-primary text-black font-semibold px-6" 
                                style={{ backgroundColor: '#9ACD32', color: '#000' }}
                              >
                                Close Detail Log
                              </Button>
                            </div>

                          </div>
                        </div>
                      )
                    })()}
                  </div>
                )}

                {/* 3. COURSES BUILDER TAB */}
                {activeTab === "users" && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-white">User Management</h2>
                      <p className="text-xs text-zinc-500 mt-1">
                        {profiles.length} registered profiles. Changing a role takes effect on their next page load.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-zinc-850 overflow-hidden divide-y divide-zinc-850">
                      {profiles.map((p) => (
                        <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-full overflow-hidden bg-zinc-950 border border-zinc-800 flex items-center justify-center shrink-0">
                              {p.avatar_url ? (
                                <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-xs font-bold text-zinc-500">{(p.full_name || "?").charAt(0).toUpperCase()}</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-sm font-semibold text-white truncate">{p.full_name || "Unnamed user"}</h4>
                              <p className="text-[11px] text-zinc-500 truncate">{(p as any).email || p.id}</p>
                            </div>
                          </div>

                          <select
                            value={p.role}
                            onChange={(e) => handleUpdateRole(p.id, e.target.value as 'student' | 'instructor' | 'admin')}
                            disabled={p.id === user?.id}
                            className={`bg-zinc-950 border rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none shrink-0 ${
                              p.role === "admin"
                                ? "border-red-900/50 text-red-400"
                                : p.role === "instructor"
                                  ? "border-blue-900/50 text-blue-400"
                                  : "border-zinc-800 text-zinc-400"
                            } ${p.id === user?.id ? "opacity-50 cursor-not-allowed" : ""}`}
                          >
                            <option value="student">student</option>
                            <option value="instructor">instructor</option>
                            <option value="admin">admin</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === "courses" && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h2 className="text-2xl font-bold text-white">Course Curriculum Builder</h2>
                      <Button 
                        onClick={() => {
                          setEditingCourse(null)
                          setCourseForm({
                            title: "",
                            slug: "",
                            description: "",
                            image: "",
                            category: "",
                            duration: "",
                            level: "Intermediate",
                            price: "49.99",
                            instructor: "",
                            courseCategory: "",
                            requiredPlanId: "",
                            published: true
                          })
                          setShowCourseModal(true)
                        }}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold flex items-center gap-1.5" 
                        style={{ backgroundColor: '#9ACD32', color: '#000' }}
                      >
                        <Plus className="w-4 h-4" />
                        Create Course
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {courses.map((course) => (
                        <div key={course.course_id || course.id} className="p-4 bg-zinc-900/40 border border-zinc-850 rounded-xl flex items-center justify-between hover:border-zinc-800 transition-colors">
                          <div className="flex items-center gap-4">
                            <img 
                              src={getMediaUrl(course.thumbnail_url || course.image || "/images/placeholder.jpg")} 
                              onError={(e) => {
                                e.currentTarget.src = "/images/placeholder.jpg"
                              }}
                              alt="" 
                              className="w-16 h-10 object-cover rounded" 
                            />
                            <div>
                              <h4 className="font-bold text-white">{course.title}</h4>
                              <p className="text-xs text-zinc-400 mt-0.5">
                                {lessons.filter(l => l.course_id === course.course_id).length} lessons • {course.duration || "Self-Paced"} • {course.level || course.difficulty || "Intermediate"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              onClick={() => {
                                setActiveSyllabusCourse(course)
                                setShowSyllabusModal(true)
                              }}
                              size="sm" 
                              variant="outline" 
                              className="border-zinc-850 text-xs text-zinc-350 hover:text-white"
                            >
                              Manage Syllabus
                            </Button>
                            <Button 
                              onClick={() => {
                                setEditingCourse(course)
                                setCourseForm({
                                  title: course.title,
                                  slug: course.slug || course.id || "",
                                  description: course.description || "",
                                  image: course.thumbnail_url || course.image || "",
                                  category: course.software_used || "",
                                  duration: course.duration || "",
                                  level: course.level || course.difficulty || "Intermediate",
                                  price: (course.price || "49.99").toString(),
                                  instructor: course.instructor || "",
                                  courseCategory: course.category || "",
                                  requiredPlanId: (course as any).required_plan_id != null ? String((course as any).required_plan_id) : "",
                                  published: (course as any).is_published !== false
                                })
                                setShowCourseModal(true)
                              }}
                              size="sm" 
                              variant="ghost" 
                              className="hover:bg-zinc-800 text-zinc-350"
                            >
                              <Edit3 className="w-4 h-4" />
                            </Button>
                            <Button 
                              onClick={() => handleDeleteCourse(course.course_id || course.id)}
                              size="sm" 
                              variant="ghost" 
                              className="hover:bg-red-950/20 text-red-400 hover:text-red-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. PROJECTS SHOWCASE TAB */}
                {activeTab === "projects" && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h2 className="text-2xl font-bold text-white">Project Showcase CMS</h2>
                      <Button 
                        onClick={() => {
                          setEditingProject(null)
                           setProjectForm({
                            title: "",
                            slug: "",
                            description: "",
                            image: "",
                            category: "Interior",
                            software: "SketchUp, D5 Render, Photoshop",
                            is_featured: false,
                            year: new Date().getFullYear().toString(),
                            location: "Phnom Penh, Cambodia",
                            price: "$20,000",
                            client: "",
                            scope: "Interior & Exterior Visualization",
                            features: "",
                            challenges: "",
                            solutions: ""
                          })
                          setShowProjectModal(true)
                        }}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold flex items-center gap-1.5" 
                        style={{ backgroundColor: '#9ACD32', color: '#000' }}
                      >
                        <Plus className="w-4 h-4" />
                        Create Project
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {projects.map((project) => (
                        <div key={project.project_id || project.id} className="p-4 bg-zinc-900/40 border border-zinc-850 rounded-xl flex items-center justify-between hover:border-zinc-800 transition-colors">
                          <div className="flex items-center gap-4">
                            <img 
                              src={getMediaUrl(project.cover_image_url || project.image || "/images/placeholder.jpg")} 
                              onError={(e) => {
                                e.currentTarget.src = "/images/placeholder.jpg"
                              }}
                              alt="" 
                              className="w-16 h-10 object-cover rounded" 
                            />
                            <div>
                              <h4 className="font-bold text-white">{project.title}</h4>
                              <p className="text-xs text-zinc-400 mt-0.5">
                                {project.category} • {project.location || "Online"} • {project.year || "2026"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              onClick={() => {
                                setEditingProject(project)
                                 setProjectForm({
                                  title: project.title,
                                  slug: project.slug || project.id || "",
                                  description: project.description || "",
                                  image: project.cover_image_url || project.image || "",
                                  category: project.category || "Interior",
                                  software: (project.software_used ?? project.software ?? "") as string,
                                  is_featured: !!project.is_featured,
                                  year: project.year || "",
                                  location: project.location || "",
                                  price: project.price || "",
                                  client: project.client || "",
                                  scope: project.scope || "",
                                  features: Array.isArray(project.features_json) 
                                    ? project.features_json.join(', ') 
                                    : (Array.isArray(project.details?.features) ? project.details.features.join(', ') : ""),
                                  challenges: Array.isArray(project.challenges_json) 
                                    ? project.challenges_json.join(', ') 
                                    : (Array.isArray(project.details?.challenges) ? project.details.challenges.join(', ') : ""),
                                  solutions: Array.isArray(project.solutions_json) 
                                    ? project.solutions_json.join(', ') 
                                    : (Array.isArray(project.details?.solutions) ? project.details.solutions.join(', ') : "")
                                })
                                setShowProjectModal(true)
                              }}
                              size="sm" 
                              variant="ghost" 
                              className="hover:bg-zinc-800 text-zinc-300"
                            >
                              <Edit3 className="w-4 h-4" />
                            </Button>
                            <Button 
                              onClick={() => { if (project.project_id) handleDeleteProject(project.project_id) }}
                              size="sm" 
                              variant="ghost" 
                              className="hover:bg-red-950/20 text-red-400 hover:text-red-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4.5. SUBMISSIONS TAB */}
                {activeTab === "submissions" && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-white">Student Homework Submissions</h2>
                      <p className="text-zinc-400 text-sm mt-1">Review student render workspace uploads, allocate scores, and submit comments. Open a submission for full context, attempt history, and grading.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
                      <div className="flex items-center gap-2">
                        {[
                          { key: "pending", label: "Pending review" },
                          { key: "graded", label: "Graded" },
                          { key: "all", label: "All" }
                        ].map(chip => (
                          <button
                            key={chip.key}
                            onClick={() => setSubmissionFilter(chip.key as typeof submissionFilter)}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                              submissionFilter === chip.key
                                ? "bg-[#9ACD32] text-black border-[#9ACD32]"
                                : "border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
                            }`}
                          >
                            {chip.label}
                          </button>
                        ))}
                      </div>
                      <input
                        type="text"
                        value={submissionSearch}
                        onChange={(e) => setSubmissionSearch(e.target.value)}
                        placeholder="Search student name..."
                        className="w-full sm:w-64 bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-zinc-700"
                      />
                    </div>

                    {submissions.length === 0 ? (
                      <div className="text-center py-12 border border-dashed border-zinc-850 rounded-xl text-zinc-400">
                        No submissions recorded yet.
                      </div>
                    ) : filteredSubmissions.length === 0 ? (
                      <div className="text-center py-12 border border-dashed border-zinc-850 rounded-xl text-zinc-400">
                        No submissions match this filter.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {filteredSubmissions.map((sub: any) => {
                          const files = Array.isArray(sub.submission_files_json) ? sub.submission_files_json : []
                          const fileObj = files[0] || {}

                          return (
                            <div key={sub.submission_id} className="bg-zinc-900/30 border border-zinc-850 p-5 rounded-xl space-y-4">
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-zinc-300 shrink-0">
                                    {sub.profiles?.full_name?.charAt(0).toUpperCase() || "S"}
                                  </div>
                                  <div className="min-w-0">
                                    <h4 className="text-sm font-semibold text-white truncate">{sub.profiles?.full_name || "Unknown Student"}</h4>
                                    <p className="text-xs text-zinc-500">{new Date(sub.submitted_at).toLocaleDateString()}</p>
                                  </div>
                                </div>
                                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full uppercase border ${
                                  sub.status === 'graded'
                                    ? 'bg-green-950/20 text-green-400 border-green-900/30'
                                    : 'bg-yellow-950/20 text-yellow-400 border-yellow-900/30'
                                }`}>
                                  {sub.status}
                                </span>
                              </div>

                              <div className="bg-zinc-950/50 border border-zinc-850/60 p-4 rounded-lg space-y-2">
                                <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">Exercise requirement:</p>
                                <h3 className="text-sm text-white font-bold">{sub.exercises?.title || "Practice Task"}</h3>
                                <div className="pt-2">
                                  <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">Submitted Link:</p>
                                  {fileObj.url && /^https?:\/\//i.test(String(fileObj.url)) ? (
                                    <a href={String(fileObj.url)} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline break-all mt-1 inline-block" style={{ color: '#9ACD32' }}>
                                      {fileObj.url}
                                    </a>
                                  ) : (
                                    <span className="text-xs text-zinc-300 break-all mt-1 inline-block">{fileObj.url || "No link provided"}</span>
                                  )}
                                </div>
                                {fileObj.notes && (
                                  <div className="pt-1">
                                    <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">Notes:</p>
                                    <p className="text-xs text-zinc-300 italic mt-1 bg-zinc-900/20 p-2.5 rounded border border-zinc-850/40">{fileObj.notes}</p>
                                  </div>
                                )}
                                {files.length > 1 && (
                                  <p className="text-[10px] text-zinc-500 pt-1">+{files.length - 1} more file(s) - open details to view all.</p>
                                )}
                              </div>

                              <div className="flex items-center justify-between gap-3">
                                <Link href={`/admin/submissions/${sub.submission_id}`}>
                                  <Button variant="outline" size="sm" className="border-[#9ACD32]/40 text-[#9ACD32] hover:bg-[#9ACD32]/10 rounded-lg text-xs font-semibold">
                                    Open details
                                    <ChevronRight className="w-3.5 h-3.5 ml-1" />
                                  </Button>
                                </Link>

                              {/* Grading inputs */}
                              {sub.status !== 'graded' ? (
                                <form onSubmit={(e) => {
                                  e.preventDefault()
                                  const form = e.currentTarget
                                  const score = parseInt((form.elements.namedItem('score') as HTMLInputElement).value)
                                  const feedback = (form.elements.namedItem('feedback') as HTMLTextAreaElement).value
                                  handleGradeSubmission(sub.submission_id, score, feedback)
                                }} className="border-t border-zinc-850/60 pt-4 space-y-3">
                                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                                    <div className="sm:col-span-1">
                                      <label className="text-[10px] uppercase font-bold text-zinc-500">Score (/100)</label>
                                      <input 
                                        type="number" 
                                        name="score"
                                        min={0}
                                        max={100}
                                        required
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-primary/80" 
                                      />
                                    </div>
                                    <div className="sm:col-span-3">
                                      <label className="text-[10px] uppercase font-bold text-zinc-500">Instructor Feedback</label>
                                      <input 
                                        type="text" 
                                        name="feedback"
                                        placeholder="Add constructive comments..."
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-primary/80" 
                                      />
                                    </div>
                                  </div>
                                  <Button type="submit" size="sm" className="bg-primary text-black font-semibold" style={{ backgroundColor: '#9ACD32', color: '#000' }}>
                                    Submit Grade
                                  </Button>
                                </form>
                              ) : (
                                <div className="border-t border-zinc-850/60 pt-4 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs bg-green-950/5 p-3 rounded-lg border border-green-900/10">
                                  <div className="sm:col-span-1">
                                    <p className="font-bold text-zinc-500 uppercase text-[10px]">Score Awarded</p>
                                    <p className="text-lg font-bold text-primary mt-0.5" style={{ color: '#9ACD32' }}>{sub.score} / 100</p>
                                  </div>
                                  <div className="sm:col-span-3">
                                    <p className="font-bold text-zinc-500 uppercase text-[10px]">Feedback Comments</p>
                                    <p className="text-zinc-300 mt-1 italic">"{sub.instructor_feedback || "None"}"</p>
                                  </div>
                                </div>
                              )}
                              </div>

                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* 5. INQUIRIES / CONTACT MESSAGES TAB */}
                {activeTab === "inquiries" && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h2 className="text-2xl font-bold text-white">Client Inquiry Inbox</h2>
                      <span className="text-xs font-semibold bg-zinc-800 text-zinc-300 px-3 py-1 rounded-full">
                        {messages.length} messages
                      </span>
                    </div>

                    {messages.length === 0 ? (
                      <div className="text-center py-12 border border-dashed border-zinc-850 rounded-xl text-zinc-400">
                        No contact inquiries found in the database.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((msg) => (
                          <div
                            key={msg.id}
                            className="bg-zinc-900/40 border border-zinc-850 p-5 rounded-xl space-y-3"
                          >
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                              <div>
                                <h4 className="font-bold text-white text-base">{msg.name}</h4>
                                <p className="text-xs text-zinc-400 mt-0.5">
                                  {msg.email} {msg.company ? `• ${msg.company}` : ''}
                                </p>
                              </div>
                              <span className="text-xs text-zinc-500">
                                {msg.created_at ? new Date(msg.created_at).toLocaleString() : ''}
                              </span>
                            </div>
                            <div className="text-sm text-zinc-300 bg-zinc-950 p-4 rounded-lg border border-zinc-900/60 leading-relaxed whitespace-pre-line">
                              {msg.message}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 6. SYLLABUS ANALYTICS TAB */}
                {activeTab === "analytics" && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-2xl font-bold text-white">Syllabus Completion & Watch Analytics</h2>
                      <p className="text-zinc-400 text-sm mt-1">
                        Track student engagement metrics, video lesson completion rates, and average play times across your visual curriculum.
                      </p>
                    </div>

                    <div className="space-y-8">
                      {courses.map((course) => {
                        const courseLessons = lessons.filter(l => l.course_id === course.course_id || l.course_id === course.id)
                        const courseEnrollments = enrollments.filter(e => e.course_id === course.course_id || e.course_id === course.id)
                        const chartData = courseLessons.map((l, idx) => {
                          const progressForLesson = progressLogs.filter(p => p.lesson_id === l.lesson_id)
                          const startedCount = progressForLesson.filter(p => (p.watched_seconds || 0) > 0 || p.is_completed).length
                          const completedCount = progressForLesson.filter(p => p.is_completed).length
                          return {
                            name: `L${idx + 1}`,
                            title: l.title,
                            Started: startedCount,
                            Completed: completedCount
                          }
                        })

                        return (
                          <div key={course.course_id || course.id} className="bg-zinc-900/30 border border-zinc-850 p-6 rounded-2xl space-y-4">
                            <div className="flex justify-between items-center border-b border-zinc-850 pb-3">
                              <h3 className="text-lg font-bold text-white">{course.title}</h3>
                              <span className="text-xs text-zinc-400 font-semibold bg-zinc-950/60 px-3 py-1 rounded-full border border-zinc-850">
                                {courseEnrollments.length} Active Students
                              </span>
                            </div>

                            {courseLessons.length === 0 ? (
                              <p className="text-xs text-zinc-500 italic">No lessons registered in this course curriculum.</p>
                            ) : (
                              <div className="space-y-6">
                                <div className="h-44 bg-zinc-950/20 border border-zinc-900 p-4 rounded-xl">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                      <defs>
                                        <linearGradient id={`colorStarted-${course.course_id || course.id}`} x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="5%" stopColor="#9ACD32" stopOpacity={0.2}/>
                                          <stop offset="95%" stopColor="#9ACD32" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id={`colorCompleted-${course.course_id || course.id}`} x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="5%" stopColor="#8A2BE2" stopOpacity={0.2}/>
                                          <stop offset="95%" stopColor="#8A2BE2" stopOpacity={0}/>
                                        </linearGradient>
                                      </defs>
                                      <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" />
                                      <XAxis dataKey="name" stroke="#52525b" fontSize={10} tickLine={false} />
                                      <YAxis stroke="#52525b" fontSize={10} tickLine={false} />
                                      <Tooltip 
                                        contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px' }}
                                        labelStyle={{ color: '#71717a', fontSize: '10px' }}
                                        itemStyle={{ fontSize: '11px' }}
                                      />
                                      <Legend formatter={(value) => <span className="text-zinc-400 text-[10px] font-semibold">{value}</span>} />
                                      <Area type="monotone" dataKey="Started" stroke="#9ACD32" strokeWidth={1.5} fillOpacity={1} fill={`url(#colorStarted-${course.course_id || course.id})`} />
                                      <Area type="monotone" dataKey="Completed" stroke="#8A2BE2" strokeWidth={1.5} fillOpacity={1} fill={`url(#colorCompleted-${course.course_id || course.id})`} />
                                    </AreaChart>
                                  </ResponsiveContainer>
                                </div>

                                <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                  <thead>
                                    <tr className="border-b border-zinc-850 text-zinc-500 uppercase tracking-wider font-bold">
                                      <th className="pb-3 w-[40%]">Lesson Module</th>
                                      <th className="pb-3 text-center">Started</th>
                                      <th className="pb-3 text-center">Completed</th>
                                      <th className="pb-3 text-center">Completion Rate</th>
                                      <th className="pb-3 text-right">Avg Watch Time</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-zinc-900/40 text-zinc-300">
                                    {courseLessons.map((l, index) => {
                                      const progressForLesson = progressLogs.filter(p => p.lesson_id === l.lesson_id)
                                      const startedCount = progressForLesson.filter(p => (p.watched_seconds || 0) > 0 || p.is_completed).length
                                      const completedCount = progressForLesson.filter(p => p.is_completed).length
                                      
                                      const completionRate = startedCount > 0 
                                        ? Math.round((completedCount / startedCount) * 100) 
                                        : 0

                                      const totalSeconds = progressForLesson.reduce((sum, p) => sum + (p.watched_seconds || 0), 0)
                                      const avgSeconds = progressForLesson.length > 0 ? totalSeconds / progressForLesson.length : 0
                                      const avgMins = (avgSeconds / 60).toFixed(1)

                                      return (
                                        <tr key={l.lesson_id} className="hover:bg-zinc-900/20">
                                          <td className="py-3 font-semibold text-white">
                                            {index + 1}. {l.title}
                                          </td>
                                          <td className="py-3 text-center font-semibold text-zinc-400">{startedCount}</td>
                                          <td className="py-3 text-center font-semibold text-zinc-400">{completedCount}</td>
                                          <td className="py-3">
                                            <div className="flex items-center gap-2 max-w-[120px] mx-auto">
                                              <div className="flex-grow bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                                                <div 
                                                  className="h-full bg-primary" 
                                                  style={{ width: `${completionRate}%`, backgroundColor: '#9ACD32' }}
                                                />
                                              </div>
                                              <span className="font-bold text-[10px] text-zinc-400 w-8 text-right">{completionRate}%</span>
                                            </div>
                                          </td>
                                          <td className="py-3 text-right text-zinc-400 font-mono">
                                            {avgSeconds > 0 ? `${avgMins} mins` : '-'}
                                          </td>
                                        </tr>
                                      )
                                    })}
                                  </tbody>
                                </table>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* 7. SUBSCRIPTION PLANS TAB */}
                {activeTab === "plans" && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h2 className="text-2xl font-bold text-white">Subscription Plans & Pricing CMS</h2>
                        <p className="text-zinc-400 text-sm mt-1">
                          Control client access tiers, adjust USD prices, and customize plan features displayed on your paywall.
                        </p>
                      </div>
                      <Button
                        onClick={() => {
                          setPlanForm({
                            name: "",
                            code: "",
                            price: "19.99",
                            interval: "monthly",
                            is_active: true
                          })
                          setShowPlanModal(true)
                        }}
                        className="bg-primary hover:bg-primary/90 text-black font-semibold flex items-center gap-1.5"
                        style={{ backgroundColor: '#9ACD32', color: '#000' }}
                      >
                        <Plus className="w-4 h-4" /> Create Plan
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {plans.map((plan) => (
                        <div key={plan.plan_id} className="bg-zinc-900/40 border border-zinc-850 p-6 rounded-2xl flex flex-col justify-between space-y-4 hover:border-zinc-800 transition-colors">
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <h3 className="text-lg font-bold text-white uppercase tracking-wider">{plan.name}</h3>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-[#9ACD32]/10 border border-[#9ACD32]/35 text-[#9ACD32]">
                                  Tier {plan.plan_id}
                                </span>
                                <Button
                                  onClick={() => handleDeletePlan(plan.plan_id)}
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-400 hover:text-red-300 hover:bg-red-950/20 p-1 h-7 w-7"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>
                            <div className="flex items-baseline gap-1 text-white">
                              <span className="text-3xl font-extrabold tracking-tight">
                                ${plan.price_usd % 1 === 0 ? plan.price_usd : parseFloat(plan.price_usd.toString()).toFixed(2)}
                              </span>
                              <span className="text-xs font-normal text-zinc-500">
                                / {plan.billing_interval === 'monthly' ? 'month' : plan.billing_interval === 'yearly' ? 'year' : 'one-time'}
                              </span>
                            </div>
                            <p className="text-xs text-zinc-400 leading-relaxed bg-zinc-950 p-3 rounded-lg border border-zinc-900">
                              {plan.plan_code === "FREE" 
                                ? "Explore starter workflows." 
                                : plan.plan_code === "STUDENT_PRO" 
                                  ? "Complete rendering foundations." 
                                  : plan.plan_code === "MENTORSHIP"
                                    ? "Direct mentorship and project review."
                                    : "Access to courses corresponding to this pricing level."}
                            </p>
                          </div>

                          <Button
                            onClick={() => {
                              setSelectedPlan(plan)
                              setEditPlanName(plan.name || "")
                              setEditPlanCode(plan.plan_code || "")
                              setEditPlanPrice((plan.price_usd || 0).toString())
                              setEditPlanInterval(plan.billing_interval || "monthly")
                              setEditPlanActive(plan.is_active !== false)
                            }}
                            className="bg-primary hover:bg-primary/90 text-black font-semibold w-full mt-2"
                            style={{ backgroundColor: '#9ACD32', color: '#000' }}
                          >
                            Edit Pricing & Details
                          </Button>
                        </div>
                      ))}
                    </div>

                    {/* Create Plan Modal */}
                    {showPlanModal && (
                      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <form onSubmit={handleCreatePlan} className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl max-w-md w-full space-y-5 animate-in fade-in zoom-in-95 duration-150 text-zinc-300">
                          <div>
                            <h3 className="text-xl font-bold text-white">Create New Pricing Plan</h3>
                            <p className="text-xs text-zinc-500 mt-1">Add a new access tier level for student checkouts.</p>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Plan Name</label>
                              <input 
                                type="text" 
                                required
                                value={planForm.name} 
                                onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })} 
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700"
                                placeholder="e.g. Masterclass VIP"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Plan Code</label>
                                <input 
                                  type="text" 
                                  required
                                  value={planForm.code} 
                                  onChange={(e) => setPlanForm({ ...planForm, code: e.target.value })} 
                                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700 font-mono"
                                  placeholder="e.g. VIP_PRO"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Price (USD)</label>
                                <input 
                                  type="number" 
                                  step="0.01"
                                  required
                                  value={planForm.price} 
                                  onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })} 
                                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700 font-mono"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Billing Interval</label>
                              <select
                                value={planForm.interval}
                                onChange={(e) => setPlanForm({ ...planForm, interval: e.target.value })}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700"
                              >
                                <option value="monthly">Monthly</option>
                                <option value="yearly">Yearly</option>
                                <option value="one-time">One-Time</option>
                              </select>
                            </div>
                          </div>

                          <div className="flex gap-3 justify-end pt-2">
                            <Button 
                              type="button" 
                              variant="ghost" 
                              onClick={() => setShowPlanModal(false)}
                              className="text-zinc-400 hover:text-white"
                            >
                              Cancel
                            </Button>
                            <Button 
                              type="submit" 
                              className="bg-primary text-black font-bold px-6"
                              style={{ backgroundColor: '#9ACD32', color: '#000' }}
                            >
                              Create Plan
                            </Button>
                          </div>
                        </form>
                      </div>
                    )}

                    {/* Edit Plan Price Modal */}
                    {selectedPlan && (
                      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <form onSubmit={handleSavePlan} className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl max-w-md w-full space-y-5 animate-in fade-in zoom-in-95 duration-150">
                          <div>
                            <h3 className="text-xl font-bold text-white">Modify Plan: {selectedPlan.name}</h3>
                            <p className="text-xs text-zinc-500 mt-1">Changes are pushed instantly to all client checkout flows.</p>
                            <div className="space-y-4 mt-4 text-zinc-300">
                            <div>
                              <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Plan Name</label>
                              <input 
                                type="text" 
                                required
                                value={editPlanName} 
                                onChange={(e) => setEditPlanName(e.target.value)} 
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Plan Code</label>
                                <input 
                                  type="text" 
                                  required
                                  value={editPlanCode} 
                                  onChange={(e) => setEditPlanCode(e.target.value)} 
                                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700 font-mono"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Price (USD)</label>
                                <input 
                                  type="number" 
                                  step="0.01"
                                  required
                                  value={editPlanPrice} 
                                  onChange={(e) => setEditPlanPrice(e.target.value)} 
                                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700 font-mono"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Billing Interval</label>
                              <select
                                value={editPlanInterval}
                                onChange={(e) => setEditPlanInterval(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700"
                              >
                                <option value="monthly">Monthly</option>
                                <option value="yearly">Yearly</option>
                                <option value="one-time">One-Time</option>
                              </select>
                            </div>
                          </div>
                          </div>

                          <div className="flex gap-3 justify-end pt-2">
                            <Button 
                              type="button" 
                              variant="ghost" 
                              onClick={() => setSelectedPlan(null)}
                              className="text-zinc-400 hover:text-white"
                            >
                              Cancel
                            </Button>
                            <Button 
                              type="submit" 
                              disabled={isSavingPlan}
                              className="bg-primary text-black font-bold px-6"
                              style={{ backgroundColor: '#9ACD32', color: '#000' }}
                            >
                              {isSavingPlan ? "Saving Plan..." : "Save Pricing Details"}
                            </Button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                )}

                {/* 8. PROMO CODES TAB */}
                {activeTab === "promos" && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h2 className="text-2xl font-bold text-white">Promo Codes Manager</h2>
                        <p className="text-zinc-400 text-sm mt-1">
                          Create and monitor checkout discount coupons, tracking their total redemptions and expirations.
                        </p>
                      </div>
                      <Button
                        onClick={() => {
                          setPromoForm({
                            code: "",
                            type: "percentage",
                            value: "10.00",
                            max: "",
                            expiry: "",
                            is_active: true
                          })
                          setShowPromoModal(true)
                        }}
                        className="bg-primary hover:bg-primary/90 text-black font-semibold flex items-center gap-1.5"
                        style={{ backgroundColor: '#9ACD32', color: '#000' }}
                      >
                        <Plus className="w-4 h-4" /> Create Promo
                      </Button>
                    </div>

                    {promos.length === 0 ? (
                      <div className="text-center py-12 border border-dashed border-zinc-850 rounded-xl text-zinc-400">
                        No discount promo codes found. Click "Create Promo" to publish one!
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {promos.map((promo) => (
                          <div key={promo.code} className="bg-zinc-900/40 border border-zinc-850 p-6 rounded-2xl flex flex-col justify-between space-y-4 hover:border-zinc-800 transition-colors">
                            <div className="space-y-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="text-sm font-mono font-bold text-white bg-zinc-950 px-3 py-1 rounded-lg border border-zinc-850">
                                    {promo.code}
                                  </span>
                                  <h4 className="text-xs text-zinc-500 mt-2">
                                    Created {new Date(promo.created_at).toLocaleDateString()}
                                  </h4>
                                </div>
                                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                                  promo.is_active 
                                    ? "bg-green-950/20 text-green-400 border border-green-900/35"
                                    : "bg-red-950/20 text-red-400 border border-red-900/35"
                                }`}>
                                  {promo.is_active ? "Active" : "Inactive"}
                                </span>
                              </div>

                              <div className="pt-2 grid grid-cols-2 gap-4">
                                <div className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-900">
                                  <p className="text-[10px] uppercase font-bold text-zinc-500">Discount</p>
                                  <p className="text-lg font-extrabold text-white mt-0.5">
                                    {promo.discount_type === 'percentage' ? `${promo.discount_value}%` : `$${promo.discount_value}`} OFF
                                  </p>
                                </div>
                                <div className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-900">
                                  <p className="text-[10px] uppercase font-bold text-zinc-500">Redemptions</p>
                                  <p className="text-lg font-extrabold text-white mt-0.5">
                                    {promo.redemptions_count} / {promo.max_redemptions || "∞"}
                                  </p>
                                </div>
                              </div>

                              {promo.expires_at && (
                                <p className="text-xs text-zinc-500 font-mono">
                                  Expires: {new Date(promo.expires_at).toLocaleString()}
                                </p>
                              )}
                            </div>

                            <Button
                              onClick={() => handleDeletePromo(promo.code)}
                              className="bg-red-950/20 hover:bg-red-950/40 text-red-400 font-semibold w-full mt-2 border border-red-900/35"
                            >
                              Delete Promo Code
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Create Promo Modal */}
                    {showPromoModal && (
                      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <form onSubmit={handleCreatePromo} className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl max-w-md w-full space-y-5 animate-in fade-in zoom-in-95 duration-150 text-zinc-300">
                          <div>
                            <h3 className="text-xl font-bold text-white">Create New Promo Code</h3>
                            <p className="text-xs text-zinc-500 mt-1">Publish discount vouchers for checkouts.</p>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Promo Code Word</label>
                              <input 
                                type="text" 
                                required
                                value={promoForm.code} 
                                onChange={(e) => setPromoForm({ ...promoForm, code: e.target.value })} 
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700 font-mono uppercase"
                                placeholder="e.g. ARCH50"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Discount Type</label>
                                <select
                                  value={promoForm.type}
                                  onChange={(e) => setPromoForm({ ...promoForm, type: e.target.value })}
                                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700"
                                >
                                  <option value="percentage">Percentage (%)</option>
                                  <option value="fixed">Fixed Amount ($)</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Discount Value</label>
                                <input 
                                  type="number" 
                                  step="0.01"
                                  required
                                  value={promoForm.value} 
                                  onChange={(e) => setPromoForm({ ...promoForm, value: e.target.value })} 
                                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700 font-mono"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Max Redemptions (Optional)</label>
                                <input 
                                  type="number" 
                                  value={promoForm.max} 
                                  onChange={(e) => setPromoForm({ ...promoForm, max: e.target.value })} 
                                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700 font-mono"
                                  placeholder="e.g. 100 (∞ if blank)"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Expiry Date (Optional)</label>
                                <input 
                                  type="datetime-local" 
                                  value={promoForm.expiry} 
                                  onChange={(e) => setPromoForm({ ...promoForm, expiry: e.target.value })} 
                                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700 font-mono"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-3 justify-end pt-2">
                            <Button 
                              type="button" 
                              variant="ghost" 
                              onClick={() => setShowPromoModal(false)}
                              className="text-zinc-400 hover:text-white"
                            >
                              Cancel
                            </Button>
                            <Button 
                              type="submit" 
                              className="bg-primary text-black font-bold px-6"
                              style={{ backgroundColor: '#9ACD32', color: '#000' }}
                            >
                              Create Promo
                            </Button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                )}

                {/* TESTIMONIALS TAB */}
                {activeTab === "testimonials" && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h2 className="text-2xl font-bold text-white">Testimonials Manager</h2>
                        <p className="text-zinc-400 text-sm mt-1">
                          Manage client quotes shown in the homepage carousel. Newest appear first.
                        </p>
                      </div>
                      <Button
                        onClick={() => {
                          setTestimonialForm({ name: "", role: "", organization: "", text: "" })
                          setEditingTestimonialId(null)
                          setShowTestimonialModal(true)
                        }}
                        className="bg-primary hover:bg-primary/90 text-black font-semibold flex items-center gap-1.5"
                        style={{ backgroundColor: '#9ACD32', color: '#000' }}
                      >
                        <Plus className="w-4 h-4" /> Add Testimonial
                      </Button>
                    </div>

                    {testimonials.length === 0 ? (
                      <div className="text-center py-12 border border-dashed border-zinc-850 rounded-xl text-zinc-400">
                        No testimonials yet. Click &quot;Add Testimonial&quot; to publish one!
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {testimonials.map((t) => (
                          <div key={t.id} className="bg-zinc-900/40 border border-zinc-850 p-6 rounded-2xl flex flex-col justify-between space-y-4 hover:border-zinc-800 transition-colors">
                            <div className="space-y-3">
                              <div className="flex justify-between items-start gap-3">
                                <div>
                                  <h4 className="text-sm font-bold text-white">{t.name}</h4>
                                  <p className="text-xs text-zinc-500">{t.role} @ {t.organization}</p>
                                </div>
                                <span className="text-xs text-zinc-500 font-mono whitespace-nowrap">
                                  {t.created_at ? new Date(t.created_at).toLocaleDateString() : ""}
                                </span>
                              </div>

                              <p className="text-sm text-zinc-300 italic leading-relaxed line-clamp-4">
                                &ldquo;{t.text}&rdquo;
                              </p>
                            </div>

                            <div className="flex gap-3 mt-2">
                              <Button
                                onClick={() => {
                                  setTestimonialForm({
                                    name: t.name || "",
                                    role: t.role || "",
                                    organization: t.organization || "",
                                    text: t.text || ""
                                  })
                                  setEditingTestimonialId(t.id)
                                  setShowTestimonialModal(true)
                                }}
                                className="bg-zinc-800 hover:bg-zinc-700 text-white font-semibold flex-1 border border-zinc-700 flex items-center justify-center gap-1.5"
                              >
                                <Edit3 className="w-4 h-4" /> Edit
                              </Button>
                              <Button
                                onClick={() => handleDeleteTestimonial(t.id, t.name)}
                                className="bg-red-950/20 hover:bg-red-950/40 text-red-400 font-semibold flex-1 border border-red-900/35"
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Create/Edit Testimonial Modal */}
                    {showTestimonialModal && (
                      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <form onSubmit={handleSaveTestimonial} className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto space-y-5 animate-in fade-in zoom-in-95 duration-150 custom-scrollbar text-zinc-300">
                          <div>
                            <h3 className="text-xl font-bold text-white">{editingTestimonialId ? "Edit Testimonial" : "New Testimonial"}</h3>
                            <p className="text-xs text-zinc-500 mt-1">Shown in the homepage carousel once published.</p>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Client Name</label>
                              <input
                                type="text"
                                required
                                maxLength={100}
                                value={testimonialForm.name}
                                onChange={(e) => setTestimonialForm({ ...testimonialForm, name: e.target.value })}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700"
                                placeholder="e.g. Srey Pich"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Role</label>
                                <input
                                  type="text"
                                  required
                                  maxLength={100}
                                  value={testimonialForm.role}
                                  onChange={(e) => setTestimonialForm({ ...testimonialForm, role: e.target.value })}
                                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700"
                                  placeholder="Creative Director"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Organization</label>
                                <input
                                  type="text"
                                  required
                                  maxLength={120}
                                  value={testimonialForm.organization}
                                  onChange={(e) => setTestimonialForm({ ...testimonialForm, organization: e.target.value })}
                                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700"
                                  placeholder="Luxe Properties"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Quote (max 600 characters)</label>
                              <textarea
                                required
                                rows={5}
                                maxLength={600}
                                value={testimonialForm.text}
                                onChange={(e) => setTestimonialForm({ ...testimonialForm, text: e.target.value })}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700 resize-none"
                                placeholder="What they said about working with you..."
                              />
                              <p className="text-[10px] text-zinc-500 mt-1">{testimonialForm.text.length}/600 characters</p>
                            </div>
                          </div>

                          <div className="flex gap-3 justify-end pt-2">
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => setShowTestimonialModal(false)}
                              className="text-zinc-400 hover:text-white"
                            >
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              className="bg-primary text-black font-bold px-6"
                              style={{ backgroundColor: '#9ACD32', color: '#000' }}
                            >
                              {editingTestimonialId ? "Save Changes" : "Publish Testimonial"}
                            </Button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

        {/* ======================================================== */}
        {/* ==================== CRUD MODALS ======================== */}
        {/* ======================================================== */}

        {/* 1. COURSE FORM MODAL */}
        {showCourseModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <form onSubmit={handleSaveCourse} className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-5 animate-in fade-in zoom-in-95 duration-150 custom-scrollbar text-zinc-350">
              <div>
                <h3 className="text-xl font-bold text-white">{editingCourse ? "Modify Masterclass" : "Create New Masterclass"}</h3>
                <p className="text-xs text-zinc-500 mt-1">Specify metadata, pricing, and visual parameters for the course card.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Course Title</label>
                  <input 
                    type="text" 
                    required 
                    value={courseForm.title} 
                    onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })} 
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700" 
                    placeholder="e.g. D5 Render Masterclass"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Slug (URL string)</label>
                    <input
                      type="text"
                      required
                      value={courseForm.slug}
                      onChange={(e) => setCourseForm({ ...courseForm, slug: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700 font-mono"
                      placeholder="e.g. d5-masterclass"
                      pattern="[a-z0-9]+(-[a-z0-9]+)*"
                      title="Lowercase letters, numbers and hyphens only - never paste a URL here"
                    />
                    <p className="text-[10px] text-zinc-500 mt-1">Lowercase letters, numbers, hyphens only. This becomes the course URL - do NOT paste a link.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Price (USD)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      required 
                      value={courseForm.price} 
                      onChange={(e) => setCourseForm({ ...courseForm, price: e.target.value })} 
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700 font-mono" 
                      placeholder="49.99"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Instructor Name</label>
                    <input
                      type="text"
                      value={courseForm.instructor}
                      onChange={(e) => setCourseForm({ ...courseForm, instructor: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700"
                      placeholder="e.g. Bun Sambath"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Category</label>
                    <input
                      type="text"
                      value={courseForm.courseCategory}
                      onChange={(e) => setCourseForm({ ...courseForm, courseCategory: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700"
                      placeholder="e.g. Rendering, Post-Production"
                      list="existing-course-categories"
                    />
                    <datalist id="existing-course-categories">
                      {Array.from(new Set(courses.map((c: any) => c.category).filter(Boolean))).map((cat) => (
                        <option key={String(cat)} value={String(cat)} />
                      ))}
                    </datalist>
                    <p className="text-[10px] text-zinc-500 mt-1">Pick an existing one or type new - creates a filter tab on /courses.</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Thumbnail Image URL</label>
                  <input 
                    type="text" 
                    required 
                    value={courseForm.image} 
                    onChange={(e) => setCourseForm({ ...courseForm, image: e.target.value })} 
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700" 
                    placeholder="https://images.unsplash.com/..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Level</label>
                    <select 
                      value={courseForm.level} 
                      onChange={(e) => setCourseForm({ ...courseForm, level: e.target.value })} 
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700"
                    >
                      <option>Beginner</option>
                      <option>Intermediate</option>
                      <option>Advanced</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Syllabus Hours</label>
                    <input 
                      type="text" 
                      required 
                      value={courseForm.duration} 
                      onChange={(e) => setCourseForm({ ...courseForm, duration: e.target.value })} 
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700" 
                      placeholder="e.g. 12 Hours"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Software Used</label>
                    <input 
                      type="text" 
                      required 
                      value={courseForm.category} 
                      onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })} 
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700" 
                      placeholder="D5 Render, SketchUp"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Access Requirement</label>
                    <select
                      value={courseForm.requiredPlanId}
                      onChange={(e) => setCourseForm({ ...courseForm, requiredPlanId: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700"
                    >
                      <option value="">Direct purchase only</option>
                      {plans.map((p) => (
                        <option key={p.plan_id} value={String(p.plan_id)}>
                          Requires plan: {p.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-zinc-500 mt-1">Subscription plans unlock this course automatically (higher plans included).</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Visibility</label>
                    <select
                      value={courseForm.published ? "published" : "draft"}
                      onChange={(e) => setCourseForm({ ...courseForm, published: e.target.value === "published" })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700"
                    >
                      <option value="published">Published (visible to students)</option>
                      <option value="draft">Draft (hidden)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Description Summary</label>
                  <textarea 
                    rows={3} 
                    required 
                    value={courseForm.description} 
                    onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })} 
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700 resize-none" 
                    placeholder="Brief description of the course contents and objectives..."
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <Button type="button" variant="ghost" onClick={() => setShowCourseModal(false)} className="text-zinc-400 hover:text-white">
                  Cancel
                </Button>
                <Button type="submit" className="bg-primary text-black font-bold px-6" style={{ backgroundColor: '#9ACD32', color: '#000' }}>
                  {editingCourse ? "Save Changes" : "Create Course"}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* 2. PROJECT FORM MODAL */}
        {showProjectModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <form onSubmit={handleSaveProject} className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-5 animate-in fade-in zoom-in-95 duration-150 custom-scrollbar text-zinc-350">
              <div>
                <h3 className="text-xl font-bold text-white">{editingProject ? "Modify Project Showcase" : "Publish New Render Showcase"}</h3>
                <p className="text-xs text-zinc-500 mt-1">Specify visualization parameters, category, and covers.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Project Title</label>
                  <input 
                    type="text" 
                    required 
                    value={projectForm.title} 
                    onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })} 
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700" 
                    placeholder="e.g. Modern Concrete Villa"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Slug (URL string)</label>
                    <input 
                      type="text" 
                      required 
                      value={projectForm.slug} 
                      onChange={(e) => setProjectForm({ ...projectForm, slug: e.target.value })} 
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700 font-mono" 
                      placeholder="e.g. modern-concrete-villa"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Category</label>
                    <select 
                      value={projectForm.category} 
                      onChange={(e) => setProjectForm({ ...projectForm, category: e.target.value })} 
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700"
                    >
                      <option>Interior</option>
                      <option>Exterior</option>
                      <option>Landscape</option>
                      <option>Commercial</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Cover Image</label>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input 
                        type="text" 
                        required 
                        value={projectForm.image} 
                        onChange={(e) => setProjectForm({ ...projectForm, image: e.target.value })} 
                        className="flex-grow bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700" 
                        placeholder="https://images.unsplash.com/..."
                      />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProjectImageUpload}
                        className="hidden"
                        id="project-image-file"
                        disabled={uploadingImage}
                      />
                      <label
                        htmlFor="project-image-file"
                        className={`bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center justify-center cursor-pointer transition-colors border border-zinc-800 shrink-0 ${uploadingImage ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {uploadingImage ? 'Uploading...' : 'Choose File'}
                      </label>
                    </div>
                    {projectForm.image && (
                      <div className="relative w-28 h-16 rounded overflow-hidden border border-zinc-800 bg-zinc-950">
                        <img 
                          src={getMediaUrl(projectForm.image)} 
                          onError={(e) => {
                            e.currentTarget.src = "/images/placeholder.jpg"
                          }}
                          alt="Cover preview" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Software Stack (Comma separated)</label>
                  <input 
                    type="text" 
                    required 
                    value={projectForm.software} 
                    onChange={(e) => setProjectForm({ ...projectForm, software: e.target.value })} 
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700" 
                    placeholder="SketchUp, Lumion, Photoshop"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Project Year</label>
                    <input 
                      type="text" 
                      value={projectForm.year} 
                      onChange={(e) => setProjectForm({ ...projectForm, year: e.target.value })} 
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700" 
                      placeholder="e.g. 2026"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Location</label>
                    <input 
                      type="text" 
                      value={projectForm.location} 
                      onChange={(e) => setProjectForm({ ...projectForm, location: e.target.value })} 
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700" 
                      placeholder="e.g. Phnom Penh, Cambodia"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Project Budget / Price</label>
                    <input 
                      type="text" 
                      value={projectForm.price} 
                      onChange={(e) => setProjectForm({ ...projectForm, price: e.target.value })} 
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700" 
                      placeholder="e.g. $25,000"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Client</label>
                    <input 
                      type="text" 
                      value={projectForm.client} 
                      onChange={(e) => setProjectForm({ ...projectForm, client: e.target.value })} 
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700" 
                      placeholder="e.g. Krohom Bookstore"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Project Scope</label>
                  <input 
                    type="text" 
                    value={projectForm.scope} 
                    onChange={(e) => setProjectForm({ ...projectForm, scope: e.target.value })} 
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700" 
                    placeholder="e.g. Exterior & Interior Visualization"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Key Features (Comma separated)</label>
                  <input 
                    type="text" 
                    value={projectForm.features} 
                    onChange={(e) => setProjectForm({ ...projectForm, features: e.target.value })} 
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700" 
                    placeholder="Sustainable design, Natural lighting, Community areas"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Challenges (Comma separated)</label>
                  <input 
                    type="text" 
                    value={projectForm.challenges} 
                    onChange={(e) => setProjectForm({ ...projectForm, challenges: e.target.value })} 
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700" 
                    placeholder="Optimizing natural light, Narrow land size"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Solutions (Comma separated)</label>
                  <input 
                    type="text" 
                    value={projectForm.solutions} 
                    onChange={(e) => setProjectForm({ ...projectForm, solutions: e.target.value })} 
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700" 
                    placeholder="Open plan layout, Custom skylights"
                  />
                </div>

                <div className="flex items-center gap-3 bg-zinc-950 p-3.5 rounded-xl border border-zinc-850">
                  <input 
                    type="checkbox" 
                    id="is_featured"
                    checked={projectForm.is_featured} 
                    onChange={(e) => setProjectForm({ ...projectForm, is_featured: e.target.checked })} 
                    className="w-4 h-4 accent-primary rounded bg-zinc-900 border-zinc-800"
                  />
                  <label htmlFor="is_featured" className="text-xs font-bold text-zinc-300 uppercase cursor-pointer select-none">
                    Feature on Front Page Showcase
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Description</label>
                  <textarea 
                    rows={3} 
                    required 
                    value={projectForm.description} 
                    onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })} 
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700 resize-none" 
                    placeholder="Narrative detail block about the architectural style..."
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <Button type="button" variant="ghost" onClick={() => setShowProjectModal(false)} className="text-zinc-400 hover:text-white">
                  Cancel
                </Button>
                <Button type="submit" className="bg-primary text-black font-bold px-6" style={{ backgroundColor: '#9ACD32', color: '#000' }}>
                  {editingProject ? "Save Showcase" : "Publish Showcase"}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* 3. SYLLABUS LESSONS MANAGER MODAL */}
        {showSyllabusModal && activeSyllabusCourse && (() => {
          const courseLessons = lessons.filter(l => l.course_id === activeSyllabusCourse.course_id || l.course_id === activeSyllabusCourse.id)

          return (
            <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-40 p-4">
              <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto space-y-6 animate-in fade-in zoom-in-95 duration-150 custom-scrollbar text-zinc-300">
                <div className="flex justify-between items-start border-b border-zinc-800 pb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">Syllabus Editor: {activeSyllabusCourse.title}</h3>
                    <p className="text-xs text-zinc-500 mt-1">Manage, add, and re-order lessons modules in the curriculum.</p>
                  </div>
                  <Button 
                    onClick={() => {
                      setEditingLesson(null)
                      setLessonForm({
                        title: "",
                        video_url: "",
                        duration: "600",
                        index: (courseLessons.length + 1).toString(),
                        source: "direct",
                        downloadable_asset_url: ""
                      })
                      setShowLessonModal(true)
                    }}
                    className="bg-primary text-black font-semibold flex items-center gap-1 text-xs px-4" 
                    style={{ backgroundColor: '#9ACD32', color: '#000' }}
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Lesson
                  </Button>
                </div>

                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                  {courseLessons.length === 0 ? (
                    <p className="text-xs text-zinc-500 italic text-center py-6">No lessons exist in this syllabus yet.</p>
                  ) : (
                    courseLessons.map((les) => (
                      <div key={les.lesson_id} className="p-3 bg-zinc-950 rounded-xl border border-zinc-850 flex justify-between items-center gap-4">
                        <div>
                          <h5 className="text-xs font-semibold text-white">
                            {les.order_index || 1}. {les.title}
                          </h5>
                          <p className="text-[10px] text-zinc-500 mt-0.5 font-mono">ID: {les.video_external_id || "N/A"} • {les.duration_minutes || 0} mins</p>
                        </div>
                        <div className="flex gap-1.5">
                          <Button 
                            onClick={() => {
                              setEditingLesson(les)
                              setLessonForm({
                                title: les.title,
                                video_url: les.video_external_id || "",
                                duration: ((les.duration_minutes || 10) * 60).toString(),
                                index: (les.order_index || 1).toString(),
                                source: les.video_source_type || "direct",
                                downloadable_asset_url: les.downloadable_asset_url || ""
                              })
                              setShowLessonModal(true)
                            }}
                            size="sm" 
                            variant="ghost" 
                            className="hover:bg-zinc-800 text-zinc-400 hover:text-white"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </Button>
                          <Button 
                            onClick={() => handleDeleteLesson(les.lesson_id)}
                            size="sm" 
                            variant="ghost" 
                            className="hover:bg-red-950/20 text-red-400 hover:text-red-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-2 border-t border-zinc-800 flex justify-end">
                  <Button onClick={() => setShowSyllabusModal(false)} variant="outline" className="border-zinc-850 px-6">
                    Close Syllabus Editor
                  </Button>
                </div>
              </div>
            </div>
          )
        })()}

        {/* 4. LESSON FORM DIALOG (SUB-MODAL) */}
        {showLessonModal && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <form onSubmit={handleSaveLesson} className="bg-zinc-950 border border-zinc-850 p-6 rounded-2xl max-w-md w-full space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div>
                <h4 className="text-lg font-bold text-white">{editingLesson ? "Modify Lesson Module" : "Add Lesson Module"}</h4>
                <p className="text-xs text-zinc-500 mt-1">Specify title, video provider hash ID, and sequence indexes.</p>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">Lesson Title</label>
                  <input 
                    type="text" 
                    required 
                    value={lessonForm.title} 
                    onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })} 
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-zinc-700" 
                    placeholder="e.g. 1. Intro to D5 Workspace"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">Video Source</label>
                  <select
                    value={lessonForm.source}
                    onChange={(e) => setLessonForm({ ...lessonForm, source: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-zinc-700"
                  >
                    <option value="direct">Direct MP4 URL</option>
                    <option value="bunny">Bunny Stream (video ID)</option>
                  </select>
                </div>

                <div>
                  {lessonForm.source === 'bunny' ? (
                    <>
                      <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">Bunny Video ID</label>
                      <input
                        type="text"
                        required
                        value={lessonForm.video_url}
                        onChange={(e) => setLessonForm({ ...lessonForm, video_url: e.target.value })}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-zinc-700 font-mono"
                        placeholder="e.g. 9f8c7e6d-1a2b-3c4d-5e6f-7a8b9c0d1e2f"
                      />
                      <p className="text-[10px] text-zinc-500 mt-1">The video GUID from your Bunny Stream library. Playback is signed server-side and expires after 2 hours.</p>
                    </>
                  ) : (
                    <>
                      <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">Video URL (direct .mp4 link)</label>
                      <input
                        type="text"
                        required
                        value={lessonForm.video_url}
                        onChange={(e) => setLessonForm({ ...lessonForm, video_url: e.target.value })}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-zinc-700 font-mono"
                        placeholder="https://your-cdn.com/lesson-01.mp4"
                      />
                      <p className="text-[10px] text-zinc-500 mt-1">Must be a direct video file URL (.mp4). YouTube/Vimeo page links will not play in the classroom player.</p>
                    </>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">Duration (Seconds)</label>
                    <input 
                      type="number" 
                      required 
                      value={lessonForm.duration} 
                      onChange={(e) => setLessonForm({ ...lessonForm, duration: e.target.value })} 
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-zinc-700 font-mono" 
                      placeholder="600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">Sequence Order Index</label>
                    <input 
                      type="number" 
                      required 
                      value={lessonForm.index} 
                      onChange={(e) => setLessonForm({ ...lessonForm, index: e.target.value })} 
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-zinc-700 font-mono" 
                      placeholder="1"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Downloadable Resource / Attachment (Optional)</label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input 
                        type="text" 
                        value={lessonForm.downloadable_asset_url} 
                        onChange={(e) => setLessonForm({ ...lessonForm, downloadable_asset_url: e.target.value })} 
                        className="flex-grow bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-zinc-700 font-mono text-[10px]" 
                        placeholder="e.g. https://drive.google.com/... or leave blank"
                      />
                      <input
                        type="file"
                        onChange={handleLessonAssetUpload}
                        className="hidden"
                        id="lesson-asset-file"
                        disabled={uploadingLessonAsset}
                      />
                      <label
                        htmlFor="lesson-asset-file"
                        className={`bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center justify-center cursor-pointer transition-colors border border-zinc-800 shrink-0 ${uploadingLessonAsset ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {uploadingLessonAsset ? 'Uploading...' : 'Choose File'}
                      </label>
                    </div>
                    <p className="text-[10px] text-zinc-500">Provide a link (Google Drive, Dropbox) or upload a file directly. Students will see this attachment on the lesson player view.</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-1">
                <Button type="button" variant="ghost" onClick={() => setShowLessonModal(false)} className="text-zinc-500 hover:text-white text-xs">
                  Cancel
                </Button>
                <Button type="submit" className="bg-primary text-black font-bold text-xs px-5" style={{ backgroundColor: '#9ACD32', color: '#000' }}>
                  {editingLesson ? "Save Lesson" : "Add Lesson"}
                </Button>
              </div>
            </form>
          </div>
        )}
          </div>

        </div>
      </div>

      <Footer />
    </main>
  )
}

