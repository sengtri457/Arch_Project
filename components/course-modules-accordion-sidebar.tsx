"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Search, ChevronDown, ChevronUp, CheckCircle, CheckCircle2, Circle, Play } from "lucide-react"
import { CourseModule, Lesson, getLessonCoverImage } from "@/lib/courses-data"
import { getMediaUrl } from "@/lib/utils"

interface CourseModulesAccordionSidebarProps {
  modules: CourseModule[]
  currentLessonId?: string | null
  currentModuleId?: string | null
  onSelectLesson: (lesson: Lesson, module: CourseModule) => void
  progressList?: { lesson_id: string; is_completed?: boolean }[]
  slug: string
  courseTitle?: string
}

export function CourseModulesAccordionSidebar({
  modules,
  currentLessonId,
  currentModuleId,
  onSelectLesson,
  progressList = [],
  slug,
  courseTitle
}: CourseModulesAccordionSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({})

  // Find active module ID from currentLessonId or currentModuleId
  useEffect(() => {
    if (!modules || modules.length === 0) return

    let activeModId: string | null = null

    if (currentLessonId) {
      for (const mod of modules) {
        if (mod.lessons?.some((l) => l.lesson_id === currentLessonId || (l as any).id === currentLessonId)) {
          activeModId = mod.module_id || String(mod.order_index)
          break
        }
      }
    }

    if (!activeModId && currentModuleId) {
      const matchedMod = modules.find(
        (m, idx) =>
          m.module_id === currentModuleId ||
          m.lesson_id === currentModuleId ||
          String(m.order_index) === currentModuleId ||
          String(idx + 1) === currentModuleId
      )
      if (matchedMod) {
        activeModId = matchedMod.module_id || String(matchedMod.order_index)
      }
    }

    // Default to expanding active module, or first module if none expanded yet
    if (activeModId) {
      setExpandedModules((prev) => ({
        ...prev,
        [activeModId!]: true
      }))
    } else if (modules[0]) {
      const firstId = modules[0].module_id || String(modules[0].order_index)
      setExpandedModules((prev) => ({
        ...prev,
        [firstId]: true
      }))
    }
  }, [currentLessonId, currentModuleId, modules])

  const toggleModule = (modId: string) => {
    setExpandedModules((prev) => ({
      ...prev,
      [modId]: !prev[modId]
    }))
  }

  // Filter modules/lessons by searchQuery
  const filteredModules = modules.map((mod) => {
    if (!searchQuery.trim()) return mod
    const q = searchQuery.toLowerCase()

    const titleMatches = mod.title.toLowerCase().includes(q) || mod.module_number.toLowerCase().includes(q)
    const matchingLessons = (mod.lessons || []).filter((l) => l.title.toLowerCase().includes(q))

    if (titleMatches || matchingLessons.length > 0) {
      return {
        ...mod,
        lessons: titleMatches ? mod.lessons : matchingLessons
      }
    }
    return null
  }).filter(Boolean) as CourseModule[]

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 flex flex-col sticky top-24 backdrop-blur-md shadow-xl">
      {/* Search Content Input Header */}
      <div className="relative mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search content"
          className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl py-2.5 pl-4 pr-10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition-colors"
        />
        <Search className="w-4 h-4 text-zinc-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>

      {/* Accordions Container */}
      <div className="space-y-3">
        {filteredModules.length === 0 ? (
          <div className="text-center py-10 text-xs text-zinc-500">
            No matching content found.
          </div>
        ) : (
          filteredModules.map((mod, idx) => {
            const modId = mod.module_id || String(mod.order_index || idx + 1)
            const isExpanded = Boolean(expandedModules[modId] || (searchQuery.trim().length > 0))
            const lessons = mod.lessons || []

            // Calculate module completion
            const totalLessons = lessons.length
            const completedCount = lessons.filter((l) =>
              progressList.some((p) => p.lesson_id === l.lesson_id && p.is_completed)
            ).length

            const completionPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0
            const isFullyCompleted = totalLessons > 0 && completedCount === totalLessons

            const moduleNumBadge = String(mod.order_index || idx + 1)

            return (
              <div
                key={modId}
                className="border border-zinc-850/80 bg-zinc-900/30 rounded-xl overflow-hidden transition-colors"
              >
                {/* Module Header Button */}
                <button
                  type="button"
                  onClick={() => toggleModule(modId)}
                  className="w-full text-left p-3.5 flex items-start justify-between gap-3 hover:bg-zinc-850/40 transition-colors group"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-grow">
                    {/* Module Index Badge */}
                    <div className="w-7 h-7 rounded-full bg-zinc-850 border border-zinc-700/60 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-bold font-mono text-zinc-300">
                        {moduleNumBadge}
                      </span>
                    </div>

                    <div className="min-w-0 flex-grow space-y-1.5">
                      {/* Title */}
                      <h3 className="text-xs font-bold text-white group-hover:text-[#9ACD32] transition-colors leading-snug break-words">
                        {mod.title}
                      </h3>

                      {/* Progress indicator */}
                      <div className="flex items-center gap-2">
                        {isFullyCompleted ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            Completed
                          </span>
                        ) : (
                          <div className="flex items-center gap-2 w-full max-w-[140px]">
                            <span className="text-[10px] font-mono font-semibold text-zinc-400 shrink-0">
                              {completionPercent}%
                            </span>
                            <div className="h-1.5 flex-grow rounded-full bg-zinc-800 overflow-hidden">
                              <div
                                className="h-full bg-[#9ACD32] rounded-full transition-all duration-300"
                                style={{ width: `${completionPercent}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expand/Collapse Chevron */}
                  <div className="shrink-0 text-zinc-400 group-hover:text-white pt-1">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </button>

                {/* Module Body Lessons List */}
                {isExpanded && (
                  <div className="p-2 pt-0 space-y-2 border-t border-zinc-850/50 bg-black/40">
                    {lessons.length === 0 ? (
                      <div className="p-3 text-[11px] text-zinc-500 italic text-center">
                        No lessons in this module yet.
                      </div>
                    ) : (
                      lessons.map((lesson, lIdx) => {
                        const isSelected =
                          currentLessonId === lesson.lesson_id ||
                          currentLessonId === (lesson as any).id ||
                          (lIdx === 0 && !currentLessonId && modId === currentModuleId)

                        const isCompleted = progressList.some(
                          (p) => p.lesson_id === lesson.lesson_id && p.is_completed
                        )

                        const coverUrl = getLessonCoverImage(slug, lesson, lIdx, mod.cover_image)

                        const durationStr = lesson.duration_minutes
                          ? `${lesson.duration_minutes}m`
                          : (lesson as any).duration
                          ? `${Math.floor((lesson as any).duration / 60)}m`
                          : "0m"

                        return (
                          <button
                            key={lesson.lesson_id || lIdx}
                            type="button"
                            onClick={() => onSelectLesson(lesson, mod)}
                            className={`w-full text-left p-2.5 rounded-xl border transition-all duration-200 flex items-start gap-3 group relative ${
                              isSelected
                                ? "bg-zinc-900 border-[#9ACD32]/80 text-white shadow-md"
                                : "bg-zinc-950/60 border-zinc-850/60 text-zinc-400 hover:border-zinc-700 hover:text-white hover:bg-zinc-900/50"
                            }`}
                          >
                            {/* Lesson Thumbnail & Playing Overlay */}
                            <div className="w-16 h-10 rounded-lg overflow-hidden bg-black border border-zinc-800 shrink-0 relative mt-0.5">
                              <img
                                src={getMediaUrl(coverUrl)}
                                alt={lesson.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />

                              {isSelected ? (
                                <div className="absolute inset-0 bg-black/75 flex items-center justify-center p-0.5">
                                  <div className="flex items-center gap-1 bg-[#9ACD32] text-black text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow">
                                    <Play className="w-2.5 h-2.5 fill-black" />
                                    <span>Playing</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="absolute bottom-1 right-1 bg-black/80 px-1 py-0.2 rounded text-[9px] font-mono text-zinc-300">
                                  {durationStr}
                                </div>
                              )}
                            </div>

                            {/* Lesson Details */}
                            <div className="flex-grow min-w-0 space-y-1">
                              <h4
                                className={`text-xs font-semibold leading-snug break-words ${
                                  isSelected ? "text-[#9ACD32]" : "text-zinc-200 group-hover:text-white"
                                }`}
                              >
                                {lesson.title}
                              </h4>

                              <div className="flex items-center gap-2 flex-wrap pt-0.5">
                                {isSelected && (
                                  <span className="text-[9px] uppercase font-black px-1.5 py-0.2 rounded bg-[#9ACD32]/20 text-[#9ACD32] border border-[#9ACD32]/40 shrink-0">
                                    Playing now
                                  </span>
                                )}
                                <span className="text-[10px] text-zinc-500 font-mono">
                                  {durationStr}
                                </span>
                                {lesson.is_preview && (
                                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                    Preview
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Completion Status Icon */}
                            <div className="shrink-0 mt-0.5">
                              {isCompleted ? (
                                <CheckCircle className="w-4 h-4 text-[#9ACD32] fill-[#9ACD32]/10" />
                              ) : isSelected ? (
                                <Play className="w-3.5 h-3.5 text-[#9ACD32] fill-current" />
                              ) : (
                                <Circle className="w-3.5 h-3.5 text-zinc-700 group-hover:text-zinc-500 transition-colors" />
                              )}
                            </div>
                          </button>
                        )
                      })
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
