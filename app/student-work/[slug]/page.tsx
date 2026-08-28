"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-provider"
import {
  useStudentWorkBySlug,
  useStudentWorkRatings,
  useUserRatingForPost,
  useRateWorkMutation,
  useStudentWorkList
} from "@/lib/react-query/hooks/use-student-work"
import { ImageLightbox } from "@/components/image-lightbox"
import { getMediaUrl } from "@/lib/utils"
import Link from "next/link"
import { Star, ArrowLeft, Loader2, MessageSquare, Code, User, Tag, Calendar, Sparkles } from "lucide-react"
import Swal from "sweetalert2"
import { motion } from "framer-motion"

export default function StudentWorkDetailPage() {
  const params = useParams<{ slug: string }>()
  const slug = params.slug
  const router = useRouter()
  const { user, profile } = useAuth()

  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  // Star rating input state
  const [ratingInput, setRatingInput] = useState(5)
  const [hoverRating, setHoverRating] = useState<number | null>(null)
  const [feedbackInput, setFeedbackInput] = useState("")

  const { data: post, isLoading, isError } = useStudentWorkBySlug(slug)
  const postId = post?.id

  const { data: ratings = [], isLoading: loadingRatings } = useStudentWorkRatings(postId || "")
  const { data: userRating } = useUserRatingForPost(postId || "", user?.id)

  const rateMutation = useRateWorkMutation(postId || "")

  // Fetch related student works based on the same architectural field
  const { data: allFieldPosts = [] } = useStudentWorkList({
    field: post?.architecture_field || undefined
  })
  
  const relatedPosts = allFieldPosts
    .filter((p) => p.id !== postId)
    .slice(0, 3)

  // Pre-populate rating form if user already rated
  useEffect(() => {
    if (userRating) {
      setRatingInput(userRating.rating)
      setFeedbackInput(userRating.feedback || "")
    }
  }, [userRating])

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#060010] text-white flex flex-col justify-between">
        <Navigation />
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-[#9ACD32]" />
        </div>
        <Footer />
      </main>
    )
  }

  if (isError || !post) {
    return (
      <main className="min-h-screen bg-[#060010] text-white flex flex-col justify-between">
        <Navigation />
        <div className="flex-grow flex flex-col items-center justify-center gap-4 py-24 text-center px-6">
          <h1 className="text-3xl font-bold">Post Not Found</h1>
          <p className="text-zinc-400">The student showcase post you are looking for does not exist or has been removed.</p>
          <Link href="/student-work">
            <Button className="bg-[#9ACD32] hover:bg-[#9ACD32]/90 text-black font-semibold">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Showcase
            </Button>
          </Link>
        </div>
        <Footer />
      </main>
    )
  }

  // Create full images list for the Lightbox component
  const galleryImages = [post.cover_image_url, ...(post.media_urls || [])].filter(Boolean)

  const handleOpenLightbox = (index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  const handleRatingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      router.push(`/login?redirect=/student-work/${slug}`)
      return
    }

    if (profile?.role === "admin" || profile?.role === "instructor") {
      Swal.fire({
        icon: "warning",
        title: "Access Denied",
        text: "Administrators and instructors are not allowed to submit student ratings."
      })
      return
    }

    try {
      await rateMutation.mutateAsync({
        student_id: user.id,
        rating: ratingInput,
        feedback: feedbackInput.trim() || undefined
      })

      Swal.fire({
        icon: "success",
        title: userRating ? "Rating Updated!" : "Rating Submitted!",
        text: "Thank you for supporting your peer with your feedback!",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000
      })
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Submission Failed",
        text: err.message || "Something went wrong."
      })
    }
  }

  return (
    <main className="min-h-screen bg-[#060010] text-white flex flex-col justify-between">
      <Navigation />

      <div className="flex-grow container mx-auto px-6 py-24 md:py-32 max-w-7xl">
        {/* Breadcrumb Back link */}
        <Link href="/student-work" className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-white text-sm mb-8 transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Showcase</span>
        </Link>

        {/* Main Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Left Column: Visuals & Narrative */}
          <div className="lg:col-span-2 space-y-8">
            <div className="space-y-4">
              <h1 className="text-3xl md:text-5xl font-bold leading-tight tracking-tight text-white">
                {post.title}
              </h1>
              
              {/* Creator details */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-sm font-bold text-[#9ACD32]">
                  {post.student_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-200">
                    Created by {post.student_name}
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    Featured on {new Date(post.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Showcase Cover and Images */}
            <div className="space-y-4">
              <div
                onClick={() => handleOpenLightbox(0)}
                className="relative aspect-[16/10] bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-900 shadow-2xl cursor-zoom-in group"
              >
                <img
                  src={getMediaUrl(post.cover_image_url || "/placeholder.svg")}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-500"
                />
              </div>

              {/* Gallery Grid */}
              {post.media_urls && post.media_urls.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                  {post.media_urls.map((img: string, idx: number) => (
                    <div
                      key={idx}
                      onClick={() => handleOpenLightbox(idx + 1)}
                      className="relative aspect-[16/10] bg-zinc-950 rounded-xl overflow-hidden border border-zinc-900 cursor-zoom-in group"
                    >
                      <img
                        src={getMediaUrl(img)}
                        alt={`Gallery ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Description / Concept */}
            <section className="bg-zinc-900/10 border border-zinc-900 p-8 rounded-2xl space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#9ACD32]" />
                Design Concept
              </h2>
              <p className="text-zinc-300 leading-relaxed whitespace-pre-line text-sm md:text-base">
                {post.description}
              </p>
            </section>

            {/* Ratings & Comments List Section */}
            <section className="space-y-6">
              <h2 className="text-2xl font-bold flex items-center gap-2.5">
                <Star className="w-6 h-6 text-[#9ACD32] fill-[#9ACD32]" />
                Peer Reviews ({ratings.length})
              </h2>

              {ratings.length === 0 ? (
                <div className="text-center py-12 bg-zinc-900/10 border border-zinc-900 rounded-2xl text-zinc-500 text-sm">
                  No reviews submitted yet. Be the first to rate this student work!
                </div>
              ) : (
                <div className="space-y-4">
                  {ratings.map((rate) => (
                    <div key={rate.id} className="bg-zinc-950/40 border border-zinc-900/60 p-5 rounded-2xl flex items-start gap-4">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                        {rate.profiles?.avatar_url ? (
                          <img src={rate.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-5 h-5 text-zinc-650" />
                        )}
                      </div>
                      
                      {/* Review details */}
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <strong className="text-zinc-200 text-sm truncate">
                            {rate.profiles?.full_name || "Academy Student"}
                          </strong>
                          <span className="text-[10px] text-zinc-500">
                            {new Date(rate.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        
                        {/* Rating Stars */}
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3.5 h-3.5 ${
                                star <= rate.rating
                                  ? "fill-[#9ACD32] text-[#9ACD32]"
                                  : "text-zinc-800"
                              }`}
                            />
                          ))}
                        </div>

                        {/* Comment feedback */}
                        {rate.feedback && (
                          <p className="text-zinc-400 text-sm leading-relaxed whitespace-pre-line mt-1.5">
                            {rate.feedback}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Right Column: Sidebar Specs & Actions */}
          <div className="space-y-6 lg:h-fit lg:sticky lg:top-28">
            
            {/* Project Specifications Card */}
            <div className="bg-zinc-950 border border-zinc-900 p-6 rounded-2xl space-y-5 shadow-xl">
              <h3 className="font-bold text-lg text-white border-b border-zinc-900 pb-3">
                Project Specs
              </h3>

              <div className="space-y-4 text-sm">
                {post.architecture_field && (
                  <div className="flex justify-between items-start gap-4">
                    <span className="text-zinc-500 font-medium shrink-0 flex items-center gap-1.5">
                      <Tag className="w-4 h-4" /> Field
                    </span>
                    <span className="text-zinc-300 font-semibold text-right">
                      {post.architecture_field}
                    </span>
                  </div>
                )}

                {post.software_used && (
                  <div className="flex justify-between items-start gap-4">
                    <span className="text-zinc-500 font-medium shrink-0 flex items-center gap-1.5">
                      <Code className="w-4 h-4" /> Software
                    </span>
                    <span className="text-zinc-350 font-mono text-xs text-right">
                      {post.software_used}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-start gap-4">
                  <span className="text-zinc-500 font-medium shrink-0 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" /> Published
                  </span>
                  <span className="text-zinc-300 text-right">
                    {new Date(post.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Ratings Aggregate Score Summary Card */}
            <div className="bg-zinc-950 border border-zinc-900 p-6 rounded-2xl space-y-4 shadow-xl">
              <h3 className="font-bold text-lg text-white">Peer Ratings</h3>
              
              <div className="flex items-center gap-4">
                <div className="text-4xl font-extrabold text-[#9ACD32]">
                  {post.average_rating ? post.average_rating : "0.0"}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= Math.round(post.average_rating || 0)
                            ? "fill-[#9ACD32] text-[#9ACD32]"
                            : "text-zinc-800"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-zinc-500">
                    Based on {post.ratings_count || 0} reviews
                  </p>
                </div>
              </div>
            </div>

            {/* Rating Widget Form */}
            <div className="bg-zinc-900/20 border border-zinc-900 p-6 rounded-2xl space-y-4 shadow-xl">
              <h3 className="font-bold text-lg text-white">
                {userRating ? "Edit Your Rating" : "Rate This Work"}
              </h3>

              {!user ? (
                <div className="space-y-3 pt-1">
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Student feedback is highly appreciated. Sign in to submit ratings and comments on peer designs!
                  </p>
                  <Link href={`/login?redirect=/student-work/${slug}`}>
                    <Button className="w-full bg-[#9ACD32] hover:bg-[#9ACD32]/90 text-black font-bold text-xs py-2 rounded-xl">
                      Sign In to Rate
                    </Button>
                  </Link>
                </div>
              ) : profile?.role === "admin" || profile?.role === "instructor" ? (
                <p className="text-xs text-zinc-500 italic bg-zinc-950/40 p-3 rounded-lg border border-zinc-900">
                  Administrators and instructors cannot submit student ratings.
                </p>
              ) : (
                <form onSubmit={handleRatingSubmit} className="space-y-4">
                  
                  {/* Interactive Star Picker */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      Select Rating stars
                    </label>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(null)}
                          onClick={() => setRatingInput(star)}
                          className="focus:outline-none transition-transform active:scale-95"
                        >
                          <Star
                            className={`w-7 h-7 transition-colors ${
                              star <= (hoverRating ?? ratingInput)
                                ? "fill-[#9ACD32] text-[#9ACD32]"
                                : "text-zinc-800 hover:text-zinc-700"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Feedback Written Comment */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      Leave Feedback comment
                    </label>
                    <textarea
                      rows={4}
                      value={feedbackInput}
                      onChange={(e) => setFeedbackInput(e.target.value)}
                      placeholder="Comment what you liked or how to make this visualization better..."
                      className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-4.5 py-3 text-xs text-white focus:outline-none focus:border-zinc-750 resize-none custom-scrollbar"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={rateMutation.isPending}
                    className="w-full bg-[#9ACD32] hover:bg-[#9ACD32]/90 text-black font-bold rounded-xl py-3 text-xs"
                  >
                    {rateMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                    ) : userRating ? (
                      "Update Feedback"
                    ) : (
                      "Submit Feedback"
                    )}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Related Works tag group section */}
        {relatedPosts.length > 0 && (
          <section className="mt-24 border-t border-zinc-900 pt-16 space-y-8">
            <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-2.5">
              <Sparkles className="w-6 h-6 text-[#9ACD32]" />
              More in <span className="text-[#9ACD32]">{post.architecture_field}</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[250px] md:auto-rows-[280px]">
              {relatedPosts.map((rPost) => (
                <div
                  key={rPost.id}
                  className="relative w-full overflow-hidden border border-zinc-850/60 rounded-xl group transition-all duration-300 shadow-xl bg-zinc-950"
                >
                  <Link href={`/student-work/${rPost.slug}`}>
                    <div className="absolute inset-0 w-full h-full bg-zinc-950 z-0">
                      <img
                        src={getMediaUrl(rPost.cover_image_url || "/placeholder.svg")}
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg"
                        }}
                        alt={rPost.title}
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                      />
                    </div>
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 to-transparent z-10" />

                    {/* Floating Star Rating Badge */}
                    <span className="absolute top-4 right-4 z-20 px-2 rounded-md bg-black/60 backdrop-blur-md border border-zinc-850/60 text-[10px] font-semibold flex items-center gap-1">
                      <Star className="w-3 h-3 fill-[#9ACD32] text-[#9ACD32]" />
                      <span className="text-white">
                        {rPost.average_rating ? rPost.average_rating : "0.0"}
                      </span>
                    </span>

                    {/* Bottom Info Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 z-20 p-4 w-full flex flex-col justify-end min-h-[40%]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full border border-primary/30 bg-zinc-900 flex items-center justify-center text-[10px] font-bold text-[#9ACD32] shrink-0" style={{ borderColor: 'rgba(154, 205, 50, 0.3)' }}>
                          {rPost.student_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-zinc-100 group-hover:text-[#9ACD32] transition-colors leading-tight line-clamp-1">
                            {rPost.title}
                          </h4>
                          <p className="text-[9px] text-zinc-400 font-medium mt-0.5">
                            By {rPost.student_name}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Full Size Image Lightbox Popup */}
      <ImageLightbox
        images={galleryImages}
        isOpen={lightboxOpen}
        initialIndex={lightboxIndex}
        onClose={() => setLightboxOpen(false)}
        title={post.title}
      />

      <Footer />
    </main>
  )
}
