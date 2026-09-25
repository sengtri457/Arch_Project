"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowDown } from "lucide-react"
import Link from "next/link"
import { useState, useRef, useEffect } from "react"
import { getMediaUrl } from "@/lib/utils"

// Background video configuration
// Fast native video streaming using new-banner.mp4 with instant poster placeholder
// Background video configuration
const USE_DIRECT_MP4 = true
const MP4_VIDEO_URL = "/assets/new-banner.mp4"
const HERO_POSTER_IMAGE = "/assets/new-banner-poster.jpg"

export function HeroSection() {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false)
  
  return (
    <section className="relative h-screen w-full overflow-hidden" suppressHydrationWarning>
      {/* Background Video / Image Container */}
      <div className="absolute inset-0 bg-black overflow-hidden pointer-events-none select-none" suppressHydrationWarning>
        {/* Instant Poster Image (Exact 1st frame of new-banner.mp4 for 100% seamless transition) */}
        <img
          src={getMediaUrl(HERO_POSTER_IMAGE)}
          alt="Architectural visualization hero background"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 z-10 ${
            isVideoLoaded ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
        />

        {/* Native HTML5 Fast Streaming Video */}
        <video
          autoPlay
          muted
          playsInline
          loop
          preload="auto"
          onLoadedData={() => setIsVideoLoaded(true)}
          onCanPlay={() => setIsVideoLoaded(true)}
          onPlaying={() => setIsVideoLoaded(true)}
          className="w-full h-full object-cover pointer-events-none scale-105 z-0"
          style={{
            minWidth: '100%',
            minHeight: '100%',
            width: 'auto',
            height: 'auto',
          }}
        >
          <source src={getMediaUrl(MP4_VIDEO_URL)} type="video/mp4" />
        </video>

        {/* Dark Vignette Overlay for Contrast (Placed BEHIND text content) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/40 z-20 pointer-events-none" />
      </div>

      {/* Hero Content Layer (Placed ABOVE overlay with z-30 for maximum crispness) */}
      <div className="relative z-30 h-full flex items-center justify-center pointer-events-auto">
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <motion.h1
            className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-6 tracking-tight break-words drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
             ARCH<span className="text-primary drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]">TIPSBOX</span>

          </motion.h1>

          <motion.p
            className="text-base sm:text-xl md:text-2xl text-white mb-8 sm:mb-12 max-w-3xl mx-auto font-semibold px-2 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]"
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
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 bg-black/30 backdrop-blur-md border-white/80 text-white hover:bg-white/20 shadow-lg">
              <Link href="#work">View Our Work</Link>
            </Button>
            <Button asChild size="lg" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg">
              <a href="https://t.me/bunsambath10" target="_blank" rel="noopener noreferrer">Get in Touch</a>
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30"
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
