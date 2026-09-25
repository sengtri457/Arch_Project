"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowDown } from "lucide-react"
import Link from "next/link"
import { useState, useRef, useEffect } from "react"
import { getMediaUrl } from "@/lib/utils"

const YOUTUBE_VIDEO_ID = "ldnzPk0me7c"
const YOUTUBE_EMBED_URL = `https://www.youtube-nocookie.com/embed/${YOUTUBE_VIDEO_ID}?autoplay=1&mute=1&loop=1&playlist=${YOUTUBE_VIDEO_ID}&controls=0&showinfo=0&rel=0&iv_load_policy=3&enablejsapi=1&disablekb=1&modestbranding=1&playsinline=1`
const THUMBNAIL_URL = `https://img.youtube.com/vi/${YOUTUBE_VIDEO_ID}/maxresdefault.jpg`

export function HeroSection() {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false)
  const [hasFallbackImageError, setHasFallbackImageError] = useState(false)
  
  return (
    <section className="relative h-screen w-full overflow-hidden" suppressHydrationWarning>
      {/* Background Video / Image Container */}
      <div className="absolute inset-0 bg-black overflow-hidden pointer-events-none" suppressHydrationWarning>
        {/* Instant High-Res Poster Thumbnail / Fallback Image */}
        <img
          src={hasFallbackImageError ? getMediaUrl("/16-SB TOWER (Commercial)/Render Image/LIGHTROOM/Exterior-1.jpg") : THUMBNAIL_URL}
          onError={() => setHasFallbackImageError(true)}
          alt="Architectural visualization hero background"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            isVideoLoaded ? "opacity-0" : "opacity-100"
          }`}
        />

        {/* YouTube Background Video Iframe */}
        <iframe
          src={YOUTUBE_EMBED_URL}
          title="Hero Background Video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          onLoad={() => setIsVideoLoaded(true)}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[177.78vh] min-w-full h-[56.25vw] min-h-full scale-125 md:scale-115 object-cover pointer-events-none border-0"
        />

        {/* Dark Overlay for Text Legibility */}
        <div className="absolute inset-0 bg-black/40 z-0" />
      </div>

      {/* Content */}
      <div className="relative h-full flex items-center justify-center">
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <motion.h1
            className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-6 tracking-tight break-words"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
             ARCH<span className="text-primary">TIPSBOX</span>

          </motion.h1>

          <motion.p
            className="text-base sm:text-xl md:text-2xl text-white mb-8 sm:mb-12 max-w-3xl mx-auto font-semibold px-2"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            Transforming architectural visions into photorealistic 3D visualizations
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center px-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 bg-transparent border-white text-white hover:bg-white/10">
              <Link href="#work">View Our Work</Link>
            </Button>
            <Button asChild size="lg" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 bg-primary text-primary-foreground hover:bg-primary/90">
              <a href="https://t.me/bunsambath10" target="_blank" rel="noopener noreferrer">Get in Touch</a>
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
      >
        <button
          onClick={() => document.getElementById("manifesto")?.scrollIntoView({ behavior: "smooth" })}
          className="flex flex-col items-center gap-2 text-white/70 hover:text-white transition-colors"
          aria-label="Scroll down"
        >
          <span className="text-sm">Scroll</span>
          <ArrowDown className="animate-bounce" size={24} />
        </button>
      </motion.div>
    </section>
  )
}
