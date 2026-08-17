"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowDown } from "lucide-react"
import Link from "next/link"
import { useState, useRef, useEffect } from "react"
import { getMediaUrl } from "@/lib/utils"

// Collection of videos from different projects for hero background
const heroVideos = [
  "/00-Homepage Animation/Homepage Animation 2K.mp4",
]

export function HeroSection() {
  const currentVideo = heroVideos[0]
  
  return (
    <section className="relative h-screen w-full overflow-hidden" suppressHydrationWarning>
      {/* Background Video */}
      <div className="absolute inset-0" suppressHydrationWarning>
        <video
          autoPlay
          muted
          playsInline
          loop
          preload="auto"
          className="w-full h-full object-cover"
          style={{
            minWidth: '100%',
            minHeight: '100%',
            width: 'auto',
            height: 'auto',
          }}
        >
          <source src={getMediaUrl(currentVideo)} type="video/mp4" />
          {/* Fallback image if video doesn't load */}
          <img
            src={getMediaUrl("/16-SB TOWER (Commercial)/Render Image/LIGHTROOM/Exterior-1.jpg")}
            alt="Architectural visualization"
            className="w-full h-full object-cover"
          />
        </video>
      </div>

      {/* Content */}
      <div className="relative h-full flex items-center justify-center">
        <div className="container mx-auto px-6 text-center">
          <motion.h1
            className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
             ARCH<span className="text-primary">TIPSBOX</span>

          </motion.h1>

          <motion.p
            className="text-xl md:text-2xl text-white mb-12 max-w-3xl mx-auto font-semibold"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            Transforming architectural visions into photorealistic 3D visualizations
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <Button asChild size="lg" variant="outline" className="text-lg px-8 bg-transparent border-white text-white hover:bg-white/10">
              <Link href="#work">View Our Work</Link>
            </Button>
            <Button asChild size="lg" className="text-lg px-8 bg-primary text-primary-foreground hover:bg-primary/90">
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
