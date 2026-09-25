"use client"

import { useState, useRef, useEffect } from "react"
import { Play, Pause, Volume2, VolumeX, Maximize2, X, ChevronLeft, ChevronRight } from "lucide-react"
import { getMediaUrl } from "@/lib/utils"

interface VideoGalleryProps {
  videos: string[]
  title: string
}

export function VideoGallery({ videos, title: _title }: VideoGalleryProps) {
  const [selectedVideo, setSelectedVideo] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const openVideo = (index: number) => {
    setSelectedVideo(index)
    setIsPlaying(true)
    setIsMuted(false)
  }

  const closeVideo = () => {
    if (videoRef.current) {
      videoRef.current.pause()
    }
    setSelectedVideo(null)
    setIsPlaying(false)
    setIsFullscreen(false)
  }

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const goToPrevious = () => {
    if (selectedVideo !== null) {
      const newIndex = selectedVideo === 0 ? videos.length - 1 : selectedVideo - 1
      setSelectedVideo(newIndex)
      setIsPlaying(true)
      if (videoRef.current) {
        videoRef.current.currentTime = 0
        videoRef.current.play()
      }
    }
  }

  const goToNext = () => {
    if (selectedVideo !== null) {
      const newIndex = selectedVideo === videos.length - 1 ? 0 : selectedVideo + 1
      setSelectedVideo(newIndex)
      setIsPlaying(true)
      if (videoRef.current) {
        videoRef.current.currentTime = 0
        videoRef.current.play()
      }
    }
  }

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement && containerRef.current) {
      try {
        await containerRef.current.requestFullscreen()
        setIsFullscreen(true)
      } catch (error) {
        console.error("Error attempting to enable fullscreen:", error)
      }
    } else {
      try {
        await document.exitFullscreen()
        setIsFullscreen(false)
      } catch (error) {
        console.error("Error attempting to exit fullscreen:", error)
      }
    }
  }

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  const handleVideoEnd = () => {
    setIsPlaying(false)
    if (videoRef.current) {
      videoRef.current.currentTime = 0
    }
  }

  // Keyboard controls
  useEffect(() => {
    if (selectedVideo === null) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          closeVideo()
          break
        case "ArrowLeft":
          goToPrevious()
          break
        case "ArrowRight":
          goToNext()
          break
        case " ":
          e.preventDefault()
          togglePlayPause()
          break
        case "m":
        case "M":
          toggleMute()
          break
        case "f":
        case "F":
          toggleFullscreen()
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVideo])

  // Prevent body scroll when video is open
  useEffect(() => {
    if (selectedVideo !== null) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [selectedVideo])

  // Auto-play when video opens
  useEffect(() => {
    if (selectedVideo !== null && videoRef.current && isPlaying) {
      videoRef.current.play().catch(() => {
        // Autoplay failed, user interaction required
        setIsPlaying(false)
      })
    }
  }, [selectedVideo, isPlaying])

  return (
    <>
      {/* Video Grid - Thumbnail Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {videos.map((video, index) => (
          <button
            key={index}
            onClick={() => openVideo(index)}
            className="relative aspect-video overflow-hidden bg-card group cursor-pointer transition-all duration-300 hover:shadow-2xl rounded-lg"
          >
            <video
              src={getMediaUrl(video)}
              className="w-full h-full object-cover"
              muted
              loop
              playsInline
              preload="metadata"
              onError={(e) => {
                console.error('Video failed to load:', video)
                const target = e.currentTarget as HTMLVideoElement
                target.style.display = 'none'
                const parent = target.parentElement
                if (parent) {
                  const errorDiv = document.createElement('div')
                  errorDiv.className = 'absolute inset-0 flex items-center justify-center bg-secondary text-muted-foreground'
                  errorDiv.textContent = 'Video not available'
                  parent.appendChild(errorDiv)
                }
              }}
              onMouseEnter={(e) => {
                const target = e.currentTarget as HTMLVideoElement
                target.play().catch(() => {
                  // Autoplay failed, that's okay
                })
              }}
              onMouseLeave={(e) => {
                const target = e.currentTarget as HTMLVideoElement
                target.pause()
                target.currentTime = 0
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="bg-primary/30 backdrop-blur-sm rounded-full p-6 transform group-hover:scale-110 transition-transform">
                <Play className="text-white" size={48} fill="white" />
              </div>
            </div>
            {/* Video number badge */}
            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm rounded-full px-4 py-2 text-white text-sm font-medium">
              Video {index + 1}
            </div>
          </button>
        ))}
      </div>

      {/* Full-Screen Video Modal */}
      {selectedVideo !== null && (
        <div
          className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeVideo()
            }
          }}
        >
          {/* Close Button */}
          <button
            onClick={closeVideo}
            className="absolute top-6 right-6 text-white hover:text-primary transition-colors z-50 bg-black/50 backdrop-blur-sm rounded-full p-3 hover:bg-black/70"
            aria-label="Close"
          >
            <X size={24} />
          </button>

          {/* Navigation Buttons */}
          {videos.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-6 top-1/2 -translate-y-1/2 text-white hover:text-primary transition-colors z-50 bg-black/50 backdrop-blur-sm rounded-full p-4 hover:bg-black/70"
                aria-label="Previous video"
              >
                <ChevronLeft size={32} />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-6 top-1/2 -translate-y-1/2 text-white hover:text-primary transition-colors z-50 bg-black/50 backdrop-blur-sm rounded-full p-4 hover:bg-black/70"
                aria-label="Next video"
              >
                <ChevronRight size={32} />
              </button>
            </>
          )}

          {/* Video Container */}
          <div
            ref={containerRef}
            className="relative w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <video
              ref={videoRef}
              src={getMediaUrl(videos[selectedVideo])}
              className="max-w-full max-h-full object-contain"
              controls={false}
              onEnded={handleVideoEnd}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onError={(e) => {
                console.error('Video failed to load:', videos[selectedVideo])
                const target = e.currentTarget as HTMLVideoElement
                target.style.display = 'none'
                const container = containerRef.current
                if (container) {
                  const errorDiv = document.createElement('div')
                  errorDiv.className = 'text-white text-center p-8'
                  errorDiv.innerHTML = '<p>Video not available</p><p className="text-sm text-gray-400 mt-2">' + videos[selectedVideo] + '</p>'
                  container.appendChild(errorDiv)
                }
              }}
              autoPlay
              playsInline
            />

            {/* Custom Video Controls Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6">
              <div className="container mx-auto flex items-center justify-center gap-4">
                {/* Play/Pause Button */}
                <button
                  onClick={togglePlayPause}
                  className="text-white hover:text-primary transition-colors bg-black/50 backdrop-blur-sm rounded-full p-3 hover:bg-black/70"
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <Pause size={24} /> : <Play size={24} fill="white" />}
                </button>

                {/* Mute/Unmute Button */}
                <button
                  onClick={toggleMute}
                  className="text-white hover:text-primary transition-colors bg-black/50 backdrop-blur-sm rounded-full p-3 hover:bg-black/70"
                  aria-label={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                </button>

                {/* Fullscreen Button */}
                <button
                  onClick={toggleFullscreen}
                  className="text-white hover:text-primary transition-colors bg-black/50 backdrop-blur-sm rounded-full p-3 hover:bg-black/70"
                  aria-label="Fullscreen"
                >
                  <Maximize2 size={24} />
                </button>
              </div>
            </div>
          </div>

          {/* Video Counter & Info */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white bg-black/50 backdrop-blur-sm rounded-full px-6 py-3 z-50 mb-20">
            <div className="text-sm font-medium">
              {selectedVideo + 1} / {videos.length}
            </div>
          </div>

          {/* Keyboard Shortcuts Hint */}
          <div className="absolute bottom-6 right-6 text-white/60 text-xs bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2 z-50 hidden md:block mb-20">
            <div>← → Navigate</div>
            <div>Space Play/Pause</div>
            <div>M Mute</div>
            <div>F Fullscreen</div>
            <div>ESC Close</div>
          </div>
        </div>
      )}
    </>
  )
}

