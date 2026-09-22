"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { Maximize2, Grid3x3, Square } from "lucide-react"
import { ImageLightbox } from "./image-lightbox"
import { getMediaUrl } from "@/lib/utils"

interface EnhancedCategorizedGalleryProps {
  gallery: {
    exterior?: string[]
    interior?: string[]
    aerial?: string[]
    details?: string[]
  }
  title: string
}

type ViewMode = "grid" | "fullsize"

export function EnhancedCategorizedGallery({ gallery, title }: EnhancedCategorizedGalleryProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const imageRefs = useRef<(HTMLDivElement | null)[]>([])

  // Collect all images from all categories into a single array
  const allImages = useMemo(() => {
    const images: string[] = []
    if (gallery.exterior) images.push(...gallery.exterior)
    if (gallery.interior) images.push(...gallery.interior)
    if (gallery.aerial) images.push(...gallery.aerial)
    if (gallery.details) images.push(...gallery.details)
    return images
  }, [gallery])

  // Find the index in allImages from a category-specific index
  const getImageIndex = (category: 'exterior' | 'interior' | 'aerial' | 'details', categoryIndex: number): number => {
    const categoryImages = gallery[category] || []
    const targetImage = categoryImages[categoryIndex]
    return allImages.findIndex(img => img === targetImage)
  }

  const openLightbox = (category: 'exterior' | 'interior' | 'aerial' | 'details', index: number) => {
    const globalIndex = getImageIndex(category, index)
    setLightboxIndex(globalIndex >= 0 ? globalIndex : 0)
    setLightboxOpen(true)
  }

  // Scroll animations for full-size view - smooth transitions only
  useEffect(() => {
    if (viewMode === "fullsize") {
      // Reset all images to initial state
      imageRefs.current.forEach((ref) => {
        if (ref) {
          ref.classList.remove("animate-slide-in-from-left")
          ref.style.opacity = "0"
          ref.style.transform = ""
        }
      })

      // Small delay to ensure DOM is ready
      setTimeout(() => {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              const element = entry.target as HTMLElement

              if (entry.isIntersecting) {
                // Animate in from left with smooth transition
                element.classList.add("animate-slide-in-from-left")
                element.style.opacity = "1"
                element.style.transition = "opacity 0.8s ease-out, transform 0.8s ease-out"
              }
            })
          },
          {
            threshold: 0.1,
            rootMargin: "0px 0px -100px 0px",
          }
        )

        imageRefs.current.forEach((ref) => {
          if (ref) observer.observe(ref)
        })

        return () => {
          imageRefs.current.forEach((ref) => {
            if (ref) observer.unobserve(ref)
          })
        }
      }, 100)
    } else {
      // Reset when switching back to grid
      imageRefs.current.forEach((ref) => {
        if (ref) {
          ref.classList.remove("animate-slide-in-from-left")
          ref.style.opacity = ""
          ref.style.transform = ""
          ref.style.transition = ""
        }
      })
    }
  }, [viewMode, allImages])

  const GallerySection = ({ 
    title: sectionTitle, 
    images, 
    category,
    startIndex
  }: { 
    title: string
    images: string[]
    category: 'exterior' | 'interior' | 'aerial' | 'details'
    startIndex: number
  }) => {
    if (!images || images.length === 0) return null

    return (
      <div>
        <h3 className="text-xl font-semibold text-foreground mb-4">{sectionTitle}</h3>
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => openLightbox(category, index)}
                className="relative overflow-hidden bg-card group cursor-pointer transition-all duration-300 hover:shadow-2xl rounded-lg"
              >
                <img
                  src={image ? getMediaUrl(image) : "/placeholder.svg"}
                  alt={`${title} - ${sectionTitle} ${index + 1}`}
                  className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement
                    if (target.src !== '/placeholder.svg') {
                      console.error('Image failed to load:', {
                        original: image,
                        transformed: getMediaUrl(image),
                        actualSrc: target.src
                      })
                      target.src = '/placeholder.svg'
                    }
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="bg-primary/20 backdrop-blur-sm rounded-full p-4">
                    <Maximize2 className="text-white" size={32} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {images.map((image, index) => {
              const globalIndex = startIndex + index
              return (
                <div
                  key={index}
                  ref={(el) => {
                    imageRefs.current[globalIndex] = el
                  }}
                  className="w-full opacity-0"
                  style={{
                    transform: "translateX(-50px)",
                  }}
                >
                  <button
                    onClick={() => openLightbox(category, index)}
                    className="relative w-full group cursor-pointer transition-all duration-300 hover:shadow-2xl rounded-lg overflow-hidden bg-card"
                  >
                    <img
                      src={image ? getMediaUrl(image) : "/placeholder.svg"}
                      alt={`${title} - ${sectionTitle} ${index + 1}`}
                      className="w-full h-auto object-contain transition-transform duration-700 group-hover:scale-[1.02]"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement
                        if (target.src !== '/placeholder.svg') {
                          console.error('Image failed to load:', {
                            original: image,
                            transformed: getMediaUrl(image),
                            actualSrc: target.src
                          })
                          target.src = '/placeholder.svg'
                        }
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="flex items-center justify-between">
                        <span className="text-white text-sm font-medium bg-black/60 backdrop-blur-sm px-4 py-2 rounded-lg">
                          {sectionTitle} - Image {index + 1} of {images.length}
                        </span>
                        <div className="bg-primary/20 backdrop-blur-sm rounded-full p-3">
                          <Maximize2 className="text-white" size={24} />
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  let currentIndex = 0

  return (
    <>
      {/* View Mode Toggle */}
      <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-4 mb-8 sm:mb-10 py-3 sm:py-4 border-b border-border/50">
        <span className="text-xs sm:text-base font-medium text-foreground">View Mode:</span>
        <div className="flex gap-1.5 sm:gap-2 bg-secondary border border-border p-1 sm:p-1.5 rounded-lg shadow-lg">
          <button
            onClick={() => setViewMode("grid")}
            className={`px-3 py-1.5 sm:px-6 sm:py-2.5 rounded-md transition-all duration-300 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium ${
              viewMode === "grid"
                ? "bg-primary text-primary-foreground shadow-lg scale-105"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
            }`}
          >
            <Grid3x3 className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Grid View</span>
          </button>
          <button
            onClick={() => setViewMode("fullsize")}
            className={`px-3 py-1.5 sm:px-6 sm:py-2.5 rounded-md transition-all duration-300 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium ${
              viewMode === "fullsize"
                ? "bg-primary text-primary-foreground shadow-lg scale-105"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
            }`}
          >
            <Square className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Full Size</span>
          </button>
        </div>
      </div>

      <div className={viewMode === "fullsize" ? "space-y-8" : "space-y-8"}>
        {gallery.exterior && gallery.exterior.length > 0 && (
          <GallerySection 
            title="Exterior Views" 
            images={gallery.exterior} 
            category="exterior"
            startIndex={currentIndex}
          />
        )}
        {gallery.exterior && (currentIndex += gallery.exterior.length)}

        {gallery.interior && gallery.interior.length > 0 && (
          <GallerySection 
            title="Interior Spaces" 
            images={gallery.interior} 
            category="interior"
            startIndex={currentIndex}
          />
        )}
        {gallery.interior && (currentIndex += gallery.interior.length)}

        {gallery.aerial && gallery.aerial.length > 0 && (
          <GallerySection 
            title="Aerial Views" 
            images={gallery.aerial} 
            category="aerial"
            startIndex={currentIndex}
          />
        )}
        {gallery.aerial && (currentIndex += gallery.aerial.length)}

        {gallery.details && gallery.details.length > 0 && (
          <GallerySection 
            title="Design Details" 
            images={gallery.details} 
            category="details"
            startIndex={currentIndex}
          />
        )}
      </div>

      <ImageLightbox
        images={allImages}
        initialIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        title={title}
      />
    </>
  )
}

