"use client"

import Link from "next/link"
import { useState, useRef, useEffect } from "react"
import { Play } from "lucide-react"
import type { Project } from "@/lib/projects-data"
import { getMediaUrl } from "@/lib/utils"

interface CollageProjectCardProps {
  project: Project
  size?: "large" | "small"
}

export function CollageProjectCard({ project, size = "large" }: CollageProjectCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [videoFailed, setVideoFailed] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const playPromiseRef = useRef<Promise<void> | null>(null)
  const hasVideos = project.videos && project.videos.length > 0
  const imageIsVideo = project.image && (project.image.endsWith('.mp4') || project.image.endsWith('.avi') || project.image.endsWith('.mov') || project.image.endsWith('.webm'))
  
  const getBestVideo = (videos: string[]) => {
    const mp4Video = videos.find(v => v.endsWith('.mp4'))
    return mp4Video || videos[0]
  }
  
  const displayVideo = hasVideos && project.videos && !videoFailed ? getBestVideo(project.videos) : (imageIsVideo && !videoFailed ? project.image : null)
  const displayImage = !displayVideo ? project.image : null

  useEffect(() => {
    const video = videoRef.current
    if (!video || !displayVideo) return

    if (playPromiseRef.current) {
      playPromiseRef.current.catch(() => {})
      playPromiseRef.current = null
    }

    let isMounted = true

    const handlePlay = async () => {
      if (!isMounted || !video || !isHovered) return
      if (video.readyState < 2) return
      
      if (playPromiseRef.current) {
        playPromiseRef.current.catch(() => {})
        playPromiseRef.current = null
      }

      try {
        video.pause()
        await new Promise(resolve => setTimeout(resolve, 50))
        
        if (!isMounted || !isHovered) return
        
        const playPromise = video.play()
        if (playPromise !== undefined) {
          playPromiseRef.current = playPromise
          await playPromise
          playPromiseRef.current = null
        }
      } catch (error) {
        playPromiseRef.current = null
      }
    }

    const handleCanPlay = () => {
      if (isHovered && isMounted) {
        handlePlay()
      }
    }

    const handleLoadStart = () => {
      if (playPromiseRef.current) {
        playPromiseRef.current.catch(() => {})
        playPromiseRef.current = null
      }
      if (video) {
        video.pause()
      }
    }

    video.addEventListener('canplay', handleCanPlay)
    video.addEventListener('loadstart', handleLoadStart)

    if (video.readyState >= 2 && isHovered) {
      handlePlay()
    }

    return () => {
      isMounted = false
      video.removeEventListener('canplay', handleCanPlay)
      video.removeEventListener('loadstart', handleLoadStart)
      
      if (playPromiseRef.current) {
        playPromiseRef.current.catch(() => {})
        playPromiseRef.current = null
      }
      
      if (video) {
        video.pause()
        video.currentTime = 0
      }
    }
  }, [displayVideo, isHovered])

  const handleMouseEnter = () => {
    setIsHovered(true)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    const video = videoRef.current
    if (video) {
      if (playPromiseRef.current) {
        playPromiseRef.current.catch(() => {})
        playPromiseRef.current = null
      }
      video.pause()
      if (displayVideo) {
        video.currentTime = 0
      }
    }
  }

  const isLarge = size === "large"
  // Match the collage layout: small items are more square, large items have varied ratios
  const aspectRatio = isLarge ? "aspect-[3/2] md:aspect-[4/3]" : "aspect-[4/3] md:aspect-square"

  return (
    <Link href={`/projects/${project.id}`}>
      <div
        className={`group relative overflow-hidden bg-card cursor-pointer ${aspectRatio}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Project Image/Video */}
        <div className="relative w-full h-full overflow-hidden">
          {displayVideo ? (
            <>
              <video
                ref={videoRef}
                key={displayVideo}
                src={getMediaUrl(displayVideo)}
                className={`w-full h-full object-cover transition-transform duration-700 ${
                  isHovered ? "scale-110" : "scale-100"
                }`}
                muted
                loop
                playsInline
                preload="metadata"
                onError={(e) => {
                  console.warn('Video failed to load, falling back to cover image:', getMediaUrl(displayVideo || ''))
                  setVideoFailed(true)
                }}
              />
              <div className="absolute top-4 left-4 z-20 bg-black/60 backdrop-blur-sm rounded-full p-2 opacity-80">
                <Play className="text-white" size={16} fill="white" />
              </div>
            </>
          ) : (
            <img
              src={displayImage ? getMediaUrl(displayImage) : "/placeholder.svg"}
              alt={project.title}
              className={`w-full h-full object-cover transition-transform duration-700 ${
                isHovered ? "scale-110" : "scale-100"
              }`}
            />
          )}
          
          {/* Gradient Overlay - Removed dark overlay */}
          
          {/* Project Info Overlay */}
          <div className="absolute inset-0 flex flex-col justify-end p-6 z-10">
            <div className="mb-2">
              <span className="text-xs md:text-sm text-primary font-semibold bg-white/20 backdrop-blur-sm px-3 py-1 rounded-md">
                {project.category}
              </span>
            </div>
            <h3 className={`font-bold text-white leading-tight drop-shadow-2xl ${
              isLarge ? "text-2xl md:text-3xl lg:text-4xl" : "text-xl md:text-2xl"
            }`}>
              {project.title}
            </h3>
          </div>

          {/* Hover Arrow Indicator */}
          <div
            className={`absolute top-6 right-6 w-12 h-12 border-2 border-white/80 flex items-center justify-center transition-all duration-300 ${
              isHovered ? "opacity-100 rotate-0 scale-110" : "opacity-0 rotate-45 scale-100"
            }`}
          >
            <span className="text-white text-xl">→</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

