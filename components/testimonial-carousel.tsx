"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Testimonial } from "@/lib/testimonials-data"
import { createClient } from "@/lib/supabase/client"
import { db } from "@/lib/supabase/db"

interface TestimonialCarouselProps {
  initialTestimonials?: Testimonial[]
}

export function TestimonialCarousel({ initialTestimonials }: TestimonialCarouselProps) {
  const [testimonials, setTestimonials] = useState<Testimonial[]>(initialTestimonials || [])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  useEffect(() => {
    if (initialTestimonials && initialTestimonials.length > 0) return
    const supabase = createClient()
    async function loadTestimonials() {
      const data = await db.getTestimonials(supabase)
      setTestimonials(data)
    }
    loadTestimonials()
  }, [initialTestimonials])

  // Auto-advance testimonials every 5 seconds
  useEffect(() => {
    if (!isAutoPlaying || testimonials.length === 0) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [isAutoPlaying, testimonials])

  const handlePrevious = () => {
    if (testimonials.length === 0) return
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
    setIsAutoPlaying(false)
  }

  const handleNext = () => {
    if (testimonials.length === 0) return
    setCurrentIndex((prev) => (prev + 1) % testimonials.length)
    setIsAutoPlaying(false)
  }

  const currentTestimonial = testimonials[currentIndex]

  // Split text into words for staggered animation
  const titleWords = "Want to find inspiration for your next project?".split(" ")

  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: [0.22, 0.9, 0.33, 1] }}
      className="py-24 md:py-32 lg:py-40 bg-[#FAFAFA] text-center"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
      suppressHydrationWarning
    >
      <div className="container mx-auto px-4 max-w-4xl" suppressHydrationWarning>
        {/* Title with staggered word animation */}
        <motion.h2
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ staggerChildren: 0.05, delayChildren: 0.1 }}
          className="text-3xl md:text-4xl lg:text-5xl font-semibold text-gray-900 mb-4"
        >
          {titleWords.map((word, index) => (
            <motion.span
              key={index}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.5, ease: [0.22, 0.9, 0.33, 1] }}
              className="inline-block mr-2"
            >
              {word}
            </motion.span>
          ))}
        </motion.h2>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.3, ease: [0.22, 0.9, 0.33, 1] }}
          className="text-sm uppercase tracking-[0.2em] text-gray-500 mb-12"
        >
          Client
        </motion.p>

        {/* Testimonial Cards Container */}
        <div className="relative min-h-[300px] flex items-center justify-center">
          {currentTestimonial ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTestimonial.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5, ease: [0.22, 0.9, 0.33, 1] }}
                className="max-w-2xl mx-auto"
              >
                {/* Quote mark accent */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="text-6xl text-primary mb-4 leading-none"
                >
                  "
                </motion.div>

                {/* Testimonial text */}
                <p className="text-lg md:text-xl text-gray-700 leading-relaxed mb-8 italic">{currentTestimonial.text}</p>

                {/* Client info */}
                <div className="space-y-1">
                  <h4 className="text-xl font-semibold text-gray-900">{currentTestimonial.name}</h4>
                  <p className="text-sm text-gray-600">{currentTestimonial.role}</p>
                  <p className="text-sm text-gray-500">{currentTestimonial.organization}</p>
                </div>
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="text-gray-400">Loading testimonials...</div>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-center gap-4 mt-12">
          <motion.button
            onClick={handlePrevious}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-12 h-12 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center text-gray-700 hover:border-primary hover:text-primary hover:shadow-lg hover:shadow-primary/20 transition-colors"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.button>

          {/* Indicator dots */}
          <div className="flex gap-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentIndex(index)
                  setIsAutoPlaying(false)
                }}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex ? "bg-primary w-8" : "bg-gray-300 hover:bg-gray-400"
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>

          <motion.button
            onClick={handleNext}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-12 h-12 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center text-gray-700 hover:border-primary hover:text-primary hover:shadow-lg hover:shadow-primary/20 transition-colors"
            aria-label="Next testimonial"
          >
            <ChevronRight className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </motion.section>
  )
}
