"use client"

import { useState, useEffect, Suspense } from "react"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import Link from "next/link"
import {
  Clock,
  Users,
  Play,
  ArrowRight,
  Loader2,
  Check,
} from "lucide-react"

import { getMediaUrl } from "@/lib/utils"
import { useCourses, useCourseAccessMap } from "@/lib/react-query/hooks/use-courses"
import { createClient } from "@/lib/supabase/client"

const SOFTWARE_FILTERS = ["All", "D5 Render", "AutoCAD", "SketchUp", "InDesign", "Photoshop", "Enscape"]

function CoursesContent() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All")
  const [selectedSoftware, setSelectedSoftware] = useState<string>("All")
  const { data: courses = [], isLoading } = useCourses()
  const { data: accessMap = {} } = useCourseAccessMap()

  const uniqueCategories = Array.from(new Set(courses.map((c) => c.category).filter(Boolean)))
  const categories = ["All", ...uniqueCategories.filter((cat) => cat !== "All")]

  const filteredCourses = courses.filter((course) => {
    const categoryMatch = selectedCategory === "All" || course.category === selectedCategory

    let softwareMatch = true
    if (selectedSoftware !== "All") {
      const courseSoftware = course.software_used || ""
      const filterLower = selectedSoftware.toLowerCase()
      const courseLower = courseSoftware.toLowerCase()
      softwareMatch = courseLower.includes(filterLower) || filterLower.includes(courseLower)
    }

    return categoryMatch && softwareMatch
  })

  const isUnlocked = (course: any) => accessMap[course.course_id || course.id]

  const [pendingCourseIds, setPendingCourseIds] = useState<string[]>([])

  useEffect(() => {
    const supabase = createClient()
    async function loadPending() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from("pending_enrollments")
        .select("course_id")
        .eq("email", user.email?.toLowerCase())
        .eq("status", "pending")
      if (data) {
        setPendingCourseIds(data.map((d) => d.course_id))
      }
    }
    loadPending()
  }, [])

  const isPending = (course: any) => pendingCourseIds.includes(course.course_id || course.id)

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background">
        <Navigation />
        <section className="relative py-32 overflow-hidden" style={{ backgroundColor: "#060010" }}>
          <div className="container mx-auto px-6">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white mb-6">Learn with Us</h1>
              <p className="text-lg sm:text-xl text-gray-300">Master architectural visualization with our comprehensive courses</p>
            </div>
          </div>
        </section>
        <section className="py-24" style={{ backgroundColor: "#060010" }}>
          <div className="w-full px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-zinc-900/30 border border-zinc-800/60 rounded-2xl overflow-hidden">
                  <div className="aspect-video w-full bg-zinc-800" />
                  <div className="p-6 space-y-4">
                    <div className="h-4 bg-zinc-800 rounded w-1/3" />
                    <div className="h-6 bg-zinc-800 rounded w-2/3" />
                    <div className="h-4 bg-zinc-800 rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        <Footer />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="relative pt-32 pb-16 overflow-hidden" style={{ backgroundColor: "#060010" }}>
        <div className="container mx-auto px-6">
          <div className="text-center max-w-4xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 text-xs font-semibold text-zinc-300">
              <span className="w-2 h-2 rounded-full bg-[#9ACD32] animate-pulse" />
              ArchTipsBox Masterclasses & Academy
            </div>
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white tracking-tight">
              Learn with Us
            </h1>
            <p className="text-base sm:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Master photorealistic rendering, architectural animation, and post-production workflows with industry-graded curriculums.
            </p>
          </div>
        </div>
      </section>

      {/* Main Course Selection Hub */}
      <section className="pb-28" style={{ backgroundColor: "#060010" }}>
        <div className="container mx-auto px-4 sm:px-6">
          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-6 max-w-5xl mx-auto">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 sm:px-5 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
                  selectedCategory === category
                    ? "bg-[#9ACD32] text-black shadow-md shadow-[#9ACD32]/10"
                    : "bg-zinc-900/40 text-zinc-400 hover:text-white border border-zinc-800/70"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* 4. Software Filter */}
          <div className="flex flex-wrap justify-center gap-2 mb-12 max-w-5xl mx-auto pt-2">
            {SOFTWARE_FILTERS.map((software) => (
              <button
                key={software}
                onClick={() => setSelectedSoftware(software)}
                className={`px-3 sm:px-3.5 py-1.5 text-xs font-medium transition-all duration-200 rounded-lg border cursor-pointer ${
                  selectedSoftware === software
                    ? "bg-[#9ACD32]/15 text-[#9ACD32] border-[#9ACD32]/40"
                    : "bg-zinc-900/30 text-zinc-400 border-zinc-850 hover:text-zinc-200 hover:border-zinc-700"
                }`}
              >
                {software === "All" ? "All Software" : software}
              </button>
            ))}
          </div>

          {/* 5. Courses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-7xl mx-auto">
            {filteredCourses.map((course) => {
              const unlocked = isUnlocked(course)
              const courseTargetSlug = course.slug || course.id

              return (
                <div
                  key={course.id}
                  className="bg-zinc-900/35 border border-zinc-850 rounded-3xl overflow-hidden hover:border-zinc-700/80 transition-all duration-300 flex flex-col justify-between shadow-lg hover:shadow-2xl group"
                >
                  <div>
                    {/* Course Image */}
                    <div className="aspect-video w-full overflow-hidden relative bg-black/40">
                      <img
                        src={course.image ? getMediaUrl(course.image) : "/placeholder.svg"}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5">
                        <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg bg-zinc-950/85 text-zinc-300 backdrop-blur-md border border-zinc-800">
                          {course.category}
                        </span>
                        {course.software_used && (
                          <span className="px-2.5 py-1 text-[10px] font-semibold rounded-lg bg-[#9ACD32]/15 text-[#9ACD32] backdrop-blur-md border border-[#9ACD32]/30">
                            {course.software_used}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Course Details */}
                    <div className="p-6">
                      <div className="flex items-center gap-3.5 text-xs text-zinc-400 mb-3">
                        <span className="flex items-center">
                          <Clock className="w-3.5 h-3.5 mr-1 text-zinc-500" />
                          {course.duration}
                        </span>
                        <span className="flex items-center">
                          <Play className="w-3.5 h-3.5 mr-1 text-zinc-500" />
                          {course.lessons} Lessons
                        </span>
                        <span className="flex items-center">
                          <Users className="w-3.5 h-3.5 mr-1 text-zinc-500" />
                          {course.level}
                        </span>
                      </div>

                      <h3 className="text-lg sm:text-xl font-bold text-white mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                        {course.title}
                      </h3>
                      <p className="text-zinc-400 text-xs sm:text-sm mb-5 line-clamp-2 leading-relaxed">
                        {course.description}
                      </p>

                      {/* Course Features */}
                      <ul className="space-y-1.5 mb-6">
                        {course.features.slice(0, 3).map((feature: string, idx: number) => (
                          <li key={idx} className="flex items-start text-xs text-zinc-300">
                            <Check className="w-3.5 h-3.5 mr-2 text-[#9ACD32] shrink-0 mt-0.5" />
                            <span className="line-clamp-1">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      {/* Instructor & Price */}
                      <div className="flex items-center justify-between pt-4 border-t border-zinc-800/80">
                        <div>
                          <p className="text-[10px] uppercase font-bold text-zinc-500">Instructor</p>
                          <p className="text-xs sm:text-sm text-white font-semibold mt-0.5">{course.instructor}</p>
                        </div>
                        <div className="text-right">
                          {unlocked ? (
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 bg-green-950/50 text-green-400 border border-green-800/40 rounded-lg">
                              Enrolled
                            </span>
                          ) : isPending(course) ? (
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 bg-yellow-950/50 text-yellow-400 border border-yellow-800/40 rounded-lg">
                              Pending Unlock
                            </span>
                          ) : (
                            <div className="text-right">
                              <p className="text-xl sm:text-2xl font-black text-primary" style={{ color: "#9ACD32" }}>
                                {course.price ? `$${parseFloat(course.price.toString().replace(/[^0-9.]/g, "")).toFixed(2)}` : "$49.99"}
                              </p>
                              <span className="text-[10px] text-zinc-500 uppercase font-mono">one-time access</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* CTA Action Buttons */}
                      <div className="pt-5">
                        {unlocked ? (
                          <Link
                            href={`/courses/${courseTargetSlug}`}
                            className="w-full inline-flex items-center justify-center px-5 py-3 text-white font-bold rounded-xl transition-all group bg-[#2e7d32] hover:bg-[#1b5e20] text-xs sm:text-sm"
                          >
                            Resume Classroom
                            <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </Link>
                        ) : isPending(course) ? (
                          <button
                            disabled
                            className="w-full inline-flex items-center justify-center px-5 py-3 text-zinc-500 font-semibold rounded-xl bg-zinc-800 border border-zinc-700 cursor-not-allowed text-xs sm:text-sm"
                          >
                            Unlock Pending Approval
                          </button>
                        ) : (
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Link
                              href={`/courses/${courseTargetSlug}`}
                              className="flex-1 inline-flex items-center justify-center px-3.5 py-3 text-zinc-200 hover:text-white font-semibold rounded-xl transition-all bg-zinc-800 hover:bg-zinc-700 text-xs text-center border border-zinc-700/60"
                            >
                              Syllabus Details
                            </Link>
                            <Link
                              href={`/checkout?courseId=${course.course_id || course.id}`}
                              className="flex-1 inline-flex items-center justify-center px-3.5 py-3 text-black font-extrabold rounded-xl transition-all text-xs gap-1 shadow-md text-center"
                              style={{ backgroundColor: "#9ACD32" }}
                            >
                              <span>Enroll Now</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {filteredCourses.length === 0 && !isLoading && (
            <div className="text-center py-20 text-zinc-400">
              <p className="text-base font-medium">No courses found matching your filter criteria.</p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory("All")
                  setSelectedSoftware("All")
                }}
                className="mt-3 text-xs text-primary font-semibold hover:underline"
                style={{ color: "#9ACD32" }}
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  )
}

export default function CoursesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#060010] flex flex-col items-center justify-center gap-3 text-zinc-400">
          <Loader2 className="w-8 h-8 animate-spin text-[#9ACD32]" />
          <span className="text-xs">Loading course catalog...</span>
        </div>
      }
    >
      <CoursesContent />
    </Suspense>
  )
}
