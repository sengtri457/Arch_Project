"use client"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { useYoutubeVideos } from "@/lib/react-query/hooks/use-youtube-videos"
import { Search, Play, X, SlidersHorizontal, Calendar, Tag } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const VIDEO_CATEGORIES = [
  "All",
  "Photoshop",
  "D5 Render",
  "Lumion",
  "Enscape",
  "Portfolio Tips",
  "Other"
]

export default function MediaPage() {
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null)

  const { data: videos = [], isLoading } = useYoutubeVideos()

  // Filter videos
  const filteredVideos = videos.filter((video) => {
    const matchesCategory = selectedCategory === "All" || video.category === selectedCategory
    const matchesSearch = searchQuery.trim() === "" || 
      video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (video.description || "").toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  // Determine featured video (first featured video, or fallback to the most recent video)
  const featuredVideo = videos.find((v) => v.is_featured) || videos[0]
  
  // Exclude featured video from grid listing ONLY if no filters are active
  const isFiltering = selectedCategory !== "All" || searchQuery.trim() !== ""
  const displayVideos = isFiltering 
    ? filteredVideos 
    : filteredVideos.filter((v) => v.id !== featuredVideo?.id)

  return (
    <main className="min-h-screen bg-[#060010] text-white flex flex-col justify-between">
      <div>
        <Navigation />

        {/* Hero Banner Section */}
        <section className="relative py-24 md:py-32 overflow-hidden bg-gradient-to-b from-[#060010] to-zinc-950 border-b border-zinc-900/60">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px] pointer-events-none" />
          <div className="container mx-auto px-6 relative z-10 text-center max-w-4xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#9ACD32]/30 bg-[#9ACD32]/10 text-[#9ACD32] text-xs font-semibold uppercase tracking-wider mb-6">
              <Play className="w-3.5 h-3.5 fill-[#9ACD32]" />
              <span>Watch Tutorials</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
              Tipsbox <span className="text-[#9ACD32]">Media</span>
            </h1>
            <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
              Level up your rendering and visualization workflows with our free tutorials, walkthroughs, and portfolio guidelines.
            </p>
          </div>
        </section>

        {/* Featured Video Section */}
        {!isLoading && featuredVideo && !isFiltering && (
          <section className="py-16 container mx-auto px-6 max-w-7xl">
            <div className="mb-8">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
                <span className="w-1.5 h-6 bg-[#9ACD32] rounded-full inline-block" />
                Featured Video
              </h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-zinc-900/20 border border-zinc-850/60 rounded-3xl p-6 md:p-8 hover:border-zinc-800 transition-colors">
              {/* Thumbnail Container */}
              <div 
                onClick={() => setActiveVideoId(featuredVideo.video_id)}
                className="lg:col-span-7 aspect-video relative rounded-2xl overflow-hidden group cursor-pointer bg-zinc-950 border border-zinc-850"
              >
                <img 
                  src={`https://img.youtube.com/vi/${featuredVideo.video_id}/maxresdefault.jpg`}
                  onError={(e) => {
                    e.currentTarget.src = `https://img.youtube.com/vi/${featuredVideo.video_id}/hqdefault.jpg`
                  }}
                  alt={featuredVideo.title}
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500 ease-out"
                />
                <div className="absolute inset-0 bg-black/45 group-hover:bg-black/35 transition-colors flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-[#9ACD32] text-black flex items-center justify-center shadow-lg shadow-[#9ACD32]/25 group-hover:scale-110 transition-transform duration-300">
                    <Play className="w-7 h-7 fill-black ml-1" />
                  </div>
                </div>
              </div>
              {/* Details Column */}
              <div className="lg:col-span-5 flex flex-col justify-between py-2">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="px-3 py-1 rounded-md text-xs font-semibold bg-zinc-800 text-zinc-300 flex items-center gap-1.5 border border-zinc-700">
                      <Tag className="w-3 h-3 text-[#9ACD32]" />
                      {featuredVideo.category}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold text-[#9ACD32] bg-[#9ACD32]/10 border border-[#9ACD32]/20 uppercase">
                      Featured
                    </span>
                  </div>
                  <h3 
                    onClick={() => setActiveVideoId(featuredVideo.video_id)}
                    className="text-2xl md:text-3xl font-extrabold text-white leading-snug tracking-tight hover:text-[#9ACD32] cursor-pointer transition-colors"
                  >
                    {featuredVideo.title}
                  </h3>
                  <p className="text-zinc-400 text-sm mt-4 leading-relaxed line-clamp-4">
                    {featuredVideo.description || "Learn advanced concepts, visualization tricks, and industry-standard workflows in this detailed tutorial."}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs text-zinc-500 mt-6 pt-4 border-t border-zinc-900">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(featuredVideo.published_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Filters and Videos Grid Section */}
        <section className="py-12 container mx-auto px-6 max-w-7xl">
          <div className="flex flex-col gap-6 mb-12 border-b border-zinc-900 pb-8">
            <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
              {/* Search Bar */}
              <div className="relative w-full md:max-w-md">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Search tutorials by title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-900/40 border border-zinc-800 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-zinc-700 transition-colors placeholder:text-zinc-500"
                />
              </div>

              {/* Category Filters */}
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-semibold mr-2 uppercase tracking-wider">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Category:</span>
                </div>
                {VIDEO_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-300 ${
                      selectedCategory === cat
                        ? "bg-[#9ACD32] text-black shadow-lg shadow-[#9ACD32]/10"
                        : "bg-zinc-900/50 text-zinc-400 hover:text-white hover:bg-zinc-800/40 border border-zinc-850"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Videos Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-pulse">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-zinc-900/20 border border-zinc-850/60 rounded-2xl overflow-hidden aspect-[4/3] space-y-4">
                  <div className="bg-zinc-850 h-2/3 w-full" />
                  <div className="px-5 space-y-2">
                    <div className="h-4 bg-zinc-850 rounded w-3/4" />
                    <div className="h-3 bg-zinc-850 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : displayVideos.length === 0 ? (
            <div className="text-center py-24 bg-zinc-900/10 border border-dashed border-zinc-850 rounded-2xl max-w-xl mx-auto">
              <p className="text-zinc-400 mb-2">No videos found matching your selection.</p>
              <p className="text-zinc-600 text-xs">Try selecting a different filter or clearing search keywords.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {displayVideos.map((video) => (
                <motion.div
                  key={video.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  onClick={() => setActiveVideoId(video.video_id)}
                  className="bg-zinc-900/30 border border-zinc-850/60 hover:border-zinc-850 hover:bg-zinc-900/50 rounded-2xl overflow-hidden group cursor-pointer flex flex-col justify-between transition-all duration-300 shadow-xl"
                >
                  <div>
                    {/* Thumbnail */}
                    <div className="aspect-video relative overflow-hidden bg-zinc-950 border-b border-zinc-900">
                      <img 
                        src={`https://img.youtube.com/vi/${video.video_id}/maxresdefault.jpg`}
                        onError={(e) => {
                          e.currentTarget.src = `https://img.youtube.com/vi/${video.video_id}/hqdefault.jpg`
                        }}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-550 ease-out"
                      />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm text-white flex items-center justify-center border border-white/10 group-hover:bg-[#9ACD32] group-hover:text-black group-hover:border-transparent transition-all duration-300">
                          <Play className="w-5 h-5 fill-current ml-0.5" />
                        </div>
                      </div>
                    </div>

                    {/* Metadata & Title */}
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-semibold bg-zinc-850 text-zinc-400 border border-zinc-800">
                          {video.category}
                        </span>
                      </div>
                      <h4 className="font-bold text-white group-hover:text-[#9ACD32] transition-colors leading-snug line-clamp-2">
                        {video.title}
                      </h4>
                    </div>
                  </div>

                  <div className="px-5 pb-5 pt-3 border-t border-zinc-900/50 text-[10px] text-zinc-500 flex justify-between items-center">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(video.published_at).toLocaleDateString()}
                    </span>
                    <span className="text-[#9ACD32] opacity-0 group-hover:opacity-100 transition-opacity font-bold uppercase tracking-wider text-[9px]">
                      Play Video &rarr;
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Video Lightbox Player Modal */}
      <AnimatePresence>
        {activeVideoId && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
          >
            {/* Close trigger outside card */}
            <div className="absolute inset-0 cursor-default" onClick={() => setActiveVideoId(null)} />

            {/* Video container */}
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="relative w-full max-w-5xl rounded-3xl overflow-hidden border border-zinc-850 bg-zinc-950 p-2 shadow-2xl z-10"
            >
              <button 
                onClick={() => setActiveVideoId(null)}
                className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/60 hover:bg-black text-zinc-400 hover:text-white border border-zinc-800 flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="aspect-video relative">
                <iframe
                  src={`https://www.youtube.com/embed/${activeVideoId}?autoplay=1`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full rounded-2xl"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </main>
  )
}
