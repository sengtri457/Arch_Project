"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd"
import { GripVertical, Edit3, Trash2, Loader2, Check, X, ExternalLink, Undo2, Redo2, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getMediaUrl } from "@/lib/utils"
import { getLessonCoverImage } from "@/lib/courses-data"

export interface SyllabusLesson {
  lesson_id: string
  course_id: string
  module_id?: string | null
  title: string
  order_index?: number
  video_external_id?: string
  duration_minutes?: number
  thumbnail_url?: string | null
  is_preview?: boolean
}

interface SyllabusDragListProps {
  courseId: string
  courseSlug?: string
  lessons: SyllabusLesson[]
  onEditLesson?: (lesson: SyllabusLesson) => void
  onDeleteLesson?: (lessonId: string) => void
  onReorderSuccess?: () => void
}

export function SyllabusDragList({
  courseId,
  courseSlug,
  lessons,
  onEditLesson,
  onDeleteLesson,
  onReorderSuccess,
}: SyllabusDragListProps) {
  const [items, setItems] = useState<SyllabusLesson[]>(lessons)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle")
  const [isMounted, setIsMounted] = useState(false)
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState("")
  const [savingTitle, setSavingTitle] = useState(false)
  const [history, setHistory] = useState<SyllabusLesson[][]>([])
  const [future, setFuture] = useState<SyllabusLesson[][]>([])
  const [undoNotice, setUndoNotice] = useState<string | null>(null)

  const lessonsKey = (lessons || []).map((l) => `${l.lesson_id}:${l.title}:${l.order_index}`).join(";")
  const lessonsIdKey = (lessons || []).map((l) => l.lesson_id).sort().join(";")

  const handleStartRename = (les: SyllabusLesson) => {
    setEditingLessonId(les.lesson_id)
    setEditingTitle(les.title || "")
  }

  const handleSaveInlineTitle = async (lessonId: string) => {
    const trimmed = (editingTitle || "").trim()
    const current = items.find((l) => l.lesson_id === lessonId)
    if (!trimmed || trimmed === current?.title) {
      setEditingLessonId(null)
      return
    }

    setSavingTitle(true)
    try {
      const res = await fetch("/api/admin/lessons", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lesson_id: lessonId,
          title: trimmed,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to save title")
      }

      setItems((prev) =>
        prev.map((item) =>
          item.lesson_id === lessonId ? { ...item, title: trimmed } : item
        )
      )
      setEditingLessonId(null)
      if (onReorderSuccess) onReorderSuccess()
    } catch (err: any) {
      console.error("Inline lesson rename failed:", err)
      alert(`Could not rename lesson: ${err.message}`)
    } finally {
      setSavingTitle(false)
    }
  }

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Clear undo/redo stacks if course lesson list membership changes (addition / deletion)
  useEffect(() => {
    setHistory([])
    setFuture([])
  }, [lessonsIdKey])

  useEffect(() => {
    // Keep local items in sync only when actual lesson properties change and not mid-save
    if (!isSaving) {
      const sorted = [...lessons].sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
      setItems(sorted)
    }
  }, [lessonsKey, isSaving])

  const persistReorder = async (
    targetItems: SyllabusLesson[],
    rollbackItems: SyllabusLesson[],
    actionType: "drag" | "undo" | "redo" = "drag"
  ) => {
    setItems(targetItems)
    setIsSaving(true)
    setSaveStatus("idle")

    if (actionType === "undo") {
      setUndoNotice("Reverted (Ctrl+Z)!")
    } else if (actionType === "redo") {
      setUndoNotice("Redone (Ctrl+Y)!")
    } else {
      setUndoNotice(null)
    }

    try {
      const response = await fetch("/api/admin/lessons/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          course_id: courseId,
          updates: targetItems.map((l, index) => ({
            lesson_id: l.lesson_id,
            order_index: index + 1,
            module_id: l.module_id || null,
          })),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to persist new order")
      }

      setSaveStatus("success")
      setTimeout(() => {
        setSaveStatus("idle")
        setUndoNotice(null)
      }, 2500)
      if (onReorderSuccess) {
        onReorderSuccess()
      }
    } catch (err: any) {
      console.error("Drag-and-drop reordering failed:", err)
      // Rollback optimistic update
      setItems(rollbackItems)
      setSaveStatus("error")
      setUndoNotice(null)
      setTimeout(() => setSaveStatus("idle"), 3000)
      alert(`Reordering failed: ${err.message}. Previous sequence restored.`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleUndo = async () => {
    if (isSaving || history.length === 0) return

    const previous = history[history.length - 1]
    const newHistory = history.slice(0, -1)
    const current = items

    setHistory(newHistory)
    setFuture((prev) => [current, ...prev])

    const resequencedPrevious = previous.map((item, index) => ({
      ...item,
      order_index: index + 1,
    }))

    await persistReorder(resequencedPrevious, current, "undo")
  }

  const handleRedo = async () => {
    if (isSaving || future.length === 0) return

    const next = future[0]
    const newFuture = future.slice(1)
    const current = items

    setFuture(newFuture)
    setHistory((prev) => [...prev, current])

    const resequencedNext = next.map((item, index) => ({
      ...item,
      order_index: index + 1,
    }))

    await persistReorder(resequencedNext, current, "redo")
  }

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || result.destination.index === result.source.index) {
      return
    }

    const previousItems = [...items]
    const reordered = Array.from(items)
    const [removed] = reordered.splice(result.source.index, 1)
    reordered.splice(result.destination.index, 0, removed)

    // Recalculate order_index sequentially starting at 1
    const updatedItems = reordered.map((item, index) => ({
      ...item,
      order_index: index + 1,
    }))

    setHistory((prev) => [...prev.slice(-19), previousItems])
    setFuture([])

    await persistReorder(updatedItems, previousItems, "drag")
  }

  // Keyboard shortcut listener for Ctrl+Z (Undo) and Ctrl+Y / Cmd+Shift+Z (Redo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently renaming inline or typing inside an input/textarea
      if (editingLessonId) return

      const activeEl = document.activeElement
      if (
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        activeEl?.getAttribute("contenteditable") === "true"
      ) {
        return
      }

      const isModifier = e.ctrlKey || e.metaKey
      if (!isModifier || e.altKey) return

      const isKeyZ = e.code === "KeyZ" || e.key.toLowerCase() === "z"
      const isKeyY = e.code === "KeyY" || e.key.toLowerCase() === "y"

      if ((isKeyZ && e.shiftKey) || isKeyY) {
        if (future.length > 0 && !isSaving) {
          e.preventDefault()
          handleRedo()
        }
      } else if (isKeyZ && !e.shiftKey) {
        if (history.length > 0 && !isSaving) {
          e.preventDefault()
          handleUndo()
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [history, future, items, isSaving, editingLessonId])

  if (!isMounted) {
    return (
      <div className="py-6 text-center text-xs text-zinc-500">
        Loading syllabus drag layout...
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <p className="text-xs text-zinc-500 italic text-center py-6">
        No lessons exist in this syllabus yet. Click "Add Lesson" above.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {/* Save indicator & Undo/Redo toolbar banner */}
      <div className="flex items-center justify-between text-xs px-1 text-zinc-400">
        <span className="text-[11px] text-zinc-500 flex items-center gap-1.5">
          <GripVertical className="w-3.5 h-3.5 text-zinc-500" />
          Drag items by handle to reorder automatically
        </span>
        <div className="flex items-center gap-2">
          {/* Undo Action Button */}
          {history.length > 0 && (
            <button
              type="button"
              onClick={handleUndo}
              disabled={isSaving}
              className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-750 hover:border-zinc-600 px-2.5 py-1 rounded-lg transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
              title="Undo lesson reorder (Ctrl+Z)"
            >
              <Undo2 className="w-3 h-3 text-[#9ACD32]" />
              <span>Undo</span>
              <kbd className="text-[9px] bg-zinc-950 border border-zinc-700 px-1 py-0.2 rounded text-zinc-400 font-mono">
                Ctrl+Z
              </kbd>
            </button>
          )}

          {/* Redo Action Button */}
          {future.length > 0 && (
            <button
              type="button"
              onClick={handleRedo}
              disabled={isSaving}
              className="flex items-center gap-1 text-[11px] font-medium text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-750 hover:border-zinc-600 px-2 py-1 rounded-lg transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
              title="Redo lesson reorder (Ctrl+Y)"
            >
              <Redo2 className="w-3 h-3 text-[#9ACD32]" />
              <span>Redo</span>
            </button>
          )}

          {isSaving && (
            <span className="flex items-center gap-1.5 text-primary text-[11px] font-mono animate-pulse" style={{ color: "#9ACD32" }}>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Saving sequence...
            </span>
          )}
          {undoNotice && (
            <span className="flex items-center gap-1 text-[#9ACD32] text-[11px] font-semibold animate-in fade-in duration-150">
              <RotateCcw className="w-3 h-3 animate-spin" /> {undoNotice}
            </span>
          )}
          {saveStatus === "success" && !undoNotice && (
            <span className="flex items-center gap-1 text-green-400 text-[11px] font-semibold">
              <Check className="w-3.5 h-3.5" /> Order saved!
            </span>
          )}
          {saveStatus === "error" && (
            <span className="text-red-400 text-[11px] font-semibold">
              Save failed (reverted)
            </span>
          )}
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId={`syllabus-${courseId}`}>
          {(provided, snapshot) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className={`space-y-2.5 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar transition-colors rounded-xl p-1 ${
                snapshot.isDraggingOver ? "bg-zinc-950/60 ring-1 ring-zinc-700" : ""
              }`}
            >
              {items.map((les, index) => {
                const thumb =
                  les.thumbnail_url ||
                  getLessonCoverImage(
                    courseSlug || courseId,
                    { ...les, thumbnail_url: les.thumbnail_url || undefined },
                    (les.order_index || index + 1) - 1
                  )

                return (
                  <Draggable
                    key={les.lesson_id}
                    draggableId={les.lesson_id}
                    index={index}
                  >
                    {(draggableProvided, draggableSnapshot) => (
                      <div
                        ref={draggableProvided.innerRef}
                        {...draggableProvided.draggableProps}
                        className={`p-3 bg-zinc-950 rounded-xl border flex justify-between items-center gap-3 transition-all ${
                          draggableSnapshot.isDragging
                            ? "border-primary shadow-2xl shadow-black/80 scale-[1.02] bg-zinc-900 z-50 ring-1 ring-primary"
                            : "border-zinc-850 hover:border-zinc-700"
                        }`}
                        style={{
                          ...draggableProvided.draggableProps.style,
                          borderColor: draggableSnapshot.isDragging ? "#9ACD32" : undefined,
                        }}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Drag Grip Handle */}
                          <div
                            {...draggableProvided.dragHandleProps}
                            className="text-zinc-600 hover:text-zinc-300 p-1 cursor-grab active:cursor-grabbing rounded hover:bg-zinc-900 transition-colors shrink-0"
                            title="Drag to reorder lesson"
                          >
                            <GripVertical className="w-4 h-4" />
                          </div>

                          {/* Index badge */}
                          <div className="w-6 h-6 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center justify-center text-[10px] font-mono font-bold shrink-0">
                            {les.order_index || index + 1}
                          </div>

                          {/* Thumbnail */}
                          <div className="w-14 h-9 rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800 shrink-0 relative">
                            <img
                              src={getMediaUrl(thumb)}
                              alt={les.title}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          {/* Titles */}
                          <div className="flex-1 min-w-0">
                            {editingLessonId === les.lesson_id ? (
                              <div
                                className="flex items-center gap-2 max-w-md py-0.5"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                }}
                              >
                                <input
                                  type="text"
                                  autoFocus
                                  disabled={savingTitle}
                                  value={editingTitle}
                                  onChange={(e) => setEditingTitle(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      handleSaveInlineTitle(les.lesson_id)
                                    } else if (e.key === "Escape") {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      setEditingLessonId(null)
                                    }
                                  }}
                                  className="w-full min-w-[220px] bg-zinc-900 border-2 border-[#9ACD32] text-white text-xs font-semibold px-3 py-1.5 rounded-lg focus:outline-none shadow-md shadow-[#9ACD32]/10"
                                />
                                {savingTitle ? (
                                  <Loader2 className="w-4 h-4 text-[#9ACD32] animate-spin shrink-0" />
                                ) : (
                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => handleSaveInlineTitle(les.lesson_id)}
                                      className="p-1.5 text-black bg-[#9ACD32] hover:bg-[#8ab82b] rounded-md transition-colors cursor-pointer"
                                      title="Save (Enter)"
                                    >
                                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingLessonId(null)}
                                      className="p-1.5 text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-md transition-colors cursor-pointer"
                                      title="Cancel (Esc)"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-xs font-semibold text-white flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    handleStartRename(les)
                                  }}
                                  className="text-left text-xs font-semibold text-white hover:text-[#9ACD32] transition-colors truncate cursor-pointer bg-transparent border-0 p-0"
                                  title="Click to rename this lesson"
                                >
                                  {les.title || "Untitled Lesson"}
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    handleStartRename(les)
                                  }}
                                  className="text-[10px] text-zinc-400 hover:text-black hover:bg-[#9ACD32] flex items-center gap-1 bg-zinc-900 px-2 py-0.5 rounded-md border border-zinc-750 shrink-0 transition-all cursor-pointer font-medium"
                                  title="Click to rename this lesson"
                                >
                                  <Edit3 className="w-2.5 h-2.5" />
                                  <span className="text-[9px] font-mono">Rename</span>
                                </button>
                              </div>
                            )}
                            <p className="text-[10px] text-zinc-500 mt-0.5 font-mono truncate">
                              ID: {les.video_external_id || "N/A"} •{" "}
                              {les.duration_minutes || 0} mins
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-1.5 shrink-0">
                          {courseId && les.lesson_id ? (
                            <Link
                              href={`/admin/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(les.lesson_id)}/edit`}
                              prefetch={true}
                              className="inline-flex items-center justify-center hover:bg-zinc-800 text-zinc-400 hover:text-white h-8 w-8 rounded-lg transition-colors"
                              title="Open full lesson page (video, assets, chapter)"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          ) : onEditLesson ? (
                            <Button
                              onClick={() => onEditLesson(les)}
                              size="sm"
                              variant="ghost"
                              className="hover:bg-zinc-800 text-zinc-400 hover:text-white h-8 w-8 p-0"
                              title="Open full lesson page (video, assets, chapter)"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Button>
                          ) : null}
                          {onDeleteLesson && (
                            <Button
                              onClick={() => onDeleteLesson(les.lesson_id)}
                              size="sm"
                              variant="ghost"
                              className="hover:bg-red-950/20 text-red-400 hover:text-red-300 h-8 w-8 p-0"
                              title="Delete lesson"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </Draggable>
                )
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  )
}
