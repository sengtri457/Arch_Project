export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { getMediaUrl } from "@/lib/utils"
import { Lock, PlayCircle, Clock, BarChart3, User, BookOpen, ArrowLeft, CheckCircle2 } from "lucide-react"
import { courses as mockCourses, d5Modules, getLessonCoverImage, CourseModule } from "@/lib/courses-data"

interface PageProps {
  params: Promise<{ slug: string }>
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

async function getModules(slug: string): Promise<CourseModule[]> {
  try {
    const { data } = await anonClient().rpc("get_course_modules", { p_slug: slug })
    if (Array.isArray(data) && data.length > 0) {
      return data.map((m: any) => ({
        module_id: m.module_id,
        order_index: m.module_order_index,
        module_number: `Module ${String(m.module_order_index).padStart(2, '0')}`,
        title: m.module_title,
        description: m.module_description || '',
        cover_image: m.module_cover_image || getLessonCoverImage(slug, null, m.module_order_index - 1),
        duration_minutes: (m.lessons || []).reduce((sum: number, l: any) => sum + (l.duration_minutes || 0), 0),
        is_preview: (m.lessons || []).some((l: any) => l.is_preview),
        lessons: m.lessons || []
      }))
    }
  } catch {}

  if (slug === "d5-masterclass" || slug.includes("d5") || slug === "d4a1b756-12d4-4047-93bd-8b58b94cb146") {
    return d5Modules
  }
  return []
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const course = await getCourse(slug)

  if (!course) {
    return { title: "Modules not found - Archtipsbox" }
  }

  return {
    title: `Course Modules | ${course.title} - Archtipsbox`,
    description: course.description || undefined
  }
}

export default async function CourseModulesOverviewPage({ params }: PageProps) {
  const { slug } = await params
  const course = await getCourse(slug)

  if (!course) notFound()

  const modules = await getModules(slug)
  const totalLessons = modules.reduce((sum, m) => sum + (m.lessons?.length || 0), 0)
  const totalMinutes = modules.reduce((sum, m) => sum + (m.duration_minutes || 0), 0)

  return (
    <main className="min-h-screen flex flex-col" style={{ backgroundColor: "#060010" }}>
      <Navigation />

      <div className="flex-grow container mx-auto px-6 py-24 md:py-32 max-w-6xl">
        {/* Back Link */}
        <Link
          href={`/courses/${slug}`}
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-[#9ACD32] mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Course Details & Overview</span>
        </Link>

        {/* Course Header Banner */}
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 md:p-8 mb-10 space-y-4 relative overflow-hidden">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-wider px-3 py-1 rounded-full bg-[#9ACD32]/10 text-[#9ACD32] border border-[#9ACD32]/20">
              {course.category || "Masterclass"}
            </span>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Enrolled Student Access
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl font-bold text-white">{course.title} - Modules</h1>
          {course.description && (
            <p className="text-sm md:text-base text-zinc-400 max-w-3xl leading-relaxed">{course.description}</p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {[
              { icon: BookOpen, label: `${modules.length} Modules` },
              { icon: PlayCircle, label: `${totalLessons} Lessons` },
              { icon: Clock, label: `${totalMinutes} Total Mins` },
              { icon: User, label: course.instructor || "Bun Sambath" }
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="bg-black/40 border border-zinc-800/60 rounded-xl p-3 flex items-center gap-2.5">
                <Icon className="w-4 h-4 shrink-0 text-[#9ACD32]" />
                <span className="text-xs font-medium text-zinc-300 truncate">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Modules List Grid */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-800/60 pb-4">
            <h2 className="text-2xl font-bold text-white">Select a Module to Start Watching</h2>
            <span className="text-xs font-mono text-zinc-400">
              {modules.length} Modules Available
            </span>
          </div>

          {modules.length === 0 ? (
            <div className="text-center py-16 bg-zinc-900/30 border border-zinc-800 rounded-2xl text-zinc-500 text-sm">
              No modules published for this course yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {modules.map((mod, idx) => {
                const coverUrl = getLessonCoverImage(slug, mod, idx)
                const moduleNum = mod.module_number || `Module ${String(mod.order_index || idx + 1).padStart(2, '0')}`

                return (
                  <div
                    key={mod.module_id || idx}
                    className="bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700/90 rounded-2xl overflow-hidden transition-all duration-300 flex flex-col group"
                  >
                    {/* Module Cover Image */}
                    <div className="aspect-video w-full bg-black/60 relative overflow-hidden">
                      <img
                        src={getMediaUrl(coverUrl)}
                        alt={mod.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                      <span className="absolute top-3 left-3 text-xs uppercase font-bold tracking-wider px-2.5 py-1 rounded bg-[#9ACD32] text-black shadow-md font-mono">
                        {moduleNum}
                      </span>

                      <span className="absolute bottom-3 right-3 text-xs font-bold font-mono text-zinc-200 bg-black/70 px-2.5 py-1 rounded backdrop-blur-sm">
                        {mod.duration_minutes || 0}m Total
                      </span>
                    </div>

                    {/* Module Info */}
                    <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
                          <span>{mod.lessons?.length || 0} Lessons Included</span>
                          {mod.is_preview && <span className="text-blue-400 font-semibold">Includes Free Preview</span>}
                        </div>
                        <h3 className="text-xl font-bold text-white group-hover:text-[#9ACD32] transition-colors">
                          {mod.title}
                        </h3>
                        {mod.description && (
                          <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                            {mod.description}
                          </p>
                        )}
                      </div>

                      <div className="pt-2">
                        <Link
                          href={`/courses/${slug}/modules/${mod.module_id}`}
                          className="w-full text-xs font-bold py-3 px-4 rounded-xl border border-[#9ACD32]/40 bg-[#9ACD32]/10 text-[#9ACD32] hover:bg-[#9ACD32] hover:text-black transition-all duration-300 flex items-center justify-center gap-2 shadow-sm"
                        >
                          <span>Explore Module & Lessons</span>
                          <PlayCircle className="w-4 h-4" />
                        </Link>
                      </div>
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
