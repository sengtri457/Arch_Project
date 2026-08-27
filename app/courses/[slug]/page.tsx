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
  const { data } = await anonClient()
    .from("courses")
    .select("course_id, title, slug, description, thumbnail_url, price, difficulty, duration, instructor, category, software_used, features, lessons, introduction_url")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle()
  return data
}

async function getCurriculum(slug: string) {
  const { data } = await anonClient().rpc("get_course_curriculum", { p_slug: slug })
  return Array.isArray(data) ? data : []
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

  const curriculum = await getCurriculum(slug)
  const features = Array.isArray((course as any).features) ? (course as any).features : []
  const totalMinutes = curriculum.reduce((sum, l) => sum + (l.duration_minutes || 0), 0)

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
                { icon: PlayCircle, label: `${(course as any).lessons || curriculum.length} lessons` },
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
              <h2 className="text-xl font-bold text-white mb-4">Curriculum</h2>
              {curriculum.length === 0 ? (
                <p className="text-sm text-zinc-500 italic">The full syllabus will be published soon.</p>
              ) : (
                <div className="rounded-2xl border border-zinc-800/60 divide-y divide-zinc-800/60 overflow-hidden">
                  {curriculum.map((lesson) => (
                    <div key={lesson.lesson_id} className="flex items-center justify-between gap-4 p-4 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <Lock className="w-3.5 h-3.5 shrink-0 text-zinc-500" />
                        <span className="text-sm text-zinc-300 truncate">{lesson.title}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-zinc-500">{lesson.duration_minutes || 0}m</span>
                        {lesson.is_preview ? (
                          <Link
                            href={`/courses/${slug}/${lesson.lesson_id}`}
                            className="text-xs font-semibold px-3 py-1 rounded-lg border border-[#9ACD32]/40 text-[#9ACD32] hover:bg-[#9ACD32]/10 transition-colors"
                          >
                            Preview
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  ))}
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
