"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { createClient } from "@/lib/supabase/client"
import { db } from "@/lib/supabase/db"
import { Course } from "@/lib/courses-data"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { BookOpen, Award, Download, Clock, LogOut, Loader2, Sparkles, Settings } from "lucide-react"

export default function StudentDashboard() {
  const { user, profile, loading, signOut } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [courseProgress, setCourseProgress] = useState<Record<string, number>>({})
  const [averageScore, setAverageScore] = useState<number | null>(null)
  const [gradedCount, setGradedCount] = useState<number>(0)
  const [loadingCourses, setLoadingCourses] = useState(true)
  const [subscriptionName, setSubscriptionName] = useState<string>("Free Student")
  const [watchHours, setWatchHours] = useState<number>(0)
  const [certificates, setCertificates] = useState<any[]>([])
  const [labProgress, setLabProgress] = useState<Record<string, { graded: number; required: number }>>({})
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login")
      } else if (profile?.role === "admin") {
        router.push("/admin")
      }
    }
  }, [user, profile, loading, router])

  useEffect(() => {
    if (!user) return
    const userId = user.id
    const userEmail = user.email || ''
    const supabase = createClient()
    async function loadEnrolledCourses() {
      try {
        setLoadingCourses(true)
        // 1. Fetch all published courses
        const allCourses = await db.getCourses(supabase)

        // Filter courses to only those the student has purchased or has subscription access to
        const accessChecks = await Promise.all(
          allCourses.map(async (course) => {
            const hasAccess = await db.checkCourseAccess(supabase, userId, course.course_id || course.id)
            return { course, hasAccess }
          })
        )
        const enrolledCourses = accessChecks
          .filter(check => check.hasAccess)
          .map(check => check.course)

        setCourses(enrolledCourses)

        // 2. Fetch all lessons to get total count per course
        const { data: allLessons } = await supabase
          .from('lessons')
          .select('lesson_id, course_id')

        // 3. Fetch completed progress for this student
        const { data: completedProgress } = await supabase
          .from('lesson_progress')
          .select('lesson_id, course_id')
          .eq('student_id', userId)
          .eq('is_completed', true)

        // 4. Calculate progress percentage per course
        const progressMap: Record<string, number> = {}
        console.log("Dashboard progress math debug:", {
          allLessons,
          completedProgress
        })
        if (allLessons && completedProgress) {
          enrolledCourses.forEach(course => {
            const courseLessons = allLessons.filter(l => l.course_id === course.course_id)
            const completed = completedProgress.filter(p => p.course_id === course.course_id)
            console.log(`Course ${course.title} (${course.id} / ${course.course_id}) progress calculation:`, {
              totalLessonsCount: courseLessons.length,
              completedCount: completed.length
            })
            
            progressMap[course.id] = courseLessons.length > 0 
              ? Math.round((completed.length / courseLessons.length) * 100)
              : 0
          })
        }
        setCourseProgress(progressMap)

        // Lab verification counts per enrolled course (certificate gate)
        try {
          const enrolledCourseIds = enrolledCourses.map(c => c.course_id || c.id).filter(Boolean) as string[]
          const lessonIds = (allLessons || []).filter(l => enrolledCourseIds.includes(l.course_id)).map(l => l.lesson_id)

          if (lessonIds.length > 0) {
            const [exRes, subRes] = await Promise.all([
              supabase.from('exercises').select('exercise_id, lesson_id').in('lesson_id', lessonIds),
              supabase.from('exercise_submissions').select('exercise_id').eq('student_id', userId).eq('status', 'graded')
            ])
            const gradedSet = new Set((subRes.data || []).map(s => s.exercise_id))
            const lessonToCourse: Record<string, string> = {}
            ;(allLessons || []).forEach(l => { lessonToCourse[l.lesson_id] = l.course_id })
            const acc: Record<string, { graded: number; required: number }> = {}
            enrolledCourseIds.forEach(id => { acc[id] = { graded: 0, required: 0 } })
            ;(exRes.data || []).forEach(ex => {
              const cid = lessonToCourse[ex.lesson_id]
              if (cid && acc[cid]) {
                acc[cid].required += 1
                if (gradedSet.has(ex.exercise_id)) acc[cid].graded += 1
              }
            })
            setLabProgress(acc)
          } else {
            setLabProgress({})
          }
        } catch (labErr) {
          console.error("Failed to load lab progress:", labErr)
        }

        // 5. Fetch graded submissions to calculate student's overall average grade
        const { data: gradedSubs } = await supabase
          .from('exercise_submissions')
          .select('score')
          .eq('student_id', userId)
          .eq('status', 'graded')

        if (gradedSubs && gradedSubs.length > 0) {
          const total = gradedSubs.reduce((acc, curr) => acc + (curr.score || 0), 0)
          setAverageScore(Math.round(total / gradedSubs.length))
          setGradedCount(gradedSubs.length)
        } else {
          setAverageScore(null)
          setGradedCount(0)
        }

        // 6. Fetch active subscription name
        const { data: activeSub } = await supabase
          .from('user_subscriptions')
          .select('*, subscription_plans(name)')
          .eq('user_id', userId)
          .eq('status', 'active')
          .maybeSingle()

        if (activeSub?.subscription_plans) {
          const planInfo = activeSub.subscription_plans as any
          setSubscriptionName(planInfo.name || "Student Pro")
        } else if (profile?.role === 'instructor') {
          setSubscriptionName('Instructor')
        } else {
          const bypassEmails = (process.env.NEXT_PUBLIC_BYPASS_EMAILS || '')
            .split(',')
            .map((e) => e.trim().toLowerCase())
            .filter(Boolean)
          if (bypassEmails.includes(userEmail.toLowerCase())) {
            setSubscriptionName('Student Pro (Bypass)')
          } else {
            setSubscriptionName('Free Student')
          }
        }

        // 7. Calculate watch hours
        const { data: watchLogs } = await supabase
          .from('lesson_progress')
          .select('watched_seconds')
          .eq('student_id', userId)

        if (watchLogs) {
          const totalSecs = watchLogs.reduce((sum, item) => sum + (item.watched_seconds || 0), 0)
          setWatchHours(parseFloat((totalSecs / 3600).toFixed(1)))
        }

        // 8. Fetch completed certificates
        const { data: certsData } = await supabase
          .from('certificates')
          .select('*, courses(title)')
          .eq('student_id', userId)

        if (certsData) {
          setCertificates(certsData)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingCourses(false)
      }
    }
    loadEnrolledCourses()
  }, [user])

  const handleLogout = async () => {
    await signOut()
    router.push("/")
  }

  if (loading) {
    return (
      <main className="min-h-screen flex flex-col justify-between" style={{ backgroundColor: '#060010' }}>
        <Navigation />

        {/* Main Content Area */}
        <div className="flex-grow container mx-auto px-6 py-24 md:py-32 max-w-7xl relative animate-pulse">
          {/* Soft background glow */}
          <div className="absolute top-10 left-10 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

          {/* Profile Welcome Header Skeleton */}
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center bg-zinc-900/10 border border-zinc-850/80 p-8 rounded-2xl mb-12 gap-6 backdrop-blur-md shadow-xl">
            <div className="flex items-center gap-5 w-full md:w-auto">
              <div className="w-20 h-20 rounded-full bg-zinc-850" />
              <div className="space-y-3 flex-grow">
                <div className="flex items-center gap-2">
                  <div className="h-8 bg-zinc-850 rounded w-48" />
                  <div className="h-5 bg-zinc-850 rounded w-24" />
                </div>
                <div className="h-4 bg-zinc-850 rounded w-36" />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="h-10 bg-zinc-850 rounded-xl w-full sm:w-36" />
              <div className="h-10 bg-zinc-850 rounded-xl w-full sm:w-28" />
            </div>
          </div>

          {/* Quick Stats Grid Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-zinc-900/10 border border-zinc-850/80 p-6 rounded-2xl flex items-center gap-4 backdrop-blur-md">
                <div className="w-12 h-12 rounded-xl bg-zinc-850" />
                <div className="space-y-2 flex-grow">
                  <div className="h-3 bg-zinc-850 rounded w-24" />
                  <div className="h-7 bg-zinc-850 rounded w-12" />
                </div>
              </div>
            ))}
          </div>

          {/* Learning Catalog Skeleton */}
          <div className="space-y-6">
            <div className="h-8 bg-zinc-850 rounded w-48 mb-6" />
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="bg-zinc-900/10 border border-zinc-850/60 p-5 rounded-2xl flex flex-col md:flex-row gap-5 items-center justify-between backdrop-blur-md">
                  <div className="flex flex-col md:flex-row items-center gap-5 w-full">
                    <div className="w-full md:w-32 aspect-video bg-zinc-850 rounded-lg shrink-0" />
                    <div className="w-full space-y-3">
                      <div className="h-3 bg-zinc-850 rounded w-16" />
                      <div className="h-5 bg-zinc-850 rounded w-2/3" />
                      <div className="w-full flex items-center gap-3">
                        <div className="flex-grow bg-zinc-850 h-2 rounded-full" />
                        <div className="h-3 bg-zinc-850 rounded w-8" />
                      </div>
                    </div>
                  </div>
                  <div className="w-full md:w-auto shrink-0">
                    <div className="h-10 bg-zinc-850 rounded-lg w-full md:w-24" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Footer />
      </main>
    )
  }

  if (!user) {
    return null
  }

  // Sample static progress values (mocked for visual demonstration)
  const mockProgress = [
    { id: "d5-masterclass", percent: 65, status: "In Progress" },
    { id: "enscape-masterclass", percent: 100, status: "Completed" },
    { id: "indesign-masterclass", percent: 10, status: "Started" }
  ]

  // Mock Asset Downloads list
  const mockAssets = [
    { name: "Modern Luxury Villa (Starter SKP Model)", size: "45.2 MB", type: "SketchUp 2024", link: "#" },
    { name: "Interior Twilight HDRI Lighting Pack", size: "128 MB", type: "HDR / EXR", link: "#" },
    { name: "Photorealistic Grass & Vegetation Materials", size: "85.4 MB", type: "D5 Assets", link: "#" }
  ]

  return (
    <main className="min-h-screen flex flex-col justify-between" style={{ backgroundColor: '#060010' }}>
      <Navigation />

      {/* Main Content Area */}
      <div className="flex-grow container mx-auto px-6 py-24 md:py-32 max-w-7xl relative">
        {/* Soft background glow */}
        <div className="absolute top-10 left-10 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Profile Welcome Header */}
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center bg-zinc-900/10 border border-zinc-850/80 p-8 rounded-2xl mb-12 gap-6 backdrop-blur-md shadow-xl">
          <div className="flex items-center gap-5">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name}
                className="w-20 h-20 rounded-full border-2 border-primary object-cover"
                style={{ borderColor: '#9ACD32' }}
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-zinc-900 border-2 border-primary flex items-center justify-center text-2xl font-bold text-white" style={{ borderColor: '#9ACD32' }}>
                {profile?.full_name?.charAt(0).toUpperCase() || "S"}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-3xl font-bold text-white">{profile?.full_name || "Student"}</h1>
                <span className="px-3 py-0.5 text-xs font-semibold bg-primary/20 text-primary border border-primary/30 rounded-full flex items-center gap-1" style={{ color: '#9ACD32', borderColor: '#9ACD32/30', backgroundColor: 'rgba(154, 205, 50, 0.1)' }}>
                  <Sparkles className="w-3 h-3" />
                  {subscriptionName}
                </span>
              </div>
              <p className="text-zinc-400 text-sm">{user.email}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/account"
              className="inline-flex items-center justify-center gap-2 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 bg-zinc-900/60 rounded-xl px-5 py-2.5 text-sm font-medium transition-colors"
            >
              <Settings className="w-4 h-4" />
              Account Settings
            </Link>
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="text-red-400 hover:text-red-300 hover:bg-red-950/20 border border-red-950/40 rounded-xl px-5"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <div className="bg-zinc-900/10 border border-zinc-850/80 p-6 rounded-2xl flex items-center gap-4 backdrop-blur-md hover:border-zinc-800 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-850 flex items-center justify-center text-[#9ACD32]">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Active Courses</p>
              <p className="text-2xl font-bold text-white mt-0.5">{courses.length}</p>
            </div>
          </div>

          <div className="bg-zinc-900/10 border border-zinc-850/80 p-6 rounded-2xl flex items-center gap-4 backdrop-blur-md hover:border-zinc-800 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-850 flex items-center justify-center text-[#9ACD32]">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Watch Progress</p>
              <p className="text-2xl font-bold text-white mt-0.5">{watchHours} Hours</p>
            </div>
          </div>

          <div className="bg-zinc-900/10 border border-zinc-850/80 p-6 rounded-2xl flex items-center gap-4 backdrop-blur-md hover:border-zinc-800 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-850 flex items-center justify-center text-[#9ACD32]">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Average Grade</p>
              <p className="text-2xl font-bold text-white mt-0.5">
                {averageScore !== null ? `${averageScore}% (${gradedCount} Graded)` : "No grades yet"}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Layout (Courses + Resources Sidebar) */}
        <div className={`grid grid-cols-1 ${certificates.length > 0 ? 'lg:grid-cols-3 gap-10' : 'lg:grid-cols-1'}`}>
          
          {/* Left Block: Enrolled Courses List */}
          <div className={certificates.length > 0 ? 'lg:col-span-2 space-y-6' : 'space-y-6'}>
            <h2 className="text-2xl font-bold text-white mb-2">My Learning Catalog</h2>
            
            {loadingCourses ? (
              <div className="space-y-4 animate-pulse">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-zinc-900/10 border border-zinc-850/60 p-5 rounded-2xl flex flex-col md:flex-row gap-5 items-center justify-between backdrop-blur-md">
                    <div className="flex flex-col md:flex-row items-center gap-5 w-full">
                      <div className="w-full md:w-32 aspect-video bg-zinc-850 rounded-lg shrink-0" />
                      <div className="w-full space-y-3">
                        <div className="h-3 bg-zinc-850 rounded w-16" />
                        <div className="h-5 bg-zinc-850 rounded w-2/3" />
                        <div className="w-full flex items-center gap-3">
                          <div className="flex-grow bg-zinc-850 h-2 rounded-full" />
                          <div className="h-3 bg-zinc-850 rounded w-8" />
                        </div>
                      </div>
                    </div>
                    <div className="w-full md:w-auto shrink-0">
                      <div className="h-10 bg-zinc-850 rounded-lg w-full md:w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-zinc-800 rounded-xl text-zinc-400 space-y-4">
                <p>You are not enrolled in any courses yet.</p>
                <Link href="/courses" className="inline-block">
                  <Button className="bg-primary text-black font-semibold rounded-xl text-xs py-5 px-6" style={{ backgroundColor: '#9ACD32', color: '#000' }}>
                    Browse Available Courses
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {courses.map((course) => {
                  const percent = courseProgress[course.id] || 0
                  return (
                    <div
                      key={course.id}
                      className="bg-zinc-900/10 border border-zinc-850/60 hover:border-zinc-800 p-5 rounded-2xl transition-all duration-300 flex flex-col md:flex-row gap-5 items-center justify-between group backdrop-blur-md hover:shadow-lg hover:shadow-[#9ACD32]/2"
                    >
                      <div className="flex flex-col md:flex-row items-center gap-5 w-full">
                        <img
                          src={course.image}
                          alt={course.title}
                          className="w-full md:w-32 aspect-video object-cover rounded-lg"
                        />
                        <div className="w-full">
                          <span className="text-xs font-semibold" style={{ color: '#9ACD32' }}>{course.category}</span>
                          <h3 className="text-lg font-bold text-white mt-1 group-hover:text-primary transition-colors">{course.title}</h3>
                          
                          {/* Progress Line */}
                          <div className="w-full mt-3 flex items-center gap-3">
                            <div className="flex-grow bg-zinc-850 h-2 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary transition-all duration-500"
                                style={{ width: `${percent}%`, backgroundColor: '#9ACD32' }}
                              />
                            </div>
                            <span className="text-xs font-medium text-zinc-300">{percent}%</span>
                          </div>

                          {(() => {
                            const labs = labProgress[course.course_id || course.id]
                            if (!labs || labs.required === 0) return null
                            const verified = labs.graded >= labs.required
                            return (
                              <div
                                className={`mt-2 inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                                  verified
                                    ? "border-[#9ACD32]/40 bg-[#9ACD32]/10"
                                    : "border-zinc-800 bg-zinc-900/60"
                                  }`}
                                style={{ color: verified ? '#9ACD32' : '#a1a1aa' }}
                              >
                                Labs verified {labs.graded}/{labs.required}
                                {!verified && " - grading pending"}
                              </div>
                            )
                          })()}
                        </div>
                      </div>

                      <div className="flex-shrink-0 w-full md:w-auto text-right">
                        <Link href={`/courses/${course.id}`}>
                          <Button className="w-full md:w-auto bg-primary text-primary-foreground hover:bg-primary/95 text-sm font-semibold rounded-lg px-6 py-5" style={{ backgroundColor: '#9ACD32', color: '#000' }}>
                            Resume
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Right Block: Certifications Card */}
          {certificates.length > 0 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Award className="w-6 h-6 text-primary" style={{ color: '#9ACD32' }} />
                  Certifications
                </h2>
                <div className="bg-zinc-900/10 border border-zinc-850/60 p-6 rounded-2xl space-y-4 backdrop-blur-md">
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Congratulations on completing your visual curriculum! You have earned the following credentials:
                  </p>
                  <div className="space-y-3">
                    {certificates.map((cert) => (
                      <div key={cert.certificate_id} className="p-3.5 bg-zinc-950 border border-zinc-850 rounded-xl group hover:border-[#9ACD32]/50 transition-colors flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white truncate">{(cert.courses as any)?.title || "Course Completed"}</h4>
                          <p className="text-[9px] text-zinc-500 font-mono mt-0.5">{cert.certificate_number}</p>
                        </div>
                        <Link href={`/certificates/${cert.certificate_id}`} target="_blank" className="flex-shrink-0">
                          <Button variant="ghost" size="sm" className="hover:bg-primary/10 text-primary hover:text-primary p-2">
                            <Award className="w-4.5 h-4.5" style={{ color: '#9ACD32' }} />
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </main>
  )
}
