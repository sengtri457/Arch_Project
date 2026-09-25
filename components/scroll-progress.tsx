"use client"

import { useEffect, useState } from "react"

export function ScrollProgress() {
  const [scrollProgress, setScrollProgress] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    const updateScrollProgress = () => {
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight
      const scrollTop = window.scrollY || window.pageYOffset
      const scrollableHeight = documentHeight - windowHeight
      
      const progress = scrollableHeight > 0 
        ? (scrollTop / scrollableHeight) * 100 
        : 0
      
      setScrollProgress(progress)
    }

    // Initial call
    updateScrollProgress()

    // Listen to scroll events
    window.addEventListener("scroll", updateScrollProgress, { passive: true })

    return () => {
      window.removeEventListener("scroll", updateScrollProgress)
    }
  }, [])

  if (!mounted) return null

  return (
    <div 
      className="fixed top-0 right-0 w-[2px] h-full bg-white/20 z-50"
    >
      <div 
        className="w-full bg-[#9ACD32] transition-all duration-150 ease-out"
        style={{ height: `${scrollProgress}%` }}
      />
    </div>
  )
}

