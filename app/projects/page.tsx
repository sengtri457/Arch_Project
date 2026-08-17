"use client"

import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { CollageProjectCard } from "@/components/collage-project-card"
import { Project } from "@/lib/projects-data"
import { createClient } from "@/lib/supabase/client"
import { db } from "@/lib/supabase/db"
import { useState, useEffect, useRef } from "react"
import { Grid3x3, Square } from "lucide-react"

type ViewMode = "grid" | "fullsize"

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("All")
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const projectRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const supabase = createClient()
    async function loadProjects() {
      const data = await db.getProjects(supabase)
      setProjects(data)
    }
    loadProjects()
  }, [])

  const uniqueCategories = Array.from(new Set(projects.map(p => p.category)))
  const categories = ["All", ...uniqueCategories]

  const filteredProjects =
    selectedCategory === "All" 
      ? projects 
      : projects.filter((p) => p.category === selectedCategory)

  // Simple vertical scroll with smooth animations for full-size view
  useEffect(() => {
    if (viewMode === "fullsize") {
      // Reset all projects to initial state
      projectRefs.current.forEach((ref) => {
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

        projectRefs.current.forEach((ref) => {
          if (ref) observer.observe(ref)
        })

        return () => {
          projectRefs.current.forEach((ref) => {
            if (ref) observer.unobserve(ref)
          })
        }
      }, 100)
    } else {
      // Reset when switching back to grid
      projectRefs.current.forEach((ref) => {
        if (ref) {
          ref.classList.remove("animate-slide-in-from-left")
          ref.style.opacity = ""
          ref.style.transform = ""
          ref.style.transition = ""
        }
      })
    }
  }, [viewMode, filteredProjects])

  return (
    <main className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative py-32 overflow-hidden" style={{ backgroundColor: '#060010' }}>
        <div className="container mx-auto px-6">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-6xl md:text-7xl font-bold text-white mb-6">Our Projects</h1>
            <p className="text-xl text-gray-300">
              Explore our complete portfolio of architectural visualizations
            </p>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section className="py-24" style={{ backgroundColor: '#060010' }}>
        <div className="w-full px-6">
          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                style={{
                  color: selectedCategory === category ? '#9ACD32' : '#d1d5db',
                }}
                className={`px-6 py-3 font-medium transition-all duration-300 bg-transparent ${
                  selectedCategory !== category && "hover:opacity-80"
                }`}
                onMouseEnter={(e) => {
                  if (selectedCategory !== category) e.currentTarget.style.color = '#9ACD32'
                }}
                onMouseLeave={(e) => {
                  if (selectedCategory !== category) e.currentTarget.style.color = '#d1d5db'
                }}
              >
                {category}
              </button>
            ))}
          </div>

          {/* View Mode Toggle */}
          <div className="flex justify-center items-center gap-4 mb-10 py-4 border-b border-border/50">
            <span className="text-base font-medium text-white">View Mode:</span>
            <div className="flex gap-2 bg-secondary border border-border p-1.5 rounded-lg shadow-lg">
              <button
                onClick={() => setViewMode("grid")}
                className={`px-6 py-2.5 rounded-md transition-all duration-300 flex items-center gap-2 font-medium ${
                  viewMode === "grid"
                    ? "bg-primary text-primary-foreground shadow-lg scale-105"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                }`}
              >
                <Grid3x3 size={20} />
                <span>Grid View</span>
              </button>
              <button
                onClick={() => setViewMode("fullsize")}
                className={`px-6 py-2.5 rounded-md transition-all duration-300 flex items-center gap-2 font-medium ${
                  viewMode === "fullsize"
                    ? "bg-primary text-primary-foreground shadow-lg scale-105"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                }`}
              >
                <Square size={20} />
                <span>Full Size</span>
              </button>
            </div>
          </div>

          {/* Collage Grid View - Matching Selected Works Layout */}
          {viewMode === "grid" && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-0">
              {filteredProjects.map((project, index) => {
                // Create repeating pattern: top row (4 items), bottom row (3 items), repeat
                // Top row: 4 equal columns (small)
                // Bottom row: 2 columns (large) + 1 column (small) + 1 column (small)
                const positionInRow = index % 7
                
                let colSpan: string
                let size: "large" | "small"
                
                if (positionInRow < 4) {
                  // Top row: 4 equal columns
                  colSpan = "md:col-span-1"
                  size = "small"
                } else {
                  // Bottom row: varied layout
                  const bottomIndex = positionInRow - 4
                  if (bottomIndex === 0) {
                    // First item in bottom row: spans 2 columns
                    colSpan = "md:col-span-2"
                    size = "large"
                  } else {
                    // Other items: span 1 column
                    colSpan = "md:col-span-1"
                    size = "small"
                  }
                }
                
                return (
                  <div key={project.id} className={colSpan}>
                    <CollageProjectCard project={project} size={size} />
                  </div>
                )
              })}
            </div>
          )}

          {/* Full Size Vertical Scroll View */}
          {viewMode === "fullsize" && (
            <div className="max-w-7xl mx-auto space-y-8">
              {filteredProjects.map((project, index) => (
                <div
                  key={project.id}
                  ref={(el) => {
                    projectRefs.current[index] = el
                  }}
                  className="w-full opacity-0 rounded-lg overflow-hidden shadow-2xl"
                  style={{
                    transform: "translateX(-50px)",
                  }}
                >
                  <CollageProjectCard project={project} size="large" />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  )
}

