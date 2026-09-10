"use client"

import * as React from "react"
import { useState, use } from "react"
import Link from "next/link"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { getMediaUrl } from "@/lib/utils"
import { VideoIntroductionPlayer } from "@/components/video-introduction-player"
import { PlayCircle, Clock, ArrowLeft, BookOpen, CheckCircle, Download, Send, Play } from "lucide-react"
import { courses as mockCourses, d5Modules, getLessonCoverImage, CourseModule, Lesson } from "@/lib/courses-data"
import { useClassroomCourse, useClassroomModules, useVideoUrl, useClassroomAccess } from "@/lib/react-query/hooks/use-classroom"
import { useAuth } from "@/components/auth-provider"

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

export default function SpecificModulePage({ params }: PageProps) {
  const { slug, moduleId } = use(params)
  const { user } = useAuth()

  const { data: course } = useClassroomCourse(slug)
  const courseId = course ? (course.course_id || course.id) : slug
  const { data: modules = [] } = useClassroomModules(courseId || slug)

  // Find target module from RPC or fallback to d5Modules
  const candidateModules = modules.length > 0 ? modules : (slug.includes("d5") || slug === "d5-masterclass" ? d5Modules : [])
  const mod: CourseModule | undefined = candidateModules.find(
    (m, idx) => m.module_id === moduleId || m.lesson_id === moduleId || String(m.order_index) === moduleId || String(idx + 1) === moduleId
  ) || candidateModules[0]

  const lessons: Lesson[] = mod?.lessons || []

  // Active inline lesson state (defaults to 1st lesson in module)
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null)

  // Sync active lesson on initial load or module change
  const currentActiveLesson = activeLesson || lessons[0] || null

  const activeLessonId = currentActiveLesson?.lesson_id
  const { data: hasAccess } = useClassroomAccess(user?.id, courseId)
  const { data: videoData } = useVideoUrl(activeLessonId, hasAccess ?? true)

  const coverUrl = getLessonCoverImage(slug, mod, (mod?.order_index || 1) - 1)
  const activeLessonCover = getLessonCoverImage(slug, currentActiveLesson, (currentActiveLesson?.order_index || 1) - 1, coverUrl)
  const totalMinutes = lessons.reduce((sum, l) => sum + (l.duration_minutes || 0), 0)

  // Stream video source URL: fetched video endpoint OR direct external link
  const streamUrl = videoData?.url || currentActiveLesson?.video_url || null
  const embedUrl = getEmbedUrl(streamUrl)

  return (
    <main className="min-h-screen flex flex-col" style={{ backgroundColor: "#060010" }}>
      <Navigation />

      <div className="flex-grow container mx-auto px-6 py-24 md:py-32 max-w-6xl">
        {/* Back Link */}
        <Link
          href={`/courses/${slug}/modules`}
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-[#9ACD32] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All {course?.title || "Course"} Modules</span>
        </Link>

        {/* Module Header Banner */}
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 md:p-8 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-0.5 rounded bg-[#9ACD32]/10 text-[#9ACD32] border border-[#9ACD32]/20 font-mono">
                {mod?.module_number || `Module ${String(mod?.order_index || 1).padStart(2, '0')}`}
              </span>
              <span className="text-xs text-zinc-400 font-mono">
                {lessons.length} Lessons &bull; {totalMinutes}m Total
              </span>
            </div>
            <h1 className="text-3xl font-bold text-white">{mod?.title || "Module Classroom"}</h1>
            {mod?.description && (
              <p className="text-xs text-zinc-400 mt-1 max-w-3xl leading-relaxed">{mod.description}</p>
            )}
          </div>
        </div>

        {/* INLINE VIDEO STREAMING PLAYER SECTION */}
        <section className="bg-zinc-950 border border-zinc-800/90 rounded-2xl p-4 md:p-6 mb-10 space-y-4 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <PlayCircle className="w-5 h-5 text-[#9ACD32] shrink-0 animate-pulse" />
              <h2 className="text-lg font-bold text-white truncate">
                {currentActiveLesson ? currentActiveLesson.title : "Select a lesson below to watch"}
              </h2>
            </div>
            {currentActiveLesson && (
              <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-zinc-900 text-zinc-300 border border-zinc-800">
                {currentActiveLesson.duration_minutes || 0} mins
              </span>
            )}
          </div>

          {/* Video Stream Container */}
          <div className="aspect-video w-full rounded-xl overflow-hidden bg-black relative border border-zinc-800/80 flex items-center justify-center">
            {embedUrl ? (
              <iframe
                src={embedUrl}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : streamUrl ? (
              <video
                src={getMediaUrl(streamUrl)}
                controls
                autoPlay
                className="w-full h-full object-contain"
                poster={getMediaUrl(activeLessonCover)}
              />
            ) : (
              <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center">
                <img
                  src={getMediaUrl(activeLessonCover)}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover opacity-20"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
                <div className="relative z-10 max-w-md space-y-3">
                  <div className="w-12 h-12 rounded-full bg-zinc-900/90 border border-zinc-700 flex items-center justify-center mx-auto text-[#9ACD32]">
                    <Play className="w-5 h-5 ml-0.5 fill-current" />
                  </div>
                  <h3 className="text-base font-bold text-white drop-shadow">
                    {currentActiveLesson ? currentActiveLesson.title : "Module Video Player"}
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Interactive video stream ready for inline viewing. Click any lesson in the playlist below to play immediately on this page.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Active Lesson Description & Downloads */}
          {currentActiveLesson && (
            <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-zinc-850">
              <div>
                <p className="text-xs text-zinc-300">
                  {currentActiveLesson.description || "In this module lesson, learn step-by-step rendering configurations and practical tips."}
                </p>
              </div>
              {currentActiveLesson.downloadable_asset_url && (
                <a
                  href={currentActiveLesson.downloadable_asset_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#9ACD32]/10 text-[#9ACD32] border border-[#9ACD32]/30 hover:bg-[#9ACD32]/20 transition-colors shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Lesson Assets
                </a>
              )}
            </div>
          )}
        </section>

        {/* LESSON CONTAIN CARD (Playlist) */}
        <section className="bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-[#9ACD32]" />
              <h2 className="text-xl font-bold text-white">Lesson Contain</h2>
            </div>
            <span className="text-xs text-zinc-400 font-mono">
              {lessons.length} Lessons Available (Click to Watch Inline)
            </span>
          </div>

          {lessons.length === 0 ? (
            <p className="text-sm text-zinc-500 italic py-6 text-center">No lessons added to this module yet.</p>
          ) : (
            <div className="space-y-3">
              {lessons.map((lesson: Lesson, idx: number) => {
                const isSelected = (currentActiveLesson?.lesson_id || currentActiveLesson?.title) === (lesson.lesson_id || lesson.title)
                const lessonCover = getLessonCoverImage(slug, lesson, idx, coverUrl)
                const lessonNum = `Lesson ${(mod?.order_index || 1)}.${lesson.order_index || idx + 1}`

                return (
                  <button
                    key={lesson.lesson_id || idx}
                    type="button"
                    onClick={() => setActiveLesson(lesson)}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group ${
                      isSelected
                        ? "bg-[#9ACD32]/10 border-[#9ACD32] text-white shadow-lg"
                        : "bg-zinc-900/60 border-zinc-800/60 hover:border-zinc-700/80 text-zinc-300"
                    }`}
                  >
                    <div className="flex items-center gap-4 min-w-0 w-full sm:w-auto flex-grow">
                      {/* Lesson Thumbnail */}
                      <div className="w-24 sm:w-28 aspect-video rounded-lg overflow-hidden bg-black/50 border border-zinc-800/80 shrink-0 relative">
                        <img
                          src={getMediaUrl(lessonCover)}
                          alt={lesson.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <span className="absolute bottom-1 right-1 text-[9px] font-bold font-mono text-zinc-300 bg-black/70 px-1 rounded">
                          {lesson.duration_minutes || 0}m
                        </span>
                        {isSelected && (
                          <div className="absolute inset-0 bg-[#9ACD32]/30 flex items-center justify-center">
                            <Play className="w-5 h-5 text-black fill-current" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-grow">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-mono font-bold ${isSelected ? "text-[#9ACD32]" : "text-zinc-400"}`}>
                            {lessonNum}
                          </span>
                          {lesson.is_preview && (
                            <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              Free Preview
                            </span>
                          )}
                        </div>
                        <h3 className={`text-sm font-semibold truncate ${isSelected ? "text-[#9ACD32]" : "text-white group-hover:text-[#9ACD32]"} transition-colors`}>
                          {lesson.title}
                        </h3>
                        {lesson.description && (
                          <p className="text-xs text-zinc-400 line-clamp-1 mt-0.5 hidden sm:block">
                            {lesson.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <span className={`text-xs font-semibold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${
                        isSelected
                          ? "bg-[#9ACD32] text-black border-[#9ACD32]"
                          : "border-[#9ACD32]/40 text-[#9ACD32] group-hover:bg-[#9ACD32]/10"
                      }`}>
                        <PlayCircle className="w-3.5 h-3.5" />
                        <span>{isSelected ? "Currently Playing" : "Watch Inline"}</span>
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </section>
      </div>

      <Footer />
    </main>
  )
}
