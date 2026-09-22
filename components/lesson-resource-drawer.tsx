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
  FolderArchive,
  Send
} from "lucide-react"
import { LessonResource, ResourceFileType } from "@/lib/courses-data"

interface LessonResourceDrawerProps {
  resources?: LessonResource[] | null
  fallbackUrl?: string | null
  lessonTitle?: string
}

export function isTelegramUrl(url?: string | null): boolean {
  if (!url) return false
  const lower = url.toLowerCase()
  return lower.includes('t.me') || lower.includes('telegram.org') || lower.includes('telegram.me')
}

function getResourceIcon(type: ResourceFileType | string, url?: string) {
  if (type === 'telegram' || isTelegramUrl(url)) {
    return <Send className="w-4 h-4 text-[#229ED9]" />
  }
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

function getResourceTypeBadge(type: ResourceFileType | string, url?: string) {
  if (type === 'telegram' || isTelegramUrl(url)) {
    return 'bg-[#229ED9]/15 text-[#229ED9] border-[#229ED9]/30 font-bold'
  }
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

  const isFallbackTelegram = isTelegramUrl(fallbackUrl)

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
            {isFallbackTelegram ? (
              <Send className="w-4 h-4 text-[#229ED9]" />
            ) : (
              <Download className="w-4 h-4 text-primary" style={{ color: '#9ACD32' }} />
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-2">
              Lesson Attachments & Resources
              {isFallbackTelegram && (
                <span className="text-[10px] lowercase font-normal bg-[#229ED9]/15 text-[#229ED9] border border-[#229ED9]/30 px-2 py-0.5 rounded-full">
                  via Telegram
                </span>
              )}
            </h3>
            <p className="text-[11px] text-zinc-500">
              {isFallbackTelegram 
                ? "Access project files, .rar/.zip models, and resources directly on our Telegram channel."
                : "Download project files, presets, and reference guides for this module."
              }
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
        {/* 1. Primary Admin Link / File (fallbackUrl) */}
        {hasFallback && (
          <div className={`col-span-full p-4 bg-zinc-900/60 border ${isFallbackTelegram ? 'border-[#229ED9]/40 bg-[#229ED9]/5' : 'border-zinc-850 hover:border-[#9ACD32]/40'} rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group transition-colors`}>
            <div className="flex items-center gap-3 truncate pr-3">
              <div className={`w-11 h-11 rounded-xl ${isFallbackTelegram ? 'bg-[#229ED9]/15 border-[#229ED9]/30' : 'bg-zinc-950 border-zinc-800'} border flex items-center justify-center shrink-0`}>
                {isFallbackTelegram ? (
                  <Send className="w-5 h-5 text-[#229ED9]" />
                ) : (
                  <FolderArchive className="w-5 h-5 text-[#9ACD32]" />
                )}
              </div>
              <div className="truncate">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-white truncate">
                    {isFallbackTelegram 
                      ? "Private Telegram Resource Channel"
                      : decodeURIComponent(fallbackUrl!.split('/').pop() || "Lesson Attachment / Resources")
                    }
                  </h4>
                  {isFallbackTelegram && (
                    <span className="text-[9px] uppercase font-mono font-bold px-2 py-0.5 rounded border bg-[#229ED9]/15 text-[#229ED9] border-[#229ED9]/30">
                      Telegram
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  {isFallbackTelegram 
                    ? `Join channel to download .rar, .zip & 3D models for ${lessonTitle || "this lesson"}`
                    : `Attached Resource File for ${lessonTitle || "Module"}`
                  }
                </p>
              </div>
            </div>

            <a 
              href={fallbackUrl!} 
              target="_blank" 
              rel="noreferrer"
              {...(!isFallbackTelegram ? { download: true } : {})}
              className={`px-4 py-2.5 rounded-xl shrink-0 flex items-center justify-center gap-2 text-xs font-bold transition-all w-full sm:w-auto ${
                isFallbackTelegram
                  ? 'bg-[#229ED9] text-white hover:bg-[#1d88bc] shadow-md shadow-[#229ED9]/25'
                  : 'bg-[#9ACD32]/10 text-[#9ACD32] border border-[#9ACD32]/20 hover:bg-[#9ACD32] hover:text-black'
              }`}
            >
              {isFallbackTelegram ? (
                <>
                  <Send className="w-4 h-4" />
                  <span>Open Telegram Channel</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download Attachment</span>
                </>
              )}
            </a>
          </div>
        )}

        {/* 2. Additional Resource Items (if any) */}
        {hasResourcesList && resources.map((item, idx) => {
          const isItemTelegram = item.file_type === 'telegram' || isTelegramUrl(item.download_url)
          return (
            <div 
              key={item.resource_id || idx}
              className={`p-3.5 bg-zinc-900/50 border ${isItemTelegram ? 'border-[#229ED9]/30 hover:border-[#229ED9]' : 'border-zinc-850 hover:border-[#9ACD32]/40'} rounded-xl flex items-center justify-between group transition-all backdrop-blur-sm shadow-sm`}
            >
              <div className="flex items-center gap-3 truncate pr-3">
                {/* File Type Icon Container */}
                <div className={`w-10 h-10 rounded-lg ${isItemTelegram ? 'bg-[#229ED9]/10 border-[#229ED9]/30' : 'bg-zinc-950 border-zinc-800'} border flex items-center justify-center shrink-0 transition-colors`}>
                  {getResourceIcon(item.file_type, item.download_url)}
                </div>

                <div className="truncate space-y-0.5">
                  <h4 className="text-xs font-semibold text-white truncate group-hover:text-[#9ACD32] transition-colors">
                    {item.title}
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] uppercase font-mono px-1.5 py-0.2 rounded border ${getResourceTypeBadge(item.file_type, item.download_url)}`}>
                      {isItemTelegram ? 'TELEGRAM' : item.file_type}
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
                {...(!isItemTelegram ? { download: true } : {})}
                className={`p-2.5 rounded-lg shrink-0 flex items-center gap-1.5 text-xs font-semibold transition-all ${
                  isItemTelegram
                    ? 'bg-[#229ED9] text-white hover:bg-[#1d88bc] shadow-sm shadow-[#229ED9]/20'
                    : 'bg-[#9ACD32]/10 text-[#9ACD32] border border-[#9ACD32]/20 hover:bg-[#9ACD32] hover:text-black'
                }`}
                title={isItemTelegram ? `Open ${item.title} on Telegram` : `Download ${item.title}`}
              >
                {isItemTelegram ? <Send className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                <span className="hidden xl:inline">{isItemTelegram ? 'Telegram' : 'Download'}</span>
              </a>
            </div>
          )
        })}
      </div>
    </div>
  )
}
