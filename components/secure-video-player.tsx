"use client"

import { useState, useEffect, useRef } from "react"
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw } from "lucide-react"

interface SecureVideoPlayerProps {
  videoUrl: string
  userEmail: string
  userId: string
  format?: 'hls' | 'direct'
  onTimeUpdate?: (currentTime: number, duration: number) => void
  onEnded?: () => void
}

export function SecureVideoPlayer({
  videoUrl,
  userEmail,
  userId,
  format,
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
  const [streamError, setStreamError] = useState<{ details: string; responseCode?: number } | null>(null)

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

  // HLS streams are attached imperatively via hls.js; direct files use the declarative src attribute
  const isHlsStream = format === 'hls' && videoUrl.includes('.m3u8')

  useEffect(() => {
    if (!isHlsStream) return

    const video = videoRef.current
    if (!video || !videoUrl) return

    setCurrentTime(0)
    setDuration(0)
    setStreamError(null)

    let destroyed = false
    let instance: { destroy: () => void } | null = null
    let networkRetries = 0

    import('hls.js').then(({ default: Hls }) => {
      if (destroyed || !videoRef.current) return

      if (!Hls.isSupported()) {
        video.src = videoUrl
        return
      }

      const hls = new Hls({ capLevelToPlayerSize: true })
      instance = hls
      hls.loadSource(videoUrl)
      hls.attachMedia(video)
      hls.on(Hls.Events.ERROR, (_event, data) => {
        console.error(
          '[HLS error]',
          String(data.type),
          '|',
          String(data.details),
          '| http:',
          data.response?.code ?? 'n/a',
          '| fatal:',
          Boolean(data.fatal),
          '|',
          data.url || videoUrl
        )

        if (!data.fatal) return

        if (data.type === Hls.ErrorTypes.NETWORK_ERROR && networkRetries < 3) {
          networkRetries += 1
          hls.startLoad()
          return
        }

        setStreamError({
          details: String(data.details ?? 'unknown'),
          responseCode: data.response?.code
        })
        hls.destroy()
        if (instance === hls) instance = null
      })
    })

    return () => {
      destroyed = true
      if (instance) {
        instance.destroy()
        instance = null
      }
    }
  }, [videoUrl, isHlsStream])

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
      }).catch((err: DOMException) => {
        if (err.name === 'AbortError') {
          console.warn('Play request interrupted (benign):', err.message)
          return
        }
        console.error("Error playing video:", err)
      })
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

      {streamError && (
        <div className="absolute inset-0 z-30 bg-black/90 flex flex-col items-center justify-center gap-2 text-center px-6">
          <p className="text-sm font-semibold text-red-400">Playback stream failed</p>
          <p className="text-xs text-zinc-300 font-mono">{streamError.details}{streamError.responseCode ? ` (HTTP ${streamError.responseCode})` : ''}</p>
          <p className="text-xs text-zinc-500 max-w-md">403 = token/key mismatch or IP validation enabled · 404 = wrong video GUID or still encoding · no request = wrong BUNNY_STREAM_PULL_ZONE_HOST</p>
        </div>
      )}

      {/* 2. Video Player Element */}
      <video
        ref={videoRef}
        src={isHlsStream ? undefined : videoUrl}
        className="w-full h-full object-contain cursor-pointer"
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={onEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onContextMenu={(e) => e.preventDefault()}
        controlsList="nodownload noplaybackrate noremoteplayback"
        disablePictureInPicture
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
