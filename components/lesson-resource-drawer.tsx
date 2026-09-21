"use client"

import * as React from "react"
import { 
  Download, 
  FileText, 
  Archive, 
  Box, 
  Image as ImageIcon, 
  File, 
  ExternalLink,
  Sparkles,
  FolderArchive
} from "lucide-react"
import { LessonResource, ResourceFileType } from "@/lib/courses-data"

interface LessonResourceDrawerProps {
  resources?: LessonResource[] | null
  fallbackUrl?: string | null
  lessonTitle?: string
}

function getResourceIcon(type: ResourceFileType | string) {
  switch (type.toLowerCase()) {
    case 'archive':
    case 'zip':
    case 'rar':
      return <Archive className="w-4 h-4 text-amber-400" />
    case 'pdf':
    case 'doc':
      return <FileText className="w-4 h-4 text-rose-400" />
    case 'preset':
    case '3d_model':
    case 'model':
      return <Box className="w-4 h-4 text-[#9ACD32]" />
    case 'image':
    case 'texture':
      return <ImageIcon className="w-4 h-4 text-sky-400" />
    default:
      return <File className="w-4 h-4 text-zinc-400" />
  }
}

function getResourceTypeBadge(type: ResourceFileType | string) {
  switch (type.toLowerCase()) {
    case 'archive':
    case 'zip':
    case 'rar':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    case 'pdf':
      return 'bg-rose-500/10 text-rose-400 border-rose-500/20'
    case 'preset':
    case '3d_model':
      return 'bg-[#9ACD32]/10 text-[#9ACD32] border-[#9ACD32]/20'
    case 'image':
      return 'bg-sky-500/10 text-sky-400 border-sky-500/20'
    default:
      return 'bg-zinc-800 text-zinc-400 border-zinc-700'
  }
}

export function LessonResourceDrawer({ resources, fallbackUrl, lessonTitle }: LessonResourceDrawerProps) {
  const hasResourcesList = Array.isArray(resources) && resources.length > 0
  const hasFallback = Boolean(fallbackUrl)

  if (!hasResourcesList && !hasFallback) {
    return null
  }

  // Calculate total size if multiple resources exist
  const totalSizeMB = hasResourcesList 
    ? resources.reduce((acc, item) => acc + (Number(item.file_size_mb) || 0), 0)
    : 0

  return (
    <div className="border-t border-zinc-850 pt-5 space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#9ACD32]/10 border border-[#9ACD32]/20 flex items-center justify-center">
            <Download className="w-4 h-4 text-primary" style={{ color: '#9ACD32' }} />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-200">
              Lesson Attachments & Resources
            </h3>
            <p className="text-[11px] text-zinc-500">
              Download project files, presets, and reference guides for this module.
            </p>
          </div>
        </div>

        {hasResourcesList && totalSizeMB > 0 && (
          <span className="text-[10px] text-zinc-400 font-mono bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-md self-start sm:self-auto">
            {resources.length} file{resources.length > 1 ? 's' : ''} ({totalSizeMB.toFixed(1)} MB total)
          </span>
        )}
      </div>

      {/* Grid of Resource Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {hasResourcesList ? (
          resources.map((item, idx) => (
            <div 
              key={item.resource_id || idx}
              className="p-3.5 bg-zinc-900/50 border border-zinc-850 rounded-xl flex items-center justify-between group hover:border-[#9ACD32]/40 transition-all backdrop-blur-sm shadow-sm"
            >
              <div className="flex items-center gap-3 truncate pr-3">
                {/* File Type Icon Container */}
                <div className="w-10 h-10 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center shrink-0 group-hover:border-[#9ACD32]/30 transition-colors">
                  {getResourceIcon(item.file_type)}
                </div>

                <div className="truncate space-y-0.5">
                  <h4 className="text-xs font-semibold text-white truncate group-hover:text-[#9ACD32] transition-colors">
                    {item.title}
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] uppercase font-mono font-bold px-1.5 py-0.2 rounded border ${getResourceTypeBadge(item.file_type)}`}>
                      {item.file_type}
                    </span>
                    {item.file_size_mb > 0 && (
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {item.file_size_mb} MB
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <a 
                href={item.download_url} 
                target="_blank" 
                rel="noreferrer"
                download
                className="p-2.5 rounded-lg bg-[#9ACD32]/10 text-[#9ACD32] border border-[#9ACD32]/20 hover:bg-[#9ACD32] hover:text-black transition-all shrink-0 flex items-center gap-1.5 text-xs font-semibold"
                title={`Download ${item.title}`}
              >
                <Download className="w-4 h-4" />
                <span className="hidden xl:inline">Download</span>
              </a>
            </div>
          ))
        ) : fallbackUrl ? (
          /* Fallback Single Download Card */
          <div className="col-span-full p-3.5 bg-zinc-900/50 border border-zinc-850 rounded-xl flex items-center justify-between group hover:border-zinc-700 transition-colors">
            <div className="flex items-center gap-3 truncate pr-3">
              <div className="w-10 h-10 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center shrink-0">
                <FolderArchive className="w-4 h-4 text-[#9ACD32]" />
              </div>
              <div className="truncate">
                <h4 className="text-xs font-semibold text-white truncate">
                  {decodeURIComponent(fallbackUrl.split('/').pop() || "Lesson Attachment / Resources")}
                </h4>
                <p className="text-[10px] text-zinc-500">Attached Resource File for {lessonTitle || "Module"}</p>
              </div>
            </div>

            <a 
              href={fallbackUrl} 
              target="_blank" 
              rel="noreferrer"
              download
              className="p-2.5 rounded-lg bg-[#9ACD32]/10 text-[#9ACD32] border border-[#9ACD32]/20 hover:bg-[#9ACD32] hover:text-black transition-all shrink-0 flex items-center gap-1.5 text-xs font-semibold"
            >
              <Download className="w-4 h-4" />
              <span>Download Attachment</span>
            </a>
          </div>
        ) : null}
      </div>
    </div>
  )
}
