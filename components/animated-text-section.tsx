"use client"

import { motion, type TargetAndTransition } from "framer-motion"
import { ArrowUp } from "lucide-react"
import { useEffect, useState, useRef } from "react"

export function AnimatedTextSection() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <section id="manifesto" className="relative h-screen w-full overflow-hidden" style={{ backgroundColor: '#141414' }} suppressHydrationWarning>
        <div className="relative h-full flex items-center justify-center" suppressHydrationWarning>
          <div className="max-w-7xl mx-auto px-4 sm:px-6" suppressHydrationWarning>
            <div className="text-center" suppressHydrationWarning>
              <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight text-white mb-4 px-4">
                Specializing in advanced 3D rendering,
              </div>
              <div 
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-regular leading-tight px-4"
                style={{
                  color: 'transparent',
                  WebkitTextStroke: '1px #d1d1d1',
                  WebkitTextFillColor: 'transparent',
                  textAlign: 'center'
                }}
              >
                <div>we meticulously convert</div>
                <div>architectural designs</div>
                <div>into high-impact visuals</div>
                <div>designed to effectively</div>
                <div>captivate stakeholders.</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="manifesto" className="relative h-screen w-full overflow-hidden" style={{ backgroundColor: '#141414' }} suppressHydrationWarning>
      {/* Animated Background Circles */}
      <div className="absolute inset-0 z-10" suppressHydrationWarning>
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] border border-white/5 rounded-full"
          animate={{
            rotate: [0, 360],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] border border-white/5 rounded-full"
          animate={{
            rotate: [360, 0],
          }}
          transition={{
            duration: 40,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      {/* Main text with modern animations */}
      <div className="relative h-full flex items-center justify-center z-20" suppressHydrationWarning>
        <div className="max-w-7xl mx-auto px-4 sm:px-6" suppressHydrationWarning>
          <div className="text-center" suppressHydrationWarning>
            {/* "Specializing in advanced 3D rendering," - Simple fade in */}
            <motion.div
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight text-white mb-4 px-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            >
              Specializing in advanced 3D rendering,
            </motion.div>
            
            {/* Animated text lines with stagger effect */}
            <div 
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-regular leading-tight px-4"
              style={{
                color: 'transparent',
                WebkitTextStroke: '1px #d1d1d1',
                WebkitTextFillColor: 'transparent',
                textAlign: 'center'
              }}
            >
              {[
                "we meticulously convert",
                "architectural designs",
                "into high-impact visuals",
                "designed to effectively",
                "captivate stakeholders."
              ].map((line, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -100, clipPath: 'inset(0 100% 0 0)' }}
                  animate={{ 
                    opacity: 1, 
                    x: 0,
                    clipPath: 'inset(0 0% 0 0)',
                  }}
                  transition={{
                    duration: 1,
                    delay: 0.5 + index * 0.2,
                    ease: [0.22, 1, 0.36, 1]
                  }}
                  whileHover={
                    { WebkitTextStroke: '1px #9ACD32' } as unknown as TargetAndTransition
                  }
                  style={{
                    transition: 'all 0.3s ease',
                  }}
                >
                  {line}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2, duration: 0.8 }}
      >
        <motion.div
          animate={{
            y: [0, 10, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="flex flex-col items-center gap-2 text-white/50 cursor-pointer"
          whileHover={{
            color: '#9ACD32',
          }}
        >
          <span className="text-sm">Scroll</span>
          <motion.div
            animate={{
              y: [0, 8, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <ArrowUp className="rotate-180" size={20} />
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  )
}
