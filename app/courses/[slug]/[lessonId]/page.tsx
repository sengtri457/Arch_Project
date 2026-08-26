"use client"

import * as React from "react"
import { useState, useEffect, useRef, use } from "react"
import { useAuth } from "@/components/auth-provider"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { createClient } from "@/lib/supabase/client"
import { db } from "@/lib/supabase/db"
import { SecureVideoPlayer } from "@/components/secure-video-player"
import { Course } from "@/lib/courses-data"
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

interface LessonPageProps {
  params: Promise<{ slug: string; lessonId: string }>
}

export default function CourseLessonClassroom({ params }: LessonPageProps) {
  const { slug, lessonId } = use(params)
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  // Course and Lesson states
  const [course, setCourse] = useState<Course | null>(null)
  const [lessons, setLessons] = useState<any[]>([])
  const [currentLesson, setCurrentLesson] = useState<any | null>(null)
  const [progressList, setProgressList] = useState<any[]>([])
  
  // Loading & Permission States
  const [loadingCatalog, setLoadingCatalog] = useState(true)
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)
  const [showCertModal, setShowCertModal] = useState(false)
  const [generatedCertId, setGeneratedCertId] = useState<string | null>(null)
  const [generatingCert, setGeneratingCert] = useState(false)
  const [certBlock, setCertBlock] = useState<{ labsGraded: number; labsRequired: number } | null>(null)

  // Heartbeat progress locks
  const lastLoggedTime = useRef<number>(0)
  const isUpdatingProgress = useRef<boolean>(false)
  const autoCertAttempted = useRef<boolean>(false)

  // Exercise States
  const [exercise, setExercise] = useState<any | null>(null)
  const [submissionUrl, setSubmissionUrl] = useState("")
  const [submissionNotes, setSubmissionNotes] = useState("")
  const [isSubmittingExercise, setIsSubmittingExercise] = useState(false)
  const [submissionStatus, setSubmissionStatus] = useState<string | null>(null)
  const [submissionScore, setSubmissionScore] = useState<number | null>(null)
  const [submissionFeedback, setSubmissionFeedback] = useState<string | null>(null)

  // Secure video delivery state
  const [activeVideo, setActiveVideo] = useState<{ source: string; format: 'hls' | 'direct'; url: string } | null>(null)
  const [loadingVideo, setLoadingVideo] = useState(false)

  // Redirect guests to login
  useEffect(() => {
    if (!loading && !user) {
      router.push(`/login?next=/courses/${slug}/${lessonId}`)
    }
  }, [user, loading, router, slug, lessonId])

  // Load Course and Access validations
  useEffect(() => {
    if (!user) return
    const userId = user.id

    async function verifyAndLoad() {
      try {
        setLoadingCatalog(true)
        
        // 1. Fetch Course by slug
        const activeCourse = await db.getCourseBySlug(supabase, slug)
        if (!activeCourse) {
          setHasAccess(false)
          setLoadingCatalog(false)
          return
        }
        setCourse(activeCourse)

        // 2. Validate Access permissions
        const accessGranted = await db.checkCourseAccess(supabase, userId, activeCourse.course_id || activeCourse.id)
        setHasAccess(accessGranted)
        if (!accessGranted) {
          setLoadingCatalog(false)
          return
        }

        // 3. Fetch all course lessons
        const courseLessons = await db.getCourseLessons(supabase, activeCourse.course_id || activeCourse.id)
        setLessons(courseLessons)

        // Select current lesson
        const matched = courseLessons.find((l) => l.lesson_id === lessonId || l.id === lessonId)
        setCurrentLesson(matched || courseLessons[0] || null)

        // 4. Fetch watch progress records for sidebar checks
        const { data: progressRecords } = await supabase
          .from("lesson_progress")
          .select("lesson_id, is_completed, watched_seconds")
          .eq("student_id", userId)
          .eq("course_id", activeCourse.course_id || activeCourse.id)

        setProgressList(progressRecords || [])

        // 5. Fetch completed certificate record if exists
        const { data: certData } = await supabase
          .from("certificates")
          .select("certificate_id")
          .eq("student_id", userId)
          .eq("course_id", activeCourse.course_id || activeCourse.id)
          .maybeSingle()

        if (certData) {
          setGeneratedCertId(certData.certificate_id)
          return
        }

        // 6. All videos already watched and no certificate yet? Re-check
        //    eligibility so the certificate auto-issues once the instructor
        //    has graded the final lab.
        const allWatched =
          courseLessons.length > 0 &&
          courseLessons.every(
            (lesson) => (progressRecords || []).some((p) => p.lesson_id === lesson.lesson_id && p.is_completed)
          )

        if (allWatched && !autoCertAttempted.current) {
          autoCertAttempted.current = true
          const courseId = activeCourse.course_id || activeCourse.id
          setTimeout(() => triggerCertGeneration(courseId), 600)
        }
      } catch (err) {
        console.error("Error loading classroom:", err)
      } finally {
        setLoadingCatalog(false)
      }
    }
    verifyAndLoad()
  }, [user, slug, lessonId])

  // Fetch playable video URL through the secured API whenever the lesson changes
  useEffect(() => {
    const lessonId = currentLesson?.lesson_id || currentLesson?.id
    setActiveVideo(null)
    if (!hasAccess || !lessonId) return

    let cancelled = false
    setLoadingVideo(true)

    fetch(`/api/lessons/${lessonId}/video`)
      .then(async (res) => {
        if (res.ok) {
          const json = await res.json()
          if (!cancelled && json?.url) {
            setActiveVideo({
              source: json.source ?? 'direct',
              format: json.format === 'hls' ? 'hls' : 'direct',
              url: json.url
            })
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingVideo(false)
      })

    return () => {
      cancelled = true
    }
  }, [currentLesson?.lesson_id, currentLesson?.id, hasAccess])

  // Handle lesson navigation in sidebar
  const handleSelectLesson = (targetLesson: any) => {
    router.push(`/courses/${slug}/${targetLesson.lesson_id || targetLesson.id}`)
  }

  // Handle watch time updates & periodic heartbeats (every 10 seconds)
  const handleTimeUpdate = async (currentTime: number, duration: number) => {
    if (!user || !course || !currentLesson || isUpdatingProgress.current) return

    const activeCourseId = course.course_id || course.id
    const timeDiff = currentTime - lastLoggedTime.current
    const isFinished = duration > 0 && currentTime >= duration * 0.90 // 90% threshold for completion

    // Trigger save if it's the first play, if 10 seconds have elapsed, or if video is finished
    if (lastLoggedTime.current === 0 || timeDiff >= 10 || isFinished) {
      isUpdatingProgress.current = true
      lastLoggedTime.current = currentTime

      const isLessonCompleted = isFinished || progressList.some(p => p.lesson_id === currentLesson.lesson_id && p.is_completed)

      try {
        await db.updateLessonProgress(supabase, {
          userId: user.id,
          courseId: activeCourseId,
          lessonId: currentLesson.lesson_id || currentLesson.id,
          watchedSeconds: currentTime,
          isCompleted: isLessonCompleted
        })

        // Update local sidebar checkmarks state instantly
        setProgressList((prev) => {
          const index = prev.findIndex((p) => p.lesson_id === currentLesson.lesson_id)
          let newProgress = [...prev]
          if (index !== -1) {
            newProgress = prev.map((p, idx) => 
              idx === index 
                ? { ...p, watched_seconds: currentTime, is_completed: isLessonCompleted } 
                : p
            )
          } else {
            newProgress = [...prev, { lesson_id: currentLesson.lesson_id, is_completed: isLessonCompleted, watched_seconds: currentTime }]
          }

          // Check if all lessons are completed and trigger cert generation
          if (isLessonCompleted && lessons.length > 0) {
            const allCompleted = lessons.every(l => 
              l.lesson_id === currentLesson.lesson_id || 
              newProgress.some(p => p.lesson_id === l.lesson_id && p.is_completed)
            )
            if (allCompleted) {
              triggerCertGeneration(activeCourseId)
            }
          }

          return newProgress
        })
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
      setShowCertModal(true)
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

  // Handle video completion
  const handleVideoEnded = () => {
    if (duration) {
      handleTimeUpdate(duration, duration)
    }
  }

  // Load Exercise & Submissions Details on Lesson Change
  useEffect(() => {
    if (!user || !currentLesson) return
    const userId = user.id

    async function loadExerciseAndSubmission() {
      try {
        const activeLessonId = currentLesson.lesson_id || currentLesson.id
        
        // 1. Fetch exercise definition
        const activeExercise = await db.getLessonExercise(supabase, activeLessonId)
        setExercise(activeExercise)

        // 2. Fetch existing student submission status
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
    // Reset submission inputs
    setSubmissionUrl("")
    setSubmissionNotes("")
  }, [user, currentLesson])

  // Submit Exercise Form Handler
  const handleSubmission = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("handleSubmission: Clicked Submit Assignment button.")
    console.log("handleSubmission: State verification:", {
      user: user ? { id: user.id, email: user.email } : null,
      currentLesson: currentLesson ? { id: currentLesson.lesson_id || currentLesson.id, title: currentLesson.title } : null,
      submissionUrl
    })

    if (!user) {
      console.warn("handleSubmission: User is null, aborting.")
      return
    }
    if (!currentLesson) {
      console.warn("handleSubmission: currentLesson is null, aborting.")
      return
    }
    if (!submissionUrl) {
      console.warn("handleSubmission: submissionUrl is empty, aborting.")
      return
    }

    setIsSubmittingExercise(true)
    const activeLessonId = currentLesson.lesson_id || currentLesson.id
    console.log("handleSubmission: Preparing to submit for lesson ID:", activeLessonId)

    try {
      let activeExerciseId = exercise?.exercise_id
      console.log("handleSubmission: Existing exercise ID found in state:", activeExerciseId)

      // Autorescue: If no exercise row exists in the database for this lesson, create one automatically
      if (!activeExerciseId) {
        console.log("handleSubmission: No exercise found for lesson. Triggering database auto-creation...")
        const { data: newExercise, error: exerciseError } = await supabase
          .from("exercises")
          .insert({
            lesson_id: activeLessonId,
            title: `Practice Task for ${currentLesson.title}`,
            brief_prompt: "Recreate the rendering setup shown in the visualization video and submit your workspace or output render image link.",
            max_score: 100
          })
          .select()
          .single()

        if (exerciseError) {
          console.error("handleSubmission: Database error during auto-creating exercise row:", exerciseError)
          throw exerciseError
        }
        activeExerciseId = newExercise.exercise_id
        setExercise(newExercise)
        console.log("handleSubmission: Auto-created exercise row successfully:", newExercise)
      }

      // Insert submission
      const payloadFiles = [{ url: submissionUrl, notes: submissionNotes }]
      console.log("handleSubmission: Inserting submission into DB for exercise ID:", activeExerciseId, "payload:", payloadFiles)
      
      const result = await db.submitExercise(supabase, {
        exerciseId: activeExerciseId,
        studentId: user.id,
        files: payloadFiles
      })

      console.log("handleSubmission: Submission result:", result)

      if (result.success) {
        setSubmissionStatus("submitted")
        console.log("handleSubmission: Submission successfully completed and saved in state.")
      } else {
        console.error("handleSubmission: Failed submission result error:", result.error)
        alert(`Failed to submit: ${result.error}`)
      }
    } catch (err: any) {
      console.error("handleSubmission: Unexpected error caught:", err)
      alert(`Error: ${err.message || err}`)
    } finally {
      setIsSubmittingExercise(false)
    }
  }

  // Telegram Submission Workflow
  const handleTelegramSubmit = async () => {
    console.log("handleTelegramSubmit: Initializing Telegram submission workflow.")
    if (!user) {
      console.warn("handleTelegramSubmit: User is null, aborting.")
      return
    }
    if (!currentLesson) {
      console.warn("handleTelegramSubmit: currentLesson is null, aborting.")
      return
    }

    setIsSubmittingExercise(true)
    const activeLessonId = currentLesson.lesson_id || currentLesson.id
    console.log("handleTelegramSubmit: Preparing Telegram submit for lesson ID:", activeLessonId)

    try {
      let activeExerciseId = exercise?.exercise_id
      console.log("handleTelegramSubmit: Existing exercise ID found in state:", activeExerciseId)

      // Autorescue: If no exercise row exists, obtain it through the secure RPC
      if (!activeExerciseId) {
        console.log("handleTelegramSubmit: No exercise found. Triggering database auto-creation...")
        const { data: ensuredExercise, error: exerciseError } = await supabase.rpc("ensure_lesson_exercise", {
          p_lesson_id: activeLessonId,
          p_title: `Practice Task for ${currentLesson.title}`
        })

        if (exerciseError) {
          console.error(
            "handleTelegramSubmit: Database error during auto-creating exercise row:",
            exerciseError.code,
            "|",
            exerciseError.message,
            "|",
            exerciseError.details
          )
          throw new Error(exerciseError.message)
        }
        activeExerciseId = (ensuredExercise as any).exercise_id
        setExercise(ensuredExercise as any)
      }

      // Record in database as Telegram submission
      const telegramChatUrl = "https://t.me/sxngtri"
      const payloadFiles = [{ url: telegramChatUrl, notes: "Large files submitted directly via Telegram message." }]
      console.log("handleTelegramSubmit: Inserting submission into DB for exercise ID:", activeExerciseId, "payload:", payloadFiles)
      
      const result = await db.submitExercise(supabase, {
        exerciseId: activeExerciseId,
        studentId: user.id,
        files: payloadFiles
      })

      console.log("handleTelegramSubmit: Submission result:", result)

      if (result.success) {
        setSubmissionStatus("submitted")
        
        // Open Telegram chat with the instructor with pre-filled message template
        const studentName = profile?.full_name || user.email || 'Student'
        const courseTitle = course?.title || 'ArchViz Course'
        const lessonTitle = currentLesson?.title || 'Visualization Lesson'
        
        const messageText = `Student Name: ${studentName}\n` +
          `Student Email: ${user.email || ''}\n` +
          `Project/Course: ${courseTitle}\n` +
          `Lesson Module: ${lessonTitle}\n\n` +
          `Hi Instructor! Here are my render files and source documents for review:`;
          
        const telegramLink = `${telegramChatUrl}?text=${encodeURIComponent(messageText)}`
        window.open(telegramLink, "_blank")
        console.log("handleTelegramSubmit: Submission created. Redirecting to Telegram:", telegramLink)
      } else {
        console.error("handleTelegramSubmit: Failed submission result error:", result.error)
        alert(`Failed to submit: ${result.error}`)
      }
    } catch (err: any) {
      console.error("handleTelegramSubmit: Unexpected error caught:", err)
      alert(`Error: ${err.message || err}`)
    } finally {
      setIsSubmittingExercise(false)
    }
  }

  if (loading || loadingCatalog || hasAccess === null) {
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

  // Access Denied Shield
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

  // Mock duration format for sidebar
  const formatSidebarDuration = (seconds: number) => {
    if (!seconds) return "0m"
    const mins = Math.floor(seconds / 60)
    return `${mins}m`
  }

  const duration = currentLesson?.duration || 0

  const renderPlayer = () => {
    if (loadingVideo) {
      return (
        <div className="aspect-video w-full bg-black rounded-xl flex flex-col items-center justify-center gap-3 border border-zinc-850">
          <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
          <p className="text-xs text-zinc-500">Preparing secure stream...</p>
        </div>
      )
    }
    if (!activeVideo) {
      return (
        <div className="aspect-video w-full bg-black rounded-xl flex flex-col items-center justify-center gap-3 border border-zinc-850">
          <Lock className="w-8 h-8 text-zinc-600" />
          <p className="text-sm text-zinc-400 font-medium">Video for this lesson is not available yet</p>
          <p className="text-xs text-zinc-600">Please contact your instructor if you believe this is an error.</p>
        </div>
      )
    }
    return (
      <SecureVideoPlayer
        videoUrl={activeVideo.url}
        userEmail={user.email || "student@archtipsbox.com"}
        userId={user.id}
        format={activeVideo.format}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleVideoEnded}
      />
    )
  }

  return (
    <main className="min-h-screen flex flex-col justify-between" style={{ backgroundColor: '#060010' }}>
      <Navigation />

      {/* Classroom Container */}
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
          
          {generatedCertId && (
            <Link href={`/certificates/${generatedCertId}`} target="_blank">
              <Button size="sm" className="bg-[#9ACD32]/10 hover:bg-[#9ACD32]/20 text-[#9ACD32] border border-[#9ACD32]/30 rounded-lg flex items-center gap-1.5 text-xs font-semibold py-4">
                <Award className="w-3.5 h-3.5" />
                View Certificate
              </Button>
            </Link>
          )}
        </div>

        {/* Dynamic Split Screen Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Classroom Panel (Left) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Secure Video Player */}
            {renderPlayer()}

            {/* Lesson Title and Descriptions */}
            <div className="bg-zinc-900/20 border border-zinc-850 p-6 rounded-2xl space-y-4">
              <div>
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
          </div>

          {/* Dynamic Sidebar Curriculum (Right) */}
          <div className="lg:col-span-1 bg-zinc-950 border border-zinc-850 rounded-2xl p-5 flex flex-col h-[600px]">
            <div className="flex items-center gap-2 border-b border-zinc-850 pb-4 mb-4">
              <BookOpen className="w-5 h-5 text-primary" style={{ color: '#9ACD32' }} />
              <h2 className="text-lg font-bold text-white">Course Syllabus</h2>
            </div>

            {/* Scrollable syllabus items list */}
            <div className="flex-grow overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {lessons.map((item, idx) => {
                const progress = progressList.find((p) => p.lesson_id === item.lesson_id)
                const isItemCompleted = progress?.is_completed || false
                const isSelected = item.lesson_id === currentLesson?.lesson_id

                return (
                  <button
                    key={item.lesson_id || item.id}
                    onClick={() => handleSelectLesson(item)}
                    className={`w-full text-left p-3 rounded-xl border transition-all duration-300 flex items-center gap-3.5 group ${
                      isSelected 
                        ? "bg-primary/10 border-primary text-white" 
                        : "bg-zinc-900/10 border-zinc-850/60 text-zinc-400 hover:border-zinc-800 hover:text-white"
                    }`}
                    style={isSelected ? { borderColor: '#9ACD32' } : {}}
                  >
                    {/* Completion Checkbox Badge */}
                    <div className="flex-shrink-0">
                      {isItemCompleted ? (
                        <CheckCircle className="w-5 h-5 text-primary fill-primary/10" style={{ color: '#9ACD32' }} />
                      ) : (
                        <Circle className="w-5 h-5 text-zinc-650 group-hover:text-zinc-400 transition-colors" />
                      )}
                    </div>

                    <div className="flex-grow min-w-0">
                      <h4 className={`text-xs font-semibold truncate ${isSelected ? "text-white" : "text-zinc-300"}`}>
                        {idx + 1}. {item.title}
                      </h4>
                      <p className="text-[10px] text-zinc-500 mt-0.5 font-mono">
                        {formatSidebarDuration(item.duration)}
                      </p>
                    </div>
                  </button>
                )
              })}
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
