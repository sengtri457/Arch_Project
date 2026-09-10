export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { CourseEnrollCta } from "@/components/course-enroll-cta"
import { VideoIntroductionPlayer } from "@/components/video-introduction-player"
import { getMediaUrl } from "@/lib/utils"
import { Lock, PlayCircle, Clock, BarChart3, User, Award, CheckCircle2 } from "lucide-react"
import { courses as mockCourses, d5Modules, getLessonCoverImage } from "@/lib/courses-data"

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
      .select("course_id, title, slug, description, thumbnail_url, price, difficulty, duration, instructor, category, software_used, features, lessons, introduction_url")
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
      category: fallback.category,
      software_used: fallback.software_used,
      features: fallback.features,
      lessons: fallback.lessons,
      introduction_url: fallback.introduction_url || null
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
    return { title: "Course not found - Archtipsbox" }
  }

  return {
    title: `${course.title} - Archtipsbox`,
    description: course.description || undefined,
    openGraph: {
      title: course.title,
      description: course.description || undefined,
      images: course.thumbnail_url ? [{ url: getMediaUrl(course.thumbnail_url) }] : undefined
    }
  }
}

export default async function CourseLandingPage({ params }: PageProps) {
  const { slug } = await params
  const course = await getCourse(slug)

  if (!course) notFound()

  const modules = await getModules(slug)
  const totalLessons = modules.reduce((sum, m) => sum + (m.lessons?.length || 0), 0)
  const totalMinutes = modules.reduce((sum, m) => sum + (m.duration_minutes || 0), 0)

  const features = Array.isArray((course as any).features) ? (course as any).features : []

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.description || undefined,
    provider: { "@type": "Organization", name: "Archtipsbox" },
    instructor: course.instructor ? { "@type": "Person", name: course.instructor } : undefined,
    offers: {
      "@type": "Offer",
      price: course.price ?? undefined,
      priceCurrency: "USD",
      availability: "https://schema.org/InStock"
    }
  }

  return (
    <main className="min-h-screen flex flex-col" style={{ backgroundColor: "#060010" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Navigation />

      <div className="flex-grow container mx-auto px-6 py-24 md:py-32 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          <div className="lg:col-span-3 space-y-8">
            <div>
              {course.category && (
                <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold border border-[#9ACD32]/30 bg-[#9ACD32]/10 text-[#9ACD32] mb-4">
                  {course.category}
                </span>
              )}
              <h1 className="text-4xl md:text-5xl font-bold text-white">{course.title}</h1>
              {course.description && (
                <p className="text-zinc-400 mt-4 leading-relaxed whitespace-pre-line">{course.description}</p>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: BarChart3, label: course.difficulty || "Intermediate" },
                { icon: Clock, label: course.duration || `${totalMinutes} min` },
                { icon: PlayCircle, label: `${totalLessons || (course as any).lessons || 0} lessons` },
                { icon: User, label: course.instructor || "Archtipsbox Team" }
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-3.5 flex items-center gap-2.5">
                  <Icon className="w-4 h-4 shrink-0" style={{ color: "#9ACD32" }} />
                  <span className="text-xs font-medium text-zinc-300 truncate">{label}</span>
                </div>
              ))}
            </div>

            {course && (course as any).introduction_url && (
              <section className="bg-zinc-900/30 border border-zinc-800/60 rounded-2xl p-6 space-y-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <PlayCircle className="w-5 h-5 animate-pulse" style={{ color: "#9ACD32" }} />
                  Watch Video Introduction
                </h2>
                <div className="aspect-video w-full rounded-xl overflow-hidden border border-zinc-800 bg-black relative">
                  <VideoIntroductionPlayer 
                    introductionUrl={getMediaUrl((course as any).introduction_url)}
                    thumbnailUrl={course.thumbnail_url ? getMediaUrl(course.thumbnail_url) : undefined}
                    title={course.title}
                  />
                </div>
              </section>
            )}

            {features.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-white mb-4">What you&apos;ll learn</h2>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {features.map((feature: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2.5 text-sm text-zinc-300">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#9ACD32" }} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Course Modules</h2>
                <span className="text-xs text-zinc-400 font-mono">
                  {modules.length} Modules &bull; {totalLessons} Lessons &bull; {totalMinutes}m Total
                </span>
              </div>
              {modules.length === 0 ? (
                <p className="text-sm text-zinc-500 italic">The course modules will be published soon.</p>
              ) : (
                <div className="space-y-4">
                  {modules.map((mod, idx) => {
                    const coverUrl = getLessonCoverImage(course.slug || course.title || slug, mod, idx)
                    const moduleNum = mod.module_number || `Module ${String(mod.order_index || idx + 1).padStart(2, '0')}`

                    return (
                      <div
                        key={mod.module_id}
                        className="bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700 rounded-2xl p-4 transition-all duration-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 group"
                      >
                        <div className="flex items-center gap-4 min-w-0 w-full sm:w-auto flex-grow">
                          {/* 16:9 Module Cover Thumbnail */}
                          <div className="w-32 sm:w-40 aspect-video rounded-xl overflow-hidden bg-black/50 border border-zinc-800/80 shrink-0 relative">
                            <img
                              src={getMediaUrl(coverUrl)}
                              alt={mod.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                            <span className="absolute bottom-1.5 left-2 text-[10px] font-bold font-mono text-zinc-300 drop-shadow">
                              {mod.duration_minutes || 0}m
                            </span>
                          </div>

                          <div className="min-w-0 flex-grow">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#9ACD32]/10 text-[#9ACD32] border border-[#9ACD32]/20">
                                {moduleNum}
                              </span>
                              <span className="text-[10px] font-medium text-zinc-400">
                                {mod.lessons?.length || 0} Lessons
                              </span>
                              {mod.is_preview && (
                                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                  Free Preview
                                </span>
                              )}
                            </div>
                            <h3 className="text-base font-semibold text-white group-hover:text-[#9ACD32] transition-colors">
                              {mod.title}
                            </h3>
                            {mod.description && (
                              <p className="text-xs text-zinc-400 line-clamp-2 mt-1">
                                {mod.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                          <Link
                            href={`/courses/${slug}/modules/${mod.module_id}`}
                            className="text-xs font-semibold px-4 py-2.5 rounded-xl border border-[#9ACD32]/40 bg-[#9ACD32]/10 text-[#9ACD32] hover:bg-[#9ACD32]/20 transition-all flex items-center gap-1.5 shadow-sm"
                          >
                            <span>Explore Module</span>
                            <PlayCircle className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>

            <section className="bg-zinc-900/30 border border-zinc-800/60 rounded-2xl p-6 flex items-start gap-4">
              <Award className="w-6 h-6 shrink-0" style={{ color: "#9ACD32" }} />
              <div>
                <h3 className="text-sm font-bold text-white">Earn a certificate</h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Complete every lesson in this masterclass to receive a verifiable Archtipsbox certificate with a unique serial number.
                </p>
              </div>
            </section>
          </div>

          <aside className="lg:col-span-2">
            <div className="sticky top-28 bg-zinc-900/40 border border-zinc-800/60 rounded-2xl overflow-hidden">
              <div className="aspect-video w-full bg-black">
                {course.thumbnail_url ? (
                  <img src={getMediaUrl(course.thumbnail_url)} alt={course.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-zinc-950" />
                )}
              </div>
              <div className="p-6 space-y-5">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-white">${Number(course.price ?? 49.99).toFixed(2)}</span>
                  <span className="text-xs text-zinc-500">one-time purchase</span>
                </div>
                <CourseEnrollCta courseId={course.course_id} slug={course.slug} />
                <ul className="space-y-2 pt-4 border-t border-zinc-800/60">
                  {[
                    "Lifetime access to all lessons",
                    "Instructor-graded exercises",
                    "Verifiable completion certificate",
                    "Secure HD streaming with Bunny CDN"
                  ].map((perk) => (
                    <li key={perk} className="flex items-center gap-2.5 text-xs text-zinc-400">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: "#9ACD32" }} />
                      {perk}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <Footer />
    </main>
  )
}
