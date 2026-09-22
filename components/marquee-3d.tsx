"use client"

import { useRef, useState, useEffect } from "react"
import { motion, useAnimationFrame, useMotionValue, useSpring, useTransform } from "framer-motion"
import { getMediaUrl, cn } from "@/lib/utils"

interface Marquee3DProps {
  items: {
    id: string
    title: string
    category: string
    image: string
  }[]
  speed?: number
}

export function Marquee3D({ items, speed = 0.5 }: Marquee3DProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [centerX, setCenterX] = useState(0)
  const [itemWidth, setItemWidth] = useState(400)
  
  // We'll use a motion value to drive the scroll
  const scrollX = useMotionValue(0)
  
  const multipliedItems = [...items, ...items, ...items, ...items]

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      if (width < 640) {
        setItemWidth(270)
      } else if (width < 1024) {
        setItemWidth(340)
      } else {
        setItemWidth(400)
      }
    }
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])
  
  useAnimationFrame((time, delta) => {
    if (!containerRef.current) return
    
    // Update center position in case of resize
    const rect = containerRef.current.getBoundingClientRect()
    if (centerX !== rect.width / 2) {
      setCenterX(rect.width / 2)
    }
    
    // Move scrollX
    let currentX = scrollX.get() - (speed * delta * 0.06) // Normalize delta
    
    // Total width of one set
    const gap = itemWidth < 300 ? 24 : 50
    const singleSetWidth = items.length * (itemWidth + gap)
    
    if (currentX <= -singleSetWidth) {
      currentX += singleSetWidth
    }
    
    scrollX.set(currentX)
  })

  return (
    <div ref={containerRef} className="relative w-full h-[380px] sm:h-[480px] md:h-[600px] overflow-hidden flex items-center perspective-1000 max-w-full">
        <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-32 bg-gradient-to-r from-[#060010] to-transparent z-20 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-32 bg-gradient-to-l from-[#060010] to-transparent z-20 pointer-events-none" />
      
      <motion.div className="flex absolute left-1/2 h-full items-center" style={{ x: scrollX }}>
        {multipliedItems.map((item, index) => (
          <MarqueeItem 
            key={`${item.id}-${index}`} 
            item={item} 
            index={index} 
            scrollX={scrollX} 
            itemWidth={itemWidth}
          />
        ))}
      </motion.div>
    </div>
  )
}

function MarqueeItem({ item, index, scrollX, itemWidth }: { 
  item: any, 
  index: number, 
  scrollX: any,
  itemWidth: number
}) {
  const gap = itemWidth < 300 ? 24 : 50
  const position = index * (itemWidth + gap)
  
  const distance = useTransform(scrollX, (x: number) => {
    const absPos = x + position
    return Math.abs(absPos) 
  })

  const scale = useTransform(distance, [0, 500], [1.1, 0.85])
  const opacity = useTransform(distance, [0, 800], [1, 0.5])
  const zIndex = useTransform(distance, [0, 500], [100, 0])
  
  const rotateY = useTransform(scrollX, (x: number) => {
    const absPos = x + position
    const val = (absPos / 800) * -20
    return Math.min(Math.max(val, -20), 20)
  })

  return (
    <motion.div
      style={{
        width: itemWidth,
        x: position,
        position: "absolute",
        scale,
        opacity,
        zIndex,
        rotateY,
        perspective: 1000,
      }}
      className="aspect-[4/5] rounded-xl overflow-hidden shadow-2xl bg-gray-900 border border-white/10"
    >
      <img
        src={getMediaUrl(item.image)}
        alt={item.title}
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-80" />
      <div className="absolute bottom-0 left-0 p-4 sm:p-8">
        <p className="text-primary text-xs sm:text-sm font-medium mb-1 sm:mb-2">{item.category}</p>
        <h3 className="text-lg sm:text-2xl font-bold text-white leading-tight line-clamp-2">{item.title}</h3>
      </div>
    </motion.div>
  )
}

