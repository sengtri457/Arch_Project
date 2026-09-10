export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { getMediaUrl } from "@/lib/utils"
import { Lock, PlayCircle, Clock, ArrowLeft, BookOpen, CheckCircle2 } from "lucide-react"
import { courses as mockCourses, d5Modules, getLessonCoverImage, CourseModule, Lesson } from "@/lib/courses-data"

interface PageProps {
  params: Promise<{ slug: string; moduleId: string }>
}

function anonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

async function getCourse(slug: string) {
  try {
    const { data } = await anonClient()
      .from("courses")
      .select("course_id, title, slug, description, thumbnail_url, price, difficulty, duration, instructor, category")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle()
    if (data) return data
  } catch {}

  const fallback = mockCourses.find((c) => c.id === slug)
  if (fallback) {
    return {
      course_id: fallback.course_id || fallback.id,
      title: fallback.title,
      slug: fallback.id,
      description: fallback.description,
      thumbnail_url: fallback.image,
      price: parseFloat(fallback.price.replace(/[^0-9.]/g, '')) || 49.99,
      difficulty: fallback.level,
      duration: fallback.duration,
      instructor: fallback.instructor,
      category: fallback.category
    }
  }
  return null
}

async function getModule(slug: string, moduleId: string): Promise<CourseModule | null> {
  try {
    const { data } = await anonClient().rpc("get_course_modules", { p_slug: slug })
    if (Array.isArray(data) && data.length > 0) {
      const match = data.find(
        (m: any) => m.module_id === moduleId || m.module_order_index === Number(moduleId) || m.module_id === `mod-${slug}-${moduleId}`
      )
      if (match) {
        return {
          module_id: match.module_id,
          order_index: match.module_order_index,
          module_number: `Module ${String(match.module_order_index).padStart(2, '0')}`,
          title: match.module_title,
          description: match.module_description || '',
          cover_image: match.module_cover_image || getLessonCoverImage(slug, null, match.module_order_index - 1),
          duration_minutes: (match.lessons || []).reduce((sum: number, l: any) => sum + (l.duration_minutes || 0), 0),
          is_preview: (match.lessons || []).some((l: any) => l.is_preview),
          lessons: match.lessons || []
        }
      }
    }
  } catch {}

  // Fallback to d5Modules
  if (slug === "d5-masterclass" || slug.includes("d5") || slug === "d4a1b756-12d4-4047-93bd-8b58b94cb146") {
    const found = d5Modules.find(
      (m, idx) => m.module_id === moduleId || m.lesson_id === moduleId || String(idx + 1) === moduleId || `mod-d5-${String(idx + 1).padStart(2, '0')}` === moduleId
    )
    if (found) return found
  }

  return null
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, moduleId } = await params
  const course = await getCourse(slug)
  const mod = await getModule(slug, moduleId)

  if (!course || !mod) {
    return { title: "Module not found - Archtipsbox" }
  }

  return {
    title: `${mod.title} | ${course.title} - Archtipsbox`,
    description: mod.description || undefined
  }
}

export default async function SpecificModulePage({ params }: PageProps) {
  const { slug, moduleId } = await params
  const course = await getCourse(slug)
  const mod = await getModule(slug, moduleId)

  if (!course || !mod) notFound()

  const coverUrl = getLessonCoverImage(slug, mod, mod.order_index - 1)
  const lessons = mod.lessons || []
  const totalMinutes = lessons.reduce((sum, l) => sum + (l.duration_minutes || 0), 0)

  return (
    <main className="min-h-screen flex flex-col" style={{ backgroundColor: "#060010" }}>
      <Navigation />

      <div className="flex-grow container mx-auto px-6 py-24 md:py-32 max-w-5xl">
        {/* Back Link */}
        <Link
          href={`/courses/${slug}`}
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-[#9ACD32] mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to {course.title} Modules</span>
        </Link>

        {/* Module Header Card */}
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 md:p-8 mb-10 relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            <div className="aspect-video w-full rounded-xl overflow-hidden bg-black/60 border border-zinc-800 relative">
              <img
                src={getMediaUrl(coverUrl)}
                alt={mod.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
              <span className="absolute bottom-2 left-3 text-xs font-bold font-mono text-zinc-300 drop-shadow">
                {totalMinutes}m Total
              </span>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-1 rounded bg-[#9ACD32]/10 text-[#9ACD32] border border-[#9ACD32]/20">
                  {mod.module_number || `Module ${String(mod.order_index).padStart(2, '0')}`}
                </span>
                <span className="text-xs text-zinc-400 font-mono">
                  {lessons.length} Lessons
                </span>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-white">{mod.title}</h1>

              {mod.description && (
                <p className="text-sm text-zinc-400 leading-relaxed">{mod.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Lesson Contain Card */}
        <section className="bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-800/60 pb-4">
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5" style={{ color: "#9ACD32" }} />
              <h2 className="text-xl font-bold text-white">Lesson Contain</h2>
            </div>
            <span className="text-xs text-zinc-400 font-mono">
              {lessons.length} Lessons Available
            </span>
          </div>

          {lessons.length === 0 ? (
            <p className="text-sm text-zinc-500 italic py-6 text-center">No lessons added to this module yet.</p>
          ) : (
            <div className="space-y-3">
              {lessons.map((lesson: Lesson, idx: number) => {
                const lessonCover = getLessonCoverImage(slug, lesson, idx, coverUrl)
                const lessonNum = `Lesson ${mod.order_index}.${lesson.order_index || idx + 1}`

                return (
                  <div
                    key={lesson.lesson_id}
                    className="bg-zinc-900/60 border border-zinc-800/60 hover:border-zinc-700/80 rounded-xl p-4 transition-all duration-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
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
                      </div>

                      <div className="min-w-0 flex-grow">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono font-semibold text-[#9ACD32]">
                            {lessonNum}
                          </span>
                          {lesson.is_preview && (
                            <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              Free Preview
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-semibold text-white group-hover:text-[#9ACD32] transition-colors truncate">
                          {lesson.title}
                        </h3>
                        {lesson.description && (
                          <p className="text-xs text-zinc-400 line-clamp-1 mt-0.5 hidden sm:block">
                            {lesson.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                      <Link
                        href={`/courses/${slug}/${lesson.lesson_id}`}
                        className="text-xs font-semibold px-4 py-2 rounded-xl border border-[#9ACD32]/40 text-[#9ACD32] hover:bg-[#9ACD32]/10 transition-colors flex items-center gap-1.5"
                      >
                        <PlayCircle className="w-3.5 h-3.5" />
                        <span>Watch Lesson</span>
                      </Link>
                    </div>
                  </div>
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
