"use client"

import { useState, useEffect, useRef } from "react"
import { Project } from "@/lib/projects-data"
import { getMediaUrl } from "@/lib/utils"

interface ProjectHeroMediaProps {
  project: Project
}

// Helper function to check if a path is a video file
function isVideoFile(path: string): boolean {
  if (!path) return false
  const videoExtensions = ['.mp4', '.avi', '.mov', '.webm', '.mkv', '.m4v']
  return videoExtensions.some(ext => path.toLowerCase().endsWith(ext))
}

export function ProjectHeroMedia({ project }: ProjectHeroMediaProps) {
  const [imageError, setImageError] = useState(false)
  const [videoError, setVideoError] = useState(false)
  const [videoLoaded, setVideoLoaded] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Reset errors when project changes
  useEffect(() => {
    setImageError(false)
    setVideoError(false)
    setVideoLoaded(false)
  }, [project.id])

  // Determine which media to display
  // Priority: 1. videos array, 2. image field (check if it's a video), 3. image field (as image)
  const videoSource = project.videos && project.videos.length > 0 
    ? project.videos[0] 
    : (project.image && isVideoFile(project.image) ? project.image : null)
  
  const imageSource = project.image && !isVideoFile(project.image) 
    ? project.image 
    : null

  // Handle video playback with proper promise handling
  useEffect(() => {
    const video = videoRef.current
    if (!video || !videoSource || videoError) return

    const handlePlay = async () => {
      try {
        // Wait for video to be ready
        if (video.readyState >= 2) {
          const playPromise = video.play()
          if (playPromise !== undefined) {
            await playPromise
          }
        }
      } catch (error) {
        // Autoplay was prevented, this is normal in some browsers
        // Silently handle the error
        console.log('Autoplay prevented or interrupted:', error)
      }
    }

    const handleCanPlay = () => {
      setVideoLoaded(true)
      handlePlay()
    }

    const handleLoadedMetadata = () => {
      handlePlay()
    }

    video.addEventListener('canplay', handleCanPlay)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)

    // Try to play if video is already loaded
    if (video.readyState >= 2) {
      handlePlay()
    }

    return () => {
      video.removeEventListener('canplay', handleCanPlay)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      // Pause and reset video when component unmounts or source changes
      if (video) {
        video.pause()
        video.currentTime = 0
      }
    }
  }, [videoSource, videoError])

  // If video fails, try to fallback to first image from images array or gallery
  const fallbackImage = !videoSource && !imageSource && project.images && project.images.length > 0
    ? project.images[0]
    : (project.gallery && project.gallery.exterior && project.gallery.exterior.length > 0
      ? project.gallery.exterior[0]
      : null)

  return (
    <div className="relative w-full min-h-full flex items-center justify-center" style={{ padding: '0' }}>
      {videoSource && !videoError ? (
        <video
          ref={videoRef}
          key={videoSource} // Force re-render when source changes
          src={getMediaUrl(videoSource)}
          className="block"
          style={{
            maxWidth: '100vw',
            maxHeight: '100vh',
            width: 'auto',
            height: 'auto',
            objectFit: 'contain'
          }}
          loop
          muted
          playsInline
          controls={false}
          preload="auto"
          onError={(e) => {
            console.error('Video failed to load:', getMediaUrl(videoSource))
            console.error('Original path:', videoSource)
            console.error('Video error details:', e)
            setVideoError(true)
          }}
        >
          <source src={getMediaUrl(videoSource)} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      ) : imageSource && !imageError ? (
        <img 
          src={getMediaUrl(imageSource)} 
          alt={project.title} 
          className="block"
          style={{
            maxWidth: '100vw',
            maxHeight: '100vh',
            width: 'auto',
            height: 'auto',
            objectFit: 'contain'
          }}
          loading="eager"
          onError={() => {
            console.error('Image failed to load:', getMediaUrl(imageSource))
            setImageError(true)
          }}
        />
      ) : fallbackImage ? (
        <img 
          src={getMediaUrl(fallbackImage)} 
          alt={project.title} 
          className="block"
          style={{
            maxWidth: '100vw',
            maxHeight: '100vh',
            width: 'auto',
            height: 'auto',
            objectFit: 'contain'
          }}
          loading="eager"
        />
      ) : (
        <div className="w-full min-h-screen flex items-center justify-center bg-secondary">
          <div className="text-center">
            <p className="text-muted-foreground text-lg mb-2">Media not available</p>
            <p className="text-muted-foreground/60 text-sm">Please check the file path</p>
            {videoSource && (
              <p className="text-muted-foreground/40 text-xs mt-2">Path: {videoSource}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}


