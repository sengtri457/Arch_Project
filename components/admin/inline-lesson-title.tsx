"use client"

import React, { useState, useRef, useEffect } from "react"
import { Pencil, Check, X, Loader2 } from "lucide-react"

interface InlineLessonTitleProps {
  lessonId?: string
  id?: string
  entityType?: "lesson" | "module"
  initialTitle?: string
  onUpdated?: (newTitle: string) => void
  className?: string
}

export function InlineLessonTitle({
  lessonId,
  id,
  entityType = "lesson",
  initialTitle = "",
  onUpdated,
  className = "",
}: InlineLessonTitleProps) {
  const targetId = id || lessonId
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(initialTitle || "")
  const [prevInitialTitle, setPrevInitialTitle] = useState(initialTitle || "")
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isJustOpenedRef = useRef(false)

  // Sync state if initialTitle changes while not actively editing
  if (initialTitle !== prevInitialTitle && !isEditing) {
    setPrevInitialTitle(initialTitle || "")
    setTitle(initialTitle || "")
  }

  const startEditing = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    isJustOpenedRef.current = true
    setIsEditing(true)
    setTimeout(() => {
      isJustOpenedRef.current = false
    }, 350)
  }

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [isEditing])

  const handleSave = async () => {
    const trimmed = (title || "").trim()
    const original = (initialTitle || "").trim()

    if (!trimmed) {
      setTitle(initialTitle || "")
      setIsEditing(false)
      return
    }

    if (trimmed === original) {
      setIsEditing(false)
      return
    }

    if (!targetId) {
      setIsEditing(false)
      return
    }

    setSaving(true)
    setErrorMessage(null)
    try {
      const endpoint = entityType === "module" ? "/api/admin/modules" : "/api/admin/lessons"
      const payload = entityType === "module"
        ? { module_id: targetId, title: trimmed }
        : { lesson_id: targetId, title: trimmed }

      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `Failed to save ${entityType} title`)
      }

      setTitle(trimmed)
      setPrevInitialTitle(trimmed)
      setIsEditing(false)
      if (onUpdated) {
        onUpdated(trimmed)
      }
    } catch (err: any) {
      console.error(`Inline ${entityType} rename failed:`, err)
      setErrorMessage(err.message || "Failed to save")
      setTimeout(() => setErrorMessage(null), 3000)
      setTitle(initialTitle || "")
      setIsEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      e.stopPropagation()
      handleSave()
    } else if (e.key === "Escape") {
      e.preventDefault()
      e.stopPropagation()
      setTitle(initialTitle || "")
      setIsEditing(false)
    }
  }

  if (isEditing) {
    return (
      <div
        ref={containerRef}
        className={`flex items-center gap-2 w-full max-w-md ${className}`}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={title}
          disabled={saving}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={(e) => {
            if (isJustOpenedRef.current) return
            if (
              e.relatedTarget &&
              containerRef.current &&
              containerRef.current.contains(e.relatedTarget as Node)
            ) {
              return
            }
            handleSave()
          }}
          className="w-full min-w-[220px] bg-zinc-900 border-2 border-[#9ACD32] text-white text-xs font-semibold px-3 py-1.5 rounded-lg focus:outline-none shadow-md shadow-[#9ACD32]/10"
        />
        {saving ? (
          <Loader2 className="w-4 h-4 text-[#9ACD32] animate-spin shrink-0" />
        ) : (
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleSave()
              }}
              className="p-1.5 text-black bg-[#9ACD32] hover:bg-[#8ab82b] rounded-md transition-colors cursor-pointer"
              title="Save (Enter)"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setTitle(initialTitle || "")
                setIsEditing(false)
              }}
              className="p-1.5 text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-md transition-colors cursor-pointer"
              title="Cancel (Esc)"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`inline-flex items-center gap-2 max-w-full ${className}`}>
      <button
        type="button"
        onClick={startEditing}
        className="text-left text-xs font-semibold text-white hover:text-[#9ACD32] transition-colors truncate cursor-pointer bg-transparent border-0 p-0"
        title="Click to rename this lesson"
      >
        {title || "Untitled Lesson"}
      </button>

      <button
        type="button"
        onClick={startEditing}
        className="text-[10px] text-zinc-400 hover:text-black hover:bg-[#9ACD32] flex items-center gap-1 bg-zinc-900 px-2 py-0.5 rounded-md border border-zinc-750 shrink-0 transition-all cursor-pointer font-medium"
        title={`Click to rename this ${entityType}`}
      >
        <Pencil className="w-2.5 h-2.5" />
        <span className="text-[9px] font-mono">Rename</span>
      </button>

      {errorMessage && (
        <span className="text-[10px] text-red-400 font-medium animate-pulse ml-1">
          {errorMessage}
        </span>
      )}
    </div>
  )
}
