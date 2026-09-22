"use client"

import { useState, useEffect } from "react"
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw } from "lucide-react"
import { getMediaUrl } from "@/lib/utils"

interface ImageLightboxProps {
  images: string[]
  initialIndex?: number
  isOpen: boolean
  onClose: () => void
  title?: string
}

export function ImageLightbox({ images, initialIndex = 0, isOpen, onClose, title }: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [zoom, setZoom] = useState(1)
  const [isZoomed, setIsZoomed] = useState(false)
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  // Update current index when initialIndex changes
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex)
      setZoom(1)
      setIsZoomed(false)
      setImagePosition({ x: 0, y: 0 })
    }
  }, [initialIndex, isOpen])

  const goToPrevious = () => {
    const newIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1
    setCurrentIndex(newIndex)
    setZoom(1)
    setIsZoomed(false)
    setImagePosition({ x: 0, y: 0 })
  }

  const goToNext = () => {
    const newIndex = currentIndex === images.length - 1 ? 0 : currentIndex + 1
    setCurrentIndex(newIndex)
    setZoom(1)
    setIsZoomed(false)
    setImagePosition({ x: 0, y: 0 })
  }

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.5, 4))
    setIsZoomed(true)
  }

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom - 0.5, 1)
    setZoom(newZoom)
    if (newZoom === 1) {
      setIsZoomed(false)
      setImagePosition({ x: 0, y: 0 })
    }
  }

  const handleResetZoom = () => {
    setZoom(1)
    setIsZoomed(false)
    setImagePosition({ x: 0, y: 0 })
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isZoomed) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - imagePosition.x, y: e.clientY - imagePosition.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && isZoomed) {
      setImagePosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleWheel = (e: React.WheelEvent) => {
    if (isOpen) {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.2 : 0.2
      const newZoom = Math.max(1, Math.min(zoom + delta, 4))
      setZoom(newZoom)
      setIsZoomed(newZoom > 1)
    }
  }

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          onClose()
          break
        case "ArrowLeft":
          goToPrevious()
          break
        case "ArrowRight":
          goToNext()
          break
        case "+":
        case "=":
          e.preventDefault()
          handleZoomIn()
          break
        case "-":
          e.preventDefault()
          handleZoomOut()
          break
        case "0":
          e.preventDefault()
          handleResetZoom()
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, currentIndex, zoom])

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/98 flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isZoomed) {
          onClose()
        }
      }}
      onWheel={handleWheel}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 text-white hover:text-primary transition-colors z-50 bg-black/60 backdrop-blur-sm rounded-full p-2.5 sm:p-3 hover:bg-black/80 shadow-lg"
        aria-label="Close"
      >
        <X className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>

      {/* Navigation Buttons */}
      {images.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 text-white hover:text-primary transition-colors z-50 bg-black/60 backdrop-blur-sm rounded-full p-2.5 sm:p-4 hover:bg-black/80 shadow-lg"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 text-white hover:text-primary transition-colors z-50 bg-black/60 backdrop-blur-sm rounded-full p-2.5 sm:p-4 hover:bg-black/80 shadow-lg"
            aria-label="Next image"
          >
            <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>
        </>
      )}

      {/* Zoom Controls */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 flex gap-1.5 sm:gap-2 z-50">
        <button
          onClick={handleZoomIn}
          className="text-white hover:text-primary transition-colors bg-black/60 backdrop-blur-sm rounded-full p-2.5 sm:p-3 hover:bg-black/80 shadow-lg"
          aria-label="Zoom in"
        >
          <ZoomIn className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        <button
          onClick={handleZoomOut}
          disabled={zoom <= 1}
          className="text-white hover:text-primary transition-colors bg-black/60 backdrop-blur-sm rounded-full p-2.5 sm:p-3 hover:bg-black/80 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
          aria-label="Zoom out"
        >
          <ZoomOut className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        <button
          onClick={handleResetZoom}
          disabled={zoom === 1}
          className="text-white hover:text-primary transition-colors bg-black/60 backdrop-blur-sm rounded-full p-2.5 sm:p-3 hover:bg-black/80 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
          aria-label="Reset zoom"
        >
          <RotateCw className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>

      {/* Image Container */}
      <div
        className="relative max-w-[98vw] max-h-[88vh] sm:max-w-[95vw] sm:max-h-[95vh] w-full h-full flex items-center justify-center overflow-hidden px-2 sm:px-0"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: isZoomed ? (isDragging ? "grabbing" : "grab") : "default" }}
      >
        <img
          src={images[currentIndex] ? getMediaUrl(images[currentIndex]) : "/placeholder.svg"}
          alt={title ? `${title} - Image ${currentIndex + 1}` : `Image ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain select-none"
          style={{
            transform: `scale(${zoom}) translate(${imagePosition.x / zoom}px, ${imagePosition.y / zoom}px)`,
            transition: isDragging ? "none" : "transform 0.3s ease-out",
          }}
          draggable={false}
          onError={(e) => {
            const target = e.currentTarget as HTMLImageElement
            if (target.src !== '/placeholder.svg') {
              console.error('Image failed to load:', images[currentIndex])
              target.src = '/placeholder.svg'
            }
          }}
        />
      </div>

      {/* Image Counter & Info */}
      <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 text-white bg-black/60 backdrop-blur-sm rounded-full px-4 sm:px-6 py-2 sm:py-3 z-50 text-center shadow-lg">
        <div className="text-xs sm:text-sm font-medium">
          {currentIndex + 1} / {images.length}
        </div>
        {zoom > 1 && (
          <div className="text-[10px] sm:text-xs text-gray-300 mt-0.5">
            {Math.round(zoom * 100)}% • Drag to pan
          </div>
        )}
      </div>

      {/* Keyboard Shortcuts Hint */}
      <div className="absolute bottom-6 right-6 text-white/60 text-xs bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2 z-50 hidden md:block">
        <div>← → Navigate</div>
        <div>+ - Zoom</div>
        <div>ESC Close</div>
      </div>
    </div>
  )
}



