"use client"

import { useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { BookOpen, Award, Clock, LogOut, Sparkles, Settings, Loader2 } from "lucide-react"

import { useEnrolledCourses, useDashboardProgress, useDashboardStats, useSubscription, useCertificates } from "@/lib/react-query/hooks/use-dashboard"

export default function StudentDashboard() {
  const { user, profile, loading, signOut } = useAuth()
  const router = useRouter()

  const userId = user?.id
  const userEmail = user?.email
  const role = profile?.role

  const { data: enrolledCourses = [], isLoading: loadingCourses } = useEnrolledCourses(userId)
  const courseIds = enrolledCourses.map(c => c.course_id || c.id).filter(Boolean) as string[]
  const { data: progressData } = useDashboardProgress(userId, courseIds)
  const { data: stats } = useDashboardStats(userId)
  const { data: subscriptionName = "Free Student" } = useSubscription(userId, userEmail, role)
  const { data: certificates = [] } = useCertificates(userId)

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login")
      } else if (profile?.role === "admin") {
        router.push("/admin")
      }
    }
  }, [user, profile, loading, router])

  const handleLogout = async () => {
    await signOut()
    router.push("/")
  }

  if (loading) {
    return (
      <main className="min-h-screen flex flex-col justify-between" style={{ backgroundColor: '#060010' }}>
        <Navigation />
        <div className="flex-grow container mx-auto px-6 py-24 md:py-32 max-w-7xl relative animate-pulse">
          <div className="absolute top-10 left-10 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
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
        </div>
        <Footer />
      </main>
    )
  }

  if (!user) return null

  return (
    <main className="min-h-screen flex flex-col justify-between" style={{ backgroundColor: '#060010' }}>
      <Navigation />

      <div className="flex-grow container mx-auto px-6 py-24 md:py-32 max-w-7xl relative">
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
              <p className="text-2xl font-bold text-white mt-0.5">{enrolledCourses.length}</p>
            </div>
          </div>

          <div className="bg-zinc-900/10 border border-zinc-850/80 p-6 rounded-2xl flex items-center gap-4 backdrop-blur-md hover:border-zinc-800 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-850 flex items-center justify-center text-[#9ACD32]">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Watch Progress</p>
              <p className="text-2xl font-bold text-white mt-0.5">{stats?.watchHours ?? 0} Hours</p>
            </div>
          </div>

          <div className="bg-zinc-900/10 border border-zinc-850/80 p-6 rounded-2xl flex items-center gap-4 backdrop-blur-md hover:border-zinc-800 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-850 flex items-center justify-center text-[#9ACD32]">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Average Grade</p>
              <p className="text-2xl font-bold text-white mt-0.5">
                {stats?.averageScore !== null ? `${stats?.averageScore}% (${stats?.gradedCount} Graded)` : "No grades yet"}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className={`grid grid-cols-1 ${certificates.length > 0 ? 'lg:grid-cols-3 gap-10' : 'lg:grid-cols-1'}`}>
          
          {/* Left: Enrolled Courses List */}
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
            ) : enrolledCourses.length === 0 ? (
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
                {enrolledCourses.map((course) => {
                  const courseId = course.course_id || course.id
                  const percent = progressData?.courseProgress[courseId] ?? 0
                  const labs = progressData?.labProgress[courseId]
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

                          {labs && labs.required > 0 && (
                            <div
                              className={`mt-2 inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                                labs.graded >= labs.required
                                  ? "border-[#9ACD32]/40 bg-[#9ACD32]/10"
                                  : "border-zinc-800 bg-zinc-900/60"
                                }`}
                              style={{ color: labs.graded >= labs.required ? '#9ACD32' : '#a1a1aa' }}
                            >
                              Labs verified {labs.graded}/{labs.required}
                              {labs.graded < labs.required && " - grading pending"}
                            </div>
                          )}
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

          {/* Right: Certifications Card */}
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
                    {certificates.map((cert: any) => (
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