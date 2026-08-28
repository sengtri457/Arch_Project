"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  FileText,
  Link2,
  Loader2,
  RotateCcw,
  Sparkles,
  User
} from "lucide-react"

interface SubmissionFileEntry {
  url?: string
  notes?: string
}

type SubmissionStatus = "submitted" | "in_review" | "graded" | "revision_requested"

const STATUS_STYLES: Record<string, string> = {
  graded: "bg-green-950/20 text-green-400 border-green-900/30",
  revision_requested: "bg-orange-950/20 text-orange-400 border-orange-900/30",
  in_review: "bg-blue-950/20 text-blue-400 border-blue-900/30",
  submitted: "bg-yellow-950/20 text-yellow-400 border-yellow-900/30"
}

function isHttpUrl(value: unknown): boolean {
  return /^https?:\/\//i.test(String(value ?? ""))
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full uppercase border ${STATUS_STYLES[status] || STATUS_STYLES.submitted}`}>
      {status.replace(/_/g, " ")}
    </span>
  )
}

export default function SubmissionDetailPage() {
  const params = useParams<{ id: string }>()
  const submissionId = params.id

  const [loading, setLoading] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)
  const [savingAction, setSavingAction] = useState<"grade" | "revision" | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const [submission, setSubmission] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])
  const [queueIds, setQueueIds] = useState<string[]>([])

  const [scoreInput, setScoreInput] = useState("")
  const [feedbackInput, setFeedbackInput] = useState("")

  const supabase = createClient()

  const loadAll = useCallback(async () => {
    setLoading(true)
    setAccessDenied(false)

    const { data, error } = await supabase
      .from("exercise_submissions")
      .select(`
        *,
        profiles:student_id ( full_name, avatar_url ),
        exercises (
          title, brief_prompt, max_score,
          lessons (
            title,
            courses ( title, slug )
          )
        )
      `)
      .eq("submission_id", submissionId)
      .maybeSingle()

    if (error || !data) {
      setSubmission(null)
      setAccessDenied(true)
      setLoading(false)
      return
    }

    setSubmission(data)

    const exerciseId = (data as any).exercise_id
    const studentId = (data as any).student_id
    const maxScore = (data as any).exercises?.max_score ?? 100

    setScoreInput(String((data as any).score ?? ""))
    setFeedbackInput((data as any).instructor_feedback || "")

    const [historyRes, queueRes] = await Promise.all([
      supabase
        .from("exercise_submissions")
        .select("submission_id, status, score, instructor_feedback, submitted_at, reviewed_at")
        .eq("exercise_id", exerciseId)
        .eq("student_id", studentId)
        .order("submitted_at", { ascending: true }),
      supabase
        .from("exercise_submissions")
        .select("submission_id, submitted_at")
        .neq("status", "graded")
        .order("submitted_at", { ascending: true })
    ])

    setHistory(historyRes.data || [])
    setQueueIds((queueRes.data || []).map((q: any) => q.submission_id))
    setLoading(false)
  }, [supabase, submissionId])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const applyUpdate = async (
    kind: "grade" | "revision",
    payload: Record<string, unknown>
  ) => {
    setSavingAction(kind)
    setActionError(null)

    const { error } = await supabase
      .from("exercise_submissions")
      .update(payload)
      .eq("submission_id", submissionId)

    if (error) {
      setActionError(error.message)
      setSavingAction(null)
      return
    }

    await loadAll()
  }

  const handleGrade = async () => {
    const maxScore = submission?.exercises?.max_score ?? 100
    const parsed = parseInt(scoreInput, 10)

    if (!Number.isInteger(parsed) || parsed < 0 || parsed > maxScore) {
      setActionError(`Score must be a whole number between 0 and ${maxScore}.`)
      return
    }

    await applyUpdate("grade", {
      status: "graded",
      score: parsed,
      instructor_feedback: feedbackInput.trim(),
      reviewed_at: new Date().toISOString()
    })
  }

  const handleRequestRevision = async () => {
    if (!feedbackInput.trim()) {
      setActionError("Feedback is required when requesting a revision.")
      return
    }

    await applyUpdate("revision", {
      status: "revision_requested",
      instructor_feedback: feedbackInput.trim(),
      reviewed_at: new Date().toISOString()
    })
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#060010" }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#9ACD32" }} />
      </main>
    )
  }

  if (accessDenied || !submission) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center" style={{ backgroundColor: "#060010" }}>
        <h1 className="text-2xl font-bold text-white">Submission not found</h1>
        <p className="text-sm text-zinc-400">This homework does not exist or you do not have access to it.</p>
        <Link href="/admin?tab=submissions">
          <Button variant="outline" className="border-zinc-800 text-zinc-300 rounded-lg">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Submissions
          </Button>
        </Link>
      </main>
    )
  }

  const files: SubmissionFileEntry[] = Array.isArray(submission.submission_files_json)
    ? submission.submission_files_json
    : []

  const exercise = submission.exercises || {}
  const lesson = exercise.lessons || {}
  const course = lesson.courses || {}
  const maxScore = exercise.max_score ?? 100
  const currentIndex = queueIds.indexOf(submissionId)
  const prevId = currentIndex > 0 ? queueIds[currentIndex - 1] : null
  const nextId = currentIndex !== -1 && currentIndex < queueIds.length - 1 ? queueIds[currentIndex + 1] : null
  const nextPendingFirst = currentIndex === -1 ? queueIds[0] || null : null

  return (
    <main className="min-h-screen flex flex-col" style={{ backgroundColor: "#060010" }}>
      <div className="flex-grow container mx-auto px-6 py-24 md:py-28 max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
          <Link href="/admin?tab=submissions">
            <Button variant="ghost" className="text-zinc-400 hover:text-white text-xs font-semibold">
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Submissions
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            {prevId && (
              <Link href={`/admin/submissions/${prevId}`}>
                <Button variant="outline" size="sm" className="border-zinc-800 text-zinc-400 hover:text-white rounded-lg">
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Prev pending
                </Button>
              </Link>
            )}
            {nextId && (
              <Link href={`/admin/submissions/${nextId}`}>
                <Button variant="outline" size="sm" className="border-zinc-800 text-zinc-400 hover:text-white rounded-lg">
                  Next pending <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            )}
            {nextPendingFirst && (
              <Link href={`/admin/submissions/${nextPendingFirst}`}>
                <Button variant="outline" size="sm" className="border-zinc-800 text-zinc-400 hover:text-white rounded-lg">
                  Next pending <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            )}
          </div>
        </div>

        <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-6 mb-6 flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-950 border border-zinc-800 flex items-center justify-center shrink-0">
              {submission.profiles?.avatar_url ? (
                <img src={submission.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5 text-zinc-600" />
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-white truncate">
                {submission.profiles?.full_name || "Unknown Student"}
              </h1>
              <p className="text-xs text-zinc-500 mt-0.5">
                Submitted {new Date(submission.submitted_at).toLocaleString()}
                {submission.reviewed_at ? ` · Reviewed ${new Date(submission.reviewed_at).toLocaleString()}` : ""}
              </p>
            </div>
          </div>
          <StatusBadge status={submission.status} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-zinc-900/30 border border-zinc-800/60 rounded-2xl p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <BookOpen className="w-4 h-4" style={{ color: "#9ACD32" }} />
                    {exercise.title || "Practice Task"}
                  </h2>
                  <p className="text-xs text-zinc-500 mt-1">
                    {course.title || "Course"} · {lesson.title || "Lesson"}
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300 shrink-0">
                  Max score: {maxScore}
                </span>
              </div>
              {exercise.brief_prompt && (
                <div className="bg-zinc-950/50 border border-zinc-850/60 p-4 rounded-xl">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Instructor brief</p>
                  <p className="text-sm text-zinc-300 leading-relaxed">{exercise.brief_prompt}</p>
                </div>
              )}
            </section>

            <section className="bg-zinc-900/30 border border-zinc-800/60 rounded-2xl p-6 space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                <FileText className="w-4 h-4" style={{ color: "#9ACD32" }} />
                Submitted work ({files.length})
              </h2>
              {files.length === 0 ? (
                <p className="text-xs text-zinc-500 italic">No files were attached to this submission.</p>
              ) : (
                files.map((file, idx) => (
                  <div key={idx} className="bg-zinc-950/50 border border-zinc-850/60 p-4 rounded-xl space-y-2">
                    <div className="flex items-start gap-2 text-sm break-all">
                      <Link2 className="w-3.5 h-3.5 mt-1 shrink-0 text-zinc-600" />
                      {isHttpUrl(file.url) ? (
                        <a href={String(file.url)} target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: "#9ACD32" }}>
                          {String(file.url)}
                        </a>
                      ) : (
                        <span className="text-zinc-300">{file.url || "(no content)"}</span>
                      )}
                    </div>
                    {file.notes && <p className="text-xs text-zinc-500 italic pl-5">{file.notes}</p>}
                  </div>
                ))
              )}
            </section>

            {history.length > 0 && (
              <section className="bg-zinc-900/30 border border-zinc-800/60 rounded-2xl p-6 space-y-3">
                <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-300">Attempt history</h2>
                <div className="space-y-2.5">
                  {history.map((attempt, idx) => (
                    <div
                      key={attempt.submission_id}
                      className={`p-3.5 rounded-xl border text-xs ${
                        attempt.submission_id === submissionId
                          ? "border-[#9ACD32]/40 bg-[#9ACD32]/5"
                          : "border-zinc-850 bg-zinc-950/40"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold text-zinc-300">Attempt {idx + 1}</span>
                        <span className="text-zinc-500">{new Date(attempt.submitted_at).toLocaleDateString()}</span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                        <StatusBadge status={attempt.status} />
                        {attempt.score != null && <span className="text-zinc-400">Score: <strong className="text-zinc-200">{attempt.score}</strong></span>}
                      </div>
                      {attempt.instructor_feedback && (
                        <p className="mt-2 text-zinc-500 leading-relaxed">“{attempt.instructor_feedback}”</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-6">
            <section className="lg:sticky lg:top-28 bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-6 space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                <Award className="w-4 h-4" style={{ color: "#9ACD32" }} />
                Grade this work
              </h2>

              {actionError && (
                <div className="p-3 rounded-lg bg-red-950/30 border border-red-900/50 text-red-400 text-xs">{actionError}</div>
              )}

              {submission.status === "graded" ? (
                <div className="p-4 rounded-xl bg-green-950/20 border border-green-900/30 space-y-1.5">
                  <p className="flex items-center gap-2 text-green-400 text-sm font-semibold">
                    <CheckCircle2 className="w-4 h-4" /> Already graded
                  </p>
                  <p className="text-xs text-zinc-400">Score: <strong className="text-white">{submission.score}</strong> / {maxScore}</p>
                  {submission.instructor_feedback && (
                    <p className="text-xs text-zinc-500 italic">“{submission.instructor_feedback}”</p>
                  )}
                  <p className="text-[10px] text-zinc-600 pt-1">Submitting again below will overwrite this grade.</p>
                </div>
              ) : null}

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                  Score (0 – {maxScore})
                </label>
                <input
                  type="number"
                  min={0}
                  max={maxScore}
                  value={scoreInput}
                  onChange={(e) => setScoreInput(e.target.value)}
                  placeholder={`${maxScore}`}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                  Feedback for the student
                </label>
                <textarea
                  rows={5}
                  value={feedbackInput}
                  onChange={(e) => setFeedbackInput(e.target.value)}
                  placeholder="What was good, what to improve..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-zinc-700 resize-none"
                />
              </div>

              <div className="space-y-2.5 pt-1">
                <Button
                  onClick={handleGrade}
                  disabled={savingAction !== null}
                  className="w-full py-5 rounded-xl font-bold flex items-center justify-center gap-2"
                  style={{ backgroundColor: "#9ACD32", color: "#000" }}
                >
                  {savingAction === "grade" ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Approve &amp; Grade
                </Button>
                <Button
                  onClick={handleRequestRevision}
                  disabled={savingAction !== null}
                  variant="outline"
                  className="w-full py-4 rounded-xl border-orange-900/40 text-orange-400 hover:bg-orange-950/20"
                >
                  {savingAction === "revision" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RotateCcw className="w-4 h-4 mr-2" />}
                  Request Revision
                </Button>
                <div className="pt-2 border-t border-zinc-800/45">
                  <Link href={`/admin?tab=student-showcase&submission_id=${submissionId}`}>
                    <Button
                      variant="outline"
                      type="button"
                      className="w-full py-4 rounded-xl border-zinc-800 text-zinc-300 hover:bg-zinc-850 hover:text-white"
                    >
                      <Sparkles className="w-4 h-4 mr-2 text-primary" style={{ color: "#9ACD32" }} />
                      Feature in Showcase
                    </Button>
                  </Link>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  )
}
