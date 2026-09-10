"use client"

import * as React from "react"
import { useState, useEffect, useRef, use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { createClient } from "@/lib/supabase/client"
import { db } from "@/lib/supabase/db"
import { SecureVideoPlayer } from "@/components/secure-video-player"
import { LessonComments } from "@/components/lesson-comments"
import { getMediaUrl } from "@/lib/utils"
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
import { 
  useClassroomCourse, 
  useClassroomModules, 
  useClassroomProgress, 
  useClassroomCertificate, 
  useVideoUrl, 
  useClassroomAccess, 
  useLessonExercise, 
  useUpdateProgress 
} from "@/lib/react-query/hooks/use-classroom"
import { courses as mockCourses, d5Modules, getLessonCoverImage, CourseModule, Lesson } from "@/lib/courses-data"

interface PageProps {
  params: Promise<{ slug: string; moduleId: string }>
}

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

function formatDuration(seconds: number): string {
  if (!seconds || Number.isNaN(seconds)) return "0m"
  const mins = Math.floor(seconds / 60)
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  const remMins = mins % 60
  return `${hrs}h ${remMins}m`
}

export default function SpecificModuleClassroomPage({ params }: PageProps) {
  const { slug, moduleId } = use(params)
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  // Fetch course & modules
  const { data: course } = useClassroomCourse(slug)
  const courseId = course ? (course.course_id || course.id) : slug
  const courseIdentifier = courseId || slug
  const { data: modules = [], isLoading: loadingModules } = useClassroomModules(courseIdentifier)
  const { data: progressList = [] } = useClassroomProgress(user?.id, courseId)
  const { data: hasAccessRaw } = useClassroomAccess(user?.id, courseId)
  const hasAccess = hasAccessRaw ?? null
  const { data: existingCert } = useClassroomCertificate(user?.id, courseId)

  // Find candidate modules (DB RPC or fallback to d5Modules)
  const candidateModules = modules.length > 0
    ? modules
    : (slug.includes("d5") || slug === "d5-masterclass" || course?.title?.toLowerCase().includes("d5"))
      ? d5Modules
      : []

  const mod: CourseModule | undefined = candidateModules.find(
    (m, idx) => m.module_id === moduleId || m.lesson_id === moduleId || String(m.order_index) === moduleId || String(idx + 1) === moduleId
  ) || candidateModules[0]

  const lessons: Lesson[] = mod?.lessons || []

  // Active inline lesson state (defaults to 1st lesson in module)
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
  const currentLesson = selectedLesson || lessons[0] || null
  const activeLessonId = currentLesson?.lesson_id

  // Video URL query hook
  const { data: videoData, isLoading: loadingVideo } = useVideoUrl(activeLessonId, hasAccess)
  const updateProgress = useUpdateProgress()

  // Exercise and Submission state
  const { data: exerciseData } = useLessonExercise(activeLessonId)
  const [exercise, setExercise] = useState<any | null>(null)
  const [submissionStatus, setSubmissionStatus] = useState<string | null>(null)
  const [submissionScore, setSubmissionScore] = useState<number | null>(null)
  const [submissionFeedback, setSubmissionFeedback] = useState<string | null>(null)
  const [submissionUrl, setSubmissionUrl] = useState("")
  const [submissionNotes, setSubmissionNotes] = useState("")
  const [isSubmittingExercise, setIsSubmittingExercise] = useState(false)

  // Heartbeat tracking refs
  const lastLoggedTime = useRef<number>(0)
  const isUpdatingProgress = useRef<boolean>(false)

  useEffect(() => {
    if (exerciseData) {
      setExercise(exerciseData)
    }
  }, [exerciseData])

  useEffect(() => {
    async function loadSubmission() {
      if (!user || !activeLessonId) return
      try {
        let activeEx = exercise
        if (!activeEx) {
          const { data: exData } = await supabase
            .from("exercises")
            .select("*")
            .eq("lesson_id", activeLessonId)
            .maybeSingle()
          if (exData) {
            setExercise(exData)
            activeEx = exData
          }
        }
        if (activeEx?.exercise_id) {
          const { data: subData } = await supabase
            .from("exercise_submissions")
            .select("*")
            .eq("exercise_id", activeEx.exercise_id)
            .eq("student_id", user.id)
            .order("submitted_at", { ascending: false })
            .maybeSingle()

          if (subData) {
            setSubmissionStatus(subData.status)
            setSubmissionScore(subData.score)
            setSubmissionFeedback(subData.instructor_feedback)
          } else {
            setSubmissionStatus(null)
            setSubmissionScore(null)
            setSubmissionFeedback(null)
          }
        }
      } catch (err) {
        console.error("Error loading lesson submission:", err)
      }
    }

    loadSubmission()
    setSubmissionUrl("")
    setSubmissionNotes("")
  }, [user, activeLessonId, supabase, exercise])

  // Progress update handler
  const handleTimeUpdate = async (currentTime: number, duration: number) => {
    if (!user || !course || !currentLesson || isUpdatingProgress.current) return
    const activeCourseId = course.course_id || course.id
    const timeDiff = currentTime - lastLoggedTime.current
    const isFinished = duration > 0 && currentTime >= duration * 0.90

    if (lastLoggedTime.current === 0 || timeDiff >= 10 || isFinished) {
      isUpdatingProgress.current = true
      lastLoggedTime.current = currentTime

      const isCompleted = isFinished || progressList.some((p: any) => p.lesson_id === currentLesson.lesson_id && p.is_completed)

      try {
        await updateProgress.mutateAsync({
          userId: user.id,
          courseId: activeCourseId,
          lessonId: currentLesson.lesson_id,
          watchedSeconds: currentTime,
          isCompleted
        })
      } catch (err) {
        console.error("Progress update error:", err)
      } finally {
        isUpdatingProgress.current = false
      }
    }
  }

  // Handle exercise submission
  const handleSubmission = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !currentLesson || !submissionUrl) return
    setIsSubmittingExercise(true)
    try {
      let activeExerciseId = exercise?.exercise_id
      if (!activeExerciseId) {
        const { data: ensuredExercise, error: exerciseError } = await supabase.rpc("ensure_lesson_exercise", {
          p_lesson_id: currentLesson.lesson_id,
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

  // Active video stream resolution (from API signed video, lesson body video_url, or video_external_id)
  const activeVideo = videoData || (currentLesson ? {
    url: currentLesson.video_url || (currentLesson as any).video_external_id || null,
    format: (currentLesson as any).video_source_type || "direct"
  } : null)

  const coverUrl = getLessonCoverImage(slug, mod, (mod?.order_index || 1) - 1)
  const currentCoverUrl = getLessonCoverImage(slug, currentLesson, (currentLesson?.order_index || 1) - 1, coverUrl)
  const totalModuleMinutes = lessons.reduce((sum, l) => sum + (l.duration_minutes || 0), 0)

  const renderPlayer = () => {
    if (loadingVideo || loadingModules) {
      return (
        <div className="aspect-video w-full bg-black rounded-xl overflow-hidden relative border border-zinc-850 flex flex-col items-center justify-center gap-3">
          <img src={getMediaUrl(currentCoverUrl)} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
          <div className="relative z-10 flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#9ACD32]" />
            <p className="text-xs text-zinc-300 font-medium drop-shadow">Loading stream...</p>
          </div>
        </div>
      )
    }

    const streamUrl = activeVideo?.url
    const embedUrl = getEmbedUrl(streamUrl)

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

    if (streamUrl) {
      return (
        <SecureVideoPlayer
          videoUrl={streamUrl}
          userEmail={user?.email || "student@archtipsbox.com"}
          userId={user?.id || ""}
          format={activeVideo?.format || "direct"}
          poster={getMediaUrl(currentCoverUrl)}
          onTimeUpdate={handleTimeUpdate}
        />
      )
    }

    return (
      <div className="aspect-video w-full bg-black rounded-xl overflow-hidden relative border border-zinc-850 flex flex-col items-center justify-center p-6 text-center">
        <img src={getMediaUrl(currentCoverUrl)} alt="" className="absolute inset-0 w-full h-full object-cover opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
        <div className="relative z-10 max-w-md space-y-3">
          <div className="w-12 h-12 rounded-full bg-zinc-900/90 border border-zinc-700 flex items-center justify-center mx-auto text-[#9ACD32]">
            <Play className="w-5 h-5 ml-0.5 fill-current" />
          </div>
          <h3 className="text-base font-bold text-white drop-shadow">
            {currentLesson?.title || "Module Video Player"}
          </h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Video stream for this module lesson is being prepared. Follow along using attached resources and exercises below.
          </p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen flex flex-col justify-between" style={{ backgroundColor: "#060010" }}>
      <Navigation />

      <div className="flex-grow container mx-auto px-6 py-24 md:py-32 max-w-7xl relative z-10">
        
        {/* Breadcrumb Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div className="flex items-center gap-2 flex-wrap text-xs sm:text-sm">
            <Link href="/courses" className="text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Courses
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
            <Link href={`/courses/${slug}/modules`} className="text-zinc-400 hover:text-white transition-colors">
              {course?.title || "Course"}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
            <span className="font-semibold text-[#9ACD32]">
              {mod?.module_number || `Module ${String(mod?.order_index || 1).padStart(2, '0')}`}: {mod?.title}
            </span>
          </div>

          {existingCert && (
            <Link href={`/certificates/${existingCert.certificate_id}`} target="_blank">
              <button className="bg-[#9ACD32]/10 hover:bg-[#9ACD32]/20 text-[#9ACD32] border border-[#9ACD32]/30 rounded-lg flex items-center gap-1.5 text-xs font-semibold px-3 py-2">
                <Award className="w-3.5 h-3.5" />
                View Certificate
              </button>
            </Link>
          )}
        </div>

        {/* Dynamic Split Screen Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Classroom Panel (Left 2 Columns) */}
          <div className="lg:col-span-2 space-y-6">
            {renderPlayer()}

            {/* Active Lesson Title & Details Card */}
            <div className="bg-zinc-900/30 border border-zinc-850 p-6 rounded-2xl space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#9ACD32]/10 text-[#9ACD32] border border-[#9ACD32]/20 font-mono">
                    {mod?.module_number || `Module ${String(mod?.order_index || 1).padStart(2, '0')}`}
                  </span>
                  <span className="text-xs text-zinc-500">&bull;</span>
                  <span className="text-xs text-zinc-400 font-medium">{course?.title}</span>
                </div>

                <h1 className="text-2xl font-bold text-white">
                  {currentLesson?.title || "Module Lesson"}
                </h1>
                <p className="text-zinc-400 text-sm mt-2 leading-relaxed">
                  {currentLesson?.description || mod?.description || "Welcome to this module lesson. Learn the core visualization concepts, lighting setups, and material techniques."}
                </p>
              </div>

              {/* Resource Downloads */}
              {currentLesson?.downloadable_asset_url && (
                <div className="border-t border-zinc-850 pt-5">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300 mb-3 flex items-center gap-2">
                    <Download className="w-4 h-4 text-[#9ACD32]" />
                    Lesson Attachments & Resources
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3 bg-zinc-900/50 border border-zinc-850 rounded-xl flex items-center justify-between group hover:border-zinc-700 transition-colors">
                      <div className="truncate max-w-[80%]">
                        <h4 className="text-xs font-semibold text-white truncate">
                          {decodeURIComponent(currentLesson.downloadable_asset_url.split('/').pop() || "Lesson Attachment / Resources")}
                        </h4>
                        <p className="text-[10px] text-zinc-500 mt-0.5">Downloadable Asset Zip</p>
                      </div>
                      <a
                        href={currentLesson.downloadable_asset_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center rounded-lg hover:bg-[#9ACD32]/10 text-[#9ACD32] p-2 transition-colors border border-transparent hover:border-[#9ACD32]/20"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Homework / Exercise Submission Box */}
              <div className="border-t border-zinc-850 pt-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-[#9ACD32]" />
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
                        <p className="text-xl font-bold text-[#9ACD32] mt-1">{submissionScore} / 100</p>
                      </div>
                      <div className="col-span-2 text-left pl-3 flex flex-col justify-center">
                        <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Instructor Feedback</p>
                        <p className="text-xs text-zinc-300 italic mt-1 leading-relaxed">"{submissionFeedback || "Great job!"}"</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmission} className="space-y-3 bg-zinc-950/60 p-4 rounded-xl border border-zinc-850">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1">
                        Render Image URL / Portfolio Link
                      </label>
                      <input
                        type="url"
                        required
                        value={submissionUrl}
                        onChange={(e) => setSubmissionUrl(e.target.value)}
                        placeholder="https://drive.google.com/... or image link"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-zinc-700"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1">
                        Notes / Software Used (Optional)
                      </label>
                      <input
                        type="text"
                        value={submissionNotes}
                        onChange={(e) => setSubmissionNotes(e.target.value)}
                        placeholder="e.g. Rendered in D5 2.0 with custom HDRI lighting"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-zinc-700"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingExercise}
                      className="w-full bg-[#9ACD32] text-black font-bold text-xs py-2.5 rounded-lg hover:bg-[#8ab82b] transition-all flex items-center justify-center gap-2"
                    >
                      {isSubmittingExercise ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        "Submit Exercise to Instructor"
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Lesson Discussion Comments */}
            {activeLessonId && (
              <div className="bg-zinc-900/30 border border-zinc-850 p-6 rounded-2xl">
                <LessonComments lessonId={activeLessonId} />
              </div>
            )}
          </div>

          {/* Module Syllabus Playlist Sidebar (Right Column) */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-zinc-900/40 border border-zinc-850 p-5 rounded-2xl flex flex-col h-[calc(100vh-12rem)] sticky top-24">
              <div className="flex items-center justify-between border-b border-zinc-850 pb-4 mb-4">
                <div>
                  <h2 className="text-base font-bold text-white">Module Syllabus</h2>
                  <p className="text-[11px] text-zinc-400 mt-0.5">{mod?.title}</p>
                </div>
                <span className="text-[10px] font-mono font-semibold px-2.5 py-1 rounded bg-[#9ACD32]/10 text-[#9ACD32] border border-[#9ACD32]/20">
                  {lessons.length} Lessons
                </span>
              </div>

              <div className="flex-grow overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
                {lessons.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-center text-zinc-500 gap-2 px-4">
                    <BookOpen className="w-8 h-8 opacity-40 text-zinc-600 mb-1" />
                    <p className="text-xs font-semibold text-zinc-400">No lessons published yet</p>
                    <p className="text-[11px] text-zinc-600">Lessons will appear here once added by the instructor.</p>
                  </div>
                ) : (
                  lessons.map((item: Lesson, idx: number) => {
                    const progress = progressList.find((p: any) => p.lesson_id === item.lesson_id)
                    const isItemCompleted = progress?.is_completed || false
                    const isSelected = item.lesson_id === activeLessonId || (currentLesson && currentLesson.title === item.title)
                    const itemCoverUrl = getLessonCoverImage(slug, item, idx, coverUrl)

                    return (
                      <button
                        key={item.lesson_id || idx}
                        type="button"
                        onClick={() => setSelectedLesson(item)}
                        className={`w-full text-left p-3 rounded-xl border transition-all duration-300 flex items-center gap-3 group ${
                          isSelected
                            ? "bg-[#9ACD32]/10 border-[#9ACD32] text-white shadow-sm"
                            : "bg-zinc-900/30 border-zinc-850/70 text-zinc-400 hover:border-zinc-700 hover:text-white"
                        }`}
                      >
                        {/* 16:9 Lesson Cover Thumbnail */}
                        <div className="w-16 h-10 rounded-lg overflow-hidden bg-black/60 border border-zinc-800 shrink-0 relative">
                          <img
                            src={getMediaUrl(itemCoverUrl)}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {isSelected && (
                            <div className="absolute inset-0 bg-[#9ACD32]/20 border border-[#9ACD32]/40 rounded-lg flex items-center justify-center">
                              <Play className="w-3.5 h-3.5 text-[#9ACD32] fill-current" />
                            </div>
                          )}
                        </div>

                        <div className="flex-grow min-w-0">
                          <h4 className={`text-xs font-semibold truncate ${isSelected ? "text-white" : "text-zinc-300"}`}>
                            {item.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-zinc-500 font-mono">
                              {item.duration_minutes || 0}m
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
                            <CheckCircle className="w-4 h-4 text-[#9ACD32] fill-[#9ACD32]/10" />
                          ) : isSelected ? (
                            <Play className="w-3.5 h-3.5 text-[#9ACD32] fill-current" />
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
      </div>

      <Footer />
    </main>
  )
}
