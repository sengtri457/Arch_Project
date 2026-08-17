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
import { BookOpen, Award, Download, Clock, LogOut, Loader2, Sparkles } from "lucide-react"

export default function StudentDashboard() {
  const { user, profile, loading, signOut } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [loadingCourses, setLoadingCourses] = useState(true)
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
    const supabase = createClient()
    async function loadEnrolledCourses() {
      try {
        setLoadingCourses(true)
        // For testing / demo, we fetch all published courses and assume student has access
        const data = await db.getCourses(supabase)
        setCourses(data)
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

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white gap-3">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#9ACD32' }} />
        <span>Loading your profile...</span>
      </div>
    )
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
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center bg-zinc-900/50 border border-zinc-800/80 p-8 rounded-2xl mb-12 gap-6 backdrop-blur-sm">
          <div className="flex items-center gap-5">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name}
                className="w-20 h-20 rounded-full border-2 border-primary object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-zinc-800 border-2 border-primary flex items-center justify-center text-2xl font-bold text-white">
                {profile?.full_name?.charAt(0).toUpperCase() || "S"}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-3xl font-bold text-white">{profile?.full_name || "Student"}</h1>
                <span className="px-3 py-0.5 text-xs font-semibold bg-primary/20 text-primary border border-primary/30 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  {profile?.role === 'admin' ? 'Admin' : 'Student Pro'}
                </span>
              </div>
              <p className="text-zinc-400 text-sm">{user.email}</p>
            </div>
          </div>

          <Button
            onClick={handleLogout}
            variant="ghost"
            className="text-red-400 hover:text-red-300 hover:bg-red-950/20 border border-red-950/40 rounded-xl px-5"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <div className="bg-zinc-900/40 border border-zinc-800/60 p-6 rounded-xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center" style={{ color: '#9ACD32' }}>
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Active Courses</p>
              <p className="text-2xl font-bold text-white">{courses.length}</p>
            </div>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-800/60 p-6 rounded-xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center" style={{ color: '#9ACD32' }}>
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Watch Progress</p>
              <p className="text-2xl font-bold text-white">18.5 Hours</p>
            </div>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-800/60 p-6 rounded-xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center" style={{ color: '#9ACD32' }}>
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Certificates Earned</p>
              <p className="text-2xl font-bold text-white">1 Certificate</p>
            </div>
          </div>
        </div>

        {/* Main Content Layout (Courses + Resources Sidebar) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Left Block: Enrolled Courses List */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-bold text-white mb-2">My Learning Catalog</h2>
            
            {loadingCourses ? (
              <div className="flex justify-center py-12 text-zinc-400 gap-2">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Loading courses...</span>
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-zinc-800 rounded-xl text-zinc-400">
                You are not enrolled in any courses yet.
              </div>
            ) : (
              <div className="space-y-4">
                {courses.map((course) => {
                  const progressObj = mockProgress.find(p => p.id === course.id) || { percent: 0, status: "Not Started" }
                  return (
                    <div
                      key={course.id}
                      className="bg-zinc-900/30 border border-zinc-800/60 hover:border-zinc-700/80 p-5 rounded-xl transition-all duration-300 flex flex-col md:flex-row gap-5 items-center justify-between group"
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
                            <div className="flex-grow bg-zinc-800 h-2 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary transition-all duration-500"
                                style={{ width: `${progressObj.percent}%`, backgroundColor: '#9ACD32' }}
                              />
                            </div>
                            <span className="text-xs font-medium text-zinc-300">{progressObj.percent}%</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex-shrink-0 w-full md:w-auto text-right">
                        <Button className="w-full md:w-auto bg-primary text-primary-foreground hover:bg-primary/95 text-sm font-semibold rounded-lg px-6 py-5">
                          Resume
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Right Block: Downloads / Asset Library */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-2">Premium Assets</h2>
            <div className="bg-zinc-900/30 border border-zinc-800/60 p-6 rounded-xl space-y-5">
              <p className="text-sm text-zinc-400">
                Get full access to SketchUp resources, render presets, and maps tied to your visualization lessons.
              </p>
              
              <div className="space-y-4">
                {mockAssets.map((asset, index) => (
                  <div key={index} className="flex items-center justify-between p-3.5 bg-zinc-900/60 border border-zinc-850 rounded-lg group hover:border-zinc-700 transition-colors">
                    <div>
                      <h4 className="text-sm font-semibold text-white truncate max-w-[200px]" title={asset.name}>
                        {asset.name}
                      </h4>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {asset.type} • {asset.size}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" className="hover:bg-primary/10 text-primary hover:text-primary">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      <Footer />
    </main>
  )
}
