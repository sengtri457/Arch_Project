"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { createClient } from "@/lib/supabase/client"
import { db } from "@/lib/supabase/db"
import { Profile } from "@/components/auth-provider"
import { Course } from "@/lib/courses-data"
import { Project } from "@/lib/projects-data"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { 
  Users, 
  BookOpen, 
  FolderGit, 
  ShieldAlert, 
  Settings, 
  UserPlus, 
  Plus, 
  Trash2, 
  Edit3, 
  Loader2, 
  TrendingUp, 
  FileText,
  Lock,
  Globe
} from "lucide-react"

type AdminTab = "overview" | "crm" | "courses" | "projects" | "submissions" | "inquiries"

export default function AdminDashboard() {
  const { user, profile, loading, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState<AdminTab>("overview")
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [submissions, setSubmissions] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(true)
  
  const router = useRouter()
  const supabase = createClient()

  // Guard routing client-side (as backup to server middleware)
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login")
      } else if (profile?.role !== 'admin') {
        router.push("/")
      }
    }
  }, [user, profile, loading, router])

  // Load CRM, courses, and projects data
  useEffect(() => {
    if (!user || profile?.role !== 'admin') return

    async function loadAdminData() {
      try {
        setLoadingData(true)
        
        // 1. Fetch profiles
        const { data: profilesData, error: profilesErr } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })
        if (!profilesErr && profilesData) setProfiles(profilesData as Profile[])

        // 2. Fetch courses
        const coursesData = await db.getCourses(supabase)
        setCourses(coursesData)

        // 3. Fetch projects
        const projectsData = await db.getProjects(supabase)
        setProjects(projectsData)
        
        // 4. Fetch contact messages
        const { data: messagesData, error: messagesErr } = await supabase
          .from('contact_messages')
          .select('*')
          .order('created_at', { ascending: false })
        if (!messagesErr && messagesData) setMessages(messagesData)
        
        // 5. Fetch student exercise submissions
        const { data: subData, error: subErr } = await supabase
          .from('exercise_submissions')
          .select(`
            *,
            profiles:student_id(full_name, avatar_url),
            exercises:exercise_id(title, max_score)
          `)
          .order('submitted_at', { ascending: false })
        if (!subErr && subData) setSubmissions(subData)
        
      } catch (err) {
        console.error("Admin data loading error:", err)
      } finally {
        setLoadingData(false)
      }
    }
    loadAdminData()
  }, [user, profile])

  // Promoting a user role to Admin or Instructor
  const handleUpdateRole = async (targetUserId: string, newRole: 'student' | 'instructor' | 'admin') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', targetUserId)

      if (error) throw error
      
      // Update local state
      setProfiles(prev => prev.map(p => p.id === targetUserId ? { ...p, role: newRole } : p))
      alert(`User role successfully updated to ${newRole}!`)
    } catch (err: any) {
      alert(`Failed to update user role: ${err.message}`)
    }
  }

  // Grading a student submission
  const handleGradeSubmission = async (
    submissionId: string, 
    score: number, 
    feedback: string
  ) => {
    try {
      const { error } = await supabase
        .from('exercise_submissions')
        .update({
          status: 'graded',
          score,
          instructor_feedback: feedback,
          reviewed_at: new Date().toISOString()
        })
        .eq('submission_id', submissionId)

      if (error) throw error

      setSubmissions(prev => prev.map(s => 
        s.submission_id === submissionId 
          ? { ...s, status: 'graded', score, instructor_feedback: feedback } 
          : s
      ))
      alert("Submission successfully graded!")
    } catch (err: any) {
      alert(`Failed to grade submission: ${err.message}`)
    }
  }

  if (loading || !user || profile?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white gap-3">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#9ACD32' }} />
        <span>Authenticating admin access...</span>
      </div>
    )
  }

  return (
    <main className="min-h-screen flex flex-col justify-between" style={{ backgroundColor: '#060010' }}>
      <Navigation />

      {/* Main Panel Content */}
      <div className="flex-grow container mx-auto px-6 py-24 md:py-32 max-w-7xl relative z-10">
        
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-zinc-800 pb-8 mb-10 gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-white flex items-center gap-2">
              LMS Admin Portal
            </h1>
            <p className="text-zinc-400 text-sm mt-1">
              Code-free course creation, student enrollment CRM, and project showcase management.
            </p>
          </div>
          <div className="text-sm bg-zinc-900 border border-zinc-850 px-4 py-2 rounded-lg text-zinc-300">
            Welcome, <span className="font-semibold text-white">{profile.full_name}</span>
          </div>
        </div>

        {/* Dashboard Sidebar + Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar Menu */}
          <div className="space-y-2 lg:col-span-1">
            <button
              onClick={() => setActiveTab("overview")}
              className={`w-full text-left px-5 py-3.5 rounded-xl font-medium flex items-center gap-3 transition-colors ${
                activeTab === "overview" 
                  ? "bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/10" 
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900/50"
              }`}
              style={activeTab === 'overview' ? { backgroundColor: '#9ACD32', color: '#000' } : {}}
            >
              <TrendingUp className="w-5 h-5" />
              Overview
            </button>
            
            <button
              onClick={() => setActiveTab("crm")}
              className={`w-full text-left px-5 py-3.5 rounded-xl font-medium flex items-center gap-3 transition-colors ${
                activeTab === "crm" 
                  ? "bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/10" 
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900/50"
              }`}
              style={activeTab === 'crm' ? { backgroundColor: '#9ACD32', color: '#000' } : {}}
            >
              <Users className="w-5 h-5" />
              Student CRM
            </button>
            
            <button
              onClick={() => setActiveTab("courses")}
              className={`w-full text-left px-5 py-3.5 rounded-xl font-medium flex items-center gap-3 transition-colors ${
                activeTab === "courses" 
                  ? "bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/10" 
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900/50"
              }`}
              style={activeTab === 'courses' ? { backgroundColor: '#9ACD32', color: '#000' } : {}}
            >
              <BookOpen className="w-5 h-5" />
              Courses Builder
            </button>
            
            <button
              onClick={() => setActiveTab("projects")}
              className={`w-full text-left px-5 py-3.5 rounded-xl font-medium flex items-center gap-3 transition-colors ${
                activeTab === "projects" 
                  ? "bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/10" 
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900/50"
              }`}
              style={activeTab === 'projects' ? { backgroundColor: '#9ACD32', color: '#000' } : {}}
            >
              <FolderGit className="w-5 h-5" />
              Projects Showcase
            </button>

            <button
              onClick={() => setActiveTab("submissions")}
              className={`w-full text-left px-5 py-3.5 rounded-xl font-medium flex items-center gap-3 transition-colors ${
                activeTab === "submissions" 
                  ? "bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/10" 
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900/50"
              }`}
              style={activeTab === 'submissions' ? { backgroundColor: '#9ACD32', color: '#000' } : {}}
            >
              <FileText className="w-5 h-5" />
              Submissions ({submissions.length})
            </button>

            <button
              onClick={() => setActiveTab("inquiries")}
              className={`w-full text-left px-5 py-3.5 rounded-xl font-medium flex items-center gap-3 transition-colors ${
                activeTab === "inquiries" 
                  ? "bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/10" 
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900/50"
              }`}
              style={activeTab === 'inquiries' ? { backgroundColor: '#9ACD32', color: '#000' } : {}}
            >
              <FileText className="w-5 h-5" />
              Inquiries ({messages.length})
            </button>
          </div>

          {/* Main Tab Board Content */}
          <div className="lg:col-span-3 bg-zinc-950 border border-zinc-850 p-6 sm:p-8 rounded-2xl min-h-[500px]">
            {loadingData ? (
              <div className="h-full flex items-center justify-center py-20 text-zinc-400 gap-3">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Loading dashboard data...</span>
              </div>
            ) : (
              <>
                {/* 1. OVERVIEW TAB */}
                {activeTab === "overview" && (
                  <div className="space-y-8">
                    <h2 className="text-2xl font-bold text-white">System Health Overview</h2>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      <div className="bg-zinc-900/40 border border-zinc-850 p-5 rounded-xl">
                        <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Total Registered Users</p>
                        <p className="text-3xl font-bold text-white mt-2">{profiles.length}</p>
                      </div>
                      
                      <div className="bg-zinc-900/40 border border-zinc-850 p-5 rounded-xl">
                        <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Active Courses</p>
                        <p className="text-3xl font-bold text-white mt-2">{courses.length}</p>
                      </div>
                      
                      <div className="bg-zinc-900/40 border border-zinc-850 p-5 rounded-xl">
                        <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Published Projects</p>
                        <p className="text-3xl font-bold text-white mt-2">{projects.length}</p>
                      </div>
                    </div>

                    <div className="bg-zinc-900/20 border border-zinc-850/60 p-6 rounded-xl space-y-4">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-primary" style={{ color: '#9ACD32' }} />
                        Security RLS Rules Status
                      </h3>
                      <p className="text-sm text-zinc-400">
                        Supabase Row Level Security is currently **Enabled** on all database tables. Guests are restricted to reading published projects and courses. Only accounts containing the `'admin'` profile role can write updates to projects, courses, and lessons.
                      </p>
                    </div>
                  </div>
                )}

                {/* 2. STUDENT CRM TAB */}
                {activeTab === "crm" && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h2 className="text-2xl font-bold text-white">Student CRM Directory</h2>
                      <span className="text-xs font-semibold bg-zinc-800 text-zinc-300 px-3 py-1 rounded-full">
                        {profiles.length} total profiles
                      </span>
                    </div>

                    {/* Table list */}
                    <div className="overflow-x-auto border border-zinc-850 rounded-xl">
                      <table className="w-full text-left border-collapse text-sm">
                        <thead>
                          <tr className="bg-zinc-900/60 border-b border-zinc-850 text-zinc-400 font-semibold uppercase text-xs">
                            <th className="p-4">Name</th>
                            <th className="p-4">Role</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-900">
                          {profiles.map((p) => (
                            <tr key={p.id} className="hover:bg-zinc-900/20 text-zinc-300">
                              <td className="p-4 flex items-center gap-3 font-semibold text-white">
                                {p.avatar_url ? (
                                  <img src={p.avatar_url} alt="" className="w-8 h-8 rounded-full" />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold">
                                    {p.full_name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                {p.full_name}
                              </td>
                              <td className="p-4">
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                                  p.role === 'admin' 
                                    ? 'bg-red-950/20 text-red-400 border-red-900/30' 
                                    : p.role === 'instructor' 
                                      ? 'bg-purple-950/20 text-purple-400 border-purple-900/30' 
                                      : 'bg-zinc-850 text-zinc-400 border-zinc-800'
                                }`}>
                                  {p.role}
                                </span>
                              </td>
                              <td className="p-4">
                                <span className={`w-2.5 h-2.5 rounded-full inline-block ${p.is_active ? 'bg-green-500' : 'bg-zinc-600'}`} />
                              </td>
                              <td className="p-4 text-right space-x-2">
                                {p.role !== 'admin' ? (
                                  <Button 
                                    onClick={() => handleUpdateRole(p.id, 'admin')}
                                    size="sm" 
                                    variant="outline" 
                                    className="border-zinc-850 text-xs text-zinc-300 hover:text-white"
                                  >
                                    Promote Admin
                                  </Button>
                                ) : (
                                  <Button 
                                    onClick={() => handleUpdateRole(p.id, 'student')}
                                    size="sm" 
                                    variant="outline" 
                                    className="border-zinc-850 text-xs text-red-400 hover:text-red-300"
                                  >
                                    Demote
                                  </Button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 3. COURSES BUILDER TAB */}
                {activeTab === "courses" && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h2 className="text-2xl font-bold text-white">Course Curriculum Builder</h2>
                      <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold flex items-center gap-1.5" style={{ backgroundColor: '#9ACD32', color: '#000' }}>
                        <Plus className="w-4 h-4" />
                        Create Course
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {courses.map((course) => (
                        <div key={course.id} className="p-4 bg-zinc-900/40 border border-zinc-850 rounded-xl flex items-center justify-between hover:border-zinc-800 transition-colors">
                          <div className="flex items-center gap-4">
                            <img src={course.image} alt="" className="w-16 h-10 object-cover rounded" />
                            <div>
                              <h4 className="font-bold text-white">{course.title}</h4>
                              <p className="text-xs text-zinc-400 mt-0.5">
                                {course.lessons} lessons • {course.duration} • {course.level}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="ghost" className="hover:bg-zinc-800 text-zinc-300">
                              <Edit3 className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="hover:bg-red-950/20 text-red-400 hover:text-red-400">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. PROJECTS SHOWCASE TAB */}
                {activeTab === "projects" && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h2 className="text-2xl font-bold text-white">Project Showcase CMS</h2>
                      <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold flex items-center gap-1.5" style={{ backgroundColor: '#9ACD32', color: '#000' }}>
                        <Plus className="w-4 h-4" />
                        Create Project
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {projects.map((project) => (
                        <div key={project.id} className="p-4 bg-zinc-900/40 border border-zinc-850 rounded-xl flex items-center justify-between hover:border-zinc-800 transition-colors">
                          <div className="flex items-center gap-4">
                            <img src={project.image} alt="" className="w-16 h-10 object-cover rounded" />
                            <div>
                              <h4 className="font-bold text-white">{project.title}</h4>
                              <p className="text-xs text-zinc-400 mt-0.5">
                                {project.category} • {project.location} • {project.year}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="ghost" className="hover:bg-zinc-800 text-zinc-300">
                              <Edit3 className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="hover:bg-red-950/20 text-red-400 hover:text-red-400">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4.5. SUBMISSIONS TAB */}
                {activeTab === "submissions" && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-white">Student Homework Submissions</h2>
                      <p className="text-zinc-400 text-sm mt-1">Review student render workspace uploads, allocate scores, and submit comments.</p>
                    </div>

                    {submissions.length === 0 ? (
                      <div className="text-center py-12 border border-dashed border-zinc-850 rounded-xl text-zinc-400">
                        No submissions recorded yet.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {submissions.map((sub: any) => {
                          const files = Array.isArray(sub.submission_files_json) ? sub.submission_files_json : []
                          const fileObj = files[0] || {}
                          
                          return (
                            <div key={sub.submission_id} className="bg-zinc-900/30 border border-zinc-850 p-5 rounded-xl space-y-4">
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-zinc-300">
                                    {sub.profiles?.full_name?.charAt(0).toUpperCase() || "S"}
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-semibold text-white">{sub.profiles?.full_name || "Unknown Student"}</h4>
                                    <p className="text-xs text-zinc-500">{new Date(sub.submitted_at).toLocaleDateString()}</p>
                                  </div>
                                </div>
                                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full uppercase border ${
                                  sub.status === 'graded' 
                                    ? 'bg-green-950/20 text-green-400 border-green-900/30' 
                                    : 'bg-yellow-950/20 text-yellow-400 border-yellow-900/30'
                                }`}>
                                  {sub.status}
                                </span>
                              </div>

                              <div className="bg-zinc-950/50 border border-zinc-850/60 p-4 rounded-lg space-y-2">
                                <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">Exercise requirement:</p>
                                <h3 className="text-sm text-white font-bold">{sub.exercises?.title || "Practice Task"}</h3>
                                <div className="pt-2">
                                  <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">Submitted Link:</p>
                                  <a href={fileObj.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline break-all mt-1 inline-block" style={{ color: '#9ACD32' }}>
                                    {fileObj.url || "No link provided"}
                                  </a>
                                </div>
                                {fileObj.notes && (
                                  <div className="pt-1">
                                    <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">Notes:</p>
                                    <p className="text-xs text-zinc-300 italic mt-1 bg-zinc-900/20 p-2.5 rounded border border-zinc-850/40">{fileObj.notes}</p>
                                  </div>
                                )}
                              </div>

                              {/* Grading inputs */}
                              {sub.status !== 'graded' ? (
                                <form onSubmit={(e) => {
                                  e.preventDefault()
                                  const form = e.currentTarget
                                  const score = parseInt((form.elements.namedItem('score') as HTMLInputElement).value)
                                  const feedback = (form.elements.namedItem('feedback') as HTMLTextAreaElement).value
                                  handleGradeSubmission(sub.submission_id, score, feedback)
                                }} className="border-t border-zinc-850/60 pt-4 space-y-3">
                                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                                    <div className="sm:col-span-1">
                                      <label className="text-[10px] uppercase font-bold text-zinc-500">Score (/100)</label>
                                      <input 
                                        type="number" 
                                        name="score"
                                        min={0}
                                        max={100}
                                        required
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-primary/80" 
                                      />
                                    </div>
                                    <div className="sm:col-span-3">
                                      <label className="text-[10px] uppercase font-bold text-zinc-500">Instructor Feedback</label>
                                      <input 
                                        type="text" 
                                        name="feedback"
                                        placeholder="Add constructive comments..."
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-primary/80" 
                                      />
                                    </div>
                                  </div>
                                  <Button type="submit" size="sm" className="bg-primary text-black font-semibold" style={{ backgroundColor: '#9ACD32', color: '#000' }}>
                                    Submit Grade
                                  </Button>
                                </form>
                              ) : (
                                <div className="border-t border-zinc-850/60 pt-4 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs bg-green-950/5 p-3 rounded-lg border border-green-900/10">
                                  <div className="sm:col-span-1">
                                    <p className="font-bold text-zinc-500 uppercase text-[10px]">Score Awarded</p>
                                    <p className="text-lg font-bold text-primary mt-0.5" style={{ color: '#9ACD32' }}>{sub.score} / 100</p>
                                  </div>
                                  <div className="sm:col-span-3">
                                    <p className="font-bold text-zinc-500 uppercase text-[10px]">Feedback Comments</p>
                                    <p className="text-zinc-300 mt-1 italic">"{sub.instructor_feedback || "None"}"</p>
                                  </div>
                                </div>
                              )}

                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* 5. INQUIRIES / CONTACT MESSAGES TAB */}
                {activeTab === "inquiries" && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h2 className="text-2xl font-bold text-white">Client Inquiry Inbox</h2>
                      <span className="text-xs font-semibold bg-zinc-800 text-zinc-300 px-3 py-1 rounded-full">
                        {messages.length} messages
                      </span>
                    </div>

                    {messages.length === 0 ? (
                      <div className="text-center py-12 border border-dashed border-zinc-850 rounded-xl text-zinc-400">
                        No contact inquiries found in the database.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((msg) => (
                          <div
                            key={msg.id}
                            className="bg-zinc-900/40 border border-zinc-850 p-5 rounded-xl space-y-3"
                          >
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                              <div>
                                <h4 className="font-bold text-white text-base">{msg.name}</h4>
                                <p className="text-xs text-zinc-400 mt-0.5">
                                  {msg.email} {msg.company ? `• ${msg.company}` : ''}
                                </p>
                              </div>
                              <span className="text-xs text-zinc-500">
                                {msg.created_at ? new Date(msg.created_at).toLocaleString() : ''}
                              </span>
                            </div>
                            <div className="text-sm text-zinc-300 bg-zinc-950 p-4 rounded-lg border border-zinc-900/60 leading-relaxed whitespace-pre-line">
                              {msg.message}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

        </div>
      </div>

      <Footer />
    </main>
  )
}
