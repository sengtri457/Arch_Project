"use client"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { useStudentWorkList } from "@/lib/react-query/hooks/use-student-work"
import { getMediaUrl } from "@/lib/utils"
import Link from "next/link"
import { Star, Search, SlidersHorizontal } from "lucide-react"
import { motion } from "framer-motion"

const ARCHITECTURE_FIELDS = [
  "All",
  "Residential",
  "Commercial",
  "Interior Design",
  "Landscape",
  "Sustainable Design",
  "Urban Planning",
  "Institutional"
]

const SOFTWARE_LIST = [
  "All",
  "D5 Render",
  "AutoCAD",
  "SketchUp",
  "InDesign",
  "Photoshop",
  "Enscape"
]

export default function StudentWorkListingPage() {
  const [selectedField, setSelectedField] = useState("All")
  const [selectedSoftware, setSelectedSoftware] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")

  const { data: posts = [], isLoading } = useStudentWorkList({
    field: selectedField === "All" ? undefined : selectedField,
    search: searchQuery ? searchQuery : undefined
  })

  const filteredPosts = posts.filter((post) => {
    if (selectedSoftware === "All") return true
    const courseSoftware = post.software_used || ""
    const filterLower = selectedSoftware.toLowerCase()
    const courseLower = courseSoftware.toLowerCase()
    return courseLower.includes(filterLower) || filterLower.includes(courseLower)
  })

  return (
    <main className="min-h-screen bg-[#060010] text-white flex flex-col justify-between">
      <div>
        <Navigation />

        {/* Hero Section */}
        <section className="relative py-32 overflow-hidden bg-gradient-to-b from-[#060010] to-zinc-950 border-b border-zinc-900/60">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
          <div className="container mx-auto px-6 relative z-10 text-center max-w-4xl">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
              Student Work <span className="text-[#9ACD32]">Showcase</span>
            </h1>
            <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
              Explore outstanding architectural renderings, layout portfolios, and concepts designed and visualizing by students in our academy.
            </p>
          </div>
        </section>

        {/* Filter & Listing Section */}
        <section className="py-16 container mx-auto px-6 max-w-7xl">
          <div className="flex flex-col gap-6 mb-12 border-b border-zinc-900 pb-8">
            <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
              
              {/* Search Input */}
              <div className="relative w-full md:max-w-md">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Search by student, software, or title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-900/40 border border-zinc-800 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-zinc-700 transition-colors placeholder:text-zinc-500"
                />
              </div>

              {/* Fields Filters */}
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-semibold mr-2 uppercase tracking-wider">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Fields:</span>
                </div>
                {ARCHITECTURE_FIELDS.map((field) => (
                  <button
                    key={field}
                    onClick={() => setSelectedField(field)}
                    className={`px-4 py-2 rounded-lg text-xs font-medium transition-all duration-300 ${
                      selectedField === field
                        ? "bg-[#9ACD32] text-black font-semibold shadow-lg shadow-[#9ACD32]/10"
                        : "bg-zinc-900/50 text-zinc-400 hover:text-white hover:bg-zinc-800/40 border border-zinc-850"
                    }`}
                  >
                    {field}
                  </button>
                ))}
              </div>
            </div>

            {/* Software Filters */}
            <div className="flex flex-wrap items-center gap-2 w-full">
              <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-semibold mr-2 uppercase tracking-wider">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Software:</span>
              </div>
              {SOFTWARE_LIST.map((software) => (
                <button
                  key={software}
                  onClick={() => setSelectedSoftware(software)}
                  className={`px-4 py-2 rounded-lg text-xs font-medium transition-all duration-300 ${
                    selectedSoftware === software
                      ? "bg-[#9ACD32] text-black font-semibold shadow-lg shadow-[#9ACD32]/10"
                      : "bg-zinc-900/50 text-zinc-400 hover:text-white hover:bg-zinc-800/40 border border-zinc-850"
                  }`}
                >
                  {software}
                </button>
              ))}
            </div>
          </div>

          {/* Posts Gallery Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-zinc-900/20 border border-zinc-850/60 rounded-2xl overflow-hidden aspect-[4/3] animate-pulse space-y-4">
                  <div className="bg-zinc-850 h-2/3 w-full" />
                  <div className="px-5 space-y-2">
                    <div className="h-4 bg-zinc-850 rounded w-3/4" />
                    <div className="h-3 bg-zinc-850 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-24 bg-zinc-900/10 border border-dashed border-zinc-850 rounded-2xl max-w-xl mx-auto">
              <p className="text-zinc-400 mb-2">No showcase items match your selection.</p>
              <p className="text-zinc-600 text-xs">Try selecting a different filter or clearing search keywords.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[250px] md:auto-rows-[300px]">
              {filteredPosts.map((post, idx) => {
                // Determine Bento grid spans based on index
                const position = idx % 6;
                let gridClasses = "md:col-span-1 md:row-span-1"; // Standard
                if (position === 0 || position === 4) {
                  gridClasses = "md:col-span-2 md:row-span-1"; // Wide
                } else if (position === 2) {
                  gridClasses = "md:col-span-1 md:row-span-2 h-full"; // Tall
                }

                return (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: Math.min(idx * 0.05, 0.4) }}
                    className={`${gridClasses} relative w-full overflow-hidden border border-zinc-850/60 rounded-2xl group transition-all duration-300 shadow-xl bg-zinc-950`}
                  >
                    <Link href={`/student-work/${post.slug}`}>
                      <div className="absolute inset-0 w-full h-full bg-zinc-950 z-0">
                        <img
                          src={getMediaUrl(post.cover_image_url || "/placeholder.svg")}
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.svg"
                          }}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-1000 ease-out will-change-transform"
                        />
                      </div>
                      
                      {/* Dark Gradient Overlay for text contrast readability */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent z-10 transition-opacity duration-300" />

                      {/* Floating Architectural Category Tag (Top Left) */}
                      {post.architecture_field && (
                        <span className="absolute top-4 left-4 z-20 px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider bg-black/60 backdrop-blur-md rounded-md border border-zinc-850/60 text-zinc-300">
                          {post.architecture_field}
                        </span>
                      )}

                      {/* Floating Star Rating Badge (Top Right) */}
                      <span className="absolute top-4 right-4 z-20 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md border border-zinc-850/60 text-xs font-semibold flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 fill-[#9ACD32] text-[#9ACD32]" />
                        <span className="text-white">
                          {post.average_rating ? post.average_rating : "N/A"}
                        </span>
                      </span>

                      {/* Bottom Info Overlay (Avatar + Details) */}
                      <div className="absolute bottom-0 left-0 right-0 z-20 p-5 w-full flex flex-col justify-end min-h-[40%]">
                        <div className="flex items-center gap-3">
                          {/* Student Avatar Circle */}
                          <div className="w-8 h-8 rounded-full border border-primary/30 bg-zinc-900 flex items-center justify-center text-xs font-bold text-[#9ACD32] shrink-0" style={{ borderColor: 'rgba(154, 205, 50, 0.3)' }}>
                            {post.student_name.charAt(0).toUpperCase()}
                          </div>
                          
                          <div className="min-w-0">
                            <h3 className="text-sm font-bold text-zinc-100 group-hover:text-[#9ACD32] transition-colors leading-tight line-clamp-1">
                              {post.title}
                            </h3>
                            <p className="text-[10px] text-zinc-400 font-medium mt-0.5">
                              By {post.student_name}
                            </p>
                          </div>
                        </div>

                        {/* Expandable details on Hover */}
                        <div className="max-h-0 opacity-0 group-hover:max-h-40 group-hover:opacity-100 overflow-hidden transition-all duration-500 ease-in-out">
                          <p className="text-zinc-400 text-xs line-clamp-2 mt-3 leading-relaxed">
                            {post.description}
                          </p>
                          <div className="flex items-center justify-between gap-2 border-t border-zinc-800/40 pt-2.5 mt-2.5 text-[9px] text-zinc-500">
                            <span className="truncate italic">
                              {post.software_used}
                            </span>
                            <span className="text-[#9ACD32] font-semibold shrink-0 flex items-center gap-0.5">
                              Details &rarr;
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>
      </div>
      <Footer />
    </main>
  )
}
