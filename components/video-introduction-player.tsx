"use client"

import { useState } from "react"
import { Play } from "lucide-react"

interface VideoIntroductionPlayerProps {
  introductionUrl: string
  thumbnailUrl?: string
  title: string
}

function getEmbedUrl(url: string | undefined | null): string | null {
  if (!url) return null
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    let videoId = ""
    if (url.includes("youtube.com/watch")) {
      const match = url.match(/[?&]v=([^&#]+)/)
      videoId = match ? match[1] : ""
    } else if (url.includes("youtu.be/")) {
      const parts = url.split("youtu.be/")
      const lastPart = parts[parts.length - 1]
      videoId = lastPart.split(/[?#]/)[0]
    } else if (url.includes("youtube.com/embed/")) {
      const parts = url.split("youtube.com/embed/")
      const lastPart = parts[parts.length - 1]
      videoId = lastPart.split(/[?#]/)[0]
    }
    // Autoplay query parameter for YouTube iframe
    return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : null
  }

  if (url.includes("vimeo.com")) {
    const match = url.match(/vimeo\.com\/(\d+)/)
    const videoId = match ? match[1] : ""
    // Autoplay query parameter for Vimeo iframe
    return videoId ? `https://player.vimeo.com/video/${videoId}?autoplay=1` : null
  }

  return null
}

export function VideoIntroductionPlayer({
  introductionUrl,
  thumbnailUrl,
  title
}: VideoIntroductionPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const embedUrl = getEmbedUrl(introductionUrl)

  const handlePlay = () => {
    setIsPlaying(true)
  }

  if (isPlaying) {
    return (
      <div className="w-full h-full relative">
        {embedUrl ? (
          <iframe
            src={embedUrl}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <video
            src={introductionUrl}
            controls
            autoPlay
            preload="metadata"
            className="w-full h-full object-contain"
          />
        )}
      </div>
    )
  }

  return (
    <div 
      onClick={handlePlay}
      className="group w-full h-full cursor-pointer relative overflow-hidden bg-black/40 flex items-center justify-center transition-all duration-300"
    >
      {thumbnailUrl ? (
        <img 
          src={thumbnailUrl} 
          alt={`${title} Preview`}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-60 group-hover:opacity-75"
        />
      ) : (
        <div className="absolute inset-0 bg-zinc-950" />
      )}
      
      {/* Play button overlay */}
      <div className="relative z-10 w-16 h-16 rounded-full bg-[#9ACD32] flex items-center justify-center shadow-lg transform transition-all duration-300 group-hover:scale-110 group-hover:bg-[#a6db37] hover:shadow-[#9ACD32]/25">
        <Play className="w-7 h-7 text-black fill-black ml-1" />
      </div>
    </div>
  )
}
