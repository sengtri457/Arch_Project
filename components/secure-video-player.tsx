"use client"

import { useState, useEffect, useRef } from "react"
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw } from "lucide-react"

interface SecureVideoPlayerProps {
  videoUrl: string
  userEmail: string
  userId: string
  onTimeUpdate?: (currentTime: number, duration: number) => void
  onEnded?: () => void
}

export function SecureVideoPlayer({
  videoUrl,
  userEmail,
  userId,
  onTimeUpdate,
  onEnded
}: SecureVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  
  // Watermark States
  const [watermarkPos, setWatermarkPos] = useState({ top: "20%", left: "20%" })
  
  // Player Controls States
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)

  // Floating Watermark Position Loop
  useEffect(() => {
    const moveWatermark = () => {
      // Calculate random percentages leaving a margin so it doesn't clip off the screen edge
      const randomTop = Math.floor(Math.random() * 70) + 10 // 10% to 80%
      const randomLeft = Math.floor(Math.random() * 60) + 10 // 10% to 70%
      setWatermarkPos({
        top: `${randomTop}%`,
        left: `${randomLeft}%`
      })
    }

    // Move watermark immediately, then repeat every 12 seconds
    moveWatermark()
    const interval = setInterval(moveWatermark, 12000)
    return () => clearInterval(interval)
  }, [])

  // Video Time & Progress Updates
  const handleTimeUpdate = () => {
    if (!videoRef.current) return
    const current = videoRef.current.currentTime
    const total = videoRef.current.duration || 0
    setCurrentTime(current)
    if (onTimeUpdate) {
      onTimeUpdate(current, total)
    }
  }

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return
    setDuration(videoRef.current.duration || 0)
  }

  // Playback Control Handlers
  const togglePlay = () => {
    if (!videoRef.current) return
    if (isPlaying) {
      videoRef.current.pause()
      setIsPlaying(false)
    } else {
      videoRef.current.play().then(() => {
        setIsPlaying(true)
      }).catch(err => console.error("Error playing video:", err))
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return
    const newTime = parseFloat(e.target.value)
    videoRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return
    const newVolume = parseFloat(e.target.value)
    videoRef.current.volume = newVolume
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    if (!videoRef.current) return
    const newMuteState = !isMuted
    videoRef.current.muted = newMuteState
    setIsMuted(newMuteState)
  }

  const handleFullscreen = () => {
    if (!videoRef.current) return
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen()
    }
  }

  // Format seconds to MM:SS
  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds)) return "0:00"
    const minutes = Math.floor(timeInSeconds / 60)
    const seconds = Math.floor(timeInSeconds % 60)
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`
  }

  return (
    <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden group border border-zinc-800">
      
      {/* 1. Dynamic Floating Anti-Piracy Watermark */}
      <div 
        className="absolute z-20 pointer-events-none select-none text-white/10 text-xs sm:text-sm font-semibold tracking-wider transition-all duration-1000 ease-in-out bg-black/20 backdrop-blur-[1px] px-3 py-1.5 rounded"
        style={{
          top: watermarkPos.top,
          left: watermarkPos.left,
          textShadow: "1px 1px 2px rgba(0,0,0,0.8)"
        }}
      >
        {userEmail} ({userId.substring(0, 8)})
      </div>

      {/* 2. Video Player Element */}
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full object-contain cursor-pointer"
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={onEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        playsInline
      />

      {/* 3. Custom Controller Bar UI */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 space-y-3">
        
        {/* Timeline Slider */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-zinc-300">{formatTime(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="flex-grow h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-primary slider-thumb"
            style={{ backgroundImage: 'linear-gradient(to right, #9ACD32, #9ACD32)' }}
          />
          <span className="text-xs font-mono text-zinc-300">{formatTime(duration)}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={togglePlay} 
              className="text-white hover:text-primary transition-colors"
              style={{ color: isPlaying ? '#9ACD32' : '#fff' }}
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 fill-current" />}
            </button>

            {/* Volume Control */}
            <div className="flex items-center gap-2 group/volume">
              <button onClick={toggleMute} className="text-zinc-300 hover:text-white transition-colors">
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-white transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Fullscreen Button */}
            <button onClick={handleFullscreen} className="text-zinc-300 hover:text-white transition-colors">
              <Maximize className="w-5 h-5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
