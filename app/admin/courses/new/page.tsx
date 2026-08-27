"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { ArrowLeft, Plus, Trash2, Upload, Loader2 } from "lucide-react"
import Swal from "sweetalert2"

const MySwal = Swal.mixin({
  customClass: {
    confirmButton: 'bg-primary text-black font-bold px-6 py-2 rounded-xl mx-2',
    cancelButton: 'bg-zinc-800 text-white font-bold px-6 py-2 rounded-xl mx-2'
  },
  buttonsStyling: false
})

export default function NewCoursePage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const [plans, setPlans] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [uploadingIntro, setUploadingIntro] = useState(false)
  const [courseForm, setCourseForm] = useState({
    title: "",
    slug: "",
    description: "",
    image: "",
    category: "",
    duration: "",
    level: "Intermediate",
    price: "49.99",
    instructor: "Bun Sambath",
    courseCategory: "",
    requiredPlanId: "",
    published: true,
    lessons: "0",
    introductionUrl: ""
  })

  const [features, setFeatures] = useState<string[]>([])

  useEffect(() => {
    if (!loading && (!user || profile?.role !== 'admin')) {
      router.replace("/")
    }
  }, [user, profile, loading, router])

  useEffect(() => {
    async function loadPlans() {
      const { data } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price', { ascending: true })
      if (data) setPlans(data)
    }
    loadPlans()
  }, [supabase])

  const handleAddFeature = () => {
    setFeatures([...features, ""])
  }

  const handleRemoveFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index))
  }

  const handleFeatureChange = (index: number, value: string) => {
    const updated = [...features]
    updated[index] = value
    setFeatures(updated)
  }

  const handleIntroductionUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingIntro(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`
      const filePath = `introductions/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('projects')
        .upload(filePath, file, {
          contentType: file.type,
          cacheControl: '31536000',
          upsert: true
        })

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('projects')
        .getPublicUrl(filePath)

      setCourseForm(prev => ({ ...prev, introductionUrl: data.publicUrl }))
    } catch (err: any) {
      MySwal.fire({ icon: 'error', title: 'Upload Failed', text: `Upload failed: ${err.message}` })
    } finally {
      setUploadingIntro(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const courseSlug = courseForm.slug.trim()
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(courseSlug)) {
      MySwal.fire({
        icon: 'error',
        title: 'Invalid Slug',
        text: 'Invalid slug. Use only lowercase letters, numbers, and hyphens - e.g. "d5-masterclass".'
      })
      return
    }

    setSaving(true)
    const requiredPlanId = courseForm.requiredPlanId ? parseInt(courseForm.requiredPlanId) : null
    const difficultyVal = courseForm.level.toLowerCase().trim()
    
    const payload = {
      title: courseForm.title.trim(),
      slug: courseSlug,
      description: courseForm.description,
      thumbnail_url: courseForm.image.trim(),
      software_used: courseForm.category.trim(),
      difficulty: ['beginner', 'intermediate', 'advanced'].includes(difficultyVal) ? difficultyVal : 'intermediate',
      price: parseFloat(courseForm.price) || 0,
      instructor: courseForm.instructor.trim() || null,
      category: courseForm.courseCategory.replace(/\s+/g, ' ').trim() || null,
      required_plan_id: requiredPlanId && Number.isInteger(requiredPlanId) ? requiredPlanId : null,
      is_published: courseForm.published,
      duration: courseForm.duration.trim() || null,
      lessons: parseInt(courseForm.lessons) || 0,
      features: features.map(f => f.trim()).filter(Boolean),
      introduction_url: courseForm.introductionUrl.trim() || null
    }

    try {
      const { error } = await supabase
        .from('courses')
        .insert(payload)

      if (error) throw error

      await MySwal.fire({
        icon: 'success',
        title: 'Created!',
        text: "Course created successfully!"
      })
      router.push("/admin?tab=courses")
    } catch (err: any) {
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: `Failed to create course: ${err.message}`
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading || !user || profile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" style={{ borderTopColor: '#9ACD32' }} />
      </div>
    )
  }

  return (
    <main className="min-h-screen flex flex-col justify-between" style={{ backgroundColor: '#060010' }}>
      <Navigation />

      <div className="flex-grow container mx-auto px-6 py-24 md:py-32 max-w-5xl relative">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/admin?tab=courses">
            <Button variant="ghost" className="text-zinc-400 hover:text-white p-2 rounded-xl border border-zinc-800">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">Create New Masterclass</h1>
            <p className="text-sm text-zinc-400">Add a brand new course curriculum card and landing details.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-zinc-900/40 border border-zinc-800 p-8 rounded-3xl space-y-8 backdrop-blur-md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Title */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Course Title</label>
              <input
                type="text"
                required
                value={courseForm.title}
                onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700"
                placeholder="e.g. Photoshop Masterclass"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5 font-mono">Slug (URL string)</label>
              <input
                type="text"
                required
                value={courseForm.slug}
                onChange={(e) => setCourseForm({ ...courseForm, slug: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700 font-mono"
                placeholder="e.g. photoshop-masterclass"
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                title="Lowercase letters, numbers, and hyphens only."
              />
              <p className="text-[10px] text-zinc-500 mt-1">Used for the URL path. No spaces or uppercase letters allowed.</p>
            </div>

            {/* Price */}
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Price (USD)</label>
              <input
                type="number"
                step="0.01"
                required
                value={courseForm.price}
                onChange={(e) => setCourseForm({ ...courseForm, price: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700 font-mono"
                placeholder="49.99"
              />
            </div>

            {/* Instructor */}
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Instructor Name</label>
              <input
                type="text"
                required
                value={courseForm.instructor}
                onChange={(e) => setCourseForm({ ...courseForm, instructor: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700"
                placeholder="e.g. Bun Sambath"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Category Group</label>
              <input
                type="text"
                required
                value={courseForm.courseCategory}
                onChange={(e) => setCourseForm({ ...courseForm, courseCategory: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700"
                placeholder="e.g. Post-Production"
              />
              <p className="text-[10px] text-zinc-500 mt-1">Filters courses by this tag on the catalog page.</p>
            </div>

            {/* Level */}
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Difficulty Level</label>
              <select
                value={courseForm.level}
                onChange={(e) => setCourseForm({ ...courseForm, level: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700"
              >
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Duration</label>
              <input
                type="text"
                required
                value={courseForm.duration}
                onChange={(e) => setCourseForm({ ...courseForm, duration: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700"
                placeholder="e.g. 6 weeks"
              />
            </div>

            {/* Lessons */}
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5 font-mono">Lessons Count</label>
              <input
                type="number"
                required
                value={courseForm.lessons}
                onChange={(e) => setCourseForm({ ...courseForm, lessons: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700 font-mono"
                placeholder="e.g. 45"
              />
            </div>

            {/* Software Used */}
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Software Used</label>
              <input
                type="text"
                required
                value={courseForm.category}
                onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700"
                placeholder="e.g. Photoshop, Lightroom"
              />
            </div>

            {/* Access Requirement */}
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Access Requirement</label>
              <select
                value={courseForm.requiredPlanId}
                onChange={(e) => setCourseForm({ ...courseForm, requiredPlanId: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700"
              >
                <option value="">Direct purchase only</option>
                {plans.map((p) => (
                  <option key={p.plan_id} value={String(p.plan_id)}>
                    Requires Plan: {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Visibility */}
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Visibility</label>
              <select
                value={courseForm.published ? "published" : "draft"}
                onChange={(e) => setCourseForm({ ...courseForm, published: e.target.value === "published" })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700"
              >
                <option value="published">Published (visible to students)</option>
                <option value="draft">Draft (hidden)</option>
              </select>
            </div>

            {/* Image Thumbnail */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Thumbnail Image URL</label>
              <input
                type="text"
                required
                value={courseForm.image}
                onChange={(e) => setCourseForm({ ...courseForm, image: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700"
                placeholder="https://images.unsplash.com/..."
              />
            </div>

            {/* Video Introduction */}
            <div className="md:col-span-2 border-t border-zinc-800 pt-6">
              <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">
                Video Introduction (URL or Video File)
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={courseForm.introductionUrl}
                  onChange={(e) => setCourseForm({ ...courseForm, introductionUrl: e.target.value })}
                  className="flex-grow bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700"
                  placeholder="Paste YouTube, Vimeo, or MP4 URL..."
                />
                <div className="relative shrink-0">
                  <input
                    type="file"
                    id="intro-upload"
                    accept="video/*"
                    onChange={handleIntroductionUpload}
                    disabled={uploadingIntro}
                    className="hidden"
                  />
                  <label
                    htmlFor="intro-upload"
                    className={`bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold px-4 py-3 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors border border-zinc-800 h-full ${uploadingIntro ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {uploadingIntro ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Upload Video
                      </>
                    )}
                  </label>
                </div>
              </div>
              <p className="text-[10px] text-zinc-500 mt-1">
                Provide an external link (YouTube, Vimeo, MP4 file) or upload an introduction video file from your computer directly.
                <br />
                <span className="text-amber-500/90 font-medium font-sans">💡 Tip for Instant Playback:</span> Before uploading, encode the video using H.264 at 720p/1080p, and make sure &quot;Fast Start&quot; (Web Optimized) is checked in your encoder. This moves metadata to the front of the file so users can stream progressive downloads immediately.
              </p>
            </div>

            {/* Description Summary */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Description Summary</label>
              <textarea
                rows={4}
                required
                value={courseForm.description}
                onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700 resize-none"
                placeholder="Brief description of the course contents and curriculum..."
              />
            </div>

            {/* Dynamic Features List */}
            <div className="md:col-span-2 border-t border-zinc-800 pt-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wide">Key Features & Bullet Points</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">These will render as key bullet features on the course details landing page.</p>
                </div>
                <Button
                  type="button"
                  onClick={handleAddFeature}
                  className="bg-zinc-800 hover:bg-zinc-750 text-white font-semibold flex items-center gap-1.5 px-4 py-2 text-xs rounded-xl"
                >
                  <Plus className="w-4 h-4" />
                  Add Feature
                </Button>
              </div>

              {features.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-zinc-800 rounded-2xl text-xs text-zinc-500">
                  No features added yet. Click "Add Feature" above to list key curriculum highlights.
                </div>
              ) : (
                <div className="space-y-3">
                  {features.map((feature, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        required
                        value={feature}
                        onChange={(e) => handleFeatureChange(idx, e.target.value)}
                        placeholder={`e.g. Advanced post-production workflows (${idx + 1})`}
                        className="flex-grow bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700"
                      />
                      <Button
                        type="button"
                        onClick={() => handleRemoveFeature(idx)}
                        variant="ghost"
                        className="text-red-400 hover:bg-red-950/20 hover:text-red-300 p-3 rounded-xl border border-red-950/30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-zinc-800">
            <Link href="/admin?tab=courses">
              <Button type="button" variant="ghost" className="text-zinc-400 hover:text-white border border-zinc-800 hover:bg-zinc-850 px-6 rounded-xl">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={saving}
              className="bg-primary text-black font-bold px-8 rounded-xl"
              style={{ backgroundColor: '#9ACD32', color: '#000' }}
            >
              {saving ? "Creating..." : "Create Course"}
            </Button>
          </div>
        </form>
      </div>

      <Footer />
    </main>
  )
}
