"use client"

import { useState, useEffect, use } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { ArrowLeft, Plus, Trash2, Upload, Loader2 } from "lucide-react"
import Swal from "sweetalert2"
import { d5Modules } from "@/lib/courses-data"

const MySwal = Swal.mixin({
  customClass: {
    confirmButton: 'bg-primary text-black font-bold px-6 py-2 rounded-xl mx-2',
    cancelButton: 'bg-zinc-800 text-white font-bold px-6 py-2 rounded-xl mx-2'
  },
  buttonsStyling: false
})

export default function EditCoursePage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const params = useParams<{ courseId: string }>()
  const courseId = params?.courseId
  const supabase = createClient()

  const [plans, setPlans] = useState<any[]>([])
  const [fetching, setFetching] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingIntro, setUploadingIntro] = useState(false)
  
  const [courseForm, setCourseForm] = useState({
    title: "",
    slug: "",
    description: "",
    image: "",
    category: "",
    duration: "",
    level: "Intermediate",
    price: "49.99",
    instructor: "Bun Sambath",
    courseCategory: "",
    requiredPlanId: "",
    published: true,
    lessons: "0",
    introductionUrl: ""
  })

  const [features, setFeatures] = useState<string[]>([])

  // Modules & Course Lessons State
  const [modules, setModules] = useState<any[]>([])
  const [courseLessons, setCourseLessons] = useState<any[]>([])
  const [loadingModules, setLoadingModules] = useState(false)
  const [showModuleModal, setShowModuleModal] = useState(false)
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null)
  const [savingModule, setSavingModule] = useState(false)
  const [moduleForm, setModuleForm] = useState({
    title: "",
    description: "",
    cover_image_url: "",
    order_index: 1,
    is_published: true,
    selectedLessonIds: [] as string[]
  })

  // Quick Syllabus Lesson Assignment State
  const [targetAssignModule, setTargetAssignModule] = useState<any | null>(null)
  const [assignLessonIds, setAssignLessonIds] = useState<string[]>([])
  const [savingAssign, setSavingAssign] = useState(false)

  const loadCourseLessons = async (cId: string, loadedModules: any[] = modules) => {
    try {
      const targetSlug = courseForm.slug || cId

      // 1. Fetch DB lessons using admin API endpoint (bypasses RLS & resolves all course aliases)
      let dbList: any[] = []
      try {
        const res = await fetch(`/api/admin/lessons?courseId=${encodeURIComponent(cId)}`)
        if (res.ok) {
          const json = await res.json()
          if (json.success && Array.isArray(json.lessons)) {
            dbList = json.lessons
          }
        }
      } catch (err) {
        console.warn("API /api/admin/lessons call failed, fallback to direct query:", err)
        const { data } = await supabase
          .from('lessons')
          .select('*')
          .or(`course_id.eq.${cId},course_id.eq.${targetSlug}`)
          .order('order_index', { ascending: true })
        if (data) dbList = data
      }

      // 2. Gather template/syllabus lessons from loadedModules or d5Modules
      let templateLessons: any[] = []
      const fromModules = (loadedModules || []).flatMap((m: any) => m.lessons || [])
      if (fromModules.length > 0) {
        templateLessons = [...fromModules]
      }

      const isD5 = cId.toLowerCase().includes('d5') || targetSlug.toLowerCase().includes('d5')
      if (isD5) {
        const d5Syllabus = d5Modules.flatMap((m: any) => m.lessons || [])
        const existingKeys = new Set(templateLessons.map((l: any) => l.lesson_id || l.title))
        for (const d5l of d5Syllabus) {
          const key = d5l.lesson_id || d5l.title
          if (!existingKeys.has(key)) {
            templateLessons.push(d5l)
          }
        }
      }

      // 3. Merge template lessons with DB lessons (DB lessons override template lessons)
      const lessonMap = new Map<string, any>()

      // Add template lessons first
      templateLessons.forEach((tLes: any, idx: number) => {
        const key = tLes.lesson_id || tLes.title
        lessonMap.set(key, {
          lesson_id: tLes.lesson_id || `temp-les-${idx}`,
          course_id: cId,
          module_id: tLes.module_id || null,
          title: tLes.title,
          video_external_id: tLes.video_external_id || tLes.video_url || null,
          duration_minutes: tLes.duration_minutes || 10,
          order_index: tLes.order_index ?? idx + 1,
          is_preview: Boolean(tLes.is_preview)
        })
      })

      // Add DB lessons (updates module_id and custom fields)
      dbList.forEach((dbLes: any, idx: number) => {
        const key = dbLes.lesson_id || dbLes.title
        const existing = lessonMap.get(key)
        lessonMap.set(key, {
          ...(existing || {}),
          ...dbLes,
          duration_minutes: dbLes.duration_minutes || (existing?.duration_minutes ?? 10),
          order_index: dbLes.order_index ?? existing?.order_index ?? idx + 1
        })
      })

      const mergedList = Array.from(lessonMap.values()).sort(
        (a, b) => (a.order_index || 0) - (b.order_index || 0)
      )

      setCourseLessons(mergedList)
    } catch (err) {
      console.error("Failed to load course lessons:", err)
    }
  }

  const handleOpenAssignLessons = (mod: any) => {
    setTargetAssignModule(mod)
    // Pre-select lessons currently assigned to this module
    const currentlyAssigned = courseLessons
      .filter((l) => l.module_id === mod.module_id)
      .map((l) => l.lesson_id)
    setAssignLessonIds(currentlyAssigned)
  }

  const handleSaveAssignLessons = async () => {
    if (!targetAssignModule || !courseId) return
    setSavingAssign(true)
    try {
      const finalSelectedIds: string[] = []

      // 1. Process selected lessons (create DB records for temp lessons first)
      for (const lesId of assignLessonIds) {
        if (lesId.startsWith('temp-les-')) {
          const les = courseLessons.find(l => l.lesson_id === lesId)
          if (les) {
            const createRes = await fetch('/api/admin/lessons', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                course_id: courseId,
                module_id: targetAssignModule.module_id,
                title: les.title,
                video_source_type: les.video_source_type || 'direct',
                video_external_id: les.video_external_id || '',
                duration_minutes: les.duration_minutes || 10,
                order_index: les.order_index || 1,
                is_preview: Boolean(les.is_preview)
              })
            })
            if (createRes.ok) {
              const json = await createRes.json().catch(() => ({}))
              if (json.lesson?.lesson_id) {
                finalSelectedIds.push(json.lesson.lesson_id)
              }
            }
          }
        } else {
          finalSelectedIds.push(lesId)
        }
      }

      // 2. Update module bindings with valid DB lesson IDs
      const res = await fetch("/api/admin/modules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          module_id: targetAssignModule.module_id,
          selected_lesson_ids: finalSelectedIds
        })
      })

      if (res.ok) {
        setTargetAssignModule(null)
        loadModules(courseId)
        MySwal.fire({
          icon: "success",
          title: "Syllabus Lessons Assigned to Module!",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 2000
        })
      } else {
        const data = await res.json().catch(() => ({}))
        alert(data.error || "Failed to assign lessons")
      }
    } catch (err: any) {
      alert(err.message || "Failed to assign lessons")
    } finally {
      setSavingAssign(false)
    }
  }

  const loadModules = async (cId: string) => {
    try {
      setLoadingModules(true)
      const res = await fetch(`/api/admin/modules?courseId=${cId}`)
      if (res.ok) {
        const json = await res.json()
        if (json.success && Array.isArray(json.modules)) {
          setModules(json.modules)
          loadCourseLessons(cId, json.modules)
        }
      }
    } catch (err) {
      console.error("Failed to load course modules:", err)
    } finally {
      setLoadingModules(false)
    }
  }

  const handleOpenCreateModule = () => {
    setEditingModuleId(null)
    setModuleForm({
      title: "",
      description: "",
      cover_image_url: "",
      order_index: modules.length + 1,
      is_published: true,
      selectedLessonIds: []
    })
    setShowModuleModal(true)
  }

  const handleOpenEditModule = (mod: any) => {
    setEditingModuleId(mod.module_id)
    const currentLessonIds = (mod.lessons || []).map((l: any) => l.lesson_id)
    setModuleForm({
      title: mod.title || "",
      description: mod.description || "",
      cover_image_url: mod.cover_image_url || mod.cover_image || "",
      order_index: mod.order_index || 1,
      is_published: mod.is_published !== false,
      selectedLessonIds: currentLessonIds
    })
    setShowModuleModal(true)
  }

  const handleSaveModule = async () => {
    if (!moduleForm.title || !courseId) return
    setSavingModule(true)
    try {
      const finalSelectedIds: string[] = []

      // 1. Process selected lessons
      for (const lesId of moduleForm.selectedLessonIds) {
        if (lesId.startsWith('temp-les-')) {
          const les = courseLessons.find(l => l.lesson_id === lesId)
          if (les) {
            const createRes = await fetch('/api/admin/lessons', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                course_id: courseId,
                title: les.title,
                video_source_type: les.video_source_type || 'direct',
                video_external_id: les.video_external_id || '',
                duration_minutes: les.duration_minutes || 10,
                order_index: les.order_index || 1,
                is_preview: Boolean(les.is_preview)
              })
            })
            if (createRes.ok) {
              const json = await createRes.json().catch(() => ({}))
              if (json.lesson?.lesson_id) {
                finalSelectedIds.push(json.lesson.lesson_id)
              }
            }
          }
        } else {
          finalSelectedIds.push(lesId)
        }
      }

      // 2. Save module
      const url = "/api/admin/modules"
      const method = editingModuleId ? "PUT" : "POST"
      const payload = {
        ...moduleForm,
        course_id: courseId,
        selected_lesson_ids: finalSelectedIds,
        ...(editingModuleId ? { module_id: editingModuleId } : {})
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        setShowModuleModal(false)
        loadModules(courseId)
        MySwal.fire({
          icon: "success",
          title: editingModuleId ? "Module Updated" : "Module Created",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 2000
        })
      } else {
        const data = await res.json().catch(() => ({}))
        alert(data.error || "Failed to save module")
      }
    } catch (err: any) {
      alert(err.message || "Failed to save module")
    } finally {
      setSavingModule(false)
    }
  }

  const handleDeleteModule = async (mId: string) => {
    const confirm = await MySwal.fire({
      icon: "warning",
      title: "Delete Module?",
      text: "This will remove the module group. Lessons in this module will be preserved.",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel"
    })

    if (!confirm.isConfirmed) return

    try {
      const res = await fetch(`/api/admin/modules?moduleId=${mId}`, { method: "DELETE" })
      if (res.ok) {
        loadModules(courseId!)
        MySwal.fire({
          icon: "success",
          title: "Module Deleted",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 2000
        })
      } else {
        const data = await res.json()
        alert(data.error || "Failed to delete module")
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete module")
    }
  }

  useEffect(() => {
    if (!loading && (!user || profile?.role !== 'admin')) {
      router.replace("/")
    }
  }, [user, profile, loading, router])

  useEffect(() => {
    async function loadData() {
      if (!courseId) return
      try {
        setFetching(true)
        
        // 1. Fetch plans
        const { data: plansData } = await supabase
          .from('subscription_plans')
          .select('*')
          .order('price_usd', { ascending: true })
        if (plansData) setPlans(plansData)

        // 2. Fetch course
        const { data: course, error } = await supabase
          .from('courses')
          .select('*')
          .or(`course_id.eq.${courseId},slug.eq.${courseId}`)
          .maybeSingle()

        if (error) throw error

        if (course) {
          setCourseForm({
            title: course.title || "",
            slug: course.slug || "",
            description: course.description || "",
            image: course.thumbnail_url || "",
            category: course.software_used || "",
            duration: course.duration || "",
            level: course.difficulty ? (course.difficulty.charAt(0).toUpperCase() + course.difficulty.slice(1)) : "Intermediate",
            price: (course.price || "49.99").toString(),
            instructor: course.instructor || "Bun Sambath",
            courseCategory: course.category || "",
            requiredPlanId: course.required_plan_id != null ? String(course.required_plan_id) : "",
            published: course.is_published !== false,
            lessons: (course.lessons || 0).toString(),
            introductionUrl: course.introduction_url || ""
          })

          setFeatures(Array.isArray(course.features) ? course.features : [])
          loadModules(courseId)
          loadCourseLessons(courseId)
        }
      } catch (err: any) {
        MySwal.fire({
          icon: 'error',
          title: 'Error Loading Course',
          text: err.message || "Failed to load course details."
        })
        router.push("/admin?tab=courses")
      } finally {
        setFetching(false)
      }
    }

    if (user && profile?.role === 'admin') {
      loadData()
    }
  }, [courseId, supabase, user, profile, router])

  const handleAddFeature = () => {
    setFeatures([...features, ""])
  }

  const handleRemoveFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index))
  }

  const handleFeatureChange = (index: number, value: string) => {
    const updated = [...features]
    updated[index] = value
    setFeatures(updated)
  }

  const handleIntroductionUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingIntro(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`
      const filePath = `introductions/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('projects')
        .upload(filePath, file, {
          contentType: file.type,
          cacheControl: '31536000',
          upsert: true
        })

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('projects')
        .getPublicUrl(filePath)

      setCourseForm(prev => ({ ...prev, introductionUrl: data.publicUrl }))
    } catch (err: any) {
      MySwal.fire({ icon: 'error', title: 'Upload Failed', text: `Upload failed: ${err.message}` })
    } finally {
      setUploadingIntro(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const courseSlug = courseForm.slug.trim()
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(courseSlug)) {
      MySwal.fire({
        icon: 'error',
        title: 'Invalid Slug',
        text: 'Invalid slug. Use only lowercase letters, numbers, and hyphens - e.g. "d5-masterclass".'
      })
      return
    }

    setSaving(true)
    const requiredPlanId = courseForm.requiredPlanId ? parseInt(courseForm.requiredPlanId) : null
    const difficultyVal = courseForm.level.toLowerCase().trim()
    
    const payload = {
      title: courseForm.title.trim(),
      slug: courseSlug,
      description: courseForm.description,
      thumbnail_url: courseForm.image.trim(),
      software_used: courseForm.category.trim(),
      difficulty: ['beginner', 'intermediate', 'advanced'].includes(difficultyVal) ? difficultyVal : 'intermediate',
      price: parseFloat(courseForm.price) || 0,
      instructor: courseForm.instructor.trim() || null,
      category: courseForm.courseCategory.replace(/\s+/g, ' ').trim() || null,
      required_plan_id: requiredPlanId && Number.isInteger(requiredPlanId) ? requiredPlanId : null,
      is_published: courseForm.published,
      duration: courseForm.duration.trim() || null,
      lessons: parseInt(courseForm.lessons) || 0,
      features: features.map(f => f.trim()).filter(Boolean),
      introduction_url: courseForm.introductionUrl.trim() || null
    }

    try {
      const { error } = await supabase
        .from('courses')
        .update(payload)
        .eq('course_id', courseId)

      if (error) throw error

      await MySwal.fire({
        icon: 'success',
        title: 'Saved!',
        text: "Course changes saved successfully!"
      })
      router.push("/admin?tab=courses")
    } catch (err: any) {
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: `Failed to save course: ${err.message}`
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading || fetching || !user || profile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" style={{ borderTopColor: '#9ACD32' }} />
      </div>
    )
  }

  return (
    <main className="min-h-screen flex flex-col justify-between" style={{ backgroundColor: '#060010' }}>
      <Navigation />

      <div className="flex-grow container mx-auto px-6 py-24 md:py-32 max-w-5xl relative">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/admin?tab=courses">
            <Button variant="ghost" className="text-zinc-400 hover:text-white p-2 rounded-xl border border-zinc-800">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">Modify Masterclass</h1>
            <p className="text-sm text-zinc-400">Update course metadata, pricing, features, and landing page details.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-zinc-900/40 border border-zinc-800 p-8 rounded-3xl space-y-8 backdrop-blur-md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Title */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Course Title</label>
              <input
                type="text"
                required
                value={courseForm.title}
                onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700"
                placeholder="e.g. Photoshop Masterclass"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5 font-mono">Slug (URL string)</label>
              <input
                type="text"
                required
                value={courseForm.slug}
                onChange={(e) => setCourseForm({ ...courseForm, slug: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700 font-mono"
                placeholder="e.g. photoshop-masterclass"
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                title="Lowercase letters, numbers, and hyphens only."
              />
              <p className="text-[10px] text-zinc-500 mt-1">Used for the URL path. No spaces or uppercase letters allowed.</p>
            </div>

            {/* Price */}
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

            {/* Instructor */}
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Instructor Name</label>
              <input
                type="text"
                required
                value={courseForm.instructor}
                onChange={(e) => setCourseForm({ ...courseForm, instructor: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700"
                placeholder="e.g. Bun Sambath"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Category Group</label>
              <input
                type="text"
                required
                value={courseForm.courseCategory}
                onChange={(e) => setCourseForm({ ...courseForm, courseCategory: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700"
                placeholder="e.g. Post-Production"
              />
              <p className="text-[10px] text-zinc-500 mt-1">Filters courses by this tag on the catalog page.</p>
            </div>

            {/* Level */}
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Difficulty Level</label>
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

            {/* Duration */}
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Duration</label>
              <input
                type="text"
                required
                value={courseForm.duration}
                onChange={(e) => setCourseForm({ ...courseForm, duration: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700"
                placeholder="e.g. 6 weeks"
              />
            </div>

            {/* Lessons */}
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5 font-mono">Lessons Count</label>
              <input
                type="number"
                required
                value={courseForm.lessons}
                onChange={(e) => setCourseForm({ ...courseForm, lessons: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700 font-mono"
                placeholder="e.g. 45"
              />
            </div>

            {/* Software Used */}
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Software Used</label>
              <input
                type="text"
                required
                value={courseForm.category}
                onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700"
                placeholder="e.g. Photoshop, Lightroom"
              />
            </div>

            {/* Access Requirement */}
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
                    Requires Plan: {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Visibility */}
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

            {/* Image Thumbnail */}
            <div className="md:col-span-2">
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

            {/* Video Introduction */}
            <div className="md:col-span-2 border-t border-zinc-800 pt-6">
              <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">
                Video Introduction (URL or Video File)
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={courseForm.introductionUrl}
                  onChange={(e) => setCourseForm({ ...courseForm, introductionUrl: e.target.value })}
                  className="flex-grow bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700"
                  placeholder="Paste YouTube, Vimeo, or MP4 URL..."
                />
                <div className="relative shrink-0">
                  <input
                    type="file"
                    id="intro-upload"
                    accept="video/*"
                    onChange={handleIntroductionUpload}
                    disabled={uploadingIntro}
                    className="hidden"
                  />
                  <label
                    htmlFor="intro-upload"
                    className={`bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold px-4 py-3 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors border border-zinc-800 h-full ${uploadingIntro ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {uploadingIntro ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Upload Video
                      </>
                    )}
                  </label>
                </div>
              </div>
              <p className="text-[10px] text-zinc-500 mt-1">
                Provide an external link (YouTube, Vimeo, MP4 file) or upload an introduction video file from your computer directly.
                <br />
                <span className="text-amber-500/90 font-medium font-sans">💡 Tip for Instant Playback:</span> Before uploading, encode the video using H.264 at 720p/1080p, and make sure &quot;Fast Start&quot; (Web Optimized) is checked in your encoder. This moves metadata to the front of the file so users can stream progressive downloads immediately.
              </p>
            </div>

            {/* Description Summary */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Description Summary</label>
              <textarea
                rows={4}
                required
                value={courseForm.description}
                onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700 resize-none"
                placeholder="Brief description of the course contents and curriculum..."
              />
            </div>

            {/* Dynamic Features List */}
            <div className="md:col-span-2 border-t border-zinc-800 pt-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wide">Key Features & Bullet Points</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">These will render as key bullet features on the course details landing page.</p>
                </div>
                <Button
                  type="button"
                  onClick={handleAddFeature}
                  className="bg-zinc-800 hover:bg-zinc-750 text-white font-semibold flex items-center gap-1.5 px-4 py-2 text-xs rounded-xl"
                >
                  <Plus className="w-4 h-4" />
                  Add Feature
                </Button>
              </div>

              {features.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-zinc-800 rounded-2xl text-xs text-zinc-500">
                  No features added yet. Click "Add Feature" above to list key curriculum highlights.
                </div>
              ) : (
                <div className="space-y-3">
                  {features.map((feature, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        required
                        value={feature}
                        onChange={(e) => handleFeatureChange(idx, e.target.value)}
                        placeholder={`e.g. Advanced post-production workflows (${idx + 1})`}
                        className="flex-grow bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700"
                      />
                      <Button
                        type="button"
                        onClick={() => handleRemoveFeature(idx)}
                        variant="ghost"
                        className="text-red-400 hover:bg-red-950/20 hover:text-red-300 p-3 rounded-xl border border-red-950/30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Course Modules Management Section */}
            <div className="md:col-span-2 border-t border-zinc-800 pt-8 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-base font-bold text-white uppercase tracking-wide flex items-center gap-2">
                    <span>Course Modules</span>
                    <span className="text-xs font-normal text-zinc-400 font-mono">({modules.length} modules)</span>
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">Manage the 3-tier hierarchy: Course → Modules → Lessons</p>
                </div>
                <Button
                  type="button"
                  onClick={handleOpenCreateModule}
                  className="bg-[#9ACD32]/10 hover:bg-[#9ACD32]/20 text-[#9ACD32] border border-[#9ACD32]/30 font-semibold flex items-center gap-1.5 px-4 py-2 text-xs rounded-xl"
                >
                  <Plus className="w-4 h-4" />
                  Add Module
                </Button>
              </div>

              {loadingModules ? (
                <div className="flex items-center justify-center py-8 text-zinc-500 gap-2 text-xs">
                  <Loader2 className="w-4 h-4 animate-spin text-[#9ACD32]" />
                  <span>Loading modules...</span>
                </div>
              ) : modules.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-zinc-800 rounded-2xl text-xs text-zinc-500">
                  No modules created yet. Click "Add Module" above to group course lessons into modules.
                </div>
              ) : (
                <div className="space-y-3">
                  {modules.map((mod: any, idx: number) => (
                    <div
                      key={mod.module_id || idx}
                      className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0 flex-grow">
                        <div className="w-24 aspect-video rounded-xl bg-black/60 border border-zinc-800 shrink-0 overflow-hidden relative">
                          {mod.cover_image_url || mod.cover_image ? (
                            <img src={mod.cover_image_url || mod.cover_image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-zinc-600 font-mono">No Cover</div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#9ACD32]/10 text-[#9ACD32] border border-[#9ACD32]/20">
                              Module {String(mod.order_index || idx + 1).padStart(2, '0')}
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono">
                              {mod.lessons?.length || 0} Lessons
                            </span>
                          </div>
                          <h4 className="text-sm font-semibold text-white truncate">{mod.title}</h4>
                          {mod.description && (
                            <p className="text-xs text-zinc-400 line-clamp-1 mt-0.5">{mod.description}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => handleOpenAssignLessons(mod)}
                          className="text-xs text-[#9ACD32] hover:bg-[#9ACD32]/10 border border-[#9ACD32]/30 px-3 py-1.5 rounded-lg flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Assign Lessons
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => handleOpenEditModule(mod)}
                          className="text-xs text-zinc-300 hover:text-white bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg"
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => handleDeleteModule(mod.module_id)}
                          className="text-xs text-red-400 hover:bg-red-950/20 bg-zinc-900 border border-zinc-800 p-2 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-zinc-800">
            <Link href="/admin?tab=courses">
              <Button type="button" variant="ghost" className="text-zinc-400 hover:text-white border border-zinc-800 hover:bg-zinc-850 px-6 rounded-xl">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={saving}
              className="bg-primary text-black font-bold px-8 rounded-xl"
              style={{ backgroundColor: '#9ACD32', color: '#000' }}
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>

      {/* Module Add/Edit Dialog Modal */}
      {showModuleModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-3xl max-w-lg w-full space-y-6">
            <h3 className="text-xl font-bold text-white">
              {editingModuleId ? "Edit Course Module" : "Add New Course Module"}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">Module Title</label>
                <input
                  type="text"
                  required
                  value={moduleForm.title}
                  onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                  placeholder="e.g. 01. Introduction & Overview"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">Order Index</label>
                <input
                  type="number"
                  required
                  value={moduleForm.order_index}
                  onChange={(e) => setModuleForm({ ...moduleForm, order_index: Number(e.target.value) })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">Cover Image URL</label>
                <input
                  type="text"
                  value={moduleForm.cover_image_url}
                  onChange={(e) => setModuleForm({ ...moduleForm, cover_image_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">Description</label>
                <textarea
                  rows={3}
                  value={moduleForm.description}
                  onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                  placeholder="Brief description of lessons included in this module..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700 resize-none"
                />
              </div>

              {/* Bind Course Lessons Checklist */}
              <div className="border-t border-zinc-800 pt-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-zinc-400 uppercase">
                    Bind Course Lessons ({moduleForm.selectedLessonIds.length} selected)
                  </label>
                  {courseLessons.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const allIds = courseLessons.map((l) => l.lesson_id)
                        const allSelected = allIds.every((id) => moduleForm.selectedLessonIds.includes(id))
                        setModuleForm((prev) => ({
                          ...prev,
                          selectedLessonIds: allSelected ? [] : allIds
                        }))
                      }}
                      className="text-[10px] text-[#9ACD32] hover:underline"
                    >
                      {courseLessons.every((l) => moduleForm.selectedLessonIds.includes(l.lesson_id))
                        ? "Deselect All"
                        : "Select All"}
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-zinc-500 mb-2">
                  Select existing lessons in this course to attach to this module:
                </p>
                {courseLessons.length === 0 ? (
                  <p className="text-xs text-zinc-600 italic py-2">No lessons exist in this course yet.</p>
                ) : (
                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 border border-zinc-800 rounded-xl p-2.5 bg-zinc-950">
                    {courseLessons.map((les: any) => {
                      const isChecked = moduleForm.selectedLessonIds.includes(les.lesson_id)
                      return (
                        <label
                          key={les.lesson_id}
                          className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer border transition-colors ${
                            isChecked
                              ? 'bg-[#9ACD32]/10 border-[#9ACD32]/30 text-white'
                              : 'bg-zinc-900 border-zinc-850 text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                const checked = e.target.checked
                                setModuleForm((prev) => ({
                                  ...prev,
                                  selectedLessonIds: checked
                                    ? [...prev.selectedLessonIds, les.lesson_id]
                                    : prev.selectedLessonIds.filter((id) => id !== les.lesson_id)
                                }))
                              }}
                              className="w-4 h-4 rounded bg-zinc-950 border-zinc-800 text-[#9ACD32] focus:ring-0 shrink-0"
                            />
                            <span className="truncate font-medium">{les.title}</span>
                          </div>
                          <span className="text-[10px] font-mono text-zinc-500 shrink-0 ml-2">
                            {les.duration_minutes || 0}m
                          </span>
                        </label>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowModuleModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSaveModule}
                disabled={savingModule}
                className="bg-[#9ACD32] text-black font-bold px-6 rounded-xl hover:bg-[#8ab82b]"
              >
                {savingModule ? "Saving..." : editingModuleId ? "Update Module" : "Create Module"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Syllabus Lessons to Module Modal */}
      {targetAssignModule && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-3xl max-w-lg w-full space-y-6">
            <div>
              <h3 className="text-xl font-bold text-white">Assign Syllabus Lessons</h3>
              <p className="text-xs text-zinc-400 mt-1">
                Module: <span className="text-[#9ACD32] font-semibold">{targetAssignModule.title}</span>
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-400 uppercase">
                  Select Lessons from Course Syllabus ({assignLessonIds.length} selected)
                </label>
                {courseLessons.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const allIds = courseLessons.map((l) => l.lesson_id)
                      const allSelected = allIds.every((id) => assignLessonIds.includes(id))
                      setAssignLessonIds(allSelected ? [] : allIds)
                    }}
                    className="text-[10px] text-[#9ACD32] hover:underline"
                  >
                    {courseLessons.every((l) => assignLessonIds.includes(l.lesson_id)) ? "Deselect All" : "Select All"}
                  </button>
                )}
              </div>

              {courseLessons.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-zinc-800 rounded-2xl">
                  <p className="text-xs text-zinc-400">No lessons created in the course syllabus yet.</p>
                  <p className="text-[11px] text-zinc-500 mt-1">Add lessons in the Syllabus Editor to assign them here.</p>
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto space-y-2 pr-1 border border-zinc-800 rounded-xl p-3 bg-zinc-950">
                  {courseLessons.map((les: any) => {
                    const isChecked = assignLessonIds.includes(les.lesson_id)
                    return (
                      <label
                        key={les.lesson_id}
                        className={`flex items-center justify-between p-2.5 rounded-xl text-xs cursor-pointer border transition-colors ${
                          isChecked
                            ? 'bg-[#9ACD32]/10 border-[#9ACD32]/30 text-white'
                            : 'bg-zinc-900 border-zinc-850 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const checked = e.target.checked
                              setAssignLessonIds((prev) =>
                                checked
                                  ? [...prev, les.lesson_id]
                                  : prev.filter((id) => id !== les.lesson_id)
                              )
                            }}
                            className="w-4 h-4 rounded bg-zinc-950 border-zinc-800 text-[#9ACD32] focus:ring-0 shrink-0"
                          />
                          <span className="truncate font-medium">{les.title}</span>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-500 shrink-0 ml-2">
                          {les.duration_minutes || 0}m
                        </span>
                      </label>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-zinc-800">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setTargetAssignModule(null)}
                className="text-zinc-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSaveAssignLessons}
                disabled={savingAssign}
                className="bg-[#9ACD32] text-black font-bold px-6 rounded-xl hover:bg-[#8ab82b]"
              >
                {savingAssign ? "Saving..." : "Save Assignment"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </main>
  )
}
