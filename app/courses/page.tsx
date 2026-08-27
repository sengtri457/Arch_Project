"use client"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import Link from "next/link"
import { Clock, Users, Play, ArrowRight } from "lucide-react"

import { getMediaUrl } from "@/lib/utils"
import { useCourses, useCourseAccessMap } from "@/lib/react-query/hooks/use-courses"

export default function CoursesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All")
  const { data: courses = [], isLoading } = useCourses()
  const { data: accessMap = {} } = useCourseAccessMap()

  const uniqueCategories = Array.from(new Set(courses.map(c => c.category).filter(Boolean)))
  const categories = ["All", ...uniqueCategories.filter(cat => cat !== "All")]

  const filteredCourses =
    selectedCategory === "All"
      ? courses
      : courses.filter((c) => c.category === selectedCategory)

  const isUnlocked = (course: any) => accessMap[course.course_id || course.id]

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background">
        <Navigation />
        <section className="relative py-32 overflow-hidden" style={{ backgroundColor: '#060010' }}>
          <div className="container mx-auto px-6">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-6xl md:text-7xl font-bold text-white mb-6">Learn with Us</h1>
              <p className="text-xl text-gray-300">Master architectural visualization with our comprehensive courses</p>
            </div>
          </div>
        </section>
        <section className="py-24" style={{ backgroundColor: '#060010' }}>
          <div className="w-full px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto animate-pulse">
              {[1, 2, 3].map(i => (
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
      <section className="relative py-32 overflow-hidden" style={{ backgroundColor: '#060010' }}>
        <div className="container mx-auto px-6">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-6xl md:text-7xl font-bold text-white mb-6">Learn with Us</h1>
            <p className="text-xl text-gray-300">
              Master architectural visualization with our comprehensive courses
            </p>
          </div>
        </div>
      </section>

      {/* Courses Section */}
      <section className="py-24" style={{ backgroundColor: '#060010' }}>
        <div className="w-full px-6">
          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-4 mb-16 max-w-6xl mx-auto">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                style={{
                  color: selectedCategory === category ? '#9ACD32' : '#d1d5db',
                }}
                className={`px-6 py-3 font-medium transition-all duration-300 bg-transparent ${
                  selectedCategory !== category && "hover:opacity-80"
                }`}
                onMouseEnter={(e) => {
                  if (selectedCategory !== category) e.currentTarget.style.color = '#9ACD32'
                }}
                onMouseLeave={(e) => {
                  if (selectedCategory !== category) e.currentTarget.style.color = '#d1d5db'
                }}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Courses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {filteredCourses.map((course) => {
              const unlocked = isUnlocked(course)
              return (
                <div
                  key={course.id}
                  className="bg-zinc-900/30 border border-zinc-800/60 rounded-2xl overflow-hidden hover:border-zinc-700/80 transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    {/* Course Image */}
                    <div className="aspect-video w-full overflow-hidden relative">
                      <img
                        src={course.image ? getMediaUrl(course.image) : "/placeholder.svg"}
                        alt={course.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                      />
                      <span className="absolute top-4 left-4 px-3 py-1 text-xs font-semibold rounded-full bg-zinc-950/80 text-zinc-300 backdrop-blur-sm border border-zinc-800">
                        {course.category}
                      </span>
                    </div>

                    {/* Course Details */}
                    <div className="p-6">
                      <div className="flex items-center gap-4 text-xs text-gray-400 mb-3">
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

                      <h3 className="text-xl font-bold text-white mb-2 line-clamp-1">{course.title}</h3>
                      <p className="text-zinc-400 text-sm mb-6 line-clamp-2">{course.description}</p>

                      {/* Course Features */}
                      <ul className="space-y-2 mb-6">
                        {course.features.slice(0, 3).map((feature, idx) => (
                          <li key={idx} className="flex items-start text-sm text-gray-300">
                            <span className="w-1.5 h-1.5 rounded-full mt-1.5 mr-2 flex-shrink-0" style={{ backgroundColor: '#9ACD32' }} />
                            {feature}
                          </li>
                        ))}
                      </ul>

                      {/* Instructor & Price */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                        <div>
                          <p className="text-xs text-gray-500">Instructor</p>
                          <p className="text-sm text-white font-medium">{course.instructor}</p>
                        </div>
                        <div className="text-right anthropic">
                          {unlocked ? (
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1.5 bg-green-950/40 text-green-400 border border-green-900/30 rounded-lg">
                              Enrolled
                            </span>
                          ) : (
                            <p className="text-2xl font-bold" style={{ color: '#9ACD32' }}>
                              {course.price ? `$${parseFloat(course.price.toString()).toFixed(2)}` : '$49.99'}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* CTA Button */}
                      <Link
                        href={`/courses/${course.id}`}
                        className="mt-6 w-full inline-flex items-center justify-center px-6 py-3 text-white font-semibold rounded-lg transition-all group"
                        style={{ backgroundColor: unlocked ? '#2e7d32' : '#9ACD32' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = unlocked ? '#1b5e20' : '#8fbc2f'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = unlocked ? '#2e7d32' : '#9ACD32'}
                      >
                        {unlocked ? 'Resume Classroom' : 'Unlock Course'}
                        <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {filteredCourses.length === 0 && !isLoading && (
            <div className="text-center py-16 text-zinc-400">
              <p>No courses found in this category.</p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  )
}