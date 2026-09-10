"use client"

import * as React from "react"
import { useState, useEffect, useRef, use } from "react"
import { useAuth } from "@/components/auth-provider"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { createClient } from "@/lib/supabase/client"
import { db } from "@/lib/supabase/db"
import { SecureVideoPlayer } from "@/components/secure-video-player"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { 
  CheckCircle, 
  Circle, 
  Play, 
  Download, 
  Loader2, 
  Lock, 
  ArrowLeft, 
  ChevronRight,
  BookOpen,
  Send,
  Award,
  ArrowRight,
  RotateCcw
} from "lucide-react"

import { useClassroomCourse, useClassroomLessons, useClassroomModules, useClassroomProgress, useClassroomCertificate, useVideoUrl, useClassroomAccess, useLessonExercise, useUpdateProgress } from "@/lib/react-query/hooks/use-classroom"
import { LessonComments } from "@/components/lesson-comments"
import { d5Modules, getLessonCoverImage, resolveLessonId } from "@/lib/courses-data"
import { getMediaUrl } from "@/lib/utils"

function getEmbedUrl(url: string | undefined | null): string | null {
  if (!url) return null
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    let videoId = ""
    if (url.includes("youtube.com/watch")) {
      const match = url.match(/[?&]v=([^&#]+)/)
      videoId = match ? match[1] : ""
    } else if (url.includes("youtu.be/")) {
      const parts = url.split("youtu.be/")
      const lastPart = parts[parts.length - 1]
      videoId = lastPart.split(/[?#]/)[0]
    } else if (url.includes("youtube.com/embed/")) {
      const parts = url.split("youtube.com/embed/")
      const lastPart = parts[parts.length - 1]
      videoId = lastPart.split(/[?#]/)[0]
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : null
  }
  if (url.includes("vimeo.com")) {
    const match = url.match(/vimeo\.com\/(\d+)/)
    const videoId = match ? match[1] : ""
    return videoId ? `https://player.vimeo.com/video/${videoId}?autoplay=1` : null
  }
  return null
}

interface LessonPageProps {
  params: Promise<{ slug: string; lessonId: string }>
}

export default function CourseLessonClassroom({ params }: LessonPageProps) {
  const { slug, lessonId } = use(params)
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  const { data: course } = useClassroomCourse(slug)
  const courseId = course ? (course.course_id || course.id) : ""
  const courseIdentifier = courseId || slug
  const { data: rawLessons = [], isLoading: loadingLessons } = useClassroomLessons(courseIdentifier)
  const { data: modulesList = [] } = useClassroomModules(courseIdentifier)
  const { data: progressList = [], isLoading: loadingProgress } = useClassroomProgress(user?.id, courseId)
  const { data: hasAccessRaw, isLoading: loadingAccess } = useClassroomAccess(user?.id, courseId)
  const hasAccess = hasAccessRaw ?? null
  const { data: existingCert } = useClassroomCertificate(user?.id, courseId)

  // Fallback to modules lessons or rawLessons
  const moduleLessons = (modulesList.length > 0 ? modulesList : d5Modules).flatMap(m => (m.lessons || []).map(l => ({
    lesson_id: l.lesson_id,
    course_id: courseId,
    title: l.title,
    video_url: l.video_url || null,
    duration: (l.duration_minutes || 0) * 60,
    is_preview: l.is_preview,
    order_index: l.order_index,
    downloadable_asset_url: l.downloadable_asset_url || null,
    thumbnail_url: l.cover_image || m.cover_image,
    cover_image: l.cover_image || m.cover_image,
    module_title: m.title,
    module_number: m.module_number || `Module ${String(m.order_index).padStart(2, '0')}`
  })))

  const candidateLessons = rawLessons.length > 0
    ? rawLessons
    : moduleLessons.length > 0
      ? moduleLessons
      : []

  // Deduplicate lessons by order_index and sort ascending
  const lessons = Array.from(
    new Map(candidateLessons.map((l: any) => [l.order_index ?? l.lesson_id, l])).values()
  ).sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))

  const resolvedParamLessonId = resolveLessonId(lessonId)

  const currentLesson = lessons.find((l: any) => 
    l.lesson_id === resolvedParamLessonId || 
    l.lesson_id === lessonId || 
    l.id === resolvedParamLessonId || 
    l.id === lessonId
  ) || lessons[0] || null
  const currentLessonIdx = lessons.findIndex((l: any) => (l.lesson_id || l.id) === (currentLesson?.lesson_id || currentLesson?.id))
  const courseFallbackCover = course?.thumbnail_url || (course as any)?.image || null
  const currentCoverUrl = getLessonCoverImage(course?.slug || course?.title || slug, currentLesson, currentLessonIdx, courseFallbackCover)

  const activeLessonId = currentLesson 
    ? (currentLesson.lesson_id || currentLesson.id) 
    : (resolvedParamLessonId !== "start" && /^[0-9a-f-]{36}$/i.test(resolvedParamLessonId) ? resolvedParamLessonId : undefined)

  // Secure video delivery state
  const canAccessVideo = Boolean(currentLesson?.is_preview || profile?.role === 'admin' || profile?.role === 'instructor' || hasAccess)
  const { data: videoData, isLoading: loadingVideo } = useVideoUrl(activeLessonId, canAccessVideo)
  const activeVideo = videoData ? { source: videoData.source as string, format: videoData.format as 'hls' | 'direct', url: videoData.url } : null

  // Certificate modal state
  const [showCertModal, setShowCertModal] = useState(false)
  const [generatedCertId, setGeneratedCertId] = useState<string | null>(null)
  const [generatingCert, setGeneratingCert] = useState(false)
  const [certBlock, setCertBlock] = useState<{ labsGraded: number; labsRequired: number } | null>(null)

  // Heartbeat progress locks
  const lastLoggedTime = useRef<number>(0)
  const isUpdatingProgress = useRef<boolean>(false)
  const autoCertAttempted = useRef<boolean>(false)

  // Exercise States
  const supabase = createClient()
  const [exercise, setExercise] = useState<any | null>(null)
  const [submissionUrl, setSubmissionUrl] = useState("")
  const [submissionNotes, setSubmissionNotes] = useState("")
  const [isSubmittingExercise, setIsSubmittingExercise] = useState(false)
  const [submissionStatus, setSubmissionStatus] = useState<string | null>(null)
  const [submissionScore, setSubmissionScore] = useState<number | null>(null)
  const [submissionFeedback, setSubmissionFeedback] = useState<string | null>(null)

  const updateProgress = useUpdateProgress()

  // Redirect guests to login
  useEffect(() => {
    if (!loading && !user) {
      router.push(`/login?next=/courses/${slug}/${lessonId}`)
    }
  }, [user, loading, router, slug, lessonId])

  // Auto-redirect /courses/[slug]/start to first lesson UUID once lessons load
  useEffect(() => {
    if (lessonId === "start" && lessons.length > 0) {
      const firstLesson = lessons[0]
      const targetId = firstLesson?.lesson_id || firstLesson?.id
      if (targetId && targetId !== "start") {
        router.replace(`/courses/${slug}/${targetId}`)
      }
    }
  }, [lessonId, lessons, slug, router])

  // Auto-certificate check when all videos watched
  useEffect(() => {
    if (existingCert) {
      setGeneratedCertId(existingCert.certificate_id)
      return
    }
    if (!course || !courseId || lessons.length === 0 || progressList.length === 0 || autoCertAttempted.current) return
    const allWatched =
      lessons.length > 0 &&
      lessons.every(
        (lesson: any) => progressList.some((p: any) => p.lesson_id === lesson.lesson_id && p.is_completed)
      )
    if (allWatched) {
      autoCertAttempted.current = true
      setTimeout(() => triggerCertGeneration(courseId), 600)
    }
  }, [course, courseId, lessons, progressList, existingCert])

  // Load Exercise & Submissions Details on Lesson Change
  useEffect(() => {
    if (!user || !currentLesson) return
    const userId = user.id

    async function loadExerciseAndSubmission() {
      try {
        const activeLessonId = currentLesson.lesson_id || currentLesson.id
        const activeExercise = await db.getLessonExercise(supabase, activeLessonId)
        setExercise(activeExercise)

        if (activeExercise) {
          const { data: existingSub, error: subError } = await supabase
            .from("exercise_submissions")
            .select("status, score, instructor_feedback")
            .eq("exercise_id", activeExercise.exercise_id)
            .eq("student_id", userId)
            .single()

          if (!subError && existingSub) {
            setSubmissionStatus(existingSub.status)
            setSubmissionScore(existingSub.score)
            setSubmissionFeedback(existingSub.instructor_feedback)
          } else {
            setSubmissionStatus(null)
            setSubmissionScore(null)
            setSubmissionFeedback(null)
          }
        } else {
          setSubmissionStatus(null)
          setSubmissionScore(null)
          setSubmissionFeedback(null)
        }
      } catch (err) {
        console.error("Error loading lesson exercise:", err)
      }
    }

    loadExerciseAndSubmission()
    setSubmissionUrl("")
    setSubmissionNotes("")
  }, [user, currentLesson])

  // Handle lesson navigation in sidebar
  const handleSelectLesson = (targetLesson: any) => {
    router.push(`/courses/${slug}/${targetLesson.lesson_id || targetLesson.id}`)
  }

  // Handle watch time updates & periodic heartbeats (every 10 seconds)
  const handleTimeUpdate = async (currentTime: number, duration: number) => {
    if (!user || !course || !currentLesson || isUpdatingProgress.current) return

    const activeCourseId = course.course_id || course.id
    const timeDiff = currentTime - lastLoggedTime.current
    const isFinished = duration > 0 && currentTime >= duration * 0.90

    if (lastLoggedTime.current === 0 || timeDiff >= 10 || isFinished) {
      isUpdatingProgress.current = true
      lastLoggedTime.current = currentTime

      const isLessonCompleted = isFinished || progressList.some((p: any) => p.lesson_id === currentLesson.lesson_id && p.is_completed)

      try {
        await updateProgress.mutateAsync({
          userId: user.id,
          courseId: activeCourseId,
          lessonId: currentLesson.lesson_id || currentLesson.id,
          watchedSeconds: currentTime,
          isCompleted: isLessonCompleted
        })

        if (isLessonCompleted && lessons.length > 0) {
          const allCompleted = lessons.every((l: any) => 
            l.lesson_id === currentLesson.lesson_id || 
            progressList.some((p: any) => p.lesson_id === l.lesson_id && p.is_completed)
          )
          if (allCompleted) {
            triggerCertGeneration(activeCourseId)
          }
        }
      } catch (err) {
        console.error("Error updating progress heartbeat:", err)
      } finally {
        isUpdatingProgress.current = false
      }
    }
  }

  const triggerCertGeneration = async (cId: string) => {
    if (generatingCert || generatedCertId) return
    try {
      setGeneratingCert(true)
      setCertBlock(null)

      const res = await fetch("/api/certificates/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: cId })
      })

      if (res.ok) {
        const data = await res.json()
        if (data.success && data.certificateId) {
          setGeneratedCertId(data.certificateId)
          setCertBlock(null)
          if (data.isNew) {
            setShowCertModal(true)
          }
        }
      } else {
        const errData = await res.json().catch(() => null)
        if (errData && typeof errData.labsGraded === "number" && typeof errData.labsRequired === "number") {
          setCertBlock({ labsGraded: errData.labsGraded, labsRequired: errData.labsRequired })
        }
      }
    } catch (err) {
      console.error("Failed to generate certificate:", err)
    } finally {
      setGeneratingCert(false)
    }
  }

  const handleVideoEnded = () => {
    if (currentLesson?.duration) {
      handleTimeUpdate(currentLesson.duration, currentLesson.duration)
    }
  }

  const handleSubmission = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !currentLesson || !submissionUrl) return

    setIsSubmittingExercise(true)
    const activeLessonId = currentLesson.lesson_id || currentLesson.id

    try {
      let activeExerciseId = exercise?.exercise_id
      if (!activeExerciseId) {
        const { data: ensuredExercise, error: exerciseError } = await supabase.rpc("ensure_lesson_exercise", {
          p_lesson_id: activeLessonId,
          p_title: `Practice Task for ${currentLesson.title}`
        })
        if (exerciseError) throw new Error(exerciseError.message)
        activeExerciseId = (ensuredExercise as any).exercise_id
        setExercise(ensuredExercise as any)
      }

      const payloadFiles = [{ url: submissionUrl, notes: submissionNotes }]
      const result = await db.submitExercise(supabase, {
        exerciseId: activeExerciseId,
        studentId: user.id,
        files: payloadFiles
      })

      if (result.success) {
        setSubmissionStatus("submitted")
      } else {
        alert(`Failed to submit: ${result.error}`)
      }
    } catch (err: any) {
      alert(`Error: ${err.message || err}`)
    } finally {
      setIsSubmittingExercise(false)
    }
  }

  const handleTelegramSubmit = async () => {
    if (!user || !currentLesson) return

    const telegramChatUrl = "https://t.me/bunsambath10"
    const newWindow = window.open("", "_blank")
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head>
            <title>Redirecting to Telegram...</title>
            <style>
              body {
                background-color: #09090b;
                color: #ffffff;
                font-family: sans-serif;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
              }
              .spinner {
                border: 4px solid rgba(255, 255, 255, 0.1);
                width: 36px;
                height: 36px;
                border-radius: 50%;
                border-left-color: #0088cc;
                animation: spin 1s linear infinite;
                margin-bottom: 16px;
              }
              @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            </style>
          </head>
          <body>
            <div class="spinner"></div>
            <p>Recording your submission and opening Telegram...</p>
          </body>
        </html>
      `)
    }

    setIsSubmittingExercise(true)
    const activeLessonId = currentLesson.lesson_id || currentLesson.id

    try {
      let activeExerciseId = exercise?.exercise_id
      if (!activeExerciseId) {
        const { data: ensuredExercise, error: exerciseError } = await supabase.rpc("ensure_lesson_exercise", {
          p_lesson_id: activeLessonId,
          p_title: `Practice Task for ${currentLesson.title}`
        })
        if (exerciseError) throw new Error(exerciseError.message)
        activeExerciseId = (ensuredExercise as any).exercise_id
        setExercise(ensuredExercise as any)
      }

      const payloadFiles = [{ url: telegramChatUrl, notes: "Large files submitted directly via Telegram message." }]
      const result = await db.submitExercise(supabase, {
        exerciseId: activeExerciseId,
        studentId: user.id,
        files: payloadFiles
      })

      if (result.success) {
        setSubmissionStatus("submitted")
        const studentName = profile?.full_name || user.email || 'Student'
        const courseTitle = course?.title || 'ArchViz Course'
        const lessonTitle = currentLesson?.title || 'Visualization Lesson'
        const messageText = `Student Name: ${studentName}\n` +
          `Student Email: ${user.email || ''}\n` +
          `Project/Course: ${courseTitle}\n` +
          `Lesson Module: ${lessonTitle}\n\n` +
          `Hi Instructor! Here are my render files and source documents for review:`
        try { await navigator.clipboard.writeText(messageText) } catch {}
        const telegramLink = `${telegramChatUrl}?text=${encodeURIComponent(messageText)}`
        if (newWindow) { newWindow.location.href = telegramLink }
        else { window.open(telegramLink, "_blank") }
      } else {
        if (newWindow) newWindow.close()
        alert(`Failed to submit: ${result.error}`)
      }
    } catch (err: any) {
      if (newWindow) newWindow.close()
      alert(`Error: ${err.message || err}`)
    } finally {
      setIsSubmittingExercise(false)
    }
  }

  const loadingCatalog = loading || loadingAccess || loadingProgress
  if (loadingCatalog || hasAccess === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white gap-3">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#9ACD32' }} />
        <span>Entering video classroom...</span>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white gap-3">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#9ACD32' }} />
        <span>Redirecting to login...</span>
      </div>
    )
  }

  if (hasAccess === false) {
    return (
      <main className="min-h-screen flex flex-col justify-between" style={{ backgroundColor: '#060010' }}>
        <Navigation />
        <div className="flex-grow flex items-center justify-center py-32 px-6">
          <div className="max-w-md w-full bg-zinc-900/60 border border-zinc-800 p-8 rounded-2xl text-center space-y-6 backdrop-blur-sm">
            <div className="w-16 h-16 bg-red-950/30 text-red-500 rounded-full flex items-center justify-center mx-auto border border-red-900/30">
              <Lock className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Course Locked</h1>
              <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
                You are not enrolled in this course yet. Please subscribe or buy this course to unlock access to the rendering guides and downloads.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              {course?.course_id && (
                <Link href={`/checkout?courseId=${course.course_id}`}>
                  <Button className="w-full bg-primary text-black hover:bg-primary/90 font-bold py-6 rounded-xl flex items-center justify-center gap-2" style={{ backgroundColor: '#9ACD32', color: '#000' }}>
                    <Lock className="w-4 h-4" />
                    Unlock Course via KHQR ({course?.price ? `$${parseFloat(course.price.toString()).toFixed(2)}` : '$49.99'})
                  </Button>
                </Link>
              )}
              <Link href="/courses">
                <Button variant="outline" className="w-full border-zinc-800 text-zinc-300 hover:bg-zinc-900/50 py-6 rounded-xl">
                  Browse Other Courses
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  const formatSidebarDuration = (seconds: number) => {
    if (!seconds) return "0m"
    const mins = Math.floor(seconds / 60)
    return `${mins}m`
  }

  const renderPlayer = () => {
    if (!loadingLessons && lessons.length === 0) {
      return (
        <div className="aspect-video w-full bg-black rounded-xl overflow-hidden relative border border-zinc-850 flex flex-col items-center justify-center p-6 text-center">
          <div className="relative z-10 max-w-md space-y-3">
            <div className="w-12 h-12 rounded-full bg-zinc-900/90 border border-zinc-700 flex items-center justify-center mx-auto text-zinc-500">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white drop-shadow">No Lessons Available Yet</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              The instructor is currently preparing curriculum modules for this course. Please check back soon.
            </p>
          </div>
        </div>
      )
    }

    if (loadingVideo || loadingLessons) {
      return (
        <div className="aspect-video w-full bg-black rounded-xl overflow-hidden relative border border-zinc-850 flex flex-col items-center justify-center gap-3">
          <img src={getMediaUrl(currentCoverUrl)} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
          <div className="relative z-10 flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#9ACD32' }} />
            <p className="text-xs text-zinc-300 font-medium drop-shadow">Preparing stream...</p>
          </div>
        </div>
      )
    }
    if (!activeVideo) {
      return (
        <div className="aspect-video w-full bg-black rounded-xl overflow-hidden relative border border-zinc-850 flex flex-col items-center justify-center p-6 text-center">
          <img src={getMediaUrl(currentCoverUrl)} alt="" className="absolute inset-0 w-full h-full object-cover opacity-25" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
          <div className="relative z-10 max-w-md space-y-3">
            <div className="w-12 h-12 rounded-full bg-zinc-900/90 border border-zinc-700 flex items-center justify-center mx-auto" style={{ color: '#9ACD32' }}>
              <Play className="w-5 h-5 ml-0.5 fill-current" />
            </div>
            <h3 className="text-base font-bold text-white drop-shadow">{currentLesson?.title || "Lesson Module"}</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Video stream for this module is being processed. You can review the attached exercise and module resources below.
            </p>
          </div>
        </div>
      )
    }

    const embedUrl = getEmbedUrl(activeVideo.url)
    if (embedUrl) {
      return (
        <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-zinc-800">
          <div className="absolute top-3 right-3 z-20 pointer-events-none select-none text-white/20 text-xs font-mono bg-black/40 px-2.5 py-1 rounded">
            {user?.email || "student"}
          </div>
          <iframe
            src={embedUrl}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )
    }

    return (
      <SecureVideoPlayer
        videoUrl={activeVideo.url}
        userEmail={user?.email || "student@archtipsbox.com"}
        userId={user?.id || ""}
        format={activeVideo.format}
        poster={getMediaUrl(currentCoverUrl)}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleVideoEnded}
      />
    )
  }

  return (
    <main className="min-h-screen flex flex-col justify-between" style={{ backgroundColor: '#060010' }}>
      <Navigation />

      <div className="flex-grow container mx-auto px-6 py-24 md:py-32 max-w-7xl relative z-10">
        
        {/* Course Directory Breadcrumb */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="text-zinc-400 hover:text-white text-sm flex items-center gap-1.5 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
            <span className="text-sm font-semibold text-primary" style={{ color: '#9ACD32' }}>{course?.title}</span>
          </div>
          
          {generatedCertId ? (
            <Link href={`/certificates/${generatedCertId}`} target="_blank">
              <Button size="sm" className="bg-[#9ACD32]/10 hover:bg-[#9ACD32]/20 text-[#9ACD32] border border-[#9ACD32]/30 rounded-lg flex items-center gap-1.5 text-xs font-semibold py-4">
                <Award className="w-3.5 h-3.5" />
                View Certificate
              </Button>
            </Link>
          ) : certBlock ? (
            <Button
              size="sm"
              onClick={() => setShowCertModal(true)}
              className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg flex items-center gap-1.5 text-xs font-semibold py-4"
            >
              <Award className="w-3.5 h-3.5" />
              Certificate Progress
            </Button>
          ) : null}
        </div>

        {/* Dynamic Split Screen Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Classroom Panel (Left) */}
          <div className="lg:col-span-2 space-y-6">
            {renderPlayer()}

            {/* Lesson Title and Descriptions */}
            <div className="bg-zinc-900/20 border border-zinc-850 p-6 rounded-2xl space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#9ACD32]/10 text-[#9ACD32] border border-[#9ACD32]/20">
                    Module {String(currentLesson?.order_index || currentLessonIdx + 1).padStart(2, '0')}
                  </span>
                  <span className="text-xs text-zinc-500">&bull;</span>
                  <span className="text-xs text-zinc-400">{course?.title || "D5 Masterclass"}</span>
                </div>
                <h1 className="text-2xl font-bold text-white">{currentLesson?.title || "Loading Lesson..."}</h1>
                <p className="text-zinc-400 text-sm mt-2 leading-relaxed">
                  Welcome to this lesson module. In this visualization tutorial, we cover the lighting configurations, material setups, and composition techniques required to produce high-end architectural renders. Follow along using the assets attached.
                </p>
              </div>

              {/* Resource Downloads */}
              {currentLesson?.downloadable_asset_url && (
                <div className="border-t border-zinc-850 pt-5">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300 mb-3 flex items-center gap-2">
                    <Download className="w-4 h-4 text-primary" style={{ color: '#9ACD32' }} />
                    Lesson Attachments
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div 
                      className="p-3 bg-zinc-900/50 border border-zinc-850 rounded-xl flex items-center justify-between group hover:border-zinc-700 transition-colors"
                    >
                      <div className="truncate max-w-[80%]">
                        <h4 className="text-xs font-semibold text-white truncate">
                          {decodeURIComponent(currentLesson.downloadable_asset_url.split('/').pop() || "Lesson Attachment / Resources")}
                        </h4>
                        <p className="text-[10px] text-zinc-500 mt-0.5">Attached Resource File</p>
                      </div>
                      <a 
                        href={currentLesson.downloadable_asset_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center justify-center rounded-lg hover:bg-[#9ACD32]/10 text-[#9ACD32] p-2 transition-colors border border-transparent hover:border-[#9ACD32]/20"
                      >
                        <Download className="w-4.5 h-4.5" />
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Homework / Exercise Submission Box */}
              <div className="border-t border-zinc-850 pt-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-primary" style={{ color: '#9ACD32' }} />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300">
                    Submit Homework Exercise
                  </h3>
                </div>

                {submissionStatus === "graded" ? (
                  <div className="p-5 bg-green-950/10 border border-green-900/30 rounded-xl space-y-3">
                    <div className="flex items-center gap-2 text-green-400 font-semibold text-sm">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      Assignment Reviewed & Graded
                    </div>
                    <div className="grid grid-cols-3 gap-3 bg-zinc-950 p-3.5 rounded-lg border border-zinc-850/40 text-center">
                      <div className="col-span-1 border-r border-zinc-850/40">
                        <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Score</p>
                        <p className="text-xl font-bold text-primary mt-1" style={{ color: '#9ACD32' }}>{submissionScore} / 100</p>
                      </div>
                      <div className="col-span-2 text-left pl-3 flex flex-col justify-center">
                        <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Instructor Feedback</p>
                        <p className="text-xs text-zinc-300 italic mt-1 leading-relaxed">"{submissionFeedback || "Excellent work!"}"</p>
                      </div>
                    </div>
                  </div>
                ) : submissionStatus === "revision_requested" ? (
                  <div className="p-4 bg-orange-950/10 border border-orange-900/30 rounded-xl space-y-2.5">
                    <div className="flex items-center gap-2 text-orange-400 font-semibold text-sm">
                      <RotateCcw className="w-5 h-5" />
                      Revision Requested
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      The instructor reviewed your submission and asked for changes before it can be graded.
                    </p>
                    {submissionFeedback && (
                      <p className="text-xs text-orange-300/90 italic bg-zinc-950/40 border border-orange-900/20 rounded-lg p-3">
                        "{submissionFeedback}"
                      </p>
                    )}
                    <p className="text-[11px] text-zinc-500">Update your work and resubmit below.</p>
                  </div>
                ) : submissionStatus === "submitted" || submissionStatus === "in_review" ? (
                  <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl text-center space-y-2">
                    <CheckCircle className="w-8 h-8 text-primary mx-auto" style={{ color: '#9ACD32' }} />
                    <h4 className="text-sm font-semibold text-white">Assignment Submitted!</h4>
                    <p className="text-xs text-zinc-400">
                      Your work has been submitted successfully and is currently under review by the instructor.
                    </p>
                  </div>
                ) : null}

                {(submissionStatus === null || submissionStatus === "revision_requested") && (
                  <>
                    <form onSubmit={handleSubmission} className="space-y-3.5">
                      {submissionStatus === "revision_requested" && (
                        <p className="text-xs text-orange-400 font-semibold">
                          Resubmit your updated work below:
                        </p>
                      )}
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Recreate the lighting and material setups from this lesson. Upload your render outputs to Google Drive, Dropbox, or OneDrive, and paste the public link below for review:
                      </p>
                      <div className="space-y-2">
                        <input
                          type="url"
                          required
                          placeholder="Paste your submission link here (e.g. https://drive.google.com/...)"
                          value={submissionUrl}
                          onChange={(e) => setSubmissionUrl(e.target.value)}
                          className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-primary/80 transition-colors"
                        />
                        <textarea
                          placeholder="Add optional notes or questions for the instructor..."
                          value={submissionNotes}
                          onChange={(e) => setSubmissionNotes(e.target.value)}
                          rows={2}
                          className="w-full bg-zinc-900/50 border border-zinc-850 rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-primary/80 transition-colors resize-none"
                        />
                      </div>
                      <Button 
                        type="submit" 
                        disabled={isSubmittingExercise}
                        className="w-full bg-primary text-black hover:bg-primary/90 text-xs font-semibold py-5 rounded-xl transition-all"
                        style={{ backgroundColor: '#9ACD32', color: '#000' }}
                      >
                        {isSubmittingExercise ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Submitting Assignment...
                          </>
                        ) : (
                          "Submit Assignment"
                        )}
                      </Button>
                    </form>
                    
                    <div className="space-y-3.5 mt-4">
                      <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-zinc-850"></div>
                        <span className="flex-shrink mx-4 text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Or</span>
                        <div className="flex-grow border-t border-zinc-850"></div>
                      </div>

                      <p className="text-xs text-zinc-400 leading-relaxed text-center">
                        Have large renders, workspace files, or video screencasts? Submit them directly to the instructor via Telegram:
                      </p>

                      <Button 
                        type="button" 
                        onClick={handleTelegramSubmit}
                        disabled={isSubmittingExercise}
                        className="w-full bg-[#0088cc] hover:bg-[#0088cc]/95 text-white text-xs font-semibold py-5 rounded-xl transition-all flex items-center justify-center gap-2"
                        style={{ backgroundColor: '#0088cc', color: '#fff' }}
                      >
                        <Send className="w-4 h-4 fill-current text-white" />
                        Submit Homework via Telegram
                      </Button>
                    </div>
                  </>
                )}
              </div>

            </div>

            {/* Q&A & Discussion Section */}
            {currentLesson && (
              <LessonComments lessonId={currentLesson.lesson_id || currentLesson.id} />
            )}
          </div>

          {/* Dynamic Sidebar Curriculum (Right) */}
          <div className="lg:col-span-1 bg-zinc-950 border border-zinc-850 rounded-2xl p-5 flex flex-col h-[600px]">
            <div className="flex items-center gap-2 border-b border-zinc-850 pb-4 mb-4">
              <BookOpen className="w-5 h-5 text-primary" style={{ color: '#9ACD32' }} />
              <h2 className="text-lg font-bold text-white">Course Syllabus</h2>
            </div>

            <div className="flex-grow overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {loadingLessons && lessons.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center text-zinc-500 gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-[#9ACD32]" />
                  <span className="text-xs text-zinc-400">Loading syllabus...</span>
                </div>
              ) : lessons.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center text-zinc-500 gap-2 px-4">
                  <BookOpen className="w-8 h-8 opacity-40 text-zinc-600 mb-1" />
                  <p className="text-xs font-semibold text-zinc-400">No lessons published yet</p>
                  <p className="text-[11px] text-zinc-600">Modules will appear here once added by the instructor.</p>
                </div>
              ) : (
                lessons.map((item: any, idx: number) => {
                  const progress = progressList.find((p: any) => p.lesson_id === item.lesson_id)
                  const isItemCompleted = progress?.is_completed || false
                  const isSelected = item.lesson_id === currentLesson?.lesson_id
                  const coverUrl = getLessonCoverImage(course?.slug || course?.title || slug, item, idx, courseFallbackCover)

                  return (
                    <button
                      key={item.lesson_id || item.id}
                      onClick={() => handleSelectLesson(item)}
                      className={`w-full text-left p-2.5 rounded-xl border transition-all duration-300 flex items-center gap-3 group ${
                        isSelected 
                          ? "bg-[#9ACD32]/10 border-[#9ACD32] text-white shadow-sm" 
                          : "bg-zinc-900/20 border-zinc-850/60 text-zinc-400 hover:border-zinc-750 hover:text-white"
                      }`}
                    >
                      {/* Module Cover Thumbnail */}
                      <div className="w-14 h-9 rounded-lg overflow-hidden bg-black/60 border border-zinc-800 shrink-0 relative">
                        <img
                          src={getMediaUrl(coverUrl)}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-[#9ACD32]/20 border border-[#9ACD32]/40 rounded-lg" />
                        )}
                      </div>

                      <div className="flex-grow min-w-0">
                        <h4 className={`text-xs font-semibold truncate ${isSelected ? "text-white" : "text-zinc-300"}`}>
                          {item.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-zinc-500 font-mono">
                            {formatSidebarDuration(item.duration)}
                          </span>
                          {item.is_preview && (
                            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              Preview
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex-shrink-0">
                        {isItemCompleted ? (
                          <CheckCircle className="w-4 h-4 text-primary fill-primary/10" style={{ color: '#9ACD32' }} />
                        ) : isSelected ? (
                          <Play className="w-3.5 h-3.5 text-primary fill-primary" style={{ color: '#9ACD32' }} />
                        ) : (
                          <Circle className="w-3.5 h-3.5 text-zinc-700 group-hover:text-zinc-500 transition-colors" />
                        )}
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>

        </div>
      </div>

      {showCertModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl max-w-md w-full text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto border border-primary/20" style={{ color: '#9ACD32', borderColor: 'rgba(154, 205, 50, 0.2)' }}>
              <Award className="w-10 h-10 animate-bounce" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-extrabold text-white">
                {certBlock ? "Almost There!" : "Course Completed!"}
              </h2>
              {certBlock ? (
                <div className="text-zinc-400 text-sm leading-relaxed space-y-3">
                  <p>All videos in **{course?.title || "this course"}** are watched. Your certificate unlocks once the instructor verifies your labs:</p>
                  {certBlock.labsRequired === 0 ? (
                    <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 text-left text-xs text-amber-400">
                      This course has no labs attached yet. Please contact your instructor - certificates require at least one graded lab.
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 text-left">
                      <div className="flex items-center justify-between text-xs font-semibold mb-2">
                        <span className="text-zinc-300">Labs verified by instructor</span>
                        <span style={{ color: '#9ACD32' }}>{certBlock.labsGraded} / {certBlock.labsRequired}</span>
                      </div>
                      <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.round((certBlock.labsGraded / certBlock.labsRequired) * 100))}%`, backgroundColor: '#9ACD32' }}
                        />
                      </div>
                      <p className="mt-3 text-[11px] text-zinc-500 leading-relaxed">
                        Submit every lab below its lesson, then wait for instructor grading. Reopen this course after grading to claim your certificate automatically.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Congratulations! You have completed all lesson modules and verified labs in **{course?.title || "this course"}**. Your certification has been successfully generated.
                </p>
              )}
            </div>
            
            <div className="space-y-3 pt-2">
              {generatingCert ? (
                <Button disabled className="w-full bg-zinc-850 text-zinc-500 py-6 rounded-xl font-bold flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Certificate...
                </Button>
              ) : generatedCertId ? (
                <Link href={`/certificates/${generatedCertId}`} target="_blank">
                  <Button className="w-full bg-primary text-black hover:bg-primary/90 py-6 rounded-xl font-bold flex items-center justify-center gap-2" style={{ backgroundColor: '#9ACD32', color: '#000' }}>
                    Claim Certificate
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              ) : (
                <Button onClick={() => course && triggerCertGeneration(course.course_id || course.id)} className="w-full bg-zinc-800 text-zinc-300 py-6 rounded-xl font-bold">
                  Retry Generation
                </Button>
              )}
              
              <Button 
                onClick={() => setShowCertModal(false)} 
                variant="ghost" 
                className="w-full text-zinc-500 hover:text-zinc-300"
              >
                Back to Classroom
              </Button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </main>
  )
}