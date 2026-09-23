"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { ArrowLeft, Plus, Trash2, Upload, Loader2, Video, FileText, Image as ImageIcon, Save, CheckCircle2 } from "lucide-react"
import { getMediaUrl } from "@/lib/utils"
import Swal from "sweetalert2"

const MySwal = Swal.mixin({
  customClass: {
    confirmButton: 'bg-primary text-black font-bold px-6 py-2 rounded-xl mx-2',
    cancelButton: 'bg-zinc-800 text-white font-bold px-6 py-2 rounded-xl mx-2'
  },
  buttonsStyling: false
})

export interface ResourceItem {
  url: string
  desc: string
}

export function parseMultipleResources(raw?: string | null): ResourceItem[] {
  if (!raw || !raw.trim()) return [{ url: "", desc: "" }]
  const lines = raw.split(/\n|;;/).map(l => l.trim()).filter(Boolean)
  const items = lines.map(line => {
    const parts = line.split('|')
    return { url: parts[0].trim(), desc: parts.slice(1).join('|').trim() }
  })
  return items.length > 0 ? items : [{ url: "", desc: "" }]
}

export function serializeResourceItems(items: ResourceItem[]): string {
  return items
    .filter(item => item.url.trim().length > 0)
    .map(item => item.desc.trim() ? `${item.url.trim()}|${item.desc.trim()}` : item.url.trim())
    .join('\n')
}

interface LessonEditorFormProps {
  courseId: string
  lessonId?: string
}

export default function LessonEditorForm({ courseId, lessonId }: LessonEditorFormProps) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const isEditing = Boolean(lessonId)

  const [loadingData, setLoadingData] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false)
  const [uploadingAsset, setUploadingAsset] = useState(false)
  const [courseTitle, setCourseTitle] = useState<string>("")

  const [lessonForm, setLessonForm] = useState({
    title: "",
    source: "direct", // direct | bunny
    video_url: "",
    duration: "600", // in seconds
    index: "1",
    thumbnail_url: "",
    is_preview: false
  })

  const [resourceItems, setResourceItems] = useState<ResourceItem[]>([
    { url: "", desc: "" }
  ])

  // Security check: must be admin
  useEffect(() => {
    if (!loading && (!user || profile?.role !== 'admin')) {
      router.replace("/")
    }
  }, [user, profile, loading, router])

  // Load course & lesson data
  useEffect(() => {
    async function init() {
      if (!courseId) return
      setLoadingData(true)
      try {
        // Fetch course info for breadcrumbs
        const { data: courseData } = await supabase
          .from('courses')
          .select('title, slug')
          .or(`id.eq.${courseId},slug.eq.${courseId}`)
          .maybeSingle()

        if (courseData?.title) {
          setCourseTitle(courseData.title)
        } else {
          setCourseTitle(courseId)
        }

        // Fetch existing lessons to determine auto-increment order if new, or load target lesson if edit
        const res = await fetch(`/api/admin/lessons?courseId=${encodeURIComponent(courseId)}`)
        let lessons: any[] = []
        if (res.ok) {
          const json = await res.json()
          if (json.success && Array.isArray(json.lessons)) {
            lessons = json.lessons
          }
        } else {
          const { data: dbLessons } = await supabase
            .from('lessons')
            .select('*')
            .or(`course_id.eq.${courseId}`)
            .order('order_index', { ascending: true })
          if (dbLessons) lessons = dbLessons
        }

        if (isEditing && lessonId) {
          const target = lessons.find((l: any) => String(l.lesson_id) === String(lessonId) || String(l.id) === String(lessonId))
          if (target) {
            const rawDuration = target.duration_minutes ? target.duration_minutes * 60 : 600
            setLessonForm({
              title: target.title || "",
              source: target.video_source_type || (target.video_external_id?.includes('-') && target.video_external_id?.length > 30 ? 'bunny' : 'direct'),
              video_url: target.video_external_id || "",
              duration: String(rawDuration),
              index: String(target.order_index ?? 1),
              thumbnail_url: target.thumbnail_url || "",
              is_preview: Boolean(target.is_preview)
            })
            setResourceItems(parseMultipleResources(target.downloadable_asset_url))
          } else {
            MySwal.fire({ icon: 'error', title: 'Error', text: 'Lesson not found.' })
            router.push(`/admin/courses/${courseId}/edit`)
          }
        } else {
          // Auto-calculate next order index for new lesson
          const maxOrder = lessons.reduce((max: number, l: any) => {
            const idx = typeof l.order_index === 'number' ? l.order_index : parseInt(l.order_index) || 0
            return idx > max ? idx : max
          }, 0)
          setLessonForm(prev => ({
            ...prev,
            index: String(maxOrder + 1)
          }))
        }
      } catch (err: any) {
        console.error("Failed to load lesson editor data:", err)
      } finally {
        setLoadingData(false)
      }
    }

    init()
  }, [courseId, lessonId, isEditing, supabase, router])

  // Asset File Upload
  const handleAssetUpload = async (e: React.ChangeEvent<HTMLInputElement>, targetIdx: number = 0) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingAsset(true)
    try {
      const fileExt = file.name.split('.').pop() || 'zip'
      const fileName = `resource-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`
      const filePath = `lesson-resources/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('projects')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('projects')
        .getPublicUrl(filePath)

      setResourceItems(prev => {
        const copy = [...prev]
        if (!copy[targetIdx]) copy[targetIdx] = { url: "", desc: "" }
        copy[targetIdx].url = data.publicUrl
        if (!copy[targetIdx].desc) copy[targetIdx].desc = file.name
        return copy
      })
    } catch (err: any) {
      MySwal.fire({ icon: 'error', title: 'Upload Failed', text: `Asset upload failed: ${err.message}` })
    } finally {
      setUploadingAsset(false)
    }
  }

  // Cover Image / Thumbnail Upload
  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingThumbnail(true)
    try {
      const fileExt = file.name.split('.').pop() || 'jpg'
      const fileName = `lesson-thumb-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`
      const filePath = `lesson-thumbnails/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('projects')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('projects')
        .getPublicUrl(filePath)

      setLessonForm(prev => ({ ...prev, thumbnail_url: data.publicUrl }))
    } catch (err: any) {
      MySwal.fire({ icon: 'error', title: 'Upload Failed', text: `Thumbnail upload failed: ${err.message}` })
    } finally {
      setUploadingThumbnail(false)
    }
  }

  // Save Lesson Handler
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!lessonForm.title.trim()) {
      MySwal.fire({ icon: 'warning', title: 'Validation Error', text: 'Please enter a valid lesson title.' })
      return
    }

    setSaving(true)
    try {
      const finalAssetPayload = serializeResourceItems(resourceItems)
      const durationSec = parseInt(lessonForm.duration) || 600
      const durationMin = Math.max(1, Math.round(durationSec / 60))

      const response = await fetch('/api/admin/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lesson_id: isEditing ? lessonId : undefined,
          course_id: courseId,
          title: lessonForm.title.trim(),
          video_source_type: lessonForm.source || 'direct',
          video_external_id: lessonForm.video_url.trim(),
          duration_minutes: durationMin,
          order_index: parseInt(lessonForm.index) || 1,
          downloadable_asset_url: finalAssetPayload,
          thumbnail_url: lessonForm.thumbnail_url.trim(),
          is_preview: lessonForm.is_preview
        })
      })

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}))
        throw new Error(errJson.error || 'Admin API error')
      }

      await MySwal.fire({
        icon: 'success',
        title: 'Success!',
        text: isEditing ? "Lesson updated successfully!" : "Lesson created successfully!"
      })

      router.push(`/admin/courses/${courseId}/edit`)
    } catch (err: any) {
      MySwal.fire({ icon: 'error', title: 'Save Failed', text: err.message || 'Failed to save lesson.' })
    } finally {
      setSaving(false)
    }
  }

  // Delete Lesson Handler
  const handleDelete = async () => {
    if (!lessonId) return
    const result = await MySwal.fire({
      title: 'Delete Lesson?',
      text: 'Are you sure you want to permanently delete this lesson? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'No, cancel'
    })

    if (!result.isConfirmed) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/admin/lessons?lessonId=${encodeURIComponent(lessonId)}`, {
        method: 'DELETE'
      })
      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}))
        throw new Error(errJson.error || 'Failed to delete lesson')
      }

      await MySwal.fire({
        icon: 'success',
        title: 'Deleted!',
        text: 'Lesson has been deleted.'
      })

      router.push(`/admin/courses/${courseId}/edit`)
    } catch (err: any) {
      MySwal.fire({ icon: 'error', title: 'Delete Failed', text: err.message || 'Failed to delete lesson.' })
    } finally {
      setDeleting(false)
    }
  }

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#9ACD32] mb-3" />
        <p className="text-zinc-400 text-sm">Loading Lesson Editor...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans">
      <Navigation />

      <main className="flex-grow pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl w-full mx-auto space-y-8">
        {/* Top Header & Breadcrumbs */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <Link href="/admin" className="hover:text-white transition-colors">Admin Dashboard</Link>
            <span>/</span>
            <Link href={`/admin/courses/${courseId}/edit`} className="hover:text-white transition-colors truncate max-w-[200px]">
              {courseTitle || courseId}
            </Link>
            <span>/</span>
            <span className="text-white font-medium">{isEditing ? "Edit Lesson" : "Add Lesson"}</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-850 pb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                <Video className="w-7 h-7 text-[#9ACD32]" />
                {isEditing ? `Edit Lesson #${lessonForm.index}` : "Create New Lesson"}
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                Configure lesson details, video sources, module thumbnails, and Google Drive resources.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link href={`/admin/courses/${courseId}/edit`}>
                <Button variant="ghost" className="text-zinc-400 hover:text-white border border-zinc-800 text-xs rounded-xl px-4">
                  <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Syllabus
                </Button>
              </Link>
              {isEditing && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 text-xs rounded-xl px-4"
                >
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 mr-1.5" />}
                  Delete
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Editor Form */}
        <form onSubmit={handleSave} className="space-y-8">
          {/* Card 1: Primary Details */}
          <div className="bg-zinc-950 border border-zinc-850 rounded-2xl p-6 space-y-6">
            <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-zinc-850 pb-3">
              <FileText className="w-4 h-4 text-[#9ACD32]" /> General Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Lesson Title *</label>
                <input
                  type="text"
                  required
                  value={lessonForm.title}
                  onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#9ACD32]"
                  placeholder="e.g. 01. Introduction to Architectural Lighting & Render Setup"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Sequence Order Index *</label>
                <input
                  type="number"
                  required
                  value={lessonForm.index}
                  onChange={(e) => setLessonForm({ ...lessonForm, index: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-[#9ACD32]"
                  placeholder="1"
                />
                <p className="text-[11px] text-zinc-500 mt-1">Controls position in curriculum (auto-incremented).</p>
              </div>
            </div>
          </div>

          {/* Card 2: Video Provider & Player Config */}
          <div className="bg-zinc-950 border border-zinc-850 rounded-2xl p-6 space-y-6">
            <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-zinc-850 pb-3">
              <Video className="w-4 h-4 text-blue-400" /> Video Provider & Playback
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Video Provider</label>
                <select
                  value={lessonForm.source}
                  onChange={(e) => setLessonForm({ ...lessonForm, source: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-400"
                >
                  <option value="direct">Direct MP4 / CDN Link</option>
                  <option value="bunny">Bunny Stream (video GUID)</option>
                </select>
              </div>

              <div className="md:col-span-2">
                {lessonForm.source === 'bunny' ? (
                  <>
                    <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Bunny Video GUID *</label>
                    <input
                      type="text"
                      required
                      value={lessonForm.video_url}
                      onChange={(e) => setLessonForm({ ...lessonForm, video_url: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-blue-400"
                      placeholder="e.g. 9f8c7e6d-1a2b-3c4d-5e6f-7a8b9c0d1e2f"
                    />
                    <p className="text-[11px] text-zinc-500 mt-1">
                      Bunny Stream library GUID. Playback is token-signed server side automatically.
                    </p>
                  </>
                ) : (
                  <>
                    <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Video MP4 URL *</label>
                    <input
                      type="text"
                      required
                      value={lessonForm.video_url}
                      onChange={(e) => setLessonForm({ ...lessonForm, video_url: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-blue-400"
                      placeholder="https://your-cdn.com/videos/lesson-01.mp4"
                    />
                    <p className="text-[11px] text-zinc-500 mt-1">
                      Must be a direct .mp4 video URL for browser HTML5 streaming.
                    </p>
                  </>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Duration (Seconds)</label>
                <input
                  type="number"
                  required
                  value={lessonForm.duration}
                  onChange={(e) => setLessonForm({ ...lessonForm, duration: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-blue-400"
                  placeholder="600"
                />
                <p className="text-[11px] text-zinc-500 mt-1">
                  ~{Math.round((parseInt(lessonForm.duration) || 0) / 60)} minutes total.
                </p>
              </div>

              <div className="md:col-span-2 flex items-center pt-4">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={lessonForm.is_preview}
                    onChange={(e) => setLessonForm({ ...lessonForm, is_preview: e.target.checked })}
                    className="w-5 h-5 rounded border-zinc-700 text-[#9ACD32] focus:ring-[#9ACD32] bg-zinc-900"
                  />
                  <div>
                    <span className="text-sm font-semibold text-white">Allow Free Trial Preview</span>
                    <p className="text-xs text-zinc-500">Enable non-subscribed visitors to preview this lesson.</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Card 3: Lesson Thumbnail / Cover Image */}
          <div className="bg-zinc-950 border border-zinc-850 rounded-2xl p-6 space-y-6">
            <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-zinc-850 pb-3">
              <ImageIcon className="w-4 h-4 text-purple-400" /> Module Cover Image (Thumbnail)
            </h2>

            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <input
                  type="text"
                  value={lessonForm.thumbnail_url}
                  onChange={(e) => setLessonForm({ ...lessonForm, thumbnail_url: e.target.value })}
                  className="flex-grow bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-purple-400"
                  placeholder="Image URL or upload file directly..."
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailUpload}
                  className="hidden"
                  id="page-lesson-thumbnail-file"
                  disabled={uploadingThumbnail}
                />
                <label
                  htmlFor="page-lesson-thumbnail-file"
                  className={`bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold px-5 py-3 rounded-xl flex items-center justify-center cursor-pointer transition-colors border border-zinc-750 shrink-0 ${uploadingThumbnail ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {uploadingThumbnail ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" /> Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" /> Choose Image
                    </>
                  )}
                </label>
              </div>

              {lessonForm.thumbnail_url && (
                <div className="flex items-center gap-4 p-3 bg-zinc-900/60 rounded-xl border border-zinc-800">
                  <div className="w-36 aspect-video rounded-lg overflow-hidden border border-zinc-750 bg-zinc-950 shrink-0">
                    <img src={getMediaUrl(lessonForm.thumbnail_url)} alt="Thumbnail Preview" className="w-full h-full object-cover" />
                  </div>
                  <div className="text-xs space-y-1">
                    <p className="font-semibold text-white flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Thumbnail Ready
                    </p>
                    <p className="text-zinc-500 break-all font-mono text-[11px]">{lessonForm.thumbnail_url}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Card 4: Attachments & Google Drive Links */}
          <div className="bg-zinc-950 border border-zinc-850 rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" /> Lesson Resources & Google Drive Links
              </h2>
              <button
                type="button"
                onClick={() => setResourceItems(prev => [...prev, { url: "", desc: "" }])}
                className="text-xs text-[#9ACD32] hover:underline flex items-center gap-1.5 font-semibold bg-[#9ACD32]/10 px-3 py-1.5 rounded-lg border border-[#9ACD32]/20"
              >
                <Plus className="w-3.5 h-3.5" /> Add Resource Link
              </button>
            </div>

            <div className="space-y-4">
              {resourceItems.map((resItem, rIdx) => {
                const isDrive = resItem.url.includes('drive.google.com') || resItem.url.includes('docs.google.com')
                const isTelegram = resItem.url.includes('t.me') || resItem.url.includes('telegram')

                return (
                  <div key={rIdx} className="p-4 bg-zinc-900/80 rounded-xl border border-zinc-800 space-y-3 relative">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-400 uppercase font-mono flex items-center gap-2">
                        Attachment #{rIdx + 1}
                        {isDrive && <span className="text-blue-400 font-semibold flex items-center gap-1">&bull; Google Drive</span>}
                        {isTelegram && <span className="text-[#229ED9] font-semibold flex items-center gap-1">&bull; Telegram</span>}
                      </span>
                      {resourceItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setResourceItems(prev => prev.filter((_, i) => i !== rIdx))}
                          className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1 hover:bg-red-500/10 px-2 py-1 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={resItem.url}
                          onChange={(e) => {
                            const copy = [...resourceItems]
                            copy[rIdx].url = e.target.value
                            setResourceItems(copy)
                          }}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-400 font-mono"
                          placeholder="Link: https://drive.google.com/drive/folders/... or file URL"
                        />
                        {rIdx === 0 && (
                          <>
                            <input
                              type="file"
                              onChange={(e) => handleAssetUpload(e, rIdx)}
                              className="hidden"
                              id="page-lesson-asset-file"
                              disabled={uploadingAsset}
                            />
                            <label
                              htmlFor="page-lesson-asset-file"
                              className={`bg-zinc-800 hover:bg-zinc-750 text-white text-xs font-semibold px-3 py-2 rounded-xl flex items-center justify-center cursor-pointer transition-colors border border-zinc-750 shrink-0 ${uploadingAsset ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              {uploadingAsset ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                            </label>
                          </>
                        )}
                      </div>

                      <div>
                        <input
                          type="text"
                          value={resItem.desc}
                          onChange={(e) => {
                            const copy = [...resourceItems]
                            copy[rIdx].desc = e.target.value
                            setResourceItems(copy)
                          }}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                          placeholder="Material Name / Description (e.g. 3D Scene File, HDRI Pack)"
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Form Actions Footer */}
          <div className="flex items-center justify-end gap-4 border-t border-zinc-850 pt-6">
            <Link href={`/admin/courses/${courseId}/edit`}>
              <Button type="button" variant="ghost" className="text-zinc-400 hover:text-white text-sm px-6">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={saving}
              className="bg-[#9ACD32] hover:bg-[#8ab82d] text-black font-bold text-sm px-8 py-3 rounded-xl shadow-lg transition-all"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" /> {isEditing ? "Save Lesson Changes" : "Create Lesson"}
                </>
              )}
            </Button>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  )
}
